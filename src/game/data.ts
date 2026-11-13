// Static game content: forms, combos, maps, enemies, items, houses, decor.
export type Rarity = "comum" | "rara" | "epica" | "lendaria";
export type Slot = "luvas" | "gi" | "botas" | "scouter" | "anel";
export const SLOTS: Slot[] = ["luvas", "gi", "botas", "scouter", "anel"];
export const SLOT_NAMES: Record<Slot, string> = { luvas: "Luvas", gi: "Gi", botas: "Botas", scouter: "Scouter", anel: "Anel" };
export const RARITY_INFO: Record<Rarity, { name: string; color: string; mult: number }> = {
  comum: { name: "Comum", color: "#d0d0d0", mult: 1 },
  rara: { name: "Rara", color: "#4aa3ff", mult: 1.6 },
  epica: { name: "Épica", color: "#c06bff", mult: 2.5 },
  lendaria: { name: "Lendária", color: "#ffb020", mult: 4 },
};
export function rollRarity(bonus = 0): Rarity {
  const r = Math.random();
  if (r < 0.01 + bonus * 0.1) return "lendaria";
  if (r < 0.07 + bonus * 0.3) return "epica";
  if (r < 0.25 + bonus * 0.4) return "rara";
  return "comum";
}

export interface FormDef { id: string; name: string; short: string; level: number; mult: number; kiDrain: number; hair: string; aura: string }
export const FORMS: FormDef[] = [
  { id: "ozaru", name: "Ozaru", short: "OZ", level: 2, mult: 1.6, kiDrain: 2, hair: "#6b4220", aura: "#c0392b" },
  { id: "kaioken", name: "Kaioken", short: "KK", level: 3, mult: 1.5, kiDrain: 3, hair: "#1a1a1a", aura: "#ff2a2a" },
  { id: "ssj1", name: "Super Saiyajin 1", short: "S1", level: 5, mult: 2, kiDrain: 3, hair: "#ffe14a", aura: "#ffe14a" },
  { id: "ssj2", name: "Super Saiyajin 2", short: "S2", level: 7, mult: 2.6, kiDrain: 4, hair: "#fff066", aura: "#fff59a" },
  { id: "ssj3", name: "Super Saiyajin 3", short: "S3", level: 9, mult: 3.3, kiDrain: 6, hair: "#ffd000", aura: "#ffcc33" },
  { id: "god", name: "Super Saiyajin God", short: "GD", level: 12, mult: 4.5, kiDrain: 6, hair: "#ff3b5c", aura: "#ff7a7a" },
  { id: "blue", name: "Super Saiyajin Blue", short: "BL", level: 15, mult: 6, kiDrain: 8, hair: "#33ccff", aura: "#33ccff" },
  { id: "ui", name: "Instinto Superior", short: "IS", level: 18, mult: 8, kiDrain: 10, hair: "#c8d2e6", aura: "#eaf2ff" },
  { id: "ego", name: "Ego Superior", short: "EG", level: 20, mult: 9, kiDrain: 11, hair: "#8f3dff", aura: "#b070ff" },
];
export const VALID_COMBOS: string[][] = [
  ["kaioken", "ssj1"], ["kaioken", "ssj2"], ["kaioken", "ssj3"], ["kaioken", "god"], ["kaioken", "blue"],
  ["kaioken", "ui"], ["kaioken", "ego"], ["ui", "ego"], ["kaioken", "ui", "ego"],
];
const comboKey = (ids: string[]) => [...ids].sort().join("+");
const COMBO_KEYS = new Set(VALID_COMBOS.map(comboKey));
export const isValidSet = (ids: string[]) => ids.length <= 1 || COMBO_KEYS.has(comboKey(ids));
export function isFormUnlocked(id: string, level: number, testMode: boolean) {
  const f = FORMS.find((x) => x.id === id);
  return !!f && (testMode || level >= f.level);
}
/** Toggle a form. Compatible forms stack; incompatible ones replace the current set. */
export function toggleForm(active: string[], id: string, level: number, testMode: boolean): { active: string[]; error?: string } {
  if (active.includes(id)) return { active: active.filter((a) => a !== id) };
  const f = FORMS.find((x) => x.id === id);
  if (!f) return { active, error: "Forma desconhecida" };
  if (!isFormUnlocked(id, level, testMode)) return { active, error: `${f.name} requer nível ${f.level}` };
  const cand = [...active, id];
  return { active: isValidSet(cand) ? cand : [id] };
}
export function comboStats(active: string[]) {
  let mult = 1, drain = 0;
  for (const id of active) { const f = FORMS.find((x) => x.id === id); if (f) { mult *= f.mult; drain += f.kiDrain; } }
  const n = active.length;
  return { mult, drain: drain * (1 + 0.5 * Math.max(0, n - 1)), giant: active.includes("ozaru"), combo: n >= 2 };
}

