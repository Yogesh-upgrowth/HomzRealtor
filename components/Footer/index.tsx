"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/companylogo/logo.png";
import { Instagram, Facebook, Linkedin, Youtube } from "lucide-react";
import { COMPANY_INFO, hasSocialLinks } from "@/lib/seo/companyInfo";

type FooterLink = { label: string; href: string };

type FooterProps = {
  topSectors?: FooterLink[];
  topDevelopers?: FooterLink[];
};

export default function Footer({ topSectors = [], topDevelopers = [] }: FooterProps) {
  // MobileBottomNav (components/Home/MobileBottomNav.tsx) only renders on the
  // home page, not globally — so the extra bottom padding that keeps this
  // footer's content clear of it must only apply there too. Everywhere else
  // (Buy/Rent/PG/Commercial Property, Projects, Plots & Land, ...) it used to
  // leave a dead empty strip below the copyright line with nothing reserving it.
  const pathname = usePathname();
  const isHome = pathname === "/";

  // The /admin portal renders its own minimal chrome — no public footer.
  if (pathname.startsWith("/admin")) return null;

  // Column heading / link / hover styles below are lifted exactly from the
  // reference build's css/layout.css `.footer-col h4/a`, `.footer-bottom`
  // rules and css/base.css tokens (--surface-deep, --border, --text-6/-8/-9,
  // --accent) — same structure/content as before, just matched typography
  // and color.
  const colHeadingCls =
    "mb-3 text-xs font-bold uppercase tracking-[1.5px] text-[#8a8986] md:mb-[18px] md:text-[13px]";
  const colLinkCls =
    "text-[13.5px] text-[#9b9a97] transition-colors hover:text-[#D9B268] md:text-[14px]";

  return (
    <footer
      className={`bg-[#0f0f11] text-[#9b9a97] ${
        isHome ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0" : ""
      }`}
    >
      <div className="max-w-[1397px] mx-auto px-6 pt-10 pb-10 grid grid-cols-1 gap-8 border-b border-[rgba(255,255,255,0.06)] sm:grid-cols-2 md:pt-[clamp(48px,6vw,80px)] lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src={logo} alt="Homz Realtor Logo" width={90} height={90} />
          </div>
          <p className="text-[14px] text-[#9b9a97] max-w-lg">
            Explore a curated selection of properties across the city. Find your
            dream home, investment property, or a space that suits your
            lifestyle.
          </p>
          <div className="mt-4 space-y-1 text-[13px] text-[#6E6D6A]">
            <p>
              <a href={`tel:${COMPANY_INFO.phone}`} className="hover:text-[#D9B268]">
                {COMPANY_INFO.phoneDisplay}
              </a>
            </p>
            <p>
              <a href={`mailto:${COMPANY_INFO.email}`} className="hover:text-[#D9B268]">
                {COMPANY_INFO.email}
              </a>
            </p>
            {COMPANY_INFO.officeAddress && <p>{COMPANY_INFO.officeAddress}</p>}
            {COMPANY_INFO.gstNumber && <p>GST: {COMPANY_INFO.gstNumber}</p>}
            {COMPANY_INFO.hararaAgentNumber && (
              <p>HARERA Agent Reg. No.: {COMPANY_INFO.hararaAgentNumber}</p>
            )}
          </div>
          {hasSocialLinks() && (
            <div className="mt-4 flex gap-3">
              {COMPANY_INFO.social.instagram && (
                <a href={COMPANY_INFO.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#9b9a97] hover:text-[#D9B268]">
                  <Instagram size={18} />
                </a>
              )}
              {COMPANY_INFO.social.facebook && (
                <a href={COMPANY_INFO.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-[#9b9a97] hover:text-[#D9B268]">
                  <Facebook size={18} />
                </a>
              )}
              {COMPANY_INFO.social.linkedin && (
                <a href={COMPANY_INFO.social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[#9b9a97] hover:text-[#D9B268]">
                  <Linkedin size={18} />
                </a>
              )}
              {COMPANY_INFO.social.youtube && (
                <a href={COMPANY_INFO.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-[#9b9a97] hover:text-[#D9B268]">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          )}
        </div>

        <div>
          <p className={colHeadingCls}>Company</p>
          <ul className="space-y-2.5 font-medium">
            <li>
              <Link href="/" className={colLinkCls}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/project-listing" className={colLinkCls}>
                Projects
              </Link>
            </li>
            <li>
              <Link href="/developer" className={colLinkCls}>
                Developers
              </Link>
            </li>
            <li>
              <Link href="/contact" className={colLinkCls}>
                Contact
              </Link>
            </li>
          </ul>
          <ul className="mt-6 space-y-2.5">
            <li>
              <Link href="/privacy-policy" className={colLinkCls}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={colLinkCls}>
                Terms of Use
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className={colLinkCls}>
                Disclaimer
              </Link>
            </li>
          </ul>
        </div>

        {topSectors.length > 0 && (
          <div>
            <p className={colHeadingCls}>Popular Sectors</p>
            <ul className="space-y-2.5 font-medium">
              {topSectors.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={colLinkCls}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topDevelopers.length > 0 && (
          <div>
            <p className={colHeadingCls}>Top Developers</p>
            <ul className="space-y-2.5 font-medium">
              {topDevelopers.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className={colLinkCls}>
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="max-w-[1397px] mx-auto px-6 py-[18px] text-left text-[12.5px] text-[#6E6D6A] md:py-[22px]">
        © {new Date().getFullYear()} Homz Realtor. All rights reserved.
      </div>
    </footer>
  );
}
