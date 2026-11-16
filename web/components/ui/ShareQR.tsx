"use client";
// "Show QR" button + full-screen sheet with a big scannable code for a flock's join link.
// Used on the join screen (pass your phone around) and the landing cards (scan from a laptop).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { APP_URL } from "@/lib/config";

export function useJoinUrl(id: number | string) {
  const [base, setBase] = useState(APP_URL);
  useEffect(() => {
    // Prefer the domain the viewer is actually on so the code always matches this deployment.
    if (!window.location.origin.startsWith("http://localhost") || !APP_URL) setBase(window.location.origin);
  }, []);
  return `${base.replace(/\/$/, "")}/f/${id}`;
}

export function QRSheet({ open, onClose, url, title }: { open: boolean; onClose: () => void; url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  if (!mounted) return null;
  // Portal to <body> so transformed ancestors can't trap the fixed overlay; the wrapper stops
  // clicks bubbling (through the React tree) into a parent <Link>.
  return createPortal(
    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`QR code to join ${title}`}
        >
          <motion.div
            className="relative w-full max-w-[340px] rounded-[32px] bg-white p-6 text-center text-black shadow-[0_30px_80px_rgba(131,110,249,0.45)]"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-black/40 hover:text-black">
              <X size={20} strokeWidth={1.75} />
            </button>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#836EF9]">Scan to join</p>
            <h2 className="mx-auto mt-1 max-w-[240px] text-[20px] font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">{title}</h2>
            <QRCodeSVG value={url} size={512} marginSize={2} level="M" className="mx-auto mt-4 h-auto w-full" title={`QR code for ${url}`} />
            <p className="mt-3 text-[13px] text-black/50">Email login · no wallet · no gas</p>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(url).then(() => setCopied(true)).catch(() => {})}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-black/[0.06] px-4 text-[15px] font-semibold hover:bg-black/10"
            >
              {copied ? <Check size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.75} />}
              {copied ? "Link copied" : "Copy link"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>,
    document.body,
  );
}

/** Round icon button that opens the QR sheet. `stop` keeps clicks from triggering a parent <Link>. */
export function ShareQRButton({ id, title, className = "", label }: { id: number | string; title: string; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const url = useJoinUrl(id);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={label ?? "Show QR code to join"}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[13px] font-semibold text-white/80 backdrop-blur-xl hover:text-white ${className}`}
      >
        <QrCode size={16} strokeWidth={1.75} aria-hidden="true" />
        {label && <span>{label}</span>}
      </button>
      <QRSheet open={open} onClose={() => setOpen(false)} url={url} title={title} />
    </>
  );
}