export const xpToNext = (level: number) => Math.floor(50 * Math.pow(level, 1.6));

export interface EnemyDef { name: string; level: number; color: string; size: number }
export type Style = "tree" | "rock" | "crystal" | "pillar" | "cloud";
export interface Theme { ground: string; ground2: string; obstacle: string; obstacleTop: string; style: Style; sky: string }
export interface MapDef { id: string; name: string; level: number; theme: Theme; enemies: EnemyDef[]; bosses: EnemyDef[] }
export const MAPS: MapDef[] = [
  { id: "terra", name: "Terra", level: 1, theme: { ground: "#4f8a3a", ground2: "#5d9a44", obstacle: "#2e5e22", obstacleTop: "#3f7a2c", style: "tree", sky: "#102010" },
    enemies: [{ name: "Lobo", level: 1, color: "#8a8f99", size: 0.9 }, { name: "Bandido", level: 2, color: "#c0392b", size: 1 }, { name: "Saibaman", level: 3, color: "#4caf50", size: 0.9 }],
    bosses: [{ name: "Raditz", level: 5, color: "#5b3a29", size: 1.5 }] },
  { id: "vegeta", name: "Planeta Vegeta", level: 5, theme: { ground: "#9a4a2e", ground2: "#a85738", obstacle: "#5c2a1a", obstacleTop: "#7a3a24", style: "rock", sky: "#200a05" },
    enemies: [{ name: "Saibaman", level: 5, color: "#4caf50", size: 0.9 }, { name: "Soldado Saiyajin", level: 7, color: "#6d4c41", size: 1 }, { name: "Ozaru Selvagem", level: 8, color: "#7b4a24", size: 1.4 }],
    bosses: [{ name: "Nappa", level: 10, color: "#d7a86e", size: 1.6 }] },
  { id: "namek", name: "Namekusei", level: 9, theme: { ground: "#5fb3a0", ground2: "#6cc0ab", obstacle: "#2f6f8f", obstacleTop: "#3f8fb0", style: "tree", sky: "#082018" },
    enemies: [{ name: "Soldado de Freeza", level: 9, color: "#9575cd", size: 1 }, { name: "Dodoria", level: 11, color: "#ec407a", size: 1.3 }, { name: "Zarbon", level: 12, color: "#26a69a", size: 1.1 }],
    bosses: [{ name: "Capitão Ginyu", level: 14, color: "#7e57c2", size: 1.5 }] },
  { id: "freeza", name: "Planeta Freeza", level: 13, theme: { ground: "#5a4a7a", ground2: "#655586", obstacle: "#2a2040", obstacleTop: "#8a7ab0", style: "pillar", sky: "#0a0614" },
    enemies: [{ name: "Elite de Freeza", level: 13, color: "#b39ddb", size: 1 }, { name: "Cui", level: 15, color: "#ab47bc", size: 1.1 }, { name: "Robô Mecha", level: 16, color: "#90a4ae", size: 1.2 }],
    bosses: [{ name: "Freeza", level: 19, color: "#f5f5f5", size: 1.4 }] },
  { id: "deuses", name: "Mundo dos Deuses", level: 17, theme: { ground: "#c9d8f0", ground2: "#d6e2f5", obstacle: "#ffffff", obstacleTop: "#e8eefc", style: "cloud", sky: "#1a2040" },
    enemies: [{ name: "Anjo Aprendiz", level: 17, color: "#80deea", size: 1 }, { name: "Guardião Divino", level: 19, color: "#ffd54f", size: 1.2 }],
    bosses: [{ name: "Bills", level: 24, color: "#9c27b0", size: 1.5 }] },
  { id: "divino", name: "Reino Divino", level: 21, theme: { ground: "#3a2a5a", ground2: "#45346a", obstacle: "#7ad9ff", obstacleTop: "#c8f2ff", style: "crystal", sky: "#05030f" },
    enemies: [{ name: "Guerreiro Divino", level: 21, color: "#e1bee7", size: 1 }, { name: "Clone de Zamasu", level: 23, color: "#81c784", size: 1.1 }],
    bosses: [{ name: "Zamasu Fundido", level: 28, color: "#c5e1a5", size: 1.6 }] },
  { id: "arena", name: "Arena Multiversal", level: 25, theme: { ground: "#8a8478", ground2: "#958f82", obstacle: "#4a453c", obstacleTop: "#b0a890", style: "pillar", sky: "#000000" },
    enemies: [{ name: "Lutador do Universo 11", level: 25, color: "#ef5350", size: 1 }, { name: "Kale Berserker", level: 27, color: "#66bb6a", size: 1.3 }],
    bosses: [{ name: "Kefla", level: 30, color: "#aed581", size: 1.4 }, { name: "Broly", level: 33, color: "#43a047", size: 1.8 }, { name: "Jiren", level: 36, color: "#e53935", size: 1.6 }] },
];
export const getMapDef = (id: string) => MAPS.find((m) => m.id === id) ?? MAPS[0]!;
export function enemyBase(level: number, boss: boolean) {
  return {
    hp: Math.round((30 + level * 28) * (boss ? 8 : 1)),
    atk: Math.round((4 + level * 3.2) * (boss ? 1.6 : 1)),
    def: Math.round(2 + level * 1.8),
    xp: Math.round((8 + level * level * 2.5) * (boss ? 10 : 1)),
    gold: Math.round((3 + level * 2) * (boss ? 15 : 1)),
  };
}

