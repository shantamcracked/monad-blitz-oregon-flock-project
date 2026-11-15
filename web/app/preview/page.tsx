// Index of mock-data previews for frontend work. No blockchain, no login needed.
import Link from "next/link";

const pages = [
  ["/preview/board", "Live Board (projector) — Teammate A"],
  ["/preview/receipt", "Receipt success + failure — Teammate A"],
  ["/preview/landing", "Landing page — Teammate A"],
  ["/preview/join", "Phone join screen — Teammate B"],
  ["/preview/create", "Create a flock — Teammate B"],
];
export default function PreviewIndex() {
  return (
    <div className="mx-auto max-w-xl p-8 text-white">
      <h1 className="text-3xl font-black">Flock UI previews (mock data)</h1>
      <ul className="mt-6 space-y-3">
        {pages.map(([href, label]) => (
          <li key={href}><Link className="text-flock-purple underline" href={href}>{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
