// Index of mock-data previews for frontend work. No blockchain, no login needed.
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const pages = [
  ["/preview/landing", "Landing", "apple.com-style product page with 3D phones"],
  ["/preview/join", "Join screen", "Phone UI inside a PhoneFrame on desktop"],
  ["/preview/create", "Create a flock", "iOS Settings-style form"],
  ["/preview/board", "Live board", "Projector keynote slide (1920×1080)"],
  ["/preview/receipt", "Receipt", "Wallet pass: success, failed, pending"],
];

export default function PreviewIndex() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-black px-5 py-16 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#836EF9] opacity-25 blur-[140px]" aria-hidden />
      <div className="relative mx-auto max-w-xl">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Flock</p>
        <h1 className="mt-2 text-[40px] font-semibold leading-tight tracking-[-0.03em]">UI previews</h1>
        <p className="mt-1 text-[17px] text-white/50">Mock data — no wallet, no login.</p>
        <ul className="mt-8 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          {pages.map(([href, label, sub]) => (
            <li key={href} className="border-b border-white/[0.08] last:border-b-0">
              <Link href={href} className="flex min-h-[60px] items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.04]">
                <span>
                  <span className="block text-[17px] font-semibold tracking-tight">{label}</span>
                  <span className="block text-[13px] text-white/50">{sub}</span>
                </span>
                <ChevronRight size={18} strokeWidth={1.75} className="shrink-0 text-white/30" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
