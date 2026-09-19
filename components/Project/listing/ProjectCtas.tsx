"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarCheck, IndianRupee, Share2, Heart, Check, Link as LinkIcon } from "lucide-react";
import { scrollToHash } from "@/lib/scrollToHash";

type Props = {
  name: string;
  enquireHref: string;
  // Stable per-project identity (e.g. `${cityKey}/${slug}`) for this guest
  // save toggle's storage key. MI-08 (2026-09-18): this used to be derived
  // from enquireHref, which is the hardcoded literal "#enquire" on every
  // project page — every project collapsed onto the same localStorage key,
  // so saving one silently "saved" all of them. The old shared key is left
  // alone (not migrated, not propagated to any specific project — there's
  // no way to know which project a stale shared flag was ever meant for),
  // it's simply no longer read from or written to.
  projectKey: string;
  variant?: "hero" | "compact";
};

const ProjectCtas = ({ name, enquireHref, projectKey, variant = "hero" }: Props) => {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const storageKey = `homz-saved-v2-${projectKey}`;

  useEffect(() => {
    try {
      setSaved(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // R19-12 (2026-09-19): setSaved() ran *before* the write and the catch was
  // empty, so when localStorage is unavailable (private mode, blocked site
  // data, quota exhausted) the button still flipped to "Saved" with
  // aria-pressed="true" while nothing had been persisted -- and the save was
  // silently gone on reload. Write first, reflect the outcome second, and say
  // so when it fails rather than implying durable storage that does not exist.
  const toggleSave = () => {
    const next = !saved;
    try {
      if (next) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
      setSaved(next);
    } catch {
      toast.error(
        "Couldn't save this on your device. Check your browser's site-data settings and try again."
      );
    }
  };

  // R19-12: saves are per-browser and a second tab writing the same key used
  // to leave this one showing stale state. `storage` fires only in *other*
  // tabs of the same origin, which is exactly the case that was wrong.
  useEffect(() => {
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setSaved(event.newValue === "1");
    };
    window.addEventListener("storage", syncFromOtherTab);
    return () => window.removeEventListener("storage", syncFromOtherTab);
  }, [storageKey]);

  // R19-12: extracted so both the Share failure path and the always-present
  // Copy link button below use the same implementation.
  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      return true;
    } catch {
      toast.error("Couldn't copy the link, copy it from the address bar instead.");
      return false;
    }
  };

  // R19-12: the failure toast used to read "Try Copy Link instead" while no
  // Copy Link control existed anywhere, and the early `return` after the
  // native-share branch made the clipboard fallback below unreachable on any
  // device that has navigator.share -- i.e. essentially every phone, which is
  // also where `copied`/"Copied" was therefore dead code. Now a real failure
  // falls through to the clipboard, and there is a separate Copy link button
  // regardless.
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (err) {
        // MI-09 (2026-09-18): the native share sheet rejects with
        // AbortError when the user simply dismisses it — that's a normal,
        // neutral outcome, not a failure. Anything else (permission denied,
        // no share target, etc.) is a real failure, and the useful recovery
        // is to copy the link rather than tell the user to find a button.
        if (err instanceof Error && err.name === "AbortError") return;
        const didCopy = await copyLink();
        if (didCopy) toast.success("Share sheet unavailable, link copied instead.");
        return;
      }
    }

    await copyLink();
  };

  const isHero = variant === "hero";

  return (
    <div className={isHero ? "space-y-3" : "flex gap-2"}>
      <div className={isHero ? "grid grid-cols-2 gap-3" : "flex gap-2"}>
        <Link
          href={enquireHref}
          onClick={(e) => scrollToHash(enquireHref, e)}
          className={
            isHero
              ? "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-4 py-3.5 text-[15px] font-bold text-[#1c1608] shadow-[0_12px_34px_rgba(201,154,75,0.3)] hover:brightness-105 transition"
              : "flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#FDF094] to-[#B77D2B] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
          }
        >
          <CalendarCheck size={18} /> Site Visit
        </Link>
        <Link
          href={enquireHref}
          onClick={(e) => scrollToHash(enquireHref, e)}
          className={
            isHero
              ? "flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3.5 text-[15px] font-semibold text-white hover:border-[#D9B268] transition-colors"
              : "flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
          }
        >
          <IndianRupee size={18} /> Best Price
        </Link>
      </div>

      {isHero && (
        <div className="flex gap-3">
          <button
            onClick={toggleSave}
            aria-pressed={saved}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              saved
                ? "border-[#D9B268] bg-[#D9B268]/10 text-[#D9B268]"
                : "border-white/15 text-gray-300 hover:border-white/30"
            }`}
          >
            <Heart size={16} className={saved ? "fill-[#D9B268]" : ""} />
            {saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={share}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-white/30 transition-colors"
          >
            <Share2 size={16} />
            Share
          </button>
          {/* R19-12: the real Copy link affordance the failure message used to
              point at. Also the only way to copy on a device with a native
              share sheet, where the clipboard path was previously unreachable. */}
          <button
            onClick={copyLink}
            aria-label="Copy link to this project"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-300 hover:border-white/30 transition-colors"
          >
            {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCtas;
