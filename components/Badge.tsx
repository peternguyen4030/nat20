import { HTMLAttributes } from "react";

type BadgeVariant = "active" | "idle" | "session" | "attention" | "archived";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  active: "bg-sage/15 text-sage border border-sage/30",
  idle: "bg-ink-faded/15 text-ink-faded border border-ink-faded/30",
  session: "bg-dusty-blue/15 text-dusty-blue border border-dusty-blue/30",
  attention: "bg-blush/15 text-blush border border-blush/30",
  archived: "bg-paper text-ink-faded border border-sketch",
};

const variantLabels: Record<BadgeVariant, string> = {
  active: "Active",
  idle: "Idle",
  session: "In Session",
  attention: "Needs Attention",
  archived: "Archived",
};

export function Badge({
  variant = "idle",
  dot = false,
  children,
  className = "",
  ...props
}: BadgeProps) {
  const label = children ?? variantLabels[variant];
  const showDot = dot || variant === "active" || variant === "idle";

  return (
    <span
      className={`
        font-sans text-[0.68rem] font-bold py-0.5 px-2.5 rounded-badge
        inline-flex items-center gap-1 whitespace-nowrap
        ${variantClasses[variant]} ${className}
      `.trim().replace(/\s+/g, " ")}
      {...props}
    >
      {showDot && <span className="text-[0.5rem]">●</span>}
      {label}
    </span>
  );
}
