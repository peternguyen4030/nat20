import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const FLOATING_ELEMENTS = [
  { emoji: "🎲", className: "animate-float-slow top-[8%] left-[6%] text-[5rem] opacity-20" },
  { emoji: "⚄", className: "animate-float-mid top-[12%] right-[8%] text-[3.5rem] opacity-15" },
  { emoji: "⚔️", className: "animate-float-fast bottom-[15%] left-[9%] text-[3rem] opacity-20" },
  { emoji: "📜", className: "animate-float-tiny bottom-[20%] right-[6%] text-[2.5rem] opacity-20" },
  { emoji: "🎲", className: "animate-float-mid top-[45%] left-[3%] text-[2rem] opacity-10" },
  { emoji: "🛡️", className: "animate-float-slow top-[50%] right-[4%] text-[2rem] opacity-10" },
  { emoji: "✦", className: "animate-float-tiny top-[5%] left-[48%] text-[1.5rem] opacity-15" },
];

const FEATURE_PILLS = [
  { emoji: "🧙", label: "Character creation" },
  { emoji: "🏰", label: "Campaign tracking" },
  { emoji: "🎲", label: "Combat tools" },
  { emoji: "📖", label: "Beginner guides" },
];

const BOARD_NAILS = [
  "absolute top-3 left-4",
  "absolute top-3 right-4",
  "absolute bottom-3 left-4",
  "absolute bottom-3 right-4",
];

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  }).catch(() => null);
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-parchment bg-paper-texture font-sans antialiased py-8 px-4">
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {FLOATING_ELEMENTS.map((el, i) => (
          <div key={i} className={`absolute ${el.className}`}>
            {el.emoji}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="wood-grain rounded-sketch shadow-[0_8px_32px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.15)] p-5 relative">
          {BOARD_NAILS.map((pos, i) => (
            <div key={i} className={`board-nail ${pos}`} />
          ))}

          <div className="animate-pin-drop relative -rotate-[1.5deg]">
            <div className="notice-pin" />
            <div className="paper-lined paper-margin rounded-input px-8 pt-10 pb-7 shadow-[2px_4px_16px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="animate-fade-up-1 flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blush border-2 border-blush-dark rounded-logo shadow-logo flex items-center justify-center text-base">
                  ⚔️
                </div>
                <span className="font-display text-lg text-ink-faded">Nat20</span>
              </div>

              <div className="animate-fade-up-2 mb-5">
                <h1 className="font-display text-[clamp(2.4rem,6vw,3.6rem)] text-ink leading-[1.1] tracking-tight">
                  Every great quest
                  <br />
                  needs a{" "}
                  <span className="underline-scrawl">good journal</span>.
                </h1>
                <p className="font-sans text-base text-ink-soft leading-relaxed mt-4 max-w-[38ch]">
                  Nat20 is the beginner-friendly companion for Dungeons &amp; Dragons.
                  Build characters, track campaigns, and roll into your first
                  adventure — no rulebook required.
                </p>
              </div>

              <div className="animate-fade-up-3 flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-tan" />
                <span className="font-display text-base text-sketch">✦ ✦ ✦</span>
                <div className="flex-1 h-px bg-tan" />
              </div>

              <div className="animate-fade-up-3 flex flex-wrap gap-2 mb-7">
                {FEATURE_PILLS.map((pill) => (
                  <span
                    key={pill.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1 font-sans font-semibold text-sm text-ink-soft bg-parchment border border-sketch rounded-badge"
                  >
                    <span>{pill.emoji}</span>
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="animate-fade-up-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Link
                  href="/register"
                  className="animate-wiggle font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent px-7 py-2.5 cursor-pointer hover:-translate-x-px hover:-translate-y-px transition-transform duration-150 inline-block"
                >
                  Start Your Adventure ✦
                </Link>
                <Link
                  href="/login"
                  className="font-sans font-semibold text-sm text-ink-faded hover:text-ink-soft transition-colors underline decoration-dotted underline-offset-2 px-2 py-2.5"
                >
                  Already have an account?
                </Link>
              </div>

              <p className="font-display text-sm text-sketch mt-6 pt-4 border-t border-dashed border-tan">
                * No experience necessary. Dice not included. Adventures guaranteed.
              </p>
            </div>
          </div>
        </div>
        <div className="board-bottom mx-6 h-3 rounded-b-lg" />
      </div>

      <p className="absolute bottom-5 font-display text-sm text-sketch text-center">
        Built for adventurers of all experience levels ✦
      </p>
    </main>
  );
}
