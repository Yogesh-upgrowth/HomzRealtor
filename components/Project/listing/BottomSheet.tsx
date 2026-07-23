"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  progress?: number; // 0-100
  onBodyScroll?: (pct: number) => void;
  children: React.ReactNode;
};

// Hand-rolled slide-up sheet — no animation library. Always mounted; visibility
// is a transform/opacity transition so open/close is animated both ways.
const BottomSheet = ({ open, onClose, title, progress, onBodyScroll, children }: Props) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleScroll = () => {
    if (!onBodyScroll || !bodyRef.current) return;
    const el = bodyRef.current;
    const max = el.scrollHeight - el.clientHeight;
    onBodyScroll(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-[#1c1c1c] text-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-gray-600" />

        {progress != null && (
          <div className="h-[3px] w-full shrink-0 bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-[#FDF094] to-[#B77D2B] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between px-5 py-3">
          <h2 className="truncate pr-4 text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={bodyRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 pb-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
