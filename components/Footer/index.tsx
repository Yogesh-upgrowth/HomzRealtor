import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/companylogo/logo.png";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
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
        </div>
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
