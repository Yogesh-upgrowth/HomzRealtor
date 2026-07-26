// In your tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
                custom: ['Zolina', 'sans-serif'], // Added 'sans-serif' as a fallback
                display: ['var(--font-display)', 'serif'], // Instrument Serif, project-listing/[city]/[slug] page only
                ui: ['var(--font-ui)', 'sans-serif'], // Manrope, project-listing/[city]/[slug] page only
      },
    },
  },
  plugins: [],
}
export default config