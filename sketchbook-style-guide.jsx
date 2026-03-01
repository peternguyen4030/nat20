import { useState } from "react";

const colors = [
  { name: "Parchment", hex: "#F5F0E8", tailwind: "bg-[#F5F0E8]", usage: "Page background" },
  { name: "Aged Paper", hex: "#EDE6D6", tailwind: "bg-[#EDE6D6]", usage: "Cards, panels" },
  { name: "Warm White", hex: "#FAF7F2", tailwind: "bg-[#FAF7F2]", usage: "Elevated surfaces" },
  { name: "Ink", hex: "#2C2416", tailwind: "text-[#2C2416]", usage: "Primary text" },
  { name: "Soft Ink", hex: "#5C4F3A", tailwind: "text-[#5C4F3A]", usage: "Secondary text" },
  { name: "Faded Ink", hex: "#9B8E7A", tailwind: "text-[#9B8E7A]", usage: "Placeholders, dim text" },
  { name: "Sketch Line", hex: "#C4B49A", tailwind: "border-[#C4B49A]", usage: "Borders, dividers" },
  { name: "Warm Tan", hex: "#D4C4A8", tailwind: "bg-[#D4C4A8]", usage: "Subtle fills" },
  { name: "Blush Accent", hex: "#C97B5A", tailwind: "text-[#C97B5A]", usage: "Primary accent, CTAs" },
  { name: "Blush Light", hex: "#E8A882", tailwind: "bg-[#E8A882]", usage: "Hover states" },
  { name: "Sage", hex: "#7A9E7E", tailwind: "text-[#7A9E7E]", usage: "Success, active status" },
  { name: "Dusty Blue", hex: "#7A8FA6", tailwind: "text-[#7A8FA6]", usage: "Info, secondary accent" },
];

const typeScale = [
  { name: "Display", classes: "text-4xl font-bold", style: { fontFamily: "'Caveat', cursive", letterSpacing: "-0.5px" }, sample: "My Campaign Journal", usage: "Page titles, hero text" },
  { name: "Heading 1", classes: "text-2xl font-semibold", style: { fontFamily: "'Caveat', cursive" }, sample: "Active Adventures", usage: "Section headers" },
  { name: "Heading 2", classes: "text-lg font-semibold", style: { fontFamily: "'Caveat', cursive" }, sample: "The Sunken City", usage: "Card titles" },
  { name: "Body", classes: "text-sm", style: { fontFamily: "'Nunito', sans-serif" }, sample: "A grim world of perilous adventure awaits beyond the old forest gate.", usage: "Default body copy" },
  { name: "Label", classes: "text-xs font-semibold tracking-wider uppercase", style: { fontFamily: "'Nunito', sans-serif" }, sample: "Last Played 3 Days Ago", usage: "Metadata, badges" },
  { name: "Mono / Dice", classes: "text-sm font-mono", style: { fontFamily: "'Courier Prime', monospace" }, sample: "roll(2d6 + 4) = 11", usage: "Dice expressions, stats" },
];

const fontSetup = `// In your layout.tsx, import from Google Fonts
// (Geist handles UI mono; these handle the sketchbook feel)

import { Caveat, Nunito } from 'next/font/google'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
})

// Apply to <html>:
// className={\`\${caveat.variable} \${nunito.variable} \${GeistMono.variable}\`}`;

const tailwindConfig = `// tailwind.config.ts
const config = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-caveat)'],   // headings
        sans:    ['var(--font-nunito)'],   // body
        mono:    ['var(--font-geist-mono)'], // dice/stats
      },
      colors: {
        parchment:  '#F5F0E8',
        paper:      '#EDE6D6',
        'warm-white': '#FAF7F2',
        ink:        '#2C2416',
        'ink-soft': '#5C4F3A',
        'ink-faded':'#9B8E7A',
        sketch:     '#C4B49A',
        tan:        '#D4C4A8',
        blush:      '#C97B5A',
        'blush-light': '#E8A882',
        sage:       '#7A9E7E',
        'dusty-blue': '#7A8FA6',
      },
    },
  },
}`;

