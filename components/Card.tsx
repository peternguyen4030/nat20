"use client";

import { HTMLAttributes } from "react";
import { Badge } from "./Badge";

interface SketchBoxProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
  raised?: boolean;
}

export function SketchBox({
  accent = false,
  raised = false,
  children,
  className = "",
  ...props
}: SketchBoxProps) {
  return (
    <div
      className={`
        border-2 rounded-sketch
        ${accent ? "border-blush shadow-sketch-accent" : "border-sketch shadow-sketch"}
        ${raised ? "bg-warm-white" : "bg-paper"}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({
  hoverable = false,
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <SketchBox
      raised
      className={`
        p-4 transition-[transform,box-shadow,border-color] duration-150
        ${hoverable ? "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_rgba(201,123,90,0.27)] hover:border-blush/40" : "cursor-default"}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      {...props}
    >
      {children}
    </SketchBox>
  );
}

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
    <Card hoverable={!!onClick} className="max-w-[260px]" onClick={onClick}>
      <div className="w-full h-20 bg-paper border border-dashed border-sketch rounded-input flex items-center justify-center text-[1.8rem] mb-3">
        {emoji}
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-display text-[1.15rem] font-semibold text-ink leading-tight">
          {title}
        </span>
        <Badge variant={status} />
      </div>

      <p className="font-sans text-[0.72rem] text-ink-faded mb-2.5">
        DM: {dmName} · {playerCount} player{playerCount !== 1 ? "s" : ""}
      </p>

      <div className="flex justify-between items-center">
        {lastPlayed && (
          <span className="font-sans text-[0.7rem] text-ink-faded">
            {lastPlayed}
          </span>
        )}
        {level !== undefined && (
          <span className="font-mono text-[0.7rem] text-ink-soft">
            Lv. {level}
          </span>
        )}
      </div>
    </Card>
  );
}
