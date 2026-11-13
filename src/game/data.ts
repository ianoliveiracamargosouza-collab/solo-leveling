// Solo Leveling: Shadow Monarch — content definitions.
export type Rarity = "comum" | "rara" | "epica" | "lendaria";
export type Slot = "arma" | "armadura" | "botas" | "anel" | "colar";
export const SLOTS: Slot[] = ["arma", "armadura", "botas", "anel", "colar"];
export const SLOT_NAMES: Record<Slot, string> = { arma: "Arma", armadura: "Armadura", botas: "Botas", anel: "Anel", colar: "Colar" };
export const RARITY_INFO: Record<Rarity, { name: string; color: string; mult: number }> = {
  comum: { name: "Comum", color: "#cbd5e1", mult: 1 },
  rara: { name: "Rara", color: "#38bdf8", mult: 1.6 },
  epica: { name: "Épica", color: "#a78bfa", mult: 2.5 },
  lendaria: { name: "Lendária", color: "#fbbf24", mult: 4 },
};
export function rollRarity(bonus = 0): Rarity {
  const r = Math.random();
  if (r < 0.01 + bonus * 0.1) return "lendaria";
  if (r < 0.07 + bonus * 0.3) return "epica";
  if (r < 0.25 + bonus * 0.4) return "rara";
  return "comum";
}

export interface FormDef { id: string; name: string; short: string; level: number; mult: number; kiDrain: number; hair: string; aura: string }
// Kept under the legacy FORMS export temporarily so the existing engine can be converted safely.
export const FORMS: FormDef[] = [
  { id: "shadow-authority", name: "Autoridade do Monarca", short: "AM", level: 1, mult: 1.15, kiDrain: 1, hair: "#111827", aura: "#64748b" },
  { id: "shadow-reinforcement", name: "Reforço Sombrio", short: "RS", level: 3, mult: 1.45, kiDrain: 2, hair: "#111827", aura: "#475569" },
  { id: "monarch-presence", name: "Presença do Monarca", short: "PM", level: 6, mult: 1.9, kiDrain: 3, hair: "#111827", aura: "#7c3aed" },
  { id: "shadow-assault", name: "Investida das Sombras", short: "IS", level: 10, mult: 2.5, kiDrain: 4, hair: "#111827", aura: "#8b5cf6" },
  { id: "monarch-domain", name: "Domínio do Monarca", short: "DM", level: 15, mult: 3.3, kiDrain: 6, hair: "#111827", aura: "#a78bfa" },
];
export const VALID_COMBOS: string[][] = [];
const comboKey = (ids: string[]) => [...ids].sort().join("+");
const COMBO_KEYS = new Set(VALID_COMBOS.map(comboKey));
export const isValidSet = (ids: string[]) => ids.length <= 1 || COMBO_KEYS.has(comboKey(ids));
export function isFormUnlocked(id: string, level: number, testMode: boolean) {
  const f = FORMS.find((x) => x.id === id);
  return !!f && (testMode || level >= f.level);
}
export function toggleForm(active: string[], id: string, level: number, testMode: boolean): { active: string[]; error?: string } {
  if (active.includes(id)) return { active: active.filter((a) => a !== id) };
  const f = FORMS.find((x) => x.id === id);
  if (!f) return { active, error: "Habilidade desconhecida" };
  if (!isFormUnlocked(id, level, testMode)) return { active, error: `${f.name} requer nível ${f.level}` };
  return { active: [id] };
}
export function comboStats(active: string[]) {
  let mult = 1, drain = 0;
  for (const id of active) { const f = FORMS.find((x) => x.id === id); if (f) { mult *= f.mult; drain += f.kiDrain; } }
  const n = active.length;
  return { mult, drain: drain * (1 + 0.5 * Math.max(0, n - 1)), giant: false, combo: n >= 2 };
}
export const xpToNext = (level: number) => Math.floor(50 * Math.pow(level, 1.6));