const globalsCss = `/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #F5F0E8;
    color: #2C2416;
    /* Subtle paper grain */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  }
}

/* Sketchy border utility */
@layer components {
  .border-sketch {
    border: 2px solid #C4B49A;
    border-radius: 4px 8px 6px 5px / 6px 4px 8px 5px;
    box-shadow: 2px 2px 0px #C4B49A;
  }
  .border-sketch-accent {
    border: 2px solid #C97B5A;
    border-radius: 4px 8px 6px 5px / 6px 4px 8px 5px;
    box-shadow: 2px 2px 0px #C97B5A44;
  }
}`;

// SVG sketchy border path helper
function SketchBox({ children, className = "", accent = false }) {
  const borderColor = accent ? "#C97B5A" : "#C4B49A";
  const shadowColor = accent ? "#C97B5A44" : "#C4B49A88";
  return (
    <div
      className={`relative ${className}`}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: "4px 8px 6px 5px / 6px 4px 8px 5px",
        boxShadow: `2px 2px 0px ${shadowColor}`,
        background: "#FAF7F2",
      }}
    >
      {children}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ fontFamily: "'Nunito', sans-serif", border: "1.5px solid #C4B49A", borderRadius: "4px 7px 5px 4px / 5px 4px 7px 4px" }}
      className="text-xs px-2.5 py-1 text-[#9B8E7A] hover:text-[#C97B5A] hover:border-[#C97B5A] transition-all bg-[#FAF7F2]"
    >
      {copied ? "✓ Copied!" : "Copy"}
    </button>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ fontFamily: "'Caveat', cursive", fontSize: "1.1rem" }}
      className={`px-4 py-2 font-medium transition-all border-b-2 ${
        active ? "border-[#C97B5A] text-[#C97B5A]" : "border-transparent text-[#9B8E7A] hover:text-[#5C4F3A]"
      }`}
    >
      {label}
    </button>
  );
}

// Paper texture background via inline SVG noise
const paperBg = {
  backgroundColor: "#F5F0E8",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
};

