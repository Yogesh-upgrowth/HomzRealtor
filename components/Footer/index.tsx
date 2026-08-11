"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/companylogo/logo.png";

// Real-estate is a YMYL (Your Money or Your Life) category — Google and
// buyers both weight demonstrable trust signals heavily here. Fill these in
// with the company's actual registered details before relying on this for
// compliance; each line only renders when non-empty, so leaving one blank
// simply omits it rather than showing a fake value.
const COMPANY_INFO = {
  officeAddress: "",
  gstNumber: "",
  hararaAgentNumber: "", // HARERA channel-partner/agent registration number
};

type FooterLink = { label: string; href: string };

type FooterProps = {
  topSectors?: FooterLink[];
  topDevelopers?: FooterLink[];
};

export default function Footer({ topSectors = [], topDevelopers = [] }: FooterProps) {
  const hasCompanyInfo =
    COMPANY_INFO.officeAddress || COMPANY_INFO.gstNumber || COMPANY_INFO.hararaAgentNumber;

  // MobileBottomNav (components/Home/MobileBottomNav.tsx) only renders on the
  // home page, not globally — so the extra bottom padding that keeps this
  // footer's content clear of it must only apply there too. Everywhere else
  // (Buy/Rent/PG/Commercial Property, Projects, Plots & Land, ...) it used to
  // leave a dead empty strip below the copyright line with nothing reserving it.
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer
      className={`bg-black text-gray-300 ${
        isHome ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0" : ""
      }`}
    >
      <div className="max-w-[1397px] mx-auto px-6 py-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Image src={logo} alt="Homz Realtor Logo" width={90} height={90} />
          </div>
          <p className="text-md text-gray-400 max-w-lg">
            Explore a curated selection of properties across the city. Find your
            dream home, investment property, or a space that suits your
            lifestyle.
          </p>
          {hasCompanyInfo && (
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              {COMPANY_INFO.officeAddress && <p>{COMPANY_INFO.officeAddress}</p>}
              {COMPANY_INFO.gstNumber && <p>GST: {COMPANY_INFO.gstNumber}</p>}
              {COMPANY_INFO.hararaAgentNumber && (
                <p>HARERA Agent Reg. No.: {COMPANY_INFO.hararaAgentNumber}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
            Company
          </p>
          <ul className="space-y-2.5 text-sm font-medium">
            <li>
              <Link href="/" className="hover:text-[#FDF094] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/project-listing" className="hover:text-[#FDF094] transition-colors">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/developer" className="hover:text-[#FDF094] transition-colors">
                Developers
              </Link>
            </li>
            <li>
              <Link href="/#consult" className="hover:text-[#FDF094] transition-colors">
                Contact
              </Link>
            </li>
          </ul>
          <ul className="mt-6 space-y-2.5 text-sm text-gray-500">
            <li>
              <Link href="/privacy-policy" className="hover:text-[#FDF094] transition-colors">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-[#FDF094] transition-colors">
                Terms of Use
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="hover:text-[#FDF094] transition-colors">
                Disclaimer
              </Link>
            </li>
          </ul>
        </div>

        {topSectors.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
              Popular Sectors
            </p>
            <ul className="space-y-2.5 text-sm font-medium">
              {topSectors.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="hover:text-[#FDF094] transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {topDevelopers.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">
              Top Developers
            </p>
            <ul className="space-y-2.5 text-sm font-medium">
              {topDevelopers.map((d) => (
                <li key={d.href}>
                  <Link href={d.href} className="hover:text-[#FDF094] transition-colors">
                    {d.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white max-w-[1397px] mx-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Homz Realtor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
