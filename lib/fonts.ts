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

// Audit item 11 (2026-09-19): this loaded five separate static weight files
// even though Manrope is a variable font. Omitting `weight` makes next/font
// serve the single variable file covering the whole 200-800 range, which is
// smaller than the five static cuts combined and gives every intermediate
// weight for free. `axes` is not needed -- weight is the default axis.
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
});
