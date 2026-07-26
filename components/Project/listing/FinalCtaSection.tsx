"use client";

import { useContext } from "react";
import Image, { type StaticImageData } from "next/image";
import { FormContext } from "@/context/FormContext";
import { buildWhatsAppHref } from "@/lib/intelligence/whatsapp";

type Props = {
  projectName: string;
  locationLine: string;
  bgImage: StaticImageData | string;
};

// Full-width final CTA for the redesigned project page. Deliberately a new
// component rather than a change to components/Common/Appointment.tsx, which
// is reused elsewhere in its current light/openForm()-only form.
const FinalCtaSection = ({ projectName, locationLine, bgImage }: Props) => {
  const { openForm } = useContext(FormContext);
  const whatsappHref = buildWhatsAppHref(projectName, locationLine);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0C]/82 to-[#0B0B0C]/95" />

      <div className="relative mx-auto max-w-[760px] px-4 py-16 text-center md:py-28">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#D9B268]">
          Ready to visit?
        </p>
        <h2 className="mb-4 font-display text-4xl leading-[1.05] text-white md:text-6xl">
          Walk the property before it&apos;s gone.
        </h2>
        <p className="mx-auto mb-8 max-w-[46ch] text-base leading-relaxed text-gray-300">
          Get expert guidance on {projectName} — pricing, availability and a personalised
          investment view from the HomzRealtor team.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={openForm}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] px-7 py-3.5 text-[15px] font-bold text-[#1c1608] shadow-[0_12px_34px_rgba(201,154,75,0.3)] hover:brightness-105 transition cursor-pointer"
          >
            Schedule Site Visit
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white hover:border-[#D9B268] transition-colors"
          >
            Call Now on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
