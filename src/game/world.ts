// Tile maps: procedural outdoor maps and house interiors.
import { HOUSES, getMapDef, type Theme } from "./data";
export const TILE = 32;
export const T = { GROUND: 0, WALL: 1, ROAD: 2, DOOR: 3, PORTAL: 4, CHEST: 5, FLOOR: 6, EXIT: 7, HWALL: 8 } as const;
export interface GameMap { id: string; name: string; w: number; h: number; tiles: Uint8Array; spawn: { x: number; y: number }; doors: { houseId: string; x: number; y: number }[]; theme: Theme; interior?: string; spawnPoints: { x: number; y: number }[] }
export const isSolid = (t: number) => t === T.WALL || t === T.CHEST || t === T.HWALL;
export function tileAt(m: GameMap, tx: number, ty: number) { return tx < 0 || ty < 0 || tx >= m.w || ty >= m.h ? T.WALL : m.tiles[ty * m.w + tx]!; }
export function collides(m: GameMap, x: number, y: number, half: number) {
  for (const [cx, cy] of [[x - half, y - half], [x + half, y - half], [x - half, y + half], [x + half, y + half]] as const)
    if (isSolid(tileAt(m, Math.floor(cx / TILE), Math.floor(cy / TILE)))) return true;
  return false;
}
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hashStr = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);

export function genMap(id: string): GameMap {
  const def = getMapDef(id); const w = 48, h = 36; const r = rng(hashStr(id));
  const tiles = new Uint8Array(w * h); const set = (x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = v; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) set(x, y, T.WALL);
    else if (r() < 0.08) { set(x, y, T.WALL); if (r() < 0.3) { set(x + 1, y, T.WALL); set(x, y + 1, T.WALL); } }
  }
  const spawn = { x: 24, y: 19 };
  for (let x = 1; x < w - 1; x++) set(x, 18, T.GROUND);
  for (let y = 1; y < h - 1; y++) set(24, y, T.GROUND);
  for (let y = spawn.y - 3; y <= spawn.y + 2; y++) for (let x = spawn.x - 3; x <= spawn.x + 3; x++) set(x, y, T.GROUND);
  set(24, 17, T.PORTAL);
  const doors: GameMap["doors"] = [];
  if (id === "double-dungeon") {
    for (let y = 2; y <= 14; y++) for (let x = 2; x <= 20; x++) set(x, y, T.ROAD);
    for (let x = 2; x <= 24; x++) set(x, 15, T.ROAD);
    for (const hd of HOUSES) {
      for (let y = hd.y; y < hd.y + hd.h; y++) for (let x = hd.x; x < hd.x + hd.w; x++) set(x, y, T.HWALL);
      const dx = hd.x + Math.floor(hd.w / 2), dy = hd.y + hd.h - 1; set(dx, dy, T.DOOR); doors.push({ houseId: hd.id, x: dx, y: dy });
    }
  }
  const spawnPoints: GameMap["spawnPoints"] = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++)
    if (tiles[y * w + x] === T.GROUND && Math.hypot(x - spawn.x, y - spawn.y) > 8) spawnPoints.push({ x, y });
  return { id, name: def.name, w, h, tiles, spawn, doors, theme: def.theme, spawnPoints };
}

export function genInterior(houseId: string): GameMap {
  const hd = HOUSES.find((x) => x.id === houseId) ?? HOUSES[0]!;
  const w = 8 + hd.w, h = 6 + hd.h; const tiles = new Uint8Array(w * h).fill(T.FLOOR);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || y === 0 || x === w - 1 || y === h - 1) tiles[y * w + x] = T.HWALL;
  const ex = Math.floor(w / 2); tiles[(h - 1) * w + ex] = T.EXIT; tiles[1 * w + ex] = T.CHEST;
  return { id: "casa:" + houseId, name: hd.name, w, h, tiles, spawn: { x: ex, y: h - 2 }, doors: [], interior: houseId, spawnPoints: [],
    theme: { ground: "#8a5a32", ground2: "#96643a", obstacle: "#3a2a1a", obstacleTop: "#c9a27a", style: "rock", sky: "#000" } };
}
