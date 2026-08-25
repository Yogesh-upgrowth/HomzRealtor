import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Phone, Mail, MapPin, Clock, ShieldCheck } from "lucide-react";

import AppointmentCard from "@/components/Common/Appointment";
import bgImg from "@/public/appointmentBG.jpg";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/defaultOgImage";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";
import { buildWhatsAppHref } from "@/lib/intelligence/whatsapp";

const SITE = "https://www.homzrealtor.com";
const PAGE_URL = `${SITE}/contact`;

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with HomzRealtor — phone, email, WhatsApp and office details for verified residential and commercial property advice in Gurgaon.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Contact HomzRealtor",
    description:
      "Get in touch with HomzRealtor — phone, email, WhatsApp and office details for verified residential and commercial property advice in Gurgaon.",
    url: PAGE_URL,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Contact", item: PAGE_URL },
      ],
    },
    {
      "@type": "ContactPage",
      name: "Contact HomzRealtor",
      url: PAGE_URL,
      about: { "@id": `${SITE}/#organization` },
    },
  ],
};

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const ContactPage = () => {
  const whatsappHref = buildWhatsAppHref("HomzRealtor properties in Gurgaon");

  const cardCls =
    "flex items-start gap-3 rounded-2xl border border-white/10 bg-[#141416] p-5 transition hover:border-[#D9B268]";

  return (
    <div className="min-h-screen bg-[#0B0B0C] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }}
      />

      <section className="w-full max-w-5xl mx-auto px-4 pt-28 pb-20 md:pt-32">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">Contact</span>
        </nav>

        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          Get in touch
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Contact {COMPANY_INFO.name}
        </h1>
        <p className="mt-4 max-w-2xl text-gray-400 leading-relaxed">
          Have a question about a project, a listing or an investment plan?
          Reach us directly using the details below, or send a message and
          one of our advisors will get back to you.
        </p>

        {COMPANY_INFO.hararaAgentNumber && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D9B268]/30 bg-[#D9B268]/10 px-4 py-2 text-sm font-medium text-[#D9B268]">
            <ShieldCheck size={16} />
            HARERA Registered Channel Partner — {COMPANY_INFO.hararaAgentNumber}
          </div>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <a href={`tel:${COMPANY_INFO.phone}`} className={cardCls}>
            <Phone className="mt-0.5 text-[#D9B268]" size={20} />
            <div>
              <p className="text-sm font-semibold text-white">Call Us</p>
              <p className="text-gray-400">{COMPANY_INFO.phoneDisplay}</p>
            </div>
          </a>

          <a href={`mailto:${COMPANY_INFO.email}`} className={cardCls}>
            <Mail className="mt-0.5 text-[#D9B268]" size={20} />
            <div>
              <p className="text-sm font-semibold text-white">Email Us</p>
              <p className="text-gray-400">{COMPANY_INFO.email}</p>
            </div>
          </a>

          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={cardCls}>
            <Phone className="mt-0.5 text-[#D9B268]" size={20} />
            <div>
              <p className="text-sm font-semibold text-white">WhatsApp</p>
              <p className="text-gray-400">Chat with an advisor now</p>
            </div>
          </a>

          {COMPANY_INFO.officeAddress ? (
            <div className={cardCls}>
              <MapPin className="mt-0.5 text-[#D9B268]" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Office</p>
                <p className="text-gray-400">{COMPANY_INFO.officeAddress}</p>
              </div>
            </div>
          ) : (
            <div className={cardCls}>
              <MapPin className="mt-0.5 text-[#D9B268]" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Where We Operate</p>
                <p className="text-gray-400">
                  Serving {COMPANY_INFO.city}, {COMPANY_INFO.state}
                </p>
              </div>
            </div>
          )}

          {COMPANY_INFO.hours && (
            <div className={cardCls}>
              <Clock className="mt-0.5 text-[#D9B268]" size={20} />
              <div>
                <p className="text-sm font-semibold text-white">Hours</p>
                <p className="text-gray-400">{COMPANY_INFO.hours}</p>
              </div>
            </div>
          )}
        </div>

        {COMPANY_INFO.mapEmbedUrl && (
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <iframe
              src={COMPANY_INFO.mapEmbedUrl}
              width="100%"
              height="360"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${COMPANY_INFO.name} office location`}
            />
          </div>
        )}
      </section>

      <AppointmentCard
        bgImage={bgImg}
        heading="PREFER TO TALK IT THROUGH?"
        para="Book a free consultation and one of our advisors will call you back with a personalised shortlist."
        btnTxt="Book a Consultation"
      />
    </div>
  );
};

export default ContactPage;
