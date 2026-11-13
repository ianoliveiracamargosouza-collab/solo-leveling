// Canvas pixel-art renderer (all sprites drawn procedurally).
import { DECOR, FORMS, HOUSES, RARITY_INFO, comboStats, type Theme } from "./data";
import type { Enemy, Game } from "./engine";
import { T, TILE } from "./world";
import { drawLook, lookFor } from "./sprites";

const FONT = "'Press Start 2P', monospace";
const hash = (x: number, y: number) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function drawTile(c: CanvasRenderingContext2D, t: number, tx: number, ty: number, th: Theme, time: number) {
  const x = tx * TILE, y = ty * TILE, r = hash(tx, ty);
  const ground = () => { c.fillStyle = r < 0.5 ? th.ground : th.ground2; c.fillRect(x, y, TILE, TILE); c.fillStyle = "rgba(0,0,0,0.12)"; c.fillRect(x + Math.floor(r * 24), y + Math.floor(hash(ty, tx) * 24), 4, 2); };
  if (t === T.GROUND) return ground();
  if (t === T.ROAD) { c.fillStyle = (tx + ty) % 2 ? "#b8a888" : "#c4b494"; c.fillRect(x, y, TILE, TILE); c.fillStyle = "rgba(0,0,0,0.1)"; c.fillRect(x, y + 31, TILE, 1); c.fillRect(x + 31, y, 1, TILE); return; }
  if (t === T.FLOOR) { c.fillStyle = ty % 2 ? th.ground : th.ground2; c.fillRect(x, y, TILE, TILE); c.fillStyle = "rgba(0,0,0,0.15)"; c.fillRect(x, y + 31, TILE, 1); c.fillRect(x + ((ty % 2) * 16), y, 1, TILE); return; }
  if (t === T.WALL) {
    ground();
    if (th.style === "tree") { c.fillStyle = "#5a3a1e"; c.fillRect(x + 13, y + 18, 6, 12); c.fillStyle = th.obstacle; c.fillRect(x + 3, y + 2, 26, 20); c.fillStyle = th.obstacleTop; c.fillRect(x + 7, y + 4, 14, 8); }
    else if (th.style === "rock") { c.fillStyle = th.obstacle; c.fillRect(x + 3, y + 8, 26, 22); c.fillStyle = th.obstacleTop; c.fillRect(x + 6, y + 9, 14, 6); }
    else if (th.style === "pillar") { c.fillStyle = th.obstacle; c.fillRect(x + 6, y + 2, 20, 28); c.fillStyle = th.obstacleTop; c.fillRect(x + 6, y + 2, 20, 5); c.fillRect(x + 9, y + 9, 3, 18); }
    else if (th.style === "crystal") { c.fillStyle = th.obstacle; c.beginPath(); c.moveTo(x + 16, y + 1); c.lineTo(x + 28, y + 20); c.lineTo(x + 16, y + 31); c.lineTo(x + 4, y + 20); c.fill(); c.fillStyle = th.obstacleTop; c.fillRect(x + 13, y + 8, 4, 10); }
    else { c.fillStyle = th.obstacle; c.fillRect(x + 2, y + 10, 28, 16); c.fillRect(x + 8, y + 4, 16, 8); c.fillStyle = "#c8d4ee"; c.fillRect(x + 2, y + 24, 28, 3); }
    return;
  }
  if (t === T.HWALL) { c.fillStyle = "#6b4a2e"; c.fillRect(x, y, TILE, TILE); c.fillStyle = "#7d5a3a"; c.fillRect(x + 1, y + 1, 14, 7); c.fillRect(x + 17, y + 9, 14, 7); c.fillRect(x + 1, y + 17, 14, 7); c.fillRect(x + 17, y + 25, 14, 6); c.fillStyle = "#b03a2e"; c.fillRect(x, y, TILE, 4); return; }
  if (t === T.DOOR || t === T.EXIT) { c.fillStyle = t === T.DOOR ? "#6b4a2e" : th.ground; c.fillRect(x, y, TILE, TILE); c.fillStyle = "#3d2614"; c.fillRect(x + 6, y + 4, 20, 28); c.fillStyle = "#8a5a2e"; c.fillRect(x + 8, y + 6, 16, 26); c.fillStyle = "#ffd54f"; c.fillRect(x + 20, y + 18, 3, 3); return; }
  if (t === T.CHEST) { c.fillStyle = th.ground; c.fillRect(x, y, TILE, TILE); c.fillStyle = "#5a3a1e"; c.fillRect(x + 4, y + 10, 24, 18); c.fillStyle = "#8a5a2e"; c.fillRect(x + 5, y + 11, 22, 6); c.fillStyle = "#ffd54f"; c.fillRect(x + 14, y + 16, 4, 5); return; }
  if (t === T.PORTAL) {
    ground(); const p = (Math.sin(time * 4) + 1) / 2;
    c.fillStyle = `rgba(120,200,255,${0.4 + p * 0.3})`; c.beginPath(); c.ellipse(x + 16, y + 18, 14, 10, 0, 0, 6.28); c.fill();
    c.strokeStyle = "#e0f6ff"; c.lineWidth = 2; c.beginPath(); c.ellipse(x + 16, y + 18, 10 * (0.6 + p * 0.4), 6, 0, 0, 6.28); c.stroke();
  }
}

