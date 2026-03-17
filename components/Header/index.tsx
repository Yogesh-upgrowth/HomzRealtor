// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IoMenu, IoClose } from "react-icons/io5";
import { ChevronDown } from "lucide-react";
import logo from "@/assets/companylogo/logo.png";
import Image from "next/image";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const transparentPaths = ["/", "/listing"];
  const [isScrolledPastTop, setIsScrolledPastTop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  const isTransparentPage = transparentPaths.includes(pathname);

  // Effect to handle navbar background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledPastTop(window.scrollY > 10);
      setIsScrolled(window.scrollY > 400);
    };

    if (isTransparentPage) {
      window.addEventListener("scroll", handleScroll);
      // Initial check in case page is already scrolled
      handleScroll();
    } else {
      setIsScrolled(false);
      setIsScrolledPastTop(false);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, isTransparentPage]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navBackgroundClass =
    !isTransparentPage || isScrolled || isMobileMenuOpen
      ? "bg-black border-[1px] border-white"
      : isScrolledPastTop
      ? "bg-white/10 backdrop-blur-md border-[1px] border-white"
      : "bg-transparent border-[1px] border-white";

  return (
    <nav className="fixed top-0 left-0 w-full z-50">
      <div className="relative md:text-[14px] text-[10px] bg-black text-white text-center md:py-3 py-2 flex md:flex-row justify-between md:justify-center md:px-4 px-2">
        <span className="text-start px-0">
          Exclusive Luxury Properties in Gurgaon – Invest in Your Future Today
        </span>
        <Link
          href="/listing"
          className="font-semibold cursor-pointer text-[10px] md:text-sm md:ml-2"
        >
          VIEW LISTINGS ➜
        </Link>
      </div>

      {/*Unified Main Navbar Container */}
      <div
        className={`w-full transition-colors duration-300  ${navBackgroundClass}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4">
          {/* Logo */}
          <Link href="/">
            <Image
              src={logo}
              alt="Homz Realtor Logo"
              width={140}
              height={100}
              priority
              className="w-[100px] h-[35px] md:w-[100px] md:h-[40px]"
            />
          </Link>

          {/* Desktop Menu  */}
          <div className="hidden md:flex items-center space-x-8 text-white">
            <Link href="/" className="hover:text-gray-200 transition">
              Home
            </Link>
            <Link href="/about-us" className="hover:text-gray-200 transition">
              About Us
            </Link>
            <Link
              href="/project-listing"
              className="hover:text-gray-200 transition"
            >
              Properties
            </Link>
            {/* Desktop Dropdown */}
            {/* <div className="relative">
              <button
                onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                className="flex items-center hover:text-gray-200 transition"
              >
                Properties
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              {isPropertiesOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1">
                  <Link
                    href="/properties/apartments"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Apartments
                  </Link>
                  <Link
                    href="/properties/villas"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Villas
                  </Link>
                  <Link
                    href="/properties/commercial"
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Commercial
                  </Link>
                </div>
              )}
            </div> */}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="text-white p-2"
            >
              {isMobileMenuOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/*  Mobile Menu  */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black text-white w-full absolute top-[118px] left-0 shadow-lg border-t b-[1px] border-white">
          <div className="flex flex-col px-4 py-2">
            <Link href="/" className="py-2 hover:text-gray-300">
              Home
            </Link>
            <Link href="/about-us" className="py-2 hover:text-gray-300">
              About Us
            </Link>
            <Link href="/project-listing" className="py-2 hover:text-gray-300">
              Properties
            </Link>

            {/* <Link
              href="/properties/apartments"
              className="py-2 pl-4 hover:text-gray-300"
            >
              Apartments
            </Link>
            <Link
              href="/properties/villas"
              className="py-2 pl-4 hover:text-gray-300"
            >
              Villas
            </Link>
            <Link
              href="/properties/commercial"
              className="py-2 pl-4 hover:text-gray-300"
            >
              Commercial
            </Link> */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
