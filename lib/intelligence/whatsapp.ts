// Single source of truth for the "Call Now on WhatsApp" CTA used across the
// redesigned project page, so the rail and final CTA never drift on copy.

const WHATSAPP_NUMBER = "918447909227";

export function buildWhatsAppHref(projectName: string, locationLine?: string | null): string {
  const message = locationLine
    ? `Hi, I'm interested in ${projectName} in ${locationLine}. Please share more details.`
    : `Hi, I'm interested in ${projectName}. Please share more details.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
