import { useState } from "react";

// ── Layout constants ──────────────────────────────────────────────────────────
const W = 1400;
const H = 1080;

// ── Color palette (sketchbook-adjacent but clean for a diagram) ───────────────
const COLORS = {
  userCampaign:  { header: "#5C7A9E", light: "#EBF0F7", border: "#5C7A9E" },
  character:     { header: "#7A5C9E", light: "#F0EBF7", border: "#7A5C9E" },
  raceClass:     { header: "#5C9E7A", light: "#EBF7F0", border: "#5C9E7A" },
  reference:     { header: "#9E7A5C", light: "#F7F0EB", border: "#9E7A5C" },
  combat:        { header: "#9E5C5C", light: "#F7EBEB", border: "#9E5C5C" },
  join:          { header: "#888",    light: "#F5F5F5", border: "#AAA"    },
};

// ── Table definitions ─────────────────────────────────────────────────────────

const tables = [
  // ── User & Campaign ──────────────────────────────────────────────────────
  {
    id: "User", label: "User", x: 30, y: 30, color: COLORS.userCampaign,
    pk: "id",
    fields: [
      { name: "id",           type: "uuid PK" },
      { name: "email",        type: "String UNIQUE" },
      { name: "passwordHash", type: "String" },
      { name: "displayName",  type: "String?" },
      { name: "createdAt",    type: "DateTime" },
      { name: "updatedAt",    type: "DateTime" },
    ],
  },
  {
    id: "Campaign", label: "Campaign", x: 270, y: 30, color: COLORS.userCampaign,
    pk: "id",
    fields: [
      { name: "id",           type: "uuid PK" },
      { name: "name",         type: "String" },
      { name: "description",  type: "String?" },
      { name: "emoji",        type: "String?" },
      { name: "ownerId",      type: "uuid FK→User" },
      { name: "createdAt",    type: "DateTime" },
      { name: "updatedAt",    type: "DateTime" },
      { name: "lastPlayedAt", type: "DateTime?" },
    ],
  },
  {
    id: "CampaignMember", label: "CampaignMember", x: 540, y: 30, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",         type: "uuid PK" },
      { name: "campaignId", type: "uuid FK→Campaign" },
      { name: "userId",     type: "uuid FK→User" },
      { name: "role",       type: "DM | PLAYER" },
    ],
  },

  // ── Character ─────────────────────────────────────────────────────────────
  {
    id: "Character", label: "Character", x: 530, y: 220, color: COLORS.character,
    pk: "id",
    fields: [
      { name: "id",              type: "uuid PK" },
      { name: "name",            type: "String" },
      { name: "level",           type: "Int" },
      { name: "maxHp",           type: "Int" },
      { name: "currentHp",       type: "Int" },
      { name: "armorClass",      type: "Int" },
      { name: "proficiencyBonus",type: "Int" },
      { name: "speed",           type: "Int" },
      { name: "inspiration",     type: "Boolean" },
      { name: "userId",          type: "uuid FK→User" },
      { name: "campaignId",      type: "uuid FK→Campaign" },
      { name: "raceId",          type: "uuid? FK→Race" },
      { name: "backgroundId",    type: "uuid? FK→Background" },
      { name: "createdAt",       type: "DateTime" },
      { name: "updatedAt",       type: "DateTime" },
    ],
  },
  {
    id: "AbilityScore", label: "AbilityScore", x: 800, y: 220, color: COLORS.character,
    pk: "id",
    fields: [
      { name: "id",           type: "uuid PK" },
      { name: "characterId",  type: "uuid FK→Character UNIQUE" },
      { name: "strength",     type: "Int" },
      { name: "dexterity",    type: "Int" },
      { name: "constitution", type: "Int" },
      { name: "intelligence", type: "Int" },
      { name: "wisdom",       type: "Int" },
      { name: "charisma",     type: "Int" },
    ],
  },

  // ── Race & Class reference ────────────────────────────────────────────────
  {
    id: "Race", label: "Race", x: 30, y: 310, color: COLORS.raceClass,
    pk: "id",
    fields: [
      { name: "id",             type: "uuid PK" },
      { name: "index",          type: "String UNIQUE" },
      { name: "name",           type: "String" },
      { name: "speed",          type: "Int" },
      { name: "size",           type: "String?" },
      { name: "description",    type: "String?" },
      { name: "abilityBonuses", type: "Json?" },
      { name: "traitNames",     type: "String[]" },
    ],
  },
  {
    id: "Subrace", label: "Subrace", x: 30, y: 560, color: COLORS.raceClass,
    pk: "id",
    fields: [
      { name: "id",             type: "uuid PK" },
      { name: "index",          type: "String UNIQUE" },
      { name: "name",           type: "String" },
      { name: "raceId",         type: "uuid FK→Race" },
      { name: "description",    type: "String?" },
      { name: "abilityBonuses", type: "Json?" },
    ],
  },
  {
    id: "Class", label: "Class", x: 270, y: 310, color: COLORS.raceClass,
    pk: "id",
    fields: [
      { name: "id",                  type: "uuid PK" },
      { name: "index",               type: "String UNIQUE" },
      { name: "name",                type: "String" },
      { name: "hitDie",              type: "Int" },
      { name: "spellcastingAbility", type: "String?" },
    ],
  },
  {
    id: "Subclass", label: "Subclass", x: 270, y: 530, color: COLORS.raceClass,
    pk: "id",
    fields: [
      { name: "id",      type: "uuid PK" },
      { name: "index",   type: "String UNIQUE" },
      { name: "name",    type: "String" },
      { name: "classId", type: "uuid FK→Class" },
    ],
  },
  {
    id: "Feature", label: "Feature", x: 30, y: 760, color: COLORS.raceClass,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "index",       type: "String? UNIQUE" },
      { name: "name",        type: "String" },
      { name: "description", type: "String" },
      { name: "type",        type: "CLASS|RACE|FEAT|BG" },
      { name: "raceId",      type: "uuid? FK→Race" },
      { name: "classId",     type: "uuid? FK→Class" },
    ],
  },

  // ── Reference data ────────────────────────────────────────────────────────
  {
    id: "Background", label: "Background", x: 800, y: 30, color: COLORS.reference,
    pk: "id",
    fields: [
      { name: "id",                 type: "uuid PK" },
      { name: "index",              type: "String UNIQUE" },
      { name: "name",               type: "String" },
      { name: "description",        type: "String?" },
      { name: "feature",            type: "String?" },
      { name: "skillProficiencies", type: "String[]" },
      { name: "languages",          type: "Int" },
    ],
  },
  {
    id: "Proficiency", label: "Proficiency", x: 1060, y: 30, color: COLORS.reference,
    pk: "id",
    fields: [
      { name: "id",    type: "uuid PK" },
      { name: "index", type: "String UNIQUE" },
      { name: "name",  type: "String" },
      { name: "type",  type: "String" },
    ],
  },
  {
    id: "Spell", label: "Spell", x: 1060, y: 240, color: COLORS.reference,
    pk: "id",
    fields: [
      { name: "id",           type: "uuid PK" },
      { name: "index",        type: "String UNIQUE" },
      { name: "name",         type: "String" },
      { name: "level",        type: "Int" },
      { name: "school",       type: "String" },
      { name: "castingTime",  type: "String" },
      { name: "range",        type: "String" },
      { name: "duration",     type: "String" },
      { name: "description",  type: "String" },
      { name: "higherLevels", type: "String?" },
    ],
  },
  {
    id: "Item", label: "Item", x: 1060, y: 560, color: COLORS.reference,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "index",       type: "String UNIQUE" },
      { name: "name",        type: "String" },
      { name: "description", type: "String?" },
      { name: "type",        type: "ItemType enum" },
      { name: "weight",      type: "Float?" },
      { name: "cost",        type: "String?" },
      { name: "damageDice",  type: "String?" },
      { name: "damageType",  type: "String?" },
      { name: "weaponRange", type: "String?" },
      { name: "armorClass",  type: "Int?" },
    ],
  },

  // ── Join / pivot tables ───────────────────────────────────────────────────
  {
    id: "CharacterClass", label: "CharacterClass", x: 420, y: 530, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "characterId", type: "uuid FK→Character" },
      { name: "classId",     type: "uuid FK→Class" },
      { name: "level",       type: "Int" },
    ],
  },
  {
    id: "CharacterFeature", label: "CharacterFeature", x: 280, y: 760, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "characterId", type: "uuid FK→Character" },
      { name: "featureId",   type: "uuid FK→Feature" },
    ],
  },
  {
    id: "CharacterProficiency", label: "CharacterProficiency", x: 800, y: 100, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",             type: "uuid PK" },
      { name: "characterId",    type: "uuid FK→Character" },
      { name: "proficiencyId",  type: "uuid FK→Proficiency" },
      { name: "expertise",      type: "Boolean" },
    ],
  },
  {
    id: "CharacterSpell", label: "CharacterSpell", x: 800, y: 480, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "characterId", type: "uuid FK→Character" },
      { name: "spellId",     type: "uuid FK→Spell" },
      { name: "status",      type: "KNOWN | PREPARED" },
    ],
  },
  {
    id: "CharacterItem", label: "CharacterItem", x: 800, y: 660, color: COLORS.join,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "characterId", type: "uuid FK→Character" },
      { name: "itemId",      type: "uuid FK→Item" },
      { name: "quantity",    type: "Int" },
      { name: "equipped",    type: "Boolean" },
      { name: "attuned",     type: "Boolean" },
    ],
  },

  // ── Combat ────────────────────────────────────────────────────────────────
  {
    id: "CombatSession", label: "CombatSession", x: 530, y: 760, color: COLORS.combat,
    pk: "id",
    fields: [
      { name: "id",                     type: "uuid PK" },
      { name: "campaignId",             type: "uuid FK→Campaign" },
      { name: "active",                 type: "Boolean" },
      { name: "round",                  type: "Int" },
      { name: "currentTurnCharacterId", type: "uuid?" },
      { name: "actionUsed",             type: "Boolean" },
      { name: "bonusActionUsed",        type: "Boolean" },
      { name: "reactionUsed",           type: "Boolean" },
      { name: "createdAt",              type: "DateTime" },
    ],
  },
  {
    id: "CombatAction", label: "CombatAction", x: 530, y: 900, color: COLORS.combat,
    pk: "id",
    fields: [
      { name: "id",          type: "uuid PK" },
      { name: "sessionId",   type: "uuid FK→CombatSession" },
      { name: "actorId",     type: "uuid FK→Character" },
      { name: "targetId",    type: "uuid? FK→Character" },
      { name: "actionType",  type: "CombatActionType" },
      { name: "actionSlot",  type: "ActionSlot" },
      { name: "spellId",     type: "uuid? FK→Spell" },
      { name: "attackRoll",  type: "Int?" },
      { name: "damageDealt", type: "Int?" },
      { name: "notes",       type: "String?" },
      { name: "createdAt",   type: "DateTime" },
    ],
  },
];

