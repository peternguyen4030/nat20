"use client";

import { HTMLAttributes } from "react";
import { Badge } from "./Badge";

// ─── SketchBox ────────────────────────────────────────────────────────────────

interface SketchBoxProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  raised?: boolean;
}

const sketchRadius = "4px 8px 6px 5px / 6px 4px 8px 5px";

export function SketchBox({ accent = false, raised = false, children, style, ...props }: SketchBoxProps) {
  return (
    <div
      style={{
        border: `2px solid ${accent ? "#C97B5A" : "#C4B49A"}`,
        borderRadius: sketchRadius,
        boxShadow: `2px 2px 0px ${accent ? "#C97B5A44" : "#C4B49A88"}`,
        background: raised ? "#FAF7F2" : "#EDE6D6",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ hoverable = false, children, style, ...props }: CardProps) {
  return (
    <SketchBox
      raised
      style={{
        padding: "16px",
        transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
        cursor: hoverable ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translate(-2px, -2px)";
          el.style.boxShadow = "4px 4px 0px #C97B5A44";
          el.style.borderColor = "#C97B5A66";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translate(0, 0)";
          el.style.boxShadow = "2px 2px 0px #C4B49A88";
          el.style.borderColor = "#C4B49A";
        }
      }}
      {...props}
    >
      {children}
    </SketchBox>
  );
}

// ─── CampaignCard ─────────────────────────────────────────────────────────────

type CampaignStatus = "active" | "idle" | "session" | "attention" | "archived";

interface CampaignCardProps {
  title: string;
  dmName?: string;
  playerCount?: number;
  level?: number;
  lastPlayed?: string;
  status?: CampaignStatus;
  emoji?: string;
  onClick?: () => void;
}

export function CampaignCard({
  title,
  dmName = "You",
  playerCount = 0,
  level,
  lastPlayed,
  status = "idle",
  emoji = "🗺️",
  onClick,
}: CampaignCardProps) {
  return (
    <Card hoverable={!!onClick} style={{ maxWidth: 260 }} onClick={onClick}>
      <div
        style={{
          width: "100%",
          height: 80,
          background: "#EDE6D6",
          border: "1.5px dashed #C4B49A",
          borderRadius: "3px 7px 5px 4px / 5px 3px 7px 4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          marginBottom: 12,
        }}
      >
        {emoji}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
        <span style={{ fontFamily: "'Caveat', cursive", fontSize: "1.15rem", color: "#2C2416", fontWeight: 600, lineHeight: 1.2 }}>
          {title}
        </span>
        <Badge variant={status} />
      </div>

      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: "#9B8E7A", marginBottom: 10 }}>
        DM: {dmName} · {playerCount} player{playerCount !== 1 ? "s" : ""}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {lastPlayed && (
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "#9B8E7A" }}>
            {lastPlayed}
          </span>
        )}
        {level !== undefined && (
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: "0.7rem", color: "#5C4F3A" }}>
            Lv. {level}
          </span>
        )}
      </div>
    </Card>
  );
}
