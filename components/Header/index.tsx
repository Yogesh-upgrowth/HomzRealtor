"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

  // 🔥 Prevent background scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
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
          <div className="hidden md:flex items-center space-x-8 text-white">
            <Link href="/">Home</Link>
            <Link href="/about-us">About Us</Link>
            <Link href="/project-listing">Properties</Link>
            <Link href="/developer">Developers</Link>
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
              matching the reference exactly (not a swapped icon pair). */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-full border border-white/10"
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
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60"
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-40 w-[min(320px,84vw)] overflow-y-auto border-l border-white/10 bg-[#131315] pt-28 shadow-[0_30px_90px_rgba(0,0,0,0.6)] transition-transform duration-[350ms] ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-1 px-6 pb-8">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex min-h-[48px] items-center border-b border-white/[0.06] py-3.5 text-[16px] font-bold text-[#ececea]"
          >
            Home
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