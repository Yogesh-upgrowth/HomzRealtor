"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IoMenu, IoClose } from "react-icons/io5";
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
      ? "bg-white/10 backdrop-blur-md"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
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

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMobileMenuOpen ? <IoClose size={26} /> : <IoMenu size={26} />}
          </button>
        </div>
      </div>

      {/* 🔥 Mobile Fullscreen Menu */}
      <div
        className={`fixed inset-0 bg-black text-white z-50 transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Top Bar inside menu */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-700">
          <span className="text-lg font-semibold">Menu</span>

          {/* ✅ Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white"
          >
            <IoClose size={28} />
          </button>
        </div>

        {/* Menu Links */}
        <div className="flex flex-col px-6 py-6 space-y-6 text-lg">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </Link>
          <Link href="/about-us" onClick={() => setIsMobileMenuOpen(false)}>
            About Us
          </Link>
          <Link
            href="/project-listing"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Properties
          </Link>
          <Link href="/developer" onClick={() => setIsMobileMenuOpen(false)}>
            Developers
          </Link>

          <div className="border-t border-gray-700 pt-6">
            {user ? (
              <div className="flex flex-col gap-4">
                {user.role === "admin" || user.role === "super_admin" ? (
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    Admin
                  </Link>
                ) : user.role === "agent" ? (
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/account" onClick={() => setIsMobileMenuOpen(false)}>
                      Account
                    </Link>
                    <Link href="/account/wishlist" onClick={() => setIsMobileMenuOpen(false)}>
                      Wishlist
                    </Link>
                  </>
                )}
                <span className="text-gray-400 text-base">Hi, {user.name}</span>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <button
                  className="text-left cursor-pointer"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openLogin();
                  }}
                >
                  Login
                </button>
                <button
                  className="text-left cursor-pointer"
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