// ── Relationship lines ────────────────────────────────────────────────────────
// Each: { from: tableId, to: tableId, label?, style: "1-1" | "1-N" | "N-N" }
const relations = [
  { from: "User",               to: "Campaign",            style: "1-N" },
  { from: "User",               to: "CampaignMember",      style: "1-N" },
  { from: "Campaign",           to: "CampaignMember",      style: "1-N" },
  { from: "User",               to: "Character",           style: "1-N" },
  { from: "Campaign",           to: "Character",           style: "1-N" },
  { from: "Race",               to: "Character",           style: "1-N" },
  { from: "Background",         to: "Character",           style: "1-N" },
  { from: "Race",               to: "Subrace",             style: "1-N" },
  { from: "Class",              to: "Subclass",            style: "1-N" },
  { from: "Race",               to: "Feature",             style: "1-N" },
  { from: "Class",              to: "Feature",             style: "1-N" },
  { from: "Character",          to: "AbilityScore",        style: "1-1" },
  { from: "Character",          to: "CharacterClass",      style: "1-N" },
  { from: "Class",              to: "CharacterClass",      style: "1-N" },
  { from: "Character",          to: "CharacterFeature",    style: "1-N" },
  { from: "Feature",            to: "CharacterFeature",    style: "1-N" },
  { from: "Character",          to: "CharacterProficiency",style: "1-N" },
  { from: "Proficiency",        to: "CharacterProficiency",style: "1-N" },
  { from: "Character",          to: "CharacterSpell",      style: "1-N" },
  { from: "Spell",              to: "CharacterSpell",      style: "1-N" },
  { from: "Character",          to: "CharacterItem",       style: "1-N" },
  { from: "Item",               to: "CharacterItem",       style: "1-N" },
  { from: "Campaign",           to: "CombatSession",       style: "1-N" },
  { from: "CombatSession",      to: "CombatAction",        style: "1-N" },
  { from: "Character",          to: "CombatAction",        style: "1-N" },
  { from: "Spell",              to: "CombatAction",        style: "1-N" },
];