function drawPlayer(c: CanvasRenderingContext2D, g: Game) {
  const { x, y } = g.s; const cs = comboStats(g.active); const sc = cs.giant ? 1.7 : 1;
  const forms = g.active.map((id) => FORMS.find((f) => f.id === id)!);
  const hairForm = [...forms].reverse()[0];
  const hair = hairForm ? hairForm.hair : "#1a1a1a"; const bob = g.moving ? Math.round(Math.sin(g.animT) * 1.5) : 0;
  c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.ellipse(x, y + 12 * sc, 10 * sc, 4 * sc, 0, 0, 6.28); c.fill();
  if (forms.length) {
    const fl = 0.85 + Math.sin(g.time * 20) * 0.15;
    forms.forEach((f, i) => { c.fillStyle = f.aura + "55"; c.beginPath(); c.ellipse(x, y - 4 * sc, (14 + i * 4) * sc * fl, (22 + i * 4) * sc * fl, 0, 0, 6.28); c.fill(); });
    if (cs.combo) { c.strokeStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.4})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x - 12, y - 20); c.lineTo(x - 4, y - 10); c.lineTo(x - 10, y); c.stroke(); }
  }
  c.save(); c.translate(x, y + bob); c.scale(sc, sc);
  const p = (px: number, py: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(px, py, w, h); };
  const leg = g.moving ? Math.round(Math.sin(g.animT) * 2) : 0;
  if (cs.giant) {
    p(-8, 2, 6, 10 + leg, "#5a3418"); p(2, 2, 6, 10 - leg, "#5a3418"); p(-10, -12, 20, 16, "#6b4220"); p(-6, -8, 12, 10, "#d8b48a");
    p(-8, -24, 16, 13, "#6b4220"); p(-5, -18, 10, 6, "#d8b48a"); p(-5, -21, 3, 2, "#ff2020"); p(2, -21, 3, 2, "#ff2020");
    p(-14, -10, 4, 12, "#6b4220"); p(10, -10, 4, 12, "#6b4220");
  } else {
    p(-6, 4, 5, 8 + leg, "#171923"); p(1, 4, 5, 8 - leg, "#171923"); p(-6, 11 + leg, 5, 2, "#4b5563"); p(1, 11 - leg, 5, 2, "#4b5563");
    p(-7, -8, 14, 12, "#171923"); p(-7, 2, 14, 2, "#4b5563"); p(-3, -8, 6, 3, "#4b5563");
    const punch = g.punchT > 0 ? 5 : 0;
    p(-10 + (g.facing.x < 0 ? -punch : 0), -7, 3, 9, "#d5ad91"); p(7 + (g.facing.x >= 0 ? punch : 0), -7, 3, 9, "#d5ad91");
    p(-5, -18, 10, 10, "#e7c3a2");
    if (g.facing.y >= 0) { p(-3, -14, 2, 2, "#111"); p(1, -14, 2, 2, "#111"); }
    const ssj3 = false;
    p(-6, -22, 12, 5, hair); p(-8, -24, 3, 6, hair); p(-3, -26, 3, 5, hair); p(1, -27, 3, 6, hair); p(5, -24, 3, 6, hair);
    if (hairForm) { p(-4, -30, 3, 5, hair); p(2, -31, 2, 5, hair); }
    if (ssj3) { p(-7, -18, 3, 22, hair); p(4, -18, 3, 22, hair); }
  }
  if (g.active.length) { c.globalAlpha = 0.25 + Math.sin(g.time * 15) * 0.1; p(-12, -30, 24, 44, "#ff0000"); c.globalAlpha = 1; }
  c.restore();
}


