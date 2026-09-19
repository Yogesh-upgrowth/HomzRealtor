"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Building2,
  IndianRupee,
  BedDouble,
  CalendarClock,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import {
  EMPTY_SEARCH_VALUES,
  FIELD_LABEL,
  FIELD_PARAM,
  SEARCH_MODES,
  buildSearchUrl,
  hasErrors,
  optionsFor,
  validateSearch,
  valuesForMode,
  type SearchErrors,
  type SearchFieldId,
  type SearchValues,
} from "@/lib/search/searchModes";

const TRENDING = [
  { label: "Sector 65", href: "/buy-property?q=Sector+65" },
  { label: "Golf Course Road", href: "/buy-property?q=Golf+Course+Road" },
  // These two have dedicated, indexable landing pages (BUY_FACETS in
  // components/PropertyListing/FacetedListingPage.tsx) — better destinations
  // than the equivalent filtered query string, which canonicalises away.
  { label: "Ready to move", href: "/buy-property/gurgaon/ready-to-move" },
  { label: "Commercial spaces", href: "/commercial" },
  { label: "Under ₹1 Cr", href: "/buy-property/gurgaon/under-1-crore" },
];

const FIELD_ICON: Record<SearchFieldId, typeof Building2> = {
  propertyType: Building2,
  budget: IndianRupee,
  bedrooms: BedDouble,
  possession: CalendarClock,
};

