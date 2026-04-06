"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionUser {
  id: string;
  displayName?: string | null;
  name?: string | null;
}

interface MapAsset {
  id: string;
  name: string;
  url: string;
}

interface TokenPosition {
  col: number;
  row: number;
}

interface BoardState {
  tokens: Record<string, TokenPosition>; // key = "char_<id>" or "npc_<id>"
}

interface Board {
  id: string;
  campaignId: string;
  activeMapId: string | null;
  combatActive: boolean;
  boardState: BoardState | null;
  activeMap: MapAsset | null;
}

interface Character {
  id: string;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
  armorClass: number;
  speed: number;
  avatarUrl: string | null;
  conditions: string[];
  inspiration: boolean;
  user: { id: string; displayName: string | null; name: string | null };
  race: { name: string } | null;
  classes: { level: number; class: { name: string } }[];
}

interface NPC {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  avatarUrl: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-tan/60 rounded-sketch animate-pulse ${className}`} />;
}

function Avatar({ src, size = 36, className = "" }: {
  src?: string | null; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-tan/30 border-2 border-sketch rounded-sketch text-base ${className}`}
        style={{ width: size, height: size }}>
        👤
      </div>
    );
  }
  return (
    <img src={src} alt="" onError={() => setError(true)}
      className={`object-cover rounded-sketch ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function HpBar({ current, max, temporary = 0 }: { current: number; max: number; temporary?: number }) {
  const pct   = Math.min(100, Math.round((current / max) * 100));
  const color = pct > 60 ? "bg-sage" : pct > 30 ? "bg-gold" : "bg-blush";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-sans text-[0.6rem] text-ink-faded uppercase tracking-wider">HP</span>
        <span className="font-mono text-[0.6rem] text-ink-faded">{current}/{max}{temporary > 0 ? ` +${temporary}` : ""}</span>
      </div>
      <div className="h-2 bg-parchment border border-sketch rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CharacterStatusCard({ character, isCurrentUser }: { character: Character; isCurrentUser: boolean }) {
  const primaryClass = character.classes?.[0];
  const isDowned     = character.currentHp <= 0;
  return (
    <div className={`bg-warm-white border-2 rounded-sketch shadow-sketch p-3 ${isDowned ? "border-blush/50 opacity-75" : isCurrentUser ? "border-blush/30" : "border-sketch"}`}>
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar src={character.avatarUrl} size={38} className={`border-2 ${isDowned ? "grayscale border-blush/40" : isCurrentUser ? "border-blush/40" : "border-sketch"}`} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ink border border-ink rounded-full flex items-center justify-center">
            <span className="font-mono text-[0.45rem] font-bold text-warm-white">{character.level}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap mb-0.5">
            <p className="font-display text-sm text-ink truncate">{character.name}</p>
            {isCurrentUser && <span className="font-sans text-[0.5rem] font-bold uppercase bg-blush/10 text-blush border border-blush/30 rounded p-0.5 shrink-0">You</span>}
            {isDowned   && <span className="font-sans text-[0.5rem] font-bold uppercase bg-blush/20 text-blush border border-blush/40 rounded p-0.5 shrink-0">Down</span>}
            {character.inspiration && <span className="font-sans text-[0.5rem] font-bold uppercase bg-gold/20 text-gold border border-gold/40 rounded p-0.5 shrink-0">✦</span>}
          </div>
          <p className="font-sans text-[0.6rem] text-ink-faded mb-1.5">
            {character.race?.name ?? "?"}{primaryClass ? ` · ${primaryClass.class.name}` : ""} · {character.user.displayName ?? character.user.name ?? "Player"}
          </p>
          <HpBar current={character.currentHp} max={character.maxHp} temporary={character.temporaryHp} />
          <div className="flex gap-3 mt-1.5">
            <div className="text-center"><p className="font-mono text-xs font-bold text-ink">{character.armorClass}</p><p className="font-sans text-[0.5rem] text-ink-faded uppercase">AC</p></div>
            <div className="text-center"><p className="font-mono text-xs font-bold text-ink">{character.speed}ft</p><p className="font-sans text-[0.5rem] text-ink-faded uppercase">SPD</p></div>
          </div>
          {character.conditions.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-1">
              {character.conditions.map((c) => <span key={c} className="font-sans text-[0.45rem] font-bold uppercase text-blush border border-blush/30 bg-blush/5 rounded p-0.5">{c}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Map Picker ────────────────────────────────────────────────────────────────

function MapPicker({ assets, activeMapId, campaignId, onChanged }: {
  assets: MapAsset[]; activeMapId: string | null; campaignId: string; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);

  async function selectMap(mapId: string | null) {
    await fetch(`/api/campaigns/${campaignId}/board`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMapId: mapId }),
    });
    setOpen(false);
    onChanged();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">
        <span>🗺️</span> {activeMapId ? "Change Map" : "Set Map"} {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-warm-white border-2 border-sketch rounded-sketch shadow-[4px_4px_0_#C4B49A] z-20">
          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {assets.length === 0
              ? <p className="font-sans text-xs text-ink-faded p-2 text-center">No map assets uploaded yet.</p>
              : <>
                  {activeMapId && <button onClick={() => selectMap(null)} className="w-full text-left font-sans text-xs text-blush p-2 rounded hover:bg-blush/5">✕ Clear map</button>}
                  {assets.map((a) => (
                    <button key={a.id} onClick={() => selectMap(a.id)}
                      className={`w-full text-left p-2 rounded flex items-center gap-2 transition-colors ${a.id === activeMapId ? "bg-blush/10 border border-blush/30" : "hover:bg-parchment"}`}>
                      <div className="w-8 h-8 bg-sketch/20 rounded border border-sketch overflow-hidden shrink-0">
                        <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-sans text-xs text-ink truncate">{a.name}</span>
                      {a.id === activeMapId && <span className="font-sans text-[0.55rem] text-blush ml-auto shrink-0">Active</span>}
                    </button>
                  ))}
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Canvas Board ──────────────────────────────────────────────────────────────

const CELL = 50; // px per grid cell

interface Token {
  key:      string;
  label:    string;
  initials: string;
  color:    string;
  avatarUrl: string | null;
  col:      number;
  row:      number;
  isDowned: boolean;
  isCurrentUser: boolean;
  canDrag:  boolean;
}

function CanvasBoard({ board, characters, npcs, currentUserId, isDM, campaignId, onBoardUpdate }: {
  board: Board;
  characters: Character[];
  npcs: NPC[];
  currentUserId: string;
  isDM: boolean;
  campaignId: string;
  onBoardUpdate: (newState: BoardState) => void;
}) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImgRef   = useRef<HTMLImageElement | null>(null);
  const mapLoadedRef = useRef(false);

  // View state
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef  = useRef(1);

  // Drag state
  const draggingRef = useRef<{ key: string; startX: number; startY: number; origCol: number; origRow: number } | null>(null);
  const dragPosRef  = useRef<{ col: number; row: number } | null>(null);

  // Pan state
  const panningRef  = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Tokens derived from board state + characters/npcs
  const boardState: BoardState = (board.boardState as BoardState | null) ?? { tokens: {} };

  function buildTokens(): Token[] {
    const tokens: Token[] = [];
    const COLORS = ["#C1636A", "#6A8FC1", "#6AC18A", "#C1A86A", "#9B6AC1", "#6AC1BB", "#C16A9B"];

    characters.forEach((c, i) => {
      const key = `char_${c.id}`;
      const pos = boardState.tokens[key] ?? { col: i % 8, row: 0 };
      tokens.push({
        key,
        label: c.name,
        initials: c.name.slice(0, 2).toUpperCase(),
        color: COLORS[i % COLORS.length],
        avatarUrl: c.avatarUrl,
        col: pos.col,
        row: pos.row,
        isDowned: c.currentHp <= 0,
        isCurrentUser: c.user.id === currentUserId,
        canDrag: isDM || c.user.id === currentUserId,
      });
    });

    npcs.forEach((n, i) => {
      const key = `npc_${n.id}`;
      const pos = boardState.tokens[key] ?? { col: (characters.length + i) % 8, row: 0 };
      tokens.push({
        key,
        label: n.name,
        initials: n.name.slice(0, 2).toUpperCase(),
        color: "#8B4040",
        avatarUrl: n.avatarUrl,
        col: pos.col,
        row: pos.row,
        isDowned: n.currentHp <= 0,
        isCurrentUser: false,
        canDrag: isDM,
      });
    });

    return tokens;
  }

  const tokensRef = useRef<Token[]>(buildTokens());

  useEffect(() => {
    tokensRef.current = buildTokens();
    draw();
  }, [board, characters, npcs]);

  // ── Load map image ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!board.activeMap) { mapImgRef.current = null; mapLoadedRef.current = false; draw(); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { mapImgRef.current = img; mapLoadedRef.current = true; draw(); };
    img.src = board.activeMap.url;
  }, [board.activeMap?.url]);

  // ── Draw ────────────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    // Background
    ctx.fillStyle = "#F5F0E8";
    ctx.fillRect(0, 0, W / scaleRef.current + 200, H / scaleRef.current + 200);

    // Map image
    if (mapImgRef.current && mapLoadedRef.current) {
      ctx.drawImage(mapImgRef.current, 0, 0, W / scaleRef.current, H / scaleRef.current);
    }

    // Grid
    const cols = Math.ceil(W / (CELL * scaleRef.current)) + 4;
    const rows = Math.ceil(H / (CELL * scaleRef.current)) + 4;
    ctx.strokeStyle = "rgba(100, 90, 80, 0.18)";
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, rows * CELL); ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(cols * CELL, r * CELL); ctx.stroke();
    }

    // Tokens
    const tokens = tokensRef.current;
    tokens.forEach((t) => {
      const isDragging = draggingRef.current?.key === t.key;
      const col = isDragging && dragPosRef.current ? dragPosRef.current.col : t.col;
      const row = isDragging && dragPosRef.current ? dragPosRef.current.row : t.row;
      const cx = col * CELL + CELL / 2;
      const cy = row * CELL + CELL / 2;
      const r  = CELL * 0.38;

      // Shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur  = isDragging ? 12 : 4;
      ctx.shadowOffsetY = isDragging ? 4 : 2;

      // Circle background
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = t.isDowned ? "#888" : t.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = t.isCurrentUser ? "#fff" : "rgba(255,255,255,0.6)";
      ctx.lineWidth   = t.isCurrentUser ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();

      // Initials text
      ctx.fillStyle = "#fff";
      ctx.font      = `bold ${Math.round(CELL * 0.28)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.initials, cx, cy);

      // Downed X
      if (t.isDowned) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - r * 0.4, cy - r * 0.4); ctx.lineTo(cx + r * 0.4, cy + r * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + r * 0.4, cy - r * 0.4); ctx.lineTo(cx - r * 0.4, cy + r * 0.4); ctx.stroke();
      }

      // Name label below token
      ctx.fillStyle   = "rgba(30,25,20,0.85)";
      ctx.font        = `${Math.round(CELL * 0.18)}px sans-serif`;
      ctx.textAlign   = "center";
      ctx.textBaseline = "top";
      const labelY = cy + r + 3;
      const labelText = t.label.length > 10 ? t.label.slice(0, 9) + "…" : t.label;
      ctx.fillText(labelText, cx, labelY);
    });

    ctx.restore();
  }

  // ── Resize canvas ───────────────────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ── Canvas coords from mouse event ─────────────────────────────────────────
  function canvasToWorld(e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const mx     = e.clientX - rect.left;
    const my     = e.clientY - rect.top;
    return {
      wx: (mx - offsetRef.current.x) / scaleRef.current,
      wy: (my - offsetRef.current.y) / scaleRef.current,
    };
  }

  function worldToCell(wx: number, wy: number) {
    return { col: Math.floor(wx / CELL), row: Math.floor(wy / CELL) };
  }

  function hitToken(wx: number, wy: number): Token | null {
    const tokens = tokensRef.current;
    for (let i = tokens.length - 1; i >= 0; i--) {
      const t  = tokens[i];
      const cx = t.col * CELL + CELL / 2;
      const cy = t.row * CELL + CELL / 2;
      const r  = CELL * 0.38;
      if (Math.hypot(wx - cx, wy - cy) <= r) return t;
    }
    return null;
  }

  // ── Mouse events ────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { wx, wy } = canvasToWorld(e);

    // Middle click or space+click = pan
    if (e.button === 1 || e.button === 2) {
      panningRef.current = true;
      panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
      return;
    }

    // Left click — check token hit
    const token = hitToken(wx, wy);
    if (token && token.canDrag) {
      draggingRef.current = { key: token.key, startX: wx, startY: wy, origCol: token.col, origRow: token.row };
      dragPosRef.current  = { col: token.col, row: token.row };
      return;
    }

    // Left click on empty = pan
    panningRef.current  = true;
    panStartRef.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (panningRef.current) {
      offsetRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y };
      draw();
      return;
    }
    if (draggingRef.current) {
      const { wx, wy } = canvasToWorld(e);
      dragPosRef.current = worldToCell(wx, wy);
      draw();
    }
  }

  async function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (panningRef.current) { panningRef.current = false; return; }

    if (draggingRef.current && dragPosRef.current) {
      const { key } = draggingRef.current;
      const { col, row } = dragPosRef.current;

      // Update token in local ref
      const token = tokensRef.current.find((t) => t.key === key);
      if (token) { token.col = col; token.row = row; }

      // Build new board state
      const newTokens = { ...boardState.tokens, [key]: { col, row } };
      const newState: BoardState = { tokens: newTokens };

      draggingRef.current = null;
      dragPosRef.current  = null;
      draw();

      // Persist
      await fetch(`/api/campaigns/${campaignId}/board`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardState: newState }),
      });
      onBoardUpdate(newState);
    }
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta   = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(4, Math.max(0.25, scaleRef.current * delta));
    const canvas  = canvasRef.current!;
    const rect    = canvas.getBoundingClientRect();
    const mx      = e.clientX - rect.left;
    const my      = e.clientY - rect.top;
    // Zoom toward cursor
    offsetRef.current = {
      x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    draw();
  }

  function onContextMenu(e: React.MouseEvent) { e.preventDefault(); }

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: "520px" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ display: "block", touchAction: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      />
      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 bg-ink/50 backdrop-blur-sm rounded-sketch p-2 pointer-events-none">
        <p className="font-sans text-[0.6rem] text-warm-white">Scroll to zoom · Drag to pan · Drag tokens to move</p>
      </div>
      {board.activeMap && (
        <div className="absolute bottom-3 right-3 bg-ink/50 backdrop-blur-sm rounded-sketch p-2 pointer-events-none">
          <p className="font-sans text-xs text-warm-white">🗺️ {board.activeMap.name}</p>
        </div>
      )}
    </div>
  );
}

