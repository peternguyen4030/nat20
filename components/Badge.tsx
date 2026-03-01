import { HTMLAttributes } from "react";

type BadgeVariant = "active" | "idle" | "session" | "attention" | "archived";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  active:    { background: "#7A9E7E22", color: "#7A9E7E", border: "1.5px solid #7A9E7E44" },
  idle:      { background: "#9B8E7A22", color: "#9B8E7A", border: "1.5px solid #9B8E7A44" },
  session:   { background: "#7A8FA622", color: "#7A8FA6", border: "1.5px solid #7A8FA644" },
  attention: { background: "#C97B5A22", color: "#C97B5A", border: "1.5px solid #C97B5A44" },
  archived:  { background: "#EDE6D6",   color: "#9B8E7A", border: "1.5px solid #C4B49A"   },
};

const variantLabels: Record<BadgeVariant, string> = {
  active:    "Active",
  idle:      "Idle",
  session:   "In Session",
  attention: "Needs Attention",
  archived:  "Archived",
};

export function Badge({ variant = "idle", dot = false, children, style, ...props }: BadgeProps) {
  const label = children ?? variantLabels[variant];
  const showDot = dot || variant === "active" || variant === "idle";

  return (
    <span
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: "0.68rem",
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "20px",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {showDot && <span style={{ fontSize: "0.5rem" }}>●</span>}
      {label}
    </span>
  );
}
