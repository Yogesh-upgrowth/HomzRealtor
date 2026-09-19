"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import logo from "@/assets/companylogo/logo.png";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

const PROMO_DISMISS_KEY = "promoBarDismissedAt";
const PROMO_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openLogin, openSignup } = useAuthModal();
  const transparentPaths = ["/", "/listing"];

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Starts true so the initial client render matches the server-rendered
  // markup (avoiding a hydration mismatch); the dismissal check only runs
  // after mount, same as any other localStorage-driven UI state.
  const [showPromoBar, setShowPromoBar] = useState(true);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(PROMO_DISMISS_KEY));
    if (dismissedAt && Date.now() - dismissedAt < PROMO_DISMISS_DURATION_MS) {
      setShowPromoBar(false);
    }
  }, []);

  const dismissPromoBar = () => {
    localStorage.setItem(PROMO_DISMISS_KEY, String(Date.now()));
    setShowPromoBar(false);
  };

  const isTransparentPage = transparentPaths.includes(pathname);
  const isAdminPortal = pathname.startsWith("/admin");

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastTop(window.scrollY > 10);
      setIsScrolled(window.scrollY > 400);
    };

    if (isTransparentPage) {
      window.addEventListener("scroll", handleScroll);
      handleScroll();
    } else {
      setIsScrolled(false);
      setIsScrolledPastTop(false);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, isTransparentPage]);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // MI-02 (2026-09-18): this drawer previously had zero Escape handling
  // (the audit's "Escape remained ineffective" finding), no focus trap, no
  // initial/returned focus, and nothing making the header bar behind it
  // actually inert -- a keyboard user could Tab straight through the open
  // drawer into the (visually obscured, backdrop-covered) navbar links and
  // activate them. drawerRef bounds the Tab-trap and initial-focus target
  // to the drawer's own controls; chromeRef is the promo bar + main navbar
  // block that becomes unreachable while the drawer is open (document.body's
  // other top-level children -- <main>, <Footer> -- are inerted too, same
  // technique as FormComponent's dialog).
  const drawerRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    if (!isMobileMenuOpen) return;

    const inerted: HTMLElement[] = [];
    if (chromeRef.current) {
      chromeRef.current.setAttribute("inert", "");
      inerted.push(chromeRef.current);
    }
    Array.from(document.body.children).forEach((child) => {
      if (child instanceof HTMLElement && !child.contains(drawerRef.current) && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "");
        inerted.push(child);
      }
    });

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      window.removeEventListener("keydown", handleKeydown);
      inerted.forEach((el) => el.removeAttribute("inert"));
      if (previouslyFocusedRef.current && document.body.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isMobileMenuOpen]);

  const navBackgroundClass =
    !isTransparentPage || isScrolled || isMobileMenuOpen
      ? "bg-black"
      : isScrolledPastTop
      ? "bg-white/10 backdrop-blur-md max-md:bg-black max-md:backdrop-blur-none"
      : "bg-transparent";

  // The /admin portal renders its own minimal AdminTopBar instead — an
  // internal tool doesn't need the public marketing nav.
  if (isAdminPortal) return null;

  return (
    // id used by components/Project/listing/StickyMiniHeader.tsx to measure
    // this navbar's real rendered height (it changes when the promo bar
    // above is dismissed) rather than guessing it with a hardcoded offset.
    <nav id="site-navbar" className="fixed top-0 left-0 w-full z-50">
      <div ref={chromeRef}>
      {/* Top Strip */}
      {showPromoBar && (
        <div className="relative text-[10px] md:text-sm bg-black text-white flex items-center justify-between md:justify-center gap-2 px-3 py-2 pr-9 md:pr-12">
          <span>
            Exclusive Luxury Properties in Gurgaon – Invest in Your Future Today
          </span>
          <Link href="/project-listing" className="font-semibold ml-2">
            VIEW ➜
          </Link>
          <button
            onClick={dismissPromoBar}
            aria-label="Dismiss announcement"
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <IoClose size={16} />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <div className={`w-full transition-all duration-300 border-b border-white/25 ${navBackgroundClass}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
          {/* Logo */}
          <Link href="/">
            <Image
              src={logo}
              alt="Logo"
              width={120}
              height={40}
              className="h-8 w-auto md:h-10"
            />
          </Link>

          {/* Desktop Menu */}
          {/* SEO audit 2026-09-07 P1 ("Main navigation omits key
              transaction/location journeys"): Commercial was reachable
              only from the footer or deep links, never from the header on
              any page — added here; "Properties" (project catalogue) is a
              distinct, already-correct destination and stays as-is. Buy
              and Rent were added alongside it, then removed per user
              request (2026-09-09) while those hubs were "not ready to
              surface yet"; restored 2026-09-19 per user confirmation now
              that both server-render real inventory (24 cards each, see
              app/buy-property/page.tsx's DEV-04 note). They are the site's
              highest-intent hubs and were the only major destinations
              carrying zero sitewide internal links. */}
          <div className="hidden lg:flex items-center space-x-6 text-white text-sm">
            <Link href="/">Home</Link>
            <Link href="/buy-property">Buy</Link>
            <Link href="/rent-property">Rent</Link>
            <Link href="/commercial">Commercial</Link>
            <Link href="/project-listing">Properties</Link>
            <Link href="/developer">Developers</Link>
            <Link href="/property-insights">Insights</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/about-us">About Us</Link>
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link href="/admin" className="text-sm hover:text-[#B77D2B]">
                    Admin
                  </Link>
                ) : user.role === "agent" ? (
                  <Link href="/dashboard" className="text-sm hover:text-[#B77D2B]">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/account" className="text-sm hover:text-[#B77D2B]">
                      Account
                    </Link>
                    <Link href="/account/wishlist" className="text-sm hover:text-[#B77D2B]">
                      Wishlist
                    </Link>
                  </>
                )}
                <span className="text-sm text-gray-300">Hi, {user.name}</span>
                <button onClick={handleLogout} className="text-sm hover:text-[#B77D2B] cursor-pointer">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={openLogin} className="cursor-pointer">Login</button>
                <button
                  onClick={openSignup}
                  className="rounded-full bg-gradient-to-r from-[#FDF094] to-[#B77D2B] px-4 py-1.5 text-sm font-semibold text-black cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle — custom 3-bar hamburger that morphs into an X,
              matching the reference exactly (not a swapped icon pair).
              lg:hidden, not md:hidden — matches the desktop menu's lg:flex
              above so there's no mid-width gap where neither menu shows. */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="lg:hidden flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-full border border-white/10"
          >
            <span
              className={`h-[2px] w-[18px] rounded-full bg-[#ececea] transition-transform duration-[250ms] ${
                isMobileMenuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-[18px] rounded-full bg-[#ececea] transition-opacity duration-[250ms] ${
                isMobileMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-[2px] w-[18px] rounded-full bg-[#ececea] transition-transform duration-[250ms] ${
                isMobileMenuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>
      </div>

      {/* Mobile nav drawer — a right-side panel under the header (not a
          full-screen overlay), matching the reference's `.mobile-nav-drawer`
          exactly: fixed, width min(320px,84vw), surface-2 background,
          left border, slide-in from the right. The fixed header (z-50)
          renders on top of the drawer's own top edge, which is what visually
          keeps the drawer's content clear of the promo bar + navbar without
          needing to measure their live height. */}
      {/* Tap-outside-to-close backdrop — a sibling of the drawer (not
          nested inside it), so its z-index is compared directly against the
          drawer's within the same stacking context instead of being scoped
          inside the drawer's own. */}
      {isMobileMenuOpen && (
        <button
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60"
        />
      )}

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed top-0 right-0 bottom-0 z-40 w-[min(320px,84vw)] overflow-y-auto border-l border-white/10 bg-[#131315] pt-28 shadow-[0_30px_90px_rgba(0,0,0,0.6)] transition-transform duration-[350ms] ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* MI-02: a real, visible, labeled close control inside the panel
            itself -- previously the only way to dismiss via anything other
            than a route change or Escape (which didn't work either) was
            tapping the full-screen backdrop, which happened to visually sit
            over the header's own hamburger/X toggle and intercept clicks
            meant for it. */}
        <button
          type="button"
          ref={closeButtonRef}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-[#D9B268] hover:text-[#D9B268]"
        >
          <IoClose size={20} />
        </button>
        <div className="flex flex-col gap-1 px-6 pb-8">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Home
          </Link>
          <Link
            href="/buy-property"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Buy
          </Link>
          <Link
            href="/rent-property"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Rent
          </Link>
          <Link
            href="/commercial"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Commercial
          </Link>
          <Link
            href="/about-us"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            About Us
          </Link>
          <Link
            href="/project-listing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Properties
          </Link>
          <Link
            href="/developer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Developers
          </Link>
          <Link
            href="/property-insights"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Insights
          </Link>
          <Link
            href="/blog"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Blog
          </Link>

          <div className="mt-2 pt-2">
            {user ? (
              <div className="flex flex-col gap-1">
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
                  >
                    Admin
                  </Link>
                ) : user.role === "agent" ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
                    >
                      Account
                    </Link>
                    <Link
                      href="/account/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
                    >
                      Wishlist
                    </Link>
                  </>
                )}
                <span className="py-2 text-sm text-gray-400">Hi, {user.name}</span>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex min-h-[48px] cursor-pointer items-center text-left text-[16px] font-bold text-[#ececea]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  className="flex min-h-[48px] cursor-pointer items-center text-left text-[16px] font-bold text-[#ececea]"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openLogin();
                  }}
                >
                  Login
                </button>
                <button
                  className="flex min-h-[48px] cursor-pointer items-center text-left text-[16px] font-bold text-[#ececea]"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openSignup();
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;