export interface EnemyDef { name: string; level: number; color: string; size: number }
export type Style = "tree" | "rock" | "crystal" | "pillar" | "cloud";
export interface Theme { ground: string; ground2: string; obstacle: string; obstacleTop: string; style: Style; sky: string }
export interface MapDef { id: string; name: string; level: number; theme: Theme; enemies: EnemyDef[]; bosses: EnemyDef[] }
export const MAPS: MapDef[] = [
  { id: "double-dungeon", name: "Masmorra Dupla", level: 1, theme: { ground: "#30313b", ground2: "#3b3d4a", obstacle: "#15151d", obstacleTop: "#626575", style: "rock", sky: "#090a12" },
    enemies: [{ name: "Goblin", level: 1, color: "#7c9a55", size: 0.9 }, { name: "Lobo de Pedra", level: 2, color: "#8b929f", size: 1 }, { name: "Estátua Guardiã", level: 3, color: "#64748b", size: 1.2 }],
    bosses: [{ name: "Estátua do Templo", level: 5, color: "#a1a1aa", size: 1.6 }] },
  { id: "dungeon-e", name: "Portal Rank E", level: 3, theme: { ground: "#344b3b", ground2: "#405c48", obstacle: "#172b20", obstacleTop: "#66856b", style: "tree", sky: "#07150d" },
    enemies: [{ name: "Goblin Guerreiro", level: 3, color: "#86a65b", size: 0.9 }, { name: "Aranha da Masmorra", level: 4, color: "#5d536e", size: 1 }, { name: "Orc Batedor", level: 5, color: "#78904c", size: 1.1 }],
    bosses: [{ name: "Chefe Orc", level: 7, color: "#a3a35a", size: 1.5 }] },
  { id: "dungeon-d", name: "Portal Rank D", level: 7, theme: { ground: "#4c3b32", ground2: "#60483b", obstacle: "#291d19", obstacleTop: "#8b6752", style: "rock", sky: "#160b08" },
    enemies: [{ name: "Lobisomem", level: 7, color: "#8b817c", size: 1 }, { name: "Mago das Sombras", level: 8, color: "#55446e", size: 1 }, { name: "Orc Guerreiro", level: 9, color: "#78904c", size: 1.2 }],
    bosses: [{ name: "Líder dos Orcs", level: 11, color: "#b0a06a", size: 1.6 }] },
  { id: "dungeon-c", name: "Portal Rank C", level: 11, theme: { ground: "#34445c", ground2: "#405674", obstacle: "#172337", obstacleTop: "#7189a8", style: "crystal", sky: "#07101e" },
    enemies: [{ name: "Cavaleiro Mágico", level: 11, color: "#7994bb", size: 1 }, { name: "Guerreiro Lagarto", level: 12, color: "#4e8b76", size: 1.1 }, { name: "Golem de Pedra", level: 13, color: "#9299a3", size: 1.3 }],
    bosses: [{ name: "Guardião do Portal", level: 15, color: "#7c83b8", size: 1.7 }] },
  { id: "dungeon-b", name: "Portal Rank B", level: 15, theme: { ground: "#49365d", ground2: "#59416f", obstacle: "#251633", obstacleTop: "#9470ad", style: "pillar", sky: "#100719" },
    enemies: [{ name: "Demônio Menor", level: 15, color: "#a65d78", size: 1 }, { name: "Assassino das Sombras", level: 16, color: "#45415f", size: 1 }, { name: "Cavaleiro Demoníaco", level: 17, color: "#7d6b9e", size: 1.2 }],
    bosses: [{ name: "Comandante Demoníaco", level: 19, color: "#b16a91", size: 1.7 }] },
  { id: "dungeon-a", name: "Portal Rank A", level: 20, theme: { ground: "#4e3c31", ground2: "#654b3a", obstacle: "#2b1b16", obstacleTop: "#b07c55", style: "rock", sky: "#160b08" },
    enemies: [{ name: "Cavaleiro de Elite", level: 20, color: "#a5a0a8", size: 1.1 }, { name: "Escavador Gigante", level: 22, color: "#8d796c", size: 1.4 }, { name: "Mago de Fogo", level: 23, color: "#d97757", size: 1 }],
    bosses: [{ name: "Igris", level: 25, color: "#9ca3af", size: 1.7 }] },
  { id: "dungeon-s", name: "Portal Rank S", level: 27, theme: { ground: "#20202d", ground2: "#2d2b42", obstacle: "#0c0b16", obstacleTop: "#6d5a91", style: "crystal", sky: "#05040c" },
    enemies: [{ name: "Formiga Soldado", level: 27, color: "#5c6479", size: 1 }, { name: "Formiga Guerreira", level: 29, color: "#41465a", size: 1.2 }, { name: "Demônio de Alto Rank", level: 30, color: "#805a9e", size: 1.3 }],
    bosses: [{ name: "Beru", level: 34, color: "#6e8b57", size: 1.8 }, { name: "Arquiteto", level: 38, color: "#9c8bb8", size: 1.7 }] },
  { id: "shadow-castle", name: "Castelo do Monarca", level: 35, theme: { ground: "#252438", ground2: "#302e4b", obstacle: "#11101e", obstacleTop: "#70658d", style: "pillar", sky: "#05040c" },
    enemies: [{ name: "Soldado das Sombras", level: 35, color: "#42445c", size: 1 }, { name: "Cavaleiro das Sombras", level: 37, color: "#55566d", size: 1.2 }],
    bosses: [{ name: "Bellion", level: 42, color: "#8d91a8", size: 1.9 }] },
];
export const getMapDef = (id: string) => MAPS.find((m) => m.id === id) ?? MAPS[0]!;
export function enemyBase(level: number, boss: boolean) {
  return { hp: Math.round((30 + level * 28) * (boss ? 8 : 1)), atk: Math.round((4 + level * 3.2) * (boss ? 1.6 : 1)), def: Math.round(2 + level * 1.8), xp: Math.round((8 + level * level * 2.5) * (boss ? 10 : 1)), gold: Math.round((3 + level * 2) * (boss ? 15 : 1)) };
}