function drawCorpse(c: CanvasRenderingContext2D, corpse: Game["corpses"][number]) {
  // Every defeated enemy leaves a dark body marked with the shadow-extraction symbol.
  c.save(); c.translate(corpse.x, corpse.y + 7); c.rotate(-0.25);
  c.fillStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.ellipse(0, 5, 15, 5, 0, 0, 6.28); c.fill();
  c.fillStyle = "#09090b"; c.fillRect(-7, -7, 14, 13); c.fillRect(-5, -16, 10, 10);
  c.fillRect(-11, -5, 4, 10); c.fillRect(7, -5, 4, 10); c.fillRect(-6, 5, 4, 7); c.fillRect(2, 5, 4, 7);
  c.strokeStyle = "#a78bfa"; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -3, 14, 0, 6.28); c.stroke();
  c.fillStyle = "#c4b5fd"; c.fillRect(-2, -13, 2, 2); c.fillRect(1, -13, 2, 2);
  c.restore();
  c.font = `6px ${FONT}`; c.textAlign = "center"; c.fillStyle = "#000"; c.fillText(corpse.name, corpse.x + 1, corpse.y - 24 + 1);
  c.fillStyle = "#e9d5ff"; c.fillText(corpse.name, corpse.x, corpse.y - 24);
  if (!corpse.attempted) {
    const pulse = 0.65 + Math.sin(Date.now() / 220) * 0.25;
    c.globalAlpha = pulse; c.fillStyle = "#a78bfa"; c.font = `7px ${FONT}`; c.fillText("ERGUE-SE", corpse.x, corpse.y - 34); c.globalAlpha = 1;
  }
}

function drawShadow(c: CanvasRenderingContext2D, shadow: Game["s"]["shadowArmy"][number], time: number) {
  c.save(); c.translate(shadow.x, shadow.y + Math.sin(time * 5 + shadow.level) * 1.2);
  c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.ellipse(0, 12, 10, 3, 0, 0, 6.28); c.fill();
  c.fillStyle = "#08080b";
  c.fillRect(-6, -8, 12, 17); c.fillRect(-5, -18, 10, 10); c.fillRect(-9, -7, 4, 11); c.fillRect(5, -7, 4, 11); c.fillRect(-5, 8, 4, 5); c.fillRect(1, 8, 4, 5);
  c.fillStyle = "#a78bfa"; c.fillRect(-3, -14, 2, 2); c.fillRect(1, -14, 2, 2);
  c.globalAlpha = 0.55; c.strokeStyle = "#8b5cf6"; c.lineWidth = 1; c.strokeRect(-8, -20, 16, 34);
  c.restore(); c.globalAlpha = 1;
  c.font = `6px ${FONT}`; c.textAlign = "center"; c.fillStyle = "#c4b5fd"; c.fillText(shadow.name, shadow.x, shadow.y - 24);
}

function drawEnemy(c: CanvasRenderingContext2D, e: Enemy, time: number) {
  const s = e.def.size, bob = Math.round(Math.sin(time * 6 + e.id) * 1.5), w = 18 * s, h = 22 * s;
  c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.ellipse(e.x, e.y + 11 * s, 10 * s, 4 * s, 0, 0, 6.28); c.fill();
  if (e.rarity !== "comum" || e.boss) { c.strokeStyle = e.boss ? "#ff3030" : RARITY_INFO[e.rarity].color; c.lineWidth = 2; c.beginPath(); c.ellipse(e.x, e.y + 11 * s, 13 * s, 5 * s, 0, 0, 6.28); c.stroke(); }
  c.save(); c.translate(e.x, e.y + bob); c.scale(s, s); drawLook(c, lookFor(e.def.name), time * 10 + e.id, e.flash > 0); c.restore();
  const by = e.y - 32 * s + bob; void w; void h;
  const hy = by - 8; c.fillStyle = "#000"; c.fillRect(e.x - 14, hy, 28, 4); c.fillStyle = e.hp / e.maxHp > 0.5 ? "#4caf50" : e.hp / e.maxHp > 0.2 ? "#ffb020" : "#e53935"; c.fillRect(e.x - 13, hy + 1, 26 * Math.max(0, e.hp / e.maxHp), 2);
  c.font = `6px ${FONT}`; c.textAlign = "center"; c.fillStyle = "#000"; c.fillText(`${e.def.name} ${e.def.level}`, e.x + 1, hy - 2);
  c.fillStyle = e.boss ? "#ff6060" : RARITY_INFO[e.rarity].color; c.fillText(`${e.def.name} ${e.def.level}`, e.x, hy - 3);
}

