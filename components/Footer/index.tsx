"use client";

import Image from "next/image";
import logo from "@/assets/companylogo/logo.png";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-[1397px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Image src={logo} alt="Homz Realtor Logo" width={90} height={90} />
          </div>
          <p className="text-md text-gray-400 max-w-lg">
            Explore a curated selection of properties across the city. Find your
            dream home, investment property, or a space that suits your
            lifestyle.
          </p>
        </div>

        <div className="flex flex-col md:items-end">
          <ul className="grid grid-cols-2 md:flex flex-cols-2 md:flex-row gap-4 md:gap-8 text-sm font-medium">
            <li>
              <a href="#" className="hover:text-[#FDF094] transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#FDF094] transition-colors">
                Projects
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#FDF094] transition-colors">
                Developers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#FDF094] transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Homz Realtor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