const QuickSearchPanel = () => {
  const router = useRouter();
  const errorId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [modeId, setModeId] = useState(SEARCH_MODES[0].id);
  const [values, setValues] = useState<SearchValues>(EMPTY_SEARCH_VALUES);
  // Errors only appear after a submit attempt — flagging an untouched panel
  // red on first paint would be noise, not feedback.
  const [errors, setErrors] = useState<SearchErrors>({});

  const mode = useMemo(
    () => SEARCH_MODES.find((m) => m.id === modeId) || SEARCH_MODES[0],
    [modeId]
  );

  // MI-03 (2026-09-18): this sheet already had Escape and scroll-lock --
  // the missing piece the handoff calls out is the rest of the focus
  // lifecycle, same technique as FormComponent's enquiry dialog: overlayRef
  // marks this portal's own node so background-inertness skips it, dialogRef
  // bounds the Tab-trap, headingRef is where focus lands on open (not the
  // Location input -- that would pop the mobile keyboard immediately on
  // open, which MI-16 flags as its own problem).
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const inerted: HTMLElement[] = [];
    Array.from(document.body.children).forEach((child) => {
      if (child === overlayRef.current) return;
      if (child instanceof HTMLElement && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    });

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
      inerted.forEach((el) => el.removeAttribute("inert"));
      if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [mobileOpen]);

  // Each tab searches a different feed with a different field set, so the
  // carried-over values are narrowed to what the new tab can actually
  // express (valuesForMode) instead of being silently sent as-is.
  const handleTabChange = (nextModeId: string) => {
    const nextMode = SEARCH_MODES.find((m) => m.id === nextModeId) || SEARCH_MODES[0];
    setModeId(nextModeId);
    setValues((current) => valuesForMode(nextMode, current));
    setErrors({});
  };

  const setValue = (key: keyof SearchValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    // Any edit is an attempt to fix the problem — clear the complaint rather
    // than leaving a stale red field while the user types.
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateSearch(mode, values);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setMobileOpen(false);
    router.push(buildSearchUrl(mode, values));
  };

  // MI-01 (2026-09-18): the inner input/select in every field below has
  // outline-none (to avoid a default browser ring clashing with the pill
  // shape), but nothing here compensated for it -- so a keyboard-focused
  // field showed literally no visual change at all. The tab buttons above
  // never had outline-none, which is why they alone showed a native ring
  // in the original audit. focus-within on the shared wrapper standardizes
  // real focus feedback across all four fields at once.
  const fieldCls = (invalid = false) =>
    `flex items-center gap-2.5 rounded-xl border bg-[#1a1a1d] px-4 h-[50px] md:h-[52px] text-[14px] text-white transition-colors focus-within:ring-2 ${
      invalid
        ? "border-[#e2564d] focus-within:border-[#e2564d] focus-within:ring-[#e2564d]/30"
        : "border-white/10 focus-within:border-[#D9B268] focus-within:ring-[#D9B268]/30"
    }`;

  // Custom corner-arrow chevron for `appearance-none` selects — same shape as
  // the reference's `.select-wrap::after` (and the mobile CTA's own chevron):
  // an 8x8px rotated corner, not a lucide icon.
  const arrowCls =
    "h-2 w-2 shrink-0 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[#8a8986]";

  // The grid has 5 columns on desktop, 2 of which the location field spans —
  // with 3 selects it fills exactly, with 2 (Plots) the row stays balanced.
  const locationSpan = mode.fields.length >= 3 ? "lg:col-span-2" : "lg:col-span-3";

  const renderSearchControls = (showMobileHeader: boolean) => (
    <>
      {showMobileHeader && (
        <div className="mb-5 md:hidden">
          <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/15" aria-hidden="true" />
          <div className="flex items-center justify-between gap-4">
            <h2
              id="mobile-search-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-[22px] font-bold tracking-[-0.02em] text-white outline-none"
            >
              Search properties
            </h2>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close search"
              data-testid="button-close-property-search"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-gray-200 transition-colors hover:border-[#D9B268] hover:text-[#D9B268]"
            >
              <X size={21} />
            </button>
          </div>
        </div>
      )}

      {/* MI-01/MI-03: a mutually-exclusive segmented control -- aria-pressed
          gives it real selected-state semantics without claiming the fuller
          (and here unnecessary) tab/tabpanel roles the doc warns against
          adding incompletely. */}
      <div role="group" aria-label="Search mode" className="mb-3 grid grid-cols-4 gap-1.5 md:flex md:flex-wrap md:gap-2">
        {SEARCH_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handleTabChange(m.id)}
            aria-pressed={mode.id === m.id}
            data-testid={`button-search-mode-${m.id}`}
            className={`min-h-11 rounded-full px-2 py-2 text-[13px] font-bold transition md:min-h-0 md:px-5 md:py-2.5 md:text-[13.5px] ${
              mode.id === m.id
                ? "bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] text-[#1c1608]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Says in plain words what the selected tab searches, so a changing
          field set reads as intentional rather than as a glitch. */}
      <p className="mb-4 text-[12px] leading-snug text-gray-500 md:text-[12.5px]" aria-live="polite">
        {mode.blurb}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={errors.form ? `${errorId}-form` : undefined}
        className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5"
      >
        <label className={`${fieldCls(Boolean(errors.q))} ${locationSpan}`}>
          <MapPin size={17} className="shrink-0 text-gray-500" />
          <input
            value={values.q}
            onChange={(e) => setValue("q", e.target.value)}
            placeholder={mode.locationPlaceholder}
            aria-label={mode.locationLabel}
            aria-invalid={Boolean(errors.q)}
            aria-describedby={errors.q ? `${errorId}-q` : undefined}
            autoComplete="off"
            className="w-full bg-transparent text-white placeholder:text-gray-500 outline-none"
          />
        </label>

        {mode.fields.map((field) => {
          const Icon = FIELD_ICON[field];
          const param = FIELD_PARAM[field];
          return (
            <label key={field} className={fieldCls()}>
              <Icon size={17} className="shrink-0 text-gray-500" />
              <select
                value={values[param]}
                onChange={(e) => setValue(param, e.target.value)}
                aria-label={FIELD_LABEL[field]}
                className="w-full appearance-none bg-transparent text-white outline-none"
              >
                {optionsFor(mode, field).map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#1a1a1d]">
                    {o.label}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className={arrowCls} />
            </label>
          );
        })}

        {(errors.q || errors.form) && (
          <p
            id={errors.q ? `${errorId}-q` : `${errorId}-form`}
            role="alert"
            className="flex items-start gap-1.5 text-[12.5px] font-semibold text-[#ef8079] md:col-span-2 lg:col-span-5"
          >
            <AlertCircle size={14} className="mt-[1px] shrink-0" />
            {errors.q || errors.form}
          </p>
        )}

        <button
          type="submit"
          data-testid="button-submit-property-search"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-5 text-[15px] font-bold text-[#1c1608] transition hover:brightness-105 md:col-span-2 md:h-[52px] md:text-[14px] lg:col-span-5"
        >
          <Search size={17} /> Search {mode.searchNoun}
        </button>
      </form>

      <div className="mt-3 flex flex-nowrap items-center gap-1.5 overflow-x-auto border-t border-white/10 pb-1 pt-3 scrollbar-hide md:mt-4 md:flex-wrap md:overflow-visible md:pb-0 md:pt-4">
        <span className="mr-1 shrink-0 text-[11px] font-bold uppercase tracking-widest text-gray-500">Trending</span>
        {TRENDING.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="shrink-0 whitespace-nowrap rounded-full border border-white/[0.08] bg-[#D9B268]/[0.06] px-2.5 py-1 text-[11px] font-semibold text-gray-300 transition hover:border-[#D9B268]/40 hover:text-[#D9B268] md:px-3.5 md:py-1.5 md:text-[12.5px]"
          >
            {t.label}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile-only CTA — opens the search panel in a bottom sheet. Desktop keeps the panel inline below.
          Values below (radius, padding, colors, font sizes) are lifted exactly from the reference
          build's css/sections.css `.hero-search` / `.hero-search-trigger` / `.hss-*` rules, not
          eyeballed — see design tokens in css/base.css (--r-card-lg:24px, --r-pill:999px,
          --surface-input:#1a1a1d, --text-2/-7/-8, --accent-2/-deep). */}
      <div className="rounded-[22px] border border-white/10 bg-[#121214]/72 p-2.5 backdrop-blur-[20px] md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          data-testid="button-open-property-search"
          className="flex min-h-[56px] w-full items-center gap-3 rounded-full border border-white/10 bg-[#1a1a1d] px-2.5 py-2 text-left transition hover:border-[#D9B268]/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F2D79B] to-[#C99A4B]">
            <Search size={18} className="text-[#1c1608]" />
          </span>
          <span className="min-w-0 flex-1 leading-[1.35]">
            <span className="block truncate text-[14px] font-bold text-[#ececea]">Search properties in Gurgaon</span>
            <span className="block truncate text-[11.5px] text-[#7d7c79]">Buy · Rent · Commercial · Plots</span>
          </span>
          <span
            aria-hidden="true"
            className="mr-2.5 h-2 w-2 shrink-0 rotate-45 border-b-[1.5px] border-r-[1.5px] border-[#8a8986] transition-transform duration-200"
          />
        </button>
      </div>

      {portalReady &&
        createPortal(
          <div
            ref={overlayRef}
            role="presentation"
            onClick={() => setMobileOpen(false)}
            className={`fixed inset-0 z-[100] flex items-end justify-center bg-black/70 pt-6 transition-[opacity,visibility] duration-300 md:hidden ${
              mobileOpen
                ? "visible pointer-events-auto opacity-100"
                : "invisible pointer-events-none opacity-0"
            }`}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-search-title"
              onClick={(event) => event.stopPropagation()}
              className={`relative max-h-[calc(100dvh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-b-0 border-white/10 bg-[#121214] px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_80px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-out scrollbar-hide ${
                mobileOpen ? "translate-y-0" : "translate-y-full"
              }`}
            >
              {renderSearchControls(true)}
            </div>
          </div>,
          document.body,
        )}

      <div className="relative hidden w-full rounded-[24px] border border-white/10 bg-[#121214]/72 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl md:block">
        {renderSearchControls(false)}
      </div>
    </>
  );
};

export default QuickSearchPanel;
