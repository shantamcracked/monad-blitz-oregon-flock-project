// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Flock — the group buy that gets cheaper every block
/// @notice price(n) = ceil(fixedCost / n) + unitCost.
///         Every join lowers the price for EVERYONE: earlier buyers are rebated the
///         difference inside the same transaction (same ~300ms Monad block).
///         Dominant assurance: the seller bonds bonusPerBuyer * (minBuyers - 1).
///         If the flock fails to reach minBuyers by the deadline, every buyer gets
///         a full refund PLUS the bonus. Joining is therefore a dominant strategy.
/// @dev Buyers/sellers can act directly (msg.sender) or via EIP-712 signatures relayed
///      by any account (gasless UX). The relayer can never move funds without a signature.
contract Flock is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { Open, Success, Failed }

    struct FlockData {
        address seller;
        uint128 fixedCost;      // F (6 decimals)
        uint128 unitCost;       // c (6 decimals)
        uint128 bonusPerBuyer;  // paid to each buyer if the flock fails
        uint128 bond;           // bonusPerBuyer * (minBuyers - 1), locked at creation
        uint64 deadline;        // unix seconds
        uint64 createdAt;
        uint32 minBuyers;
        uint32 maxBuyers;
        uint32 n;               // current number of buyers
        Status status;
    }

    struct FlockView {
        uint256 id;
        FlockData data;
        string title;
        string imageUrl;
        uint256 currentPrice;   // what every buyer has paid net, right now
        uint256 nextPrice;      // what the next buyer would pay
        uint256 soloPrice;      // price with 1 buyer
        address[] buyers;
        uint64[] joinedAt;
    }

    uint32 public constant MAX_BUYERS_CAP = 60; // push-rebate loop cap (gas safety)
    uint16 public constant FEE_BPS = 250;       // 2.5% platform fee on successful flocks

    bytes32 private constant JOIN_TYPEHASH =
        keccak256("Join(uint256 flockId,address buyer,uint256 nonce,uint256 deadline)");
    bytes32 private constant CREATE_TYPEHASH = keccak256(
        "Create(address seller,bytes32 titleHash,uint128 fixedCost,uint128 unitCost,uint128 bonusPerBuyer,uint64 deadline,uint32 minBuyers,uint32 maxBuyers,uint256 nonce,uint256 sigDeadline)"
    );

    IERC20 public immutable token;
    address public immutable treasury;

    uint256 public flockCount;
    mapping(uint256 => FlockData) internal _flocks;
    mapping(uint256 => string) public titles;
    mapping(uint256 => string) public imageUrls;
    mapping(uint256 => address[]) internal _buyers;
    mapping(uint256 => uint64[]) internal _joinedAt;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(address => uint256) public nonces;

    event FlockCreated(uint256 indexed id, address indexed seller, string title, uint256 fixedCost, uint256 unitCost, uint32 minBuyers, uint32 maxBuyers, uint64 deadline, uint256 bonusPerBuyer);
    event Joined(uint256 indexed id, address indexed buyer, uint32 n, uint256 pricePaid);
    event PriceDropped(uint256 indexed id, uint256 oldPrice, uint256 newPrice, uint256 rebatePerBuyer, uint32 n);
    event Settled(uint256 indexed id, bool success, uint256 finalPrice, uint32 n);
    event Refunded(uint256 indexed id, address indexed buyer, uint256 amount);

    error BadParams();
    error NotOpen();
    error Full();
    error AlreadyJoined();
    error Expired();
    error BadSignature();
    error NotSettleable();

    constructor(IERC20 token_, address treasury_) EIP712("Flock", "1") {
        token = token_;
        treasury = treasury_;
    }

    // ───────────────────────── pricing ─────────────────────────

    /// @notice Price per buyer when there are `n` buyers. ceil(F/n) + c.
    function priceAt(uint256 id, uint256 n) public view returns (uint256) {
        FlockData storage f = _flocks[id];
        if (n == 0) n = 1;
        return (uint256(f.fixedCost) + n - 1) / n + f.unitCost;
    }

    function currentPrice(uint256 id) public view returns (uint256) {
        return priceAt(id, _flocks[id].n);
    }

    // ───────────────────────── create ─────────────────────────

    function createFlock(
        string calldata title,
        string calldata imageUrl,
        uint128 fixedCost,
        uint128 unitCost,
        uint128 bonusPerBuyer,
        uint64 deadline,
        uint32 minBuyers,
        uint32 maxBuyers
    ) external nonReentrant returns (uint256) {
        return _create(msg.sender, title, imageUrl, fixedCost, unitCost, bonusPerBuyer, deadline, minBuyers, maxBuyers);
    }

    function createFlockFor(
        address seller,
        string calldata title,
        string calldata imageUrl,
        uint128 fixedCost,
        uint128 unitCost,
        uint128 bonusPerBuyer,
        uint64 deadline,
        uint32 minBuyers,
        uint32 maxBuyers,
        uint256 sigDeadline,
        bytes calldata sig
    ) external nonReentrant returns (uint256) {
        if (block.timestamp > sigDeadline) revert Expired();
        bytes32 structHash = keccak256(
            abi.encode(
                CREATE_TYPEHASH, seller, keccak256(bytes(title)), fixedCost, unitCost, bonusPerBuyer,
                deadline, minBuyers, maxBuyers, nonces[seller]++, sigDeadline
            )
        );
        if (ECDSA.recover(_hashTypedDataV4(structHash), sig) != seller) revert BadSignature();
        return _create(seller, title, imageUrl, fixedCost, unitCost, bonusPerBuyer, deadline, minBuyers, maxBuyers);
    }

    function _create(
        address seller,
        string calldata title,
        string calldata imageUrl,
        uint128 fixedCost,
        uint128 unitCost,
        uint128 bonusPerBuyer,
        uint64 deadline,
        uint32 minBuyers,
        uint32 maxBuyers
    ) internal returns (uint256 id) {
        if (minBuyers == 0 || maxBuyers < minBuyers || maxBuyers > MAX_BUYERS_CAP) revert BadParams();
        if (deadline <= block.timestamp || fixedCost == 0) revert BadParams();

        uint128 bond = bonusPerBuyer * (minBuyers - 1);
        id = ++flockCount;
        _flocks[id] = FlockData({
            seller: seller,
            fixedCost: fixedCost,
            unitCost: unitCost,
            bonusPerBuyer: bonusPerBuyer,
            bond: bond,
            deadline: deadline,
            createdAt: uint64(block.timestamp),
            minBuyers: minBuyers,
            maxBuyers: maxBuyers,
            n: 0,
            status: Status.Open
        });
        titles[id] = title;
        imageUrls[id] = imageUrl;
        if (bond > 0) token.safeTransferFrom(seller, address(this), bond);
        emit FlockCreated(id, seller, title, fixedCost, unitCost, minBuyers, maxBuyers, deadline, bonusPerBuyer);
    }

    // ───────────────────────── join ─────────────────────────

    function join(uint256 id) external nonReentrant {
        _join(id, msg.sender);
    }

    function joinFor(uint256 id, address buyer, uint256 sigDeadline, bytes calldata sig) external nonReentrant {
        if (block.timestamp > sigDeadline) revert Expired();
        bytes32 structHash = keccak256(abi.encode(JOIN_TYPEHASH, id, buyer, nonces[buyer]++, sigDeadline));
        if (ECDSA.recover(_hashTypedDataV4(structHash), sig) != buyer) revert BadSignature();
        _join(id, buyer);
    }

    function _join(uint256 id, address buyer) internal {
        FlockData storage f = _flocks[id];
        if (f.seller == address(0) || f.status != Status.Open) revert NotOpen();
        if (block.timestamp >= f.deadline) revert Expired();
        if (f.n >= f.maxBuyers) revert Full();
        if (hasJoined[id][buyer]) revert AlreadyJoined();

        uint32 oldN = f.n;
        uint256 oldPrice = priceAt(id, oldN); // only meaningful if oldN > 0
        uint32 newN = oldN + 1;
        uint256 newPrice = priceAt(id, newN);

        // effects
        f.n = newN;
        hasJoined[id][buyer] = true;
        _buyers[id].push(buyer);
        _joinedAt[id].push(uint64(block.timestamp));

        // interactions: pull new buyer's payment, then rebate every earlier buyer
        token.safeTransferFrom(buyer, address(this), newPrice);
        emit Joined(id, buyer, newN, newPrice);

        if (oldN > 0 && oldPrice > newPrice) {
            uint256 rebate = oldPrice - newPrice;
            address[] storage list = _buyers[id];
            for (uint256 i = 0; i < oldN; i++) {
                token.safeTransfer(list[i], rebate);
            }
            emit PriceDropped(id, oldPrice, newPrice, rebate, newN);
        }

        // auto-settle the moment the flock is full
        if (newN == f.maxBuyers) _settleSuccess(id);
    }

    // ───────────────────────── settle ─────────────────────────

    /// @notice Success: anyone once n == max, or after the deadline if n >= min;
    ///         the seller may also close early once n >= min.
    ///         Failure: anyone after the deadline if n < min → refund + bonus to everyone, in ONE tx.
    function settle(uint256 id) external nonReentrant {
        FlockData storage f = _flocks[id];
        if (f.seller == address(0) || f.status != Status.Open) revert NotOpen();
        bool afterDeadline = block.timestamp >= f.deadline;

        if (f.n >= f.minBuyers && (afterDeadline || msg.sender == f.seller)) {
            _settleSuccess(id);
        } else if (afterDeadline && f.n < f.minBuyers) {
            _settleFailure(id);
        } else {
            revert NotSettleable();
        }
    }

    function _settleSuccess(uint256 id) internal {
        FlockData storage f = _flocks[id];
        f.status = Status.Success;
        uint256 finalPrice = priceAt(id, f.n);
        uint256 gross = finalPrice * f.n;
        uint256 fee = (gross * FEE_BPS) / 10_000;
        if (fee > 0) token.safeTransfer(treasury, fee);
        token.safeTransfer(f.seller, gross - fee + f.bond); // seller gets revenue + bond back
        emit Settled(id, true, finalPrice, f.n);
    }

    function _settleFailure(uint256 id) internal {
        FlockData storage f = _flocks[id];
        f.status = Status.Failed;
        uint256 paidEach = f.n == 0 ? 0 : priceAt(id, f.n);
        uint256 refundEach = paidEach + f.bonusPerBuyer;
        address[] storage list = _buyers[id];
        for (uint256 i = 0; i < f.n; i++) {
            token.safeTransfer(list[i], refundEach);
            emit Refunded(id, list[i], refundEach);
        }
        uint256 leftover = f.bond - uint256(f.bonusPerBuyer) * f.n;
        if (leftover > 0) token.safeTransfer(f.seller, leftover);
        emit Settled(id, false, paidEach, f.n);
    }

    // ───────────────────────── views ─────────────────────────

    function getFlock(uint256 id) public view returns (FlockView memory v) {
        FlockData storage f = _flocks[id];
        v.id = id;
        v.data = f;
        v.title = titles[id];
        v.imageUrl = imageUrls[id];
        v.currentPrice = f.n == 0 ? priceAt(id, 1) : priceAt(id, f.n);
        v.nextPrice = priceAt(id, uint256(f.n) + 1);
        v.soloPrice = priceAt(id, 1);
        v.buyers = _buyers[id];
        v.joinedAt = _joinedAt[id];
    }

    /// @notice Latest `count` flocks, newest first.
    function getFlocks(uint256 count) external view returns (FlockView[] memory out) {
        uint256 total = flockCount;
        if (count > total) count = total;
        out = new FlockView[](count);
        for (uint256 i = 0; i < count; i++) out[i] = getFlock(total - i);
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
