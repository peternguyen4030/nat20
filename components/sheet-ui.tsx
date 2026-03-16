"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({
  src, size = 48, className = "",
}: {
  src?: string | null; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-tan/30 border-2 border-sketch ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        👤
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Character avatar"
      onError={() => setError(true)}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── Rich tooltip ──────────────────────────────────────────────────────────────

export function Tooltip({
  children, content, side = "top",
}: {
  children: ReactNode;
  content:  ReactNode;
  side?:    "top" | "bottom" | "left" | "right";
}) {
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  function handleMouseEnter() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const GAP  = 8;

    let x = 0;
    let y = 0;

    switch (side) {
      case "top":
        x = rect.left + rect.width / 2;
        y = rect.top  - GAP;
        break;
      case "bottom":
        x = rect.left + rect.width / 2;
        y = rect.bottom + GAP;
        break;
      case "left":
        x = rect.left  - GAP;
        y = rect.top   + rect.height / 2;
        break;
      case "right":
        x = rect.right + GAP;
        y = rect.top   + rect.height / 2;
        break;
    }

    setCoords({ x, y });
    setVisible(true);
  }

  const transformClass = {
    top:    "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left:   "-translate-x-full -translate-y-1/2",
    right:  "-translate-y-1/2",
  }[side];

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div
          className={`fixed z-[9999] pointer-events-none ${transformClass}`}
          style={{ left: coords.x, top: coords.y }}
        >
          <div className="bg-ink text-warm-white font-sans text-xs leading-relaxed rounded-sketch shadow-[0_4px_16px_rgba(0,0,0,0.25)] p-3 w-56 border border-ink-soft/20">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

export function SectionCard({
  title, icon, children, onEdit, accent = false, className = "",
}: {
  title:    string;
  icon?:    string;
  children: ReactNode;
  onEdit?:  () => void;
  accent?:  boolean;
  className?: string;
}) {
  return (
    <div className={`bg-warm-white border-2 rounded-sketch shadow-sketch ${
      accent ? "border-blush/30" : "border-sketch"
    } ${className}`}>
      {/* Card header — overflow-hidden here only so border-radius clips the bg correctly */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-sketch overflow-hidden rounded-t-sketch ${
        accent ? "bg-blush/5" : "bg-parchment"
      }`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">
            {title}
          </p>
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="font-sans text-xs text-blush hover:text-ink-soft transition-colors font-semibold underline decoration-dotted underline-offset-2"
          >
            Edit
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Edit drawer ───────────────────────────────────────────────────────────────

export function EditDrawer({
  title, icon, children, onClose, onSave, saving = false,
}: {
  title:    string;
  icon?:    string;
  children: ReactNode;
  onClose:  () => void;
  onSave:   () => void;
  saving?:  boolean;
}) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="w-full max-w-md bg-warm-white border-l-2 border-sketch shadow-[-4px_0_32px_rgba(0,0,0,0.15)] flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-sketch bg-parchment">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            <h2 className="font-display text-xl text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-input border-2 border-sketch bg-warm-white text-ink-faded hover:text-ink hover:border-blush transition-all flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t-2 border-sketch bg-parchment flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="font-sans font-semibold text-sm text-ink-faded border-2 border-sketch rounded-sketch px-4 py-2 bg-warm-white hover:bg-paper transition-all shadow-sketch"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`font-sans font-bold text-sm text-white rounded-sketch px-5 py-2 border-2 transition-all flex items-center gap-2 ${
              saving
                ? "bg-tan border-sketch opacity-60 cursor-not-allowed"
                : "bg-blush border-blush shadow-sketch-accent hover:-translate-x-px hover:-translate-y-px"
            }`}
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : "Save Changes ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

export function FieldRow({
  label, children, hint,
}: {
  label:    string;
  children: ReactNode;
  hint?:    string;
}) {
  return (
    <div>
      <label className="block font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="font-sans text-xs text-ink-faded mt-1">{hint}</p>}
    </div>
  );
}

// ── Stat pip (spell slots / death saves) ──────────────────────────────────────

export function StatPip({
  filled, onClick, color = "bg-blush",
}: {
  filled:  boolean;
  onClick?: () => void;
  color?:  string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
        filled
          ? `${color} border-transparent`
          : "bg-parchment border-sketch hover:border-blush/50"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    />
  );
}