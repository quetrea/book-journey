export type BackgroundTheme = {
  id: string;
  name: string;
  /** Primary orb color (hex) */
  orb1: string;
  /** Secondary orb color (hex) */
  orb2: string;
  /** Accent orb color (hex) */
  orb3: string;
  /** Base background color */
  base: string;
};

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: "midnight",  name: "Midnight",   orb1: "#5865F2", orb2: "#8B5CF6", orb3: "#3B82F6", base: "#07090f" },
  { id: "cosmos",    name: "Cosmos",     orb1: "#8B5CF6", orb2: "#EC4899", orb3: "#6366F1", base: "#0d0915" },
  { id: "aurora",    name: "Aurora",     orb1: "#10B981", orb2: "#06B6D4", orb3: "#3B82F6", base: "#061210" },
  { id: "sunset",    name: "Sunset",     orb1: "#F59E0B", orb2: "#EF4444", orb3: "#EC4899", base: "#140807" },
  { id: "ocean",     name: "Ocean",      orb1: "#06B6D4", orb2: "#3B82F6", orb3: "#0EA5E9", base: "#060e15" },
  { id: "forest",    name: "Forest",     orb1: "#22C55E", orb2: "#10B981", orb3: "#84CC16", base: "#060f09" },
  { id: "rose",      name: "Rose",       orb1: "#F43F5E", orb2: "#EC4899", orb3: "#FB7185", base: "#14060a" },
  { id: "amber",     name: "Amber",      orb1: "#F59E0B", orb2: "#F97316", orb3: "#EAB308", base: "#140d04" },
  { id: "crimson",   name: "Crimson",    orb1: "#DC2626", orb2: "#9F1239", orb3: "#EF4444", base: "#130307" },
  { id: "teal",      name: "Teal",       orb1: "#14B8A6", orb2: "#0D9488", orb3: "#06B6D4", base: "#060f0e" },
  { id: "violet",    name: "Violet",     orb1: "#7C3AED", orb2: "#6D28D9", orb3: "#A78BFA", base: "#0c0815" },
  { id: "lava",      name: "Lava",       orb1: "#DC2626", orb2: "#F97316", orb3: "#FDE047", base: "#140806" },
  { id: "sky",       name: "Sky",        orb1: "#38BDF8", orb2: "#7DD3FC", orb3: "#0EA5E9", base: "#060d15" },
  { id: "gold",      name: "Gold",       orb1: "#FBBF24", orb2: "#D97706", orb3: "#FDE047", base: "#120d03" },
  { id: "sakura",    name: "Sakura",     orb1: "#F9A8D4", orb2: "#F472B6", orb3: "#FBCFE8", base: "#130810" },
  { id: "cyber",     name: "Cyber",      orb1: "#00FFA3", orb2: "#00D4FF", orb3: "#7B2FFF", base: "#040d09" },
  { id: "ember",     name: "Ember",      orb1: "#FF6B35", orb2: "#EF4444", orb3: "#F7C59F", base: "#140806" },
  { id: "nordic",    name: "Nordic",     orb1: "#5E81AC", orb2: "#81A1C1", orb3: "#88C0D0", base: "#080c12" },
  { id: "jade",      name: "Jade",       orb1: "#10B981", orb2: "#064E3B", orb3: "#34D399", base: "#050f08" },
  { id: "obsidian",  name: "Obsidian",   orb1: "#475569", orb2: "#64748B", orb3: "#334155", base: "#050708" },
  { id: "lime",      name: "Lime",       orb1: "#84CC16", orb2: "#65A30D", orb3: "#BEF264", base: "#090f04" },
  { id: "dusk",      name: "Dusk",       orb1: "#818CF8", orb2: "#C084FC", orb3: "#F472B6", base: "#0b0912" },
];

export const DEFAULT_THEME_ID = "midnight";