// ── Row height helper ─────────────────────────────────────────────────────────
const HEADER_H   = 28;
const ROW_H      = 18;
const TABLE_W    = 210;
const PADDING    = 8;

function tableHeight(t) {
  return HEADER_H + t.fields.length * ROW_H + PADDING;
}

function tableCenterY(t) {
  return t.y + tableHeight(t) / 2;
}

function tableRight(t)  { return t.x + TABLE_W; }
function tableBottom(t) { return t.y + tableHeight(t); }

// ── Get anchor point for a relation endpoint ──────────────────────────────────
function getAnchor(tMap, id, otherX) {
  const t = tMap[id];
  if (!t) return [0, 0];
  const cy = tableCenterY(t);
  if (otherX < t.x) return [t.x, cy];
  if (otherX > tableRight(t)) return [tableRight(t), cy];
  return [t.x + TABLE_W / 2, tableBottom(t)];
}

// ── Legend ────────────────────────────────────────────────────────────────────
const legend = [
  { color: COLORS.userCampaign.header, label: "User & Campaign" },
  { color: COLORS.character.header,    label: "Character" },
  { color: COLORS.raceClass.header,    label: "Race / Class / Features" },
  { color: COLORS.reference.header,    label: "Reference Data (seeded)" },
  { color: COLORS.combat.header,       label: "Combat" },
  { color: COLORS.join.header,         label: "Join / Pivot Tables" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ERD() {
  const [hoveredTable, setHoveredTable] = useState(null);
  const [showRelations, setShowRelations] = useState(true);

  const tMap = Object.fromEntries(tables.map(t => [t.id, t]));

  const viewBox = `0 0 ${W} ${H}`;

  return (
    <div style={{ background: "#F8F6F1", minHeight: "100vh", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", color: "#2C2416", margin: 0 }}>Nat20 — Entity Relationship Diagram</h1>
          <p style={{ fontSize: "0.8rem", color: "#9B8E7A", margin: "4px 0 0" }}>schema.prisma · {tables.length} tables · {relations.length} relationships</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowRelations(r => !r)}
            style={{ fontSize: "0.75rem", padding: "5px 12px", borderRadius: 6, border: "1.5px solid #C4B49A", background: showRelations ? "#5C7A9E" : "#FAF7F2", color: showRelations ? "#fff" : "#5C4F3A", cursor: "pointer" }}
          >
            {showRelations ? "Hide" : "Show"} Relations
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {legend.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#5C4F3A" }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#5C4F3A", marginLeft: 8 }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#666" strokeWidth="1.5" strokeDasharray="4,2"/><text x="22" y="9" fontSize="8" fill="#666">N</text></svg>
          1-N
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "#5C4F3A" }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#666" strokeWidth="1.5"/></svg>
          1-1
        </div>
      </div>

      {/* SVG diagram — scrollable */}
      <div style={{ overflowX: "auto", overflowY: "auto", border: "1.5px solid #D4C4A8", borderRadius: 10, background: "#FDFAF5" }}>
        <svg width={W} height={H} viewBox={viewBox} style={{ display: "block" }}>

          {/* Relation lines — drawn first so they appear behind tables */}
          {showRelations && relations.map((rel, i) => {
            const from = tMap[rel.from];
            const to   = tMap[rel.to];
            if (!from || !to) return null;

            const [x1, y1] = getAnchor(tMap, rel.from, to.x + TABLE_W / 2);
            const [x2, y2] = getAnchor(tMap, rel.to,   from.x + TABLE_W / 2);

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const isHovered = hoveredTable === rel.from || hoveredTable === rel.to;
            const stroke = isHovered ? "#5C7A9E" : "#BDB0A0";
            const sw = isHovered ? 2 : 1;
            const dash = rel.style === "1-N" ? "5,3" : undefined;

            const cx1 = x1 + (x2 - x1) * 0.4;
            const cy1 = y1;
            const cx2 = x1 + (x2 - x1) * 0.6;
            const cy2 = y2;

            return (
              <g key={i}>
                <path
                  d={`M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`}
                  fill="none" stroke={stroke} strokeWidth={sw}
                  strokeDasharray={dash}
                  opacity={hoveredTable && !isHovered ? 0.2 : 0.7}
                />
                {/* Cardinality label */}
                {isHovered && (
                  <text x={mx} y={my - 4} textAnchor="middle" fontSize="9" fill="#5C7A9E" fontWeight="600">
                    {rel.style}
                  </text>
                )}
              </g>
            );
          })}

          {/* Tables */}
          {tables.map(t => {
            const h = tableHeight(t);
            const isHovered = hoveredTable === t.id;
            const borderColor = isHovered ? t.color.header : t.color.border;

            return (
              <g
                key={t.id}
                onMouseEnter={() => setHoveredTable(t.id)}
                onMouseLeave={() => setHoveredTable(null)}
                style={{ cursor: "default" }}
              >
                {/* Drop shadow */}
                <rect x={t.x + 3} y={t.y + 3} width={TABLE_W} height={h} rx={5} fill="rgba(0,0,0,0.08)" />

                {/* Table body */}
                <rect x={t.x} y={t.y} width={TABLE_W} height={h} rx={5}
                  fill={t.color.light}
                  stroke={borderColor}
                  strokeWidth={isHovered ? 2 : 1}
                />

                {/* Header */}
                <rect x={t.x} y={t.y} width={TABLE_W} height={HEADER_H} rx={5} fill={t.color.header} />
                <rect x={t.x} y={t.y + HEADER_H - 5} width={TABLE_W} height={5} fill={t.color.header} />

                {/* Table name */}
                <text x={t.x + TABLE_W / 2} y={t.y + 18} textAnchor="middle"
                  fontSize="11" fontWeight="700" fill="#fff" fontFamily="system-ui">
                  {t.label}
                </text>

                {/* Divider line */}
                <line x1={t.x} y1={t.y + HEADER_H} x2={t.x + TABLE_W} y2={t.y + HEADER_H}
                  stroke={t.color.border} strokeWidth="1" />

                {/* Fields */}
                {t.fields.map((f, fi) => {
                  const fy = t.y + HEADER_H + fi * ROW_H + 13;
                  const isPK = f.type.includes("PK");
                  const isFK = f.type.includes("FK");
                  return (
                    <g key={f.name}>
                      {fi % 2 === 0 && (
                        <rect x={t.x + 1} y={t.y + HEADER_H + fi * ROW_H + 1}
                          width={TABLE_W - 2} height={ROW_H}
                          fill="rgba(0,0,0,0.025)" rx={0}
                        />
                      )}
                      {/* PK key icon */}
                      {isPK && (
                        <text x={t.x + 7} y={fy} fontSize="8" fill="#C97B5A">🔑</text>
                      )}
                      {/* FK link icon */}
                      {isFK && !isPK && (
                        <text x={t.x + 7} y={fy} fontSize="8" fill="#5C7A9E">🔗</text>
                      )}
                      <text x={t.x + (isPK || isFK ? 18 : 8)} y={fy}
                        fontSize="9.5" fill={isPK ? "#9B5A3A" : isFK ? "#3A5A9B" : "#3A3A3A"}
                        fontWeight={isPK ? "700" : "400"}
                        fontFamily="'Courier New', monospace">
                        {f.name}
                      </text>
                      <text x={t.x + TABLE_W - 6} y={fy} textAnchor="end"
                        fontSize="8.5" fill="#999" fontFamily="system-ui">
                        {f.type.replace(" FK→" + f.type.split("FK→")[1], "").replace(" PK","").replace(" UNIQUE","")}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

        </svg>
      </div>

      <p style={{ fontSize: "0.72rem", color: "#9B8E7A", marginTop: 8 }}>
        Hover over a table to highlight its relationships. Toggle relation lines with the button above.
      </p>
    </div>
  );
}
