// Persistent player save (localStorage).
import type { Item, Slot } from "./data";
export interface HouseState { decor: { type: string; x: number; y: number }[]; chest: Item[] }
export interface SaveData {
  version: 1; name: string; level: number; xp: number; gold: number; hp: number; ki: number;
  train: { str: number; def: number; hp: number; ki: number }; trainPoints: number; phaseBoost: number; senzuBeans: number;
  inventory: Item[]; equipped: Partial<Record<Slot, Item>>;
  houses: Record<string, HouseState>; mapId: string; x: number; y: number;
  testMode: boolean; bossesDefeated: string[]; prestige: number;
}
const KEY = "solo_leveling_shadow_monarch_save_v1";
export function defaultSave(): SaveData {
  return { version: 1, name: "Sung Jin-Woo", level: 1, xp: 0, gold: 50, hp: 100, ki: 100, train: { str: 0, def: 0, hp: 0, ki: 0 }, trainPoints: 0, phaseBoost: 0, senzuBeans: 0,
    inventory: [], equipped: {}, houses: {}, mapId: "double-dungeon", x: -1, y: -1, testMode: false, bossesDefeated: [], prestige: 0 };
}
export function loadSave(): SaveData {
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = defaultSave(); const p = JSON.parse(raw); return { ...d, ...p, train: { ...d.train, ...(p.train ?? {}) }, houses: p.houses ?? {} }; } } catch { /* corrupt save */ }
  return defaultSave();
}
export function writeSave(s: SaveData) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ } }
export function clearSave() { localStorage.removeItem(KEY); }