export function render(c: CanvasRenderingContext2D, g: Game, vw: number, vh: number, dpr: number, zoom: number) {
  const m = g.map, W = m.w * TILE, H = m.h * TILE, sw = vw / zoom, sh = vh / zoom;
  const cx = W > sw ? clamp(g.s.x - sw / 2, 0, W - sw) : (W - sw) / 2;
  const cy = H > sh ? clamp(g.s.y - sh / 2, 0, H - sh) : (H - sh) / 2;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = m.theme.sky; c.fillRect(0, 0, vw, vh);
  c.setTransform(dpr * zoom, 0, 0, dpr * zoom, Math.round(-cx * zoom * dpr), Math.round(-cy * zoom * dpr));
  const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
  const x1 = Math.min(m.w - 1, Math.ceil((cx + sw) / TILE)), y1 = Math.min(m.h - 1, Math.ceil((cy + sh) / TILE));
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(c, m.tiles[ty * m.w + tx]!, tx, ty, m.theme, g.time);
  const house = g.house;
  if (house) for (const o of house.decor) {
    const d = DECOR[o.type]; if (!d) continue; const x = o.x * TILE, y = o.y * TILE; c.fillStyle = d.color;
    if (o.type === "tapete") c.fillRect(x + 1, y + 6, 30, 20);
    else if (o.type === "cama") { c.fillRect(x + 4, y + 2, 24, 28); c.fillStyle = "#fff"; c.fillRect(x + 6, y + 4, 20, 7); }
    else if (o.type === "esfera") { c.beginPath(); c.arc(x + 16, y + 18, 8, 0, 6.28); c.fill(); c.fillStyle = "#c0392b"; c.fillRect(x + 14, y + 16, 4, 4); }
    else if (o.type === "estatua") { c.fillRect(x + 10, y + 2, 12, 26); c.fillRect(x + 6, y + 2, 20, 8); c.fillStyle = "#ff2020"; c.fillRect(x + 10, y + 5, 3, 2); }
    else { c.fillStyle = "#8a5a2e"; c.fillRect(x + 11, y + 20, 10, 10); c.fillStyle = d.color; c.fillRect(x + 7, y + 6, 18, 15); }
  }
  for (const corpse of g.corpses) drawCorpse(c, corpse);
  const actors: { y: number; draw: () => void }[] = g.enemies.filter((e) => e.alive).map((e) => ({ y: e.y, draw: () => drawEnemy(c, e, g.time) }));
  if (g.s.shadowsSummoned) for (const shadow of g.s.shadowArmy) actors.push({ y: shadow.y, draw: () => drawShadow(c, shadow, g.time) });
  actors.push({ y: g.s.y, draw: () => drawPlayer(c, g) }); actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
  for (const p of g.projs) { c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(p.x, p.y, p.r * 0.5, 0, 6.28); c.fill(); }
  for (const p of g.parts) { c.globalAlpha = Math.min(1, p.life * 2); c.fillStyle = p.color; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); } c.globalAlpha = 1;
  c.textAlign = "center";
  for (const d of m.doors) {
    const hd = HOUSES.find((h) => h.id === d.houseId)!; const owned = !!g.s.houses[hd.id];
    const label = owned ? `${hd.name} · Dono: ${g.s.name}` : `${hd.name} · À venda ${hd.price}z · Nv ${hd.level}`;
    c.font = `6px ${FONT}`; const lx = (hd.x + hd.w / 2) * TILE, ly = hd.y * TILE - 4; const tw = c.measureText(label).width;
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(lx - tw / 2 - 3, ly - 8, tw + 6, 11); c.fillStyle = owned ? "#9fe870" : "#ffd54f"; c.fillText(label, lx, ly);
  }
  c.font = `8px ${FONT}`;
  for (const t of g.texts) { c.globalAlpha = Math.min(1, t.life * 2); c.fillStyle = "#000"; c.fillText(t.text, t.x + 1, t.y + 1); c.fillStyle = t.color; c.fillText(t.text, t.x, t.y); } c.globalAlpha = 1;
}