export interface Item { uid: string; name: string; slot: Slot; rarity: Rarity; level: number; atk: number; def: number; hp: number; ki: number; kiRegen: number; value: number }
const ITEM_NAMES: Record<Slot, string[]> = {
  luvas: ["Luvas de Treino", "Munhequeiras Pesadas", "Luvas de Batalha"],
  gi: ["Gi Laranja", "Armadura Saiyajin", "Gi Divino"],
  botas: ["Botas de Treino", "Botas Saiyajin", "Botas do Vento"],
  scouter: ["Scouter Verde", "Scouter Vermelho", "Scouter Elite"],
  anel: ["Anel de Ki", "Brinco Potara", "Anel dos Deuses"],
};
export function makeItem(level: number, rarity: Rarity, slot?: Slot): Item {
  const s = slot ?? SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
  const names = ITEM_NAMES[s];
  const base = names[Math.min(names.length - 1, Math.floor(level / 10))]!;
  const p = (2 + level * 1.5) * RARITY_INFO[rarity].mult;
  const r = (v: number) => Math.round(v);
  const it: Item = { uid: Math.random().toString(36).slice(2), name: base, slot: s, rarity, level, atk: 0, def: 0, hp: 0, ki: 0, kiRegen: 0, value: r(p * 5) };
  if (s === "luvas") it.atk = r(p);
  if (s === "gi") { it.def = r(p * 0.6); it.hp = r(p * 4); }
  if (s === "botas") { it.def = r(p * 0.8); it.hp = r(p * 1.5); }
  if (s === "scouter") { it.ki = r(p * 4); it.kiRegen = Math.round(p * 0.08 * 10) / 10; }
  if (s === "anel") { it.atk = r(p * 0.5); it.ki = r(p * 2); it.hp = r(p * 2); }
  return it;
}

export interface HouseDef { id: string; name: string; x: number; y: number; w: number; h: number; price: number; level: number }
export const HOUSES: HouseDef[] = [
  { id: "casa1", name: "Casa Simples", x: 3, y: 3, w: 5, h: 4, price: 200, level: 2 },
  { id: "casa2", name: "Casa Capsule Corp", x: 10, y: 3, w: 6, h: 5, price: 1000, level: 6 },
  { id: "casa3", name: "Mansão Kame", x: 3, y: 9, w: 7, h: 4, price: 5000, level: 12 },
];
export const DECOR: Record<string, { name: string; price: number; color: string }> = {
  planta: { name: "Planta", price: 50, color: "#3fae4a" },
  tapete: { name: "Tapete", price: 80, color: "#c0392b" },
  cama: { name: "Cama", price: 150, color: "#4a7bd0" },
  esfera: { name: "Esfera do Dragão", price: 300, color: "#ff9f1a" },
  estatua: { name: "Estátua de Shenlong", price: 600, color: "#2ecc71" },
};