export interface Item { uid: string; name: string; slot: Slot; rarity: Rarity; level: number; atk: number; def: number; hp: number; ki: number; kiRegen: number; value: number }
const ITEM_NAMES: Record<Slot, string[]> = {
  arma: ["Adaga de Caçador", "Espada do Cavaleiro", "Lâmina Demoníaca"],
  armadura: ["Uniforme de Caçador", "Armadura Reforçada", "Armadura do Monarca"],
  botas: ["Botas de Caçador", "Botas Reforçadas", "Botas das Sombras"],
  anel: ["Anel de Mana", "Anel do Portal", "Anel do Monarca"],
  colar: ["Colar Simples", "Colar de Mana", "Colar das Sombras"],
};
export function makeItem(level: number, rarity: Rarity, slot?: Slot): Item {
  const s = slot ?? SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
  const names = ITEM_NAMES[s]; const base = names[Math.min(names.length - 1, Math.floor(level / 10))]!;
  const p = (2 + level * 1.5) * RARITY_INFO[rarity].mult; const r = (v: number) => Math.round(v);
  const it: Item = { uid: Math.random().toString(36).slice(2), name: base, slot: s, rarity, level, atk: 0, def: 0, hp: 0, ki: 0, kiRegen: 0, value: r(p * 5) };
  if (s === "arma") it.atk = r(p);
  if (s === "armadura") { it.def = r(p * 0.6); it.hp = r(p * 4); }
  if (s === "botas") { it.def = r(p * 0.8); it.hp = r(p * 1.5); }
  if (s === "anel") { it.ki = r(p * 4); it.kiRegen = Math.round(p * 0.08 * 10) / 10; }
  if (s === "colar") { it.atk = r(p * 0.5); it.ki = r(p * 2); it.hp = r(p * 2); }
  return it;
}
export interface HouseDef { id: string; name: string; x: number; y: number; w: number; h: number; price: number; level: number }
export const HOUSES: HouseDef[] = [
  { id: "casa1", name: "Esconderijo Simples", x: 3, y: 3, w: 5, h: 4, price: 200, level: 2 },
  { id: "casa2", name: "Base de Caçadores", x: 10, y: 3, w: 6, h: 5, price: 1000, level: 6 },
  { id: "casa3", name: "Refúgio do Monarca", x: 3, y: 9, w: 7, h: 4, price: 5000, level: 12 },
];
export const DECOR: Record<string, { name: string; price: number; color: string }> = {
  planta: { name: "Planta", price: 50, color: "#3fae4a" },
  tapete: { name: "Tapete", price: 80, color: "#6d5a91" },
  cama: { name: "Cama", price: 150, color: "#4a7bd0" },
  esfera: { name: "Cristal de Mana", price: 300, color: "#8b5cf6" },
  estatua: { name: "Estátua Sombria", price: 600, color: "#64748b" },
};
