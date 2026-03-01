import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-caveat)'],    // headings — Caveat
        sans:    ['var(--font-nunito)'],    // body     — Nunito
        mono:    ['var(--font-geist-mono)'],// dice/stats
      },
      colors: {
        parchment:    '#F5F0E8',  // page background
        paper:        '#EDE6D6',  // cards, hover fills
        'warm-white': '#FAF7F2',  // elevated surfaces
        ink:          '#2C2416',  // primary text
        'ink-soft':   '#5C4F3A',  // secondary text
        'ink-faded':  '#9B8E7A',  // placeholders, dim text
        sketch:       '#C4B49A',  // borders, dividers
        tan:          '#D4C4A8',  // subtle fills, dividers
        blush:        '#C97B5A',  // primary accent, CTAs
        'blush-dark': '#9B5A3A',  // blush shadow / border on hover
        'blush-light':'#E8A882',  // blush hover state
        sage:         '#7A9E7E',  // success, active status
        'dusty-blue': '#7A8FA6',  // info, secondary accent
      },
      borderRadius: {
        // Sketchy irregular border radius — the core visual signature
        'sketch': '4px 8px 6px 5px / 6px 4px 8px 5px',
        'input':  '3px 7px 5px 4px / 5px 3px 7px 4px',
        'logo':   '8px 14px 10px 9px / 10px 8px 14px 9px',
        'badge':  '20px',
      },
      boxShadow: {
        'sketch':        '2px 2px 0px #C4B49A88',  // default card shadow
        'sketch-sm':     '1px 1px 0px #C4B49A88',  // hover state (recedes)
        'sketch-accent': '2px 2px 0px #9B5A3A',    // blush button shadow
        'logo':          '3px 3px 0px #9B5A3A',    // brand icon shadow
      },
      backgroundImage: {
        // Subtle paper grain texture — applied via bg-paper-texture
        'paper-texture': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
      },
      spacing: {
        '13': '3.25rem', // used for the 52px logo icon (w-13 / h-13)
      },
    },
  },
  plugins: [],
}

export default config