// ── Board Page ────────────────────────────────────────────────────────────────

export default function CampaignBoardPage() {
  const params     = useParams();
  const router     = useRouter();
  const campaignId = params.campaignId as string;

  const [board,        setBoard]        = useState<Board | null>(null);
  const [characters,   setCharacters]   = useState<Character[]>([]);
  const [npcs,         setNpcs]         = useState<NPC[]>([]);
  const [assets,       setAssets]       = useState<MapAsset[]>([]);
  const [currentUser,  setCurrentUser]  = useState<SessionUser | null>(null);
  const [isDM,         setIsDM]         = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [sessionRes, boardRes, campaignRes, npcsRes] = await Promise.all([
      authClient.getSession(),
      fetch(`/api/campaigns/${campaignId}/board`).then((r) => { if (!r.ok) throw new Error("Failed to load board"); return r.json(); }),
      fetch(`/api/campaigns/${campaignId}`).then((r) => { if (!r.ok) throw new Error("Campaign not found"); return r.json(); }),
      fetch(`/api/campaigns/${campaignId}/npcs`).then((r) => r.ok ? r.json() : []),
    ]);

    if (!sessionRes?.data?.user) { router.push("/login"); return null; }
    const user       = sessionRes.data.user as SessionUser;
    const membership = campaignRes.members?.find((m: any) => m.user.id === user.id);

    return {
      user,
      isDM:        membership?.role === "DM",
      campaignName: campaignRes.name,
      board:       boardRes.board,
      characters:  boardRes.characters,
      assets:      boardRes.assets,
      npcs:        npcsRes,
    };
  }, [campaignId, router]);

  useEffect(() => {
    let active = true;
    loadData()
      .then((result) => {
        if (!active || !result) return;
        setCurrentUser(result.user);
        setIsDM(result.isDM);
        setCampaignName(result.campaignName);
        setBoard(result.board);
        setCharacters(result.characters);
        setAssets(result.assets);
        setNpcs(result.npcs);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData().then((result) => {
      if (!result) return;
      setBoard(result.board);
      setCharacters(result.characters);
      setAssets(result.assets);
      setNpcs(result.npcs);
    });
  }, [loadData]);

  function handleBoardUpdate(newState: BoardState) {
    setBoard((prev) => prev ? { ...prev, boardState: newState } : prev);
  }

  if (error) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <p className="font-display text-2xl text-ink mb-2">Failed to load board</p>
        <Link href={`/campaigns/${campaignId}`} className="font-sans text-sm text-blush underline">Back to campaign</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-parchment bg-paper-texture font-sans antialiased flex flex-col">

      {/* Nav */}
      <nav className="bg-warm-white border-b-2 border-sketch p-3 sticky top-0 z-40">
        <div className="max-w-full mx-auto flex items-center gap-3 flex-wrap">
          <Link href={`/campaigns/${campaignId}`} className="font-sans text-sm text-ink-faded hover:text-ink transition-colors">← Campaign</Link>
          <span className="text-sketch">/</span>
          {loading ? <Skeleton className="h-4 w-32" /> : <span className="font-display text-lg text-ink">{campaignName}</span>}
          <span className="text-sketch">/</span>
          <span className="font-display text-lg text-ink">Session Board</span>
          {isDM && !loading && board && (
            <div className="ml-auto flex items-center gap-2">
              <MapPicker assets={assets} activeMapId={board.activeMapId} campaignId={campaignId} onChanged={refresh} />
              <Link href={`/campaigns/${campaignId}/board/npcs`}>
                <button className="font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">
                  👹 NPCs
                </button>
              </Link>
              <Link href={`/campaigns/${campaignId}/board/combat`}>
                <button className="font-sans font-bold text-sm text-white bg-blush border-2 border-blush rounded-sketch shadow-sketch-accent p-2 hover:-translate-x-px hover:-translate-y-px transition-all flex items-center gap-2">
                  ⚔️ Start Combat
                </button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* Canvas area */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : board ? (
            <CanvasBoard
              board={board}
              characters={characters}
              npcs={npcs}
              currentUserId={currentUser?.id ?? ""}
              isDM={isDM}
              campaignId={campaignId}
              onBoardUpdate={handleBoardUpdate}
            />
          ) : null}
        </div>

        {/* Party sidebar */}
        <div className="w-72 shrink-0 bg-warm-white border-l-2 border-sketch overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">Party Status</p>
            <span className="font-mono text-xs text-ink-faded">{characters.length} active</span>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : characters.length === 0 ? (
            <div className="bg-parchment border-2 border-dashed border-sketch rounded-sketch p-4 text-center">
              <p className="text-xl mb-1">🧙</p>
              <p className="font-sans text-xs text-ink-faded">No active characters.</p>
            </div>
          ) : (
            characters.map((c) => (
              <CharacterStatusCard key={c.id} character={c} isCurrentUser={c.user.id === currentUser?.id} />
            ))
          )}

          {isDM && npcs.length > 0 && (
            <>
              <div className="border-t border-sketch p-2">
                <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded mb-2">NPCs</p>
                <div className="space-y-1">
                  {npcs.map((n) => {
                    const pct = Math.min(100, Math.round((n.currentHp / n.maxHp) * 100));
                    const color = pct > 60 ? "bg-sage" : pct > 30 ? "bg-gold" : "bg-blush";
                    return (
                      <div key={n.id} className="bg-parchment border border-sketch rounded p-2 flex items-center gap-2">
                        <span className="text-sm shrink-0">👹</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs text-ink truncate">{n.name}</p>
                          <div className="h-1 bg-warm-white border border-sketch rounded-full overflow-hidden mt-0.5">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="font-mono text-[0.6rem] text-ink-faded shrink-0">{n.currentHp}/{n.maxHp}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {isDM && (
            <div className="border-t border-sketch p-2 space-y-2">
              <p className="font-sans text-[0.65rem] font-bold uppercase tracking-widest text-ink-faded">DM Tools</p>
              <Link href={`/campaigns/${campaignId}/board/combat`}>
                <button className="w-full font-sans font-semibold text-sm text-white bg-blush border-2 border-blush rounded-sketch p-2 hover:-translate-x-px hover:-translate-y-px transition-all shadow-sketch-accent flex items-center gap-2">
                  ⚔️ Start Combat
                </button>
              </Link>
              <button onClick={refresh} className="w-full font-sans font-semibold text-sm text-ink-soft bg-parchment border-2 border-sketch rounded-sketch p-2 hover:bg-paper hover:border-blush/50 transition-all shadow-sketch flex items-center gap-2">
                ↻ Refresh Board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}