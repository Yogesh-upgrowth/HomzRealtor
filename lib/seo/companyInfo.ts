// Single source of truth for the business's Name/Address/Phone (NAP) and
// registration details — referenced by the footer, the /contact page, and
// the Organization JSON-LD in app/layout.tsx, so all three ever say the same
// thing. Real estate is a YMYL category; Google and buyers both weight
// consistent NAP plus a visible RERA registration number heavily here.
//
// officeAddress / hararaAgentNumber / gstNumber / social / hours are
// deliberately blank — fill these in with the company's actual registered
// details. Every consumer of this object renders each field conditionally
// (omitted, not faked) wherever it's blank, so leaving one empty degrades
// gracefully instead of shipping a placeholder value.
export const COMPANY_INFO = {
  name: "Homz Realtor",
  legalName: "",
  phone: "+91-8447909227",
  phoneDisplay: "+91 84479 09227",
  email: "hello@homzrealtor.com",
  officeAddress: "",
  city: "Gurgaon",
  state: "Haryana",
  country: "IN",
  gstNumber: "",
  // HARERA channel-partner/agent registration number (Haryana RERA — the
  // relevant authority for the Gurgaon market this site actually serves).
  hararaAgentNumber: "",
  hours: "", // e.g. "Mon–Sat, 10:00 AM – 7:00 PM"
  mapEmbedUrl: "", // Google Maps embed src, once officeAddress is set
  social: {
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
  },
};

export function hasSocialLinks(): boolean {
  return Object.values(COMPANY_INFO.social).some(Boolean);
}
