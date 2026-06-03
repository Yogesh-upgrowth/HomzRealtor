"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IoMenu, IoClose } from "react-icons/io5";
import logo from "@/assets/companylogo/logo.png";
import Image from "next/image";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const transparentPaths = ["/", "/listing"];

  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isTransparentPage = transparentPaths.includes(pathname);

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

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      {/* Top Strip */}
      <div className="text-[10px] md:text-sm bg-black text-white flex justify-between md:justify-center px-3 py-2">
        <span>
          Exclusive Luxury Properties in Gurgaon – Invest in Your Future Today
        </span>
        <Link href="/listing" className="font-semibold ml-2">
          VIEW ➜
        </Link>
      </div>

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
              className="w-[90px] h-[32px] md:w-[110px] md:h-[40px]"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8 text-white">
            <Link href="/">Home</Link>
            <Link href="/about-us">About Us</Link>
            <Link href="/project-listing">Properties</Link>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;