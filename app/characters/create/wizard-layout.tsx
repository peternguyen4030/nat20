import type { ReactNode } from "react";

/** Sticky offset below wizard progress bar */
export const WIZARD_STICKY_TOP = "top-[5.25rem]";

const sidePanelFrame =
  `sticky ${WIZARD_STICKY_TOP} z-10 flex min-h-[min(22rem,calc(100vh-11rem))] max-h-[calc(100vh-8.5rem)] flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-sketch border-2 border-sketch p-6 shadow-sketch transition-[box-shadow,transform] duration-300 ease-out motion-safe:hover:shadow-[3px_3px_0_#c4b49a]`;

/** Content-sized preview (Class step) — no min-height stretch. */
const sidePanelFrameContent =
  `sticky ${WIZARD_STICKY_TOP} z-10 flex flex-col gap-3 overflow-visible rounded-sketch border-2 border-sketch p-6 shadow-sketch transition-[box-shadow,transform] duration-300 ease-out motion-safe:hover:shadow-[3px_3px_0_#c4b49a]`;

/** Shorter hint rail — no min-height stretch (used for Class step). */
const sidePanelHintCompact =
  `sticky ${WIZARD_STICKY_TOP} z-10 flex flex-col gap-2 overflow-visible rounded-sketch border-2 border-sketch p-4 shadow-sketch transition-[box-shadow,transform] duration-300 ease-out motion-safe:hover:shadow-[3px_3px_0_#c4b49a]`;

const sidePanelFrameStatic =
  `z-10 flex min-h-[min(22rem,calc(100vh-11rem))] max-h-[calc(100vh-8.5rem)] flex-col gap-3 overflow-y-auto overflow-x-hidden rounded-sketch border-2 border-sketch p-6 shadow-sketch transition-[box-shadow,transform] duration-300 ease-out motion-safe:hover:shadow-[3px_3px_0_#c4b49a]`;

const sidePanelHintCompactStatic =
  `z-10 flex flex-col gap-2 overflow-visible rounded-sketch border-2 border-sketch p-4 shadow-sketch transition-[box-shadow,transform] duration-300 ease-out motion-safe:hover:shadow-[3px_3px_0_#c4b49a]`;

export function WizardStepBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`animate-wizard-step ${className ?? "space-y-8"}`}>{children}</div>;
}

export function WizardStepHeader({
  title,
  subtitle,
  density = "default",
}: {
  title: string;
  subtitle: string;
  density?: "default" | "compact";
}) {
  if (density === "compact") {
    return (
      <div className="space-y-1">
        <h1 className="font-display text-3xl leading-tight text-ink md:text-[2rem] md:leading-tight">{title}</h1>
        <p className="max-w-3xl font-sans text-xs leading-snug text-ink-faded md:text-sm">{subtitle}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h1 className="font-display text-4xl text-ink md:text-[2.5rem] md:leading-tight">{title}</h1>
      <p className="max-w-3xl font-sans text-sm leading-relaxed text-ink-faded md:text-base">{subtitle}</p>
    </div>
  );
}

/** 12-column row: 3 + 6 + 3 on large screens */
export function WizardThreeColumnGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-1 items-start lg:grid-cols-12 ${className ?? "gap-8 lg:gap-10"}`}
    >
      {children}
    </div>
  );
}

export function WizardHintColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`order-last min-h-0 lg:order-first lg:col-span-3 ${className}`}>{children}</div>;
}

export function WizardMainColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 space-y-6 lg:col-span-6 ${className}`}>{children}</div>;
}

export function WizardSideColumn({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-h-0 lg:col-span-3 ${className}`}>{children}</div>;
}

type PanelProps = { icon: string; title: string; children: ReactNode };

export type WizardDetailPanelSizing = "fill" | "content";

export function WizardHintPanel({
  icon,
  title,
  children,
  density = "default",
  sticky = true,
}: PanelProps & { density?: "default" | "compact"; sticky?: boolean }) {
  const frame = density === "compact"
    ? (sticky ? sidePanelHintCompact : sidePanelHintCompactStatic)
    : (sticky ? sidePanelFrame : sidePanelFrameStatic);
  const headerPb = density === "compact" ? "pb-2" : "pb-3";
  const bodySpace = density === "compact" ? "space-y-2" : "space-y-3";
  return (
    <div className={`${frame} bg-parchment`}>
      <div className={`flex shrink-0 items-center gap-2 border-b border-sketch/60 ${headerPb}`}>
        <span className="text-lg">{icon}</span>
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">{title}</p>
      </div>
      <div className={`min-h-0 flex-1 font-sans text-xs leading-relaxed text-ink-soft ${bodySpace}`}>{children}</div>
    </div>
  );
}

export function WizardDetailPanel({
  icon,
  title,
  children,
  sizing = "fill",
}: PanelProps & { sizing?: WizardDetailPanelSizing }) {
  const frame = sizing === "content" ? sidePanelFrameContent : sidePanelFrame;
  const headerPb = "pb-3";
  const bodyClass =
    sizing === "content" ? "space-y-3" : "min-h-0 flex flex-1 flex-col space-y-3";
  return (
    <div className={`${frame} bg-warm-white`}>
      <div className={`flex shrink-0 items-center gap-2 border-b border-sketch/60 ${headerPb}`}>
        <span className="text-lg">{icon}</span>
        <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">{title}</p>
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