export default function SketchbookStyleGuide() {
  const [activeTab, setActiveTab] = useState("colors");
  const tabs = ["colors", "typography", "components", "config"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Nunito:wght@400;500;600;700&family=Courier+Prime&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ ...paperBg, fontFamily: "'Nunito', sans-serif", minHeight: "100vh", color: "#2C2416" }} className="p-6 md:p-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            {/* Little hand-drawn star doodles */}
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem", color: "#C97B5A" }}>✦</span>
            <span style={{ fontFamily: "'Nunito', sans-serif" }} className="text-xs font-semibold tracking-widest uppercase text-[#9B8E7A]">Your Roll20 Clone</span>
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem", color: "#7A9E7E" }}>✦</span>
          </div>
          <h1 style={{ fontFamily: "'Caveat', cursive", fontSize: "2.8rem", color: "#2C2416", lineHeight: 1.1 }}>
            Sketchbook Design System
          </h1>
          <p className="text-sm text-[#9B8E7A] mt-1">Cozy Notebook · Handwritten Fonts · Warm Neutrals</p>

          {/* Decorative underline squiggle */}
          <svg width="220" height="10" viewBox="0 0 220 10" fill="none" className="mt-2 opacity-40">
            <path d="M2 7 Q20 2 40 7 Q60 12 80 7 Q100 2 120 7 Q140 12 160 7 Q180 2 200 7 Q210 9 218 6" stroke="#C97B5A" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b-2 border-[#D4C4A8] mb-8">
          {tabs.map(t => (
            <Tab key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={activeTab === t} onClick={() => setActiveTab(t)} />
          ))}
        </div>

        {/* COLORS */}
        {activeTab === "colors" && (
          <div>
            <p className="text-sm text-[#9B8E7A] mb-6">A warm, inky palette — like a well-used notebook. Parchment backgrounds, soft ink text, and a terracotta blush accent.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {colors.map(c => (
                <SketchBox key={c.name} className="p-4 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded flex-shrink-0" style={{ backgroundColor: c.hex, border: "1.5px solid #C4B49A", borderRadius: "3px 6px 4px 3px / 4px 3px 6px 3px" }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.05rem" }} className="font-semibold text-[#2C2416]">{c.name}</span>
                      <span className="text-xs font-mono text-[#9B8E7A]">{c.hex}</span>
                    </div>
                    <p className="text-xs text-[#9B8E7A] mt-0.5 mb-2">{c.usage}</p>
                    <code className="text-xs bg-[#EDE6D6] text-[#5C4F3A] px-1.5 py-0.5 rounded font-mono">{c.tailwind}</code>
                  </div>
                </SketchBox>
              ))}
            </div>
          </div>
        )}

        {/* TYPOGRAPHY */}
        {activeTab === "typography" && (
          <div className="space-y-4">
            <p className="text-sm text-[#9B8E7A] mb-2">Three fonts working together: <strong>Caveat</strong> for display/headings (handwritten), <strong>Nunito</strong> for body (soft & readable), and <strong>Courier Prime</strong> for dice expressions.</p>

            <SketchBox className="p-4 mb-6" accent>
              <p className="text-xs font-semibold text-[#C97B5A] uppercase tracking-wider mb-1">⚠ Font note</p>
              <p className="text-sm text-[#5C4F3A]">This design swaps Geist Sans for <strong>Caveat + Nunito</strong> as the primary pairing. Geist Mono is still great for dice/stats — or swap in Courier Prime for extra notebook charm. See the Config tab for setup.</p>
            </SketchBox>

            {typeScale.map(t => (
              <SketchBox key={t.name} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'Caveat', cursive" }} className="text-sm font-semibold text-[#C97B5A] bg-[#C97B5A]/10 px-2 py-0.5 rounded">{t.name}</span>
                    <span className="text-xs text-[#9B8E7A]">{t.usage}</span>
                  </div>
                </div>
                <p className={t.classes} style={{ ...t.style, color: "#2C2416" }}>{t.sample}</p>
              </SketchBox>
            ))}
          </div>
        )}

        {/* COMPONENTS */}
        {activeTab === "components" && (
          <div className="space-y-8">

            {/* Buttons */}
            <div>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem" }} className="text-[#5C4F3A] mb-4">Buttons</h2>
              <SketchBox className="p-6 flex flex-wrap gap-3 items-center">
                {/* Primary */}
                <button style={{ fontFamily: "'Nunito', sans-serif", border: "2px solid #C97B5A", borderRadius: "4px 8px 6px 5px / 6px 4px 8px 5px", background: "#C97B5A", boxShadow: "2px 2px 0px #9B5A3A" }} className="px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                  + New Campaign
                </button>
                {/* Secondary */}
                <button style={{ fontFamily: "'Nunito', sans-serif", border: "2px solid #C4B49A", borderRadius: "4px 8px 6px 5px / 6px 4px 8px 5px", background: "#FAF7F2", boxShadow: "2px 2px 0px #C4B49A" }} className="px-4 py-2 text-sm font-semibold text-[#5C4F3A] hover:bg-[#EDE6D6] transition-colors">
                  View Characters
                </button>
                {/* Ghost */}
                <button style={{ fontFamily: "'Nunito', sans-serif" }} className="px-4 py-2 text-sm font-medium text-[#9B8E7A] hover:text-[#5C4F3A] transition-colors underline underline-offset-2 decoration-dotted">
                  Cancel
                </button>
                {/* Danger */}
                <button style={{ fontFamily: "'Nunito', sans-serif", border: "2px solid #C97B5A44", borderRadius: "4px 8px 6px 5px / 6px 4px 8px 5px", background: "#FAF7F2" }} className="px-4 py-2 text-sm font-semibold text-[#C97B5A] hover:bg-[#C97B5A]/10 transition-colors">
                  🗑 Archive
                </button>
              </SketchBox>
            </div>

            {/* Campaign Card */}
            <div>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem" }} className="text-[#5C4F3A] mb-4">Campaign Card</h2>
              <SketchBox className="p-6">
                <div style={{ maxWidth: 260 }}>
                  <div style={{ border: "2px solid #C4B49A", borderRadius: "5px 10px 8px 6px / 8px 5px 10px 7px", background: "#FAF7F2", boxShadow: "3px 3px 0px #C4B49A", cursor: "pointer", padding: "16px" }}>
                    {/* Map thumbnail placeholder with doodle feel */}
                    <div style={{ width: "100%", height: 80, background: "#EDE6D6", border: "1.5px dashed #C4B49A", borderRadius: "3px 7px 5px 4px / 5px 3px 7px 4px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: "1.8rem" }}>
                      🗺️
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.2rem", color: "#2C2416", fontWeight: 600 }}>The Sunken City</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: "#7A9E7E22", color: "#7A9E7E", border: "1.5px solid #7A9E7E44", whiteSpace: "nowrap" }}>● Active</span>
                    </div>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: "#9B8E7A", marginBottom: 10 }}>DM: You · 4 players</p>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "#9B8E7A" }}>2 days ago</span>
                      <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "0.7rem", color: "#5C4F3A" }}>Lv. 5</span>
                    </div>
                  </div>
                </div>
              </SketchBox>
            </div>

            {/* Badges */}
            <div>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem" }} className="text-[#5C4F3A] mb-4">Badges & Status</h2>
              <SketchBox className="p-6 flex flex-wrap gap-3 items-center">
                {[
                  { label: "● Active", bg: "#7A9E7E22", color: "#7A9E7E", border: "#7A9E7E44" },
                  { label: "● Idle", bg: "#9B8E7A22", color: "#9B8E7A", border: "#9B8E7A44" },
                  { label: "In Session", bg: "#7A8FA622", color: "#7A8FA6", border: "#7A8FA644" },
                  { label: "Needs Attention", bg: "#C97B5A22", color: "#C97B5A", border: "#C97B5A44" },
                  { label: "Archived", bg: "#EDE6D6", color: "#9B8E7A", border: "#C4B49A" },
                ].map(b => (
                  <span key={b.label} style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", background: b.bg, color: b.color, border: `1.5px solid ${b.border}`, borderRadius: "20px" }}>{b.label}</span>
                ))}
              </SketchBox>
            </div>

            {/* Input */}
            <div>
              <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.4rem" }} className="text-[#5C4F3A] mb-4">Input</h2>
              <SketchBox className="p-6" style={{ maxWidth: 340 }}>
                <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9B8E7A", display: "block", marginBottom: 6 }}>Campaign Name</label>
                <input
                  style={{ fontFamily: "'Nunito', sans-serif", width: "100%", background: "#F5F0E8", border: "2px solid #C4B49A", borderRadius: "3px 7px 5px 4px / 5px 3px 7px 4px", padding: "8px 12px", fontSize: "0.875rem", color: "#2C2416", outline: "none" }}
                  placeholder="e.g. The Forgotten Realms..."
                  defaultValue=""
                />
                <p style={{ fontFamily: "'Caveat', cursive", fontSize: "0.85rem", color: "#9B8E7A", marginTop: 4 }}>↑ click to focus — border turns blush</p>
              </SketchBox>
            </div>
          </div>
        )}

        {/* CONFIG */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <p className="text-sm text-[#9B8E7A]">Font setup and Tailwind config. Caveat + Nunito load from Google Fonts via Next.js&apos;s built-in font system.</p>

            {[
              { title: "Font setup (layout.tsx)", code: fontSetup },
              { title: "tailwind.config.ts", code: tailwindConfig },
              { title: "globals.css", code: globalsCss },
            ].map(block => (
              <div key={block.title}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.1rem" }} className="font-semibold text-[#5C4F3A]">{block.title}</span>
                  <CopyButton text={block.code} />
                </div>
                <SketchBox className="p-4">
                  <pre className="text-xs font-mono text-[#5C4F3A] overflow-x-auto leading-relaxed whitespace-pre">{block.code}</pre>
                </SketchBox>
              </div>
            ))}

            <SketchBox accent className="p-4">
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: "1.05rem" }} className="font-semibold text-[#C97B5A] mb-1">✏ Sketchy border tip</p>
              <p className="text-sm text-[#5C4F3A]">The hand-drawn border effect is just an irregular <code className="bg-[#EDE6D6] px-1 rounded text-xs">border-radius</code> like <code className="bg-[#EDE6D6] px-1 rounded text-xs">4px 8px 6px 5px / 6px 4px 8px 5px</code> plus a flat <code className="bg-[#EDE6D6] px-1 rounded text-xs">box-shadow</code> offset. No SVG needed for most UI elements — works great as a <code className="bg-[#EDE6D6] px-1 rounded text-xs">.border-sketch</code> utility class in your globals.</p>
            </SketchBox>
          </div>
        )}

        {/* Footer doodle */}
        <div className="mt-16 pt-6 flex items-center justify-between" style={{ borderTop: "2px dashed #D4C4A8" }}>
          <span style={{ fontFamily: "'Caveat', cursive" }} className="text-[#9B8E7A]">Sketchbook Design System ✦</span>
          <span className="text-xs font-mono text-[#9B8E7A]">Caveat · Nunito · Courier Prime</span>
        </div>
      </div>
    </>
  );
}
