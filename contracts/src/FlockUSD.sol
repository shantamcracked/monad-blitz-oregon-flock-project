// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title FlockUSD (fUSD) — demo stablecoin for Monad testnet
/// @notice 6 decimals like USDC. Anyone can mint 500 fUSD to any address (test money).
///         The Flock contract is a "trusted spender": it never needs an approve() tx,
///         so buyers can join with ZERO transactions of their own (gas is relayed).
///         On mainnet this is swapped for real USDC + EIP-2612 permit.
contract FlockUSD is ERC20 {
    address public immutable deployer;
    address public flock; // trusted spender, set once

    uint256 public constant FAUCET_AMOUNT = 500e6; // $500
    uint256 public constant FAUCET_CAP = 2_000e6;   // can't faucet above $2,000 balance

    constructor() ERC20("Flock USD", "fUSD") {
        deployer = msg.sender;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function setFlock(address flock_) external {
        require(msg.sender == deployer, "only deployer");
        require(flock == address(0), "flock already set");
        flock = flock_;
    }

    /// @notice Mint $500 of test dollars to `to`.
    function faucet(address to) external {
        require(balanceOf(to) < FAUCET_CAP, "enough test dollars");
        _mint(to, FAUCET_AMOUNT);
    }

    /// @notice Flock contract has unlimited allowance from everyone (demo UX).
    function allowance(address owner, address spender) public view override returns (uint256) {
        if (spender == flock && flock != address(0)) return type(uint256).max;
        return super.allowance(owner, spender);
    }
}
