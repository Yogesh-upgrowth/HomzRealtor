import { Instrument_Serif, Manrope } from "next/font/google";

// Shared dark-luxury typography — used by the project detail page and the
// homepage. Loaded once here (next/font/google loaders are meant to be
// instantiated per unique config, not duplicated per file) and applied by
// each consumer via its own scoped wrapper div, so the rest of the site
// keeps its current fonts.
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
});
