// Pixel-art enemy sprites in the same style as the hero (procedural canvas drawing).
export type Hair = "none" | "spiky" | "long" | "flat" | "mohawk" | "ears" | "horns" | "pony" | "wild";
export type Body = "human" | "beast" | "robot" | "plant" | "giant";
export interface Look { body: Body; skin: string; hair: Hair; hairC: string; top: string; pants: string; belt: string; boots: string; eye?: string; extra?: string; tail?: string }
const H = (o: Partial<Look>): Look => ({ body: "human", skin: "#f2c299", hair: "none", hairC: "#1a1a1a", top: "#555", pants: "#333", belt: "#222", boots: "#ddd", ...o });
const SAIYAN_ARMOR = { top: "#e8e8e8", belt: "#c9a227", boots: "#f0f0f0", pants: "#1f2a5a" };
export const LOOKS: Record<string, Look> = {
  "Lobo": H({ body: "beast", skin: "#8a8f99", extra: "#5f646d" }),
  "Bandido": H({ hair: "flat", hairC: "#3b2a1a", top: "#c0392b", pants: "#4a3a2a", belt: "#111", boots: "#3b2a1a", extra: "#222" }),
  "Saibaman": H({ body: "plant", skin: "#4caf50", eye: "#ff3030" }),
  "Soldado Saiyajin": H({ hair: "spiky", ...SAIYAN_ARMOR, tail: "#6b4220" }),
  "Ozaru Selvagem": H({ body: "giant", skin: "#7b4a24", eye: "#ff2020" }),
  "Soldado de Freeza": H({ skin: "#9575cd", hair: "horns", hairC: "#5e35b1", ...SAIYAN_ARMOR, pants: "#2a2a4a" }),
  "Dodoria": H({ skin: "#ec407a", hair: "horns", hairC: "#ad1457", ...SAIYAN_ARMOR, pants: "#3a2a4a", extra: "fat" }),
  "Zarbon": H({ skin: "#26a69a", hair: "pony", hairC: "#004d40", ...SAIYAN_ARMOR, pants: "#1a2a3a" }),
  "Capitão Ginyu": H({ skin: "#7e57c2", hair: "horns", hairC: "#311b92", top: "#efefef", pants: "#1a1a3a", belt: "#c9a227", boots: "#fff" }),
  "Elite de Freeza": H({ skin: "#b39ddb", hair: "flat", hairC: "#4527a0", ...SAIYAN_ARMOR, pants: "#4a1a4a" }),
  "Cui": H({ skin: "#ab47bc", hair: "ears", hairC: "#6a1b9a", ...SAIYAN_ARMOR, pants: "#2a1a3a" }),
  "Robô Mecha": H({ body: "robot", skin: "#90a4ae", eye: "#ff3030" }),
  "Freeza": H({ skin: "#f5f5f5", hair: "none", top: "#f5f5f5", pants: "#f5f5f5", belt: "#f5f5f5", boots: "#f5f5f5", extra: "#8e24aa", tail: "#f5f5f5", eye: "#d50000" }),
  "Anjo Aprendiz": H({ skin: "#80deea", hair: "mohawk", hairC: "#eceff1", top: "#311b92", pants: "#1a1a4a", belt: "#e65100", boots: "#311b92", extra: "halo" }),
  "Guardião Divino": H({ skin: "#e0b080", hair: "flat", hairC: "#ffd54f", top: "#ffd54f", pants: "#6d4c41", belt: "#b71c1c", boots: "#5d4037" }),
  "Bills": H({ skin: "#9c27b0", hair: "ears", hairC: "#7b1fa2", top: "#111", pants: "#c62828", belt: "#ffd54f", boots: "#ffd54f", eye: "#ffeb3b", tail: "#9c27b0" }),
  "Guerreiro Divino": H({ skin: "#e1bee7", hair: "mohawk", hairC: "#fff", top: "#4a148c", pants: "#311b92", belt: "#ffd54f", boots: "#fff" }),
  "Clone de Zamasu": H({ skin: "#81c784", hair: "mohawk", hairC: "#fafafa", top: "#2e2a5a", pants: "#3a3a3a", belt: "#c62828", boots: "#fff" }),
  "Zamasu Fundido": H({ skin: "#c5e1a5", hair: "wild", hairC: "#fafafa", top: "#4a148c", pants: "#311b92", belt: "#ffd54f", boots: "#fff", extra: "halo" }),
  "Raditz": H({ hair: "long", hairC: "#111", ...SAIYAN_ARMOR, tail: "#6b4220" }),
  "Nappa": H({ hair: "none", ...SAIYAN_ARMOR, top: "#d7c48a", extra: "fat", tail: "#6b4220" }),
  "Lutador do Universo 11": H({ skin: "#e8a888", hair: "flat", hairC: "#111", top: "#ef5350", pants: "#111", belt: "#ffd54f", boots: "#111" }),
  "Kale Berserker": H({ hair: "wild", hairC: "#a5ff5a", top: "#c62828", pants: "#ffe0e0", belt: "#111", boots: "#111", extra: "fat", eye: "#fff" }),
  "Kefla": H({ hair: "spiky", hairC: "#c6ff6a", top: "#f06292", pants: "#e0e0e0", belt: "#ad1457", boots: "#111", extra: "#ffeb3b" }),
  "Broly": H({ hair: "wild", hairC: "#a5ff5a", top: "#f2c299", pants: "#fafafa", belt: "#ffd54f", boots: "#5d4037", extra: "fat", eye: "#fff" }),
  "Jiren": H({ skin: "#e0e0e0", hair: "none", top: "#c62828", pants: "#111", belt: "#111", boots: "#111", eye: "#000", extra: "fat" }),
};
const FALLBACK = H({ hair: "spiky" });
export const lookFor = (name: string) => LOOKS[name] ?? FALLBACK;

type P = (x: number, y: number, w: number, h: number, col: string) => void;
/** Draws at origin (0,0) = character centre, same coordinate scale as the hero. */
export function drawLook(c: CanvasRenderingContext2D, L: Look, moving: number, flash: boolean, facingDown = true) {
  const p: P = (x, y, w, h, col) => { c.fillStyle = flash ? "#ffffff" : col; c.fillRect(x, y, w, h); };
  const leg = Math.round(Math.sin(moving) * 2), eye = L.eye ?? "#111";
  if (L.body === "beast") {
    p(-11, -6, 20, 10, L.skin); p(-11, 0, 20, 4, L.extra!); p(-10, 4, 4, 7 + leg, L.skin); p(4, 4, 4, 7 - leg, L.skin);
    p(7, -12, 9, 9, L.skin); p(8, -15, 3, 4, L.skin); p(13, -15, 3, 4, L.skin); p(14, -8, 4, 3, "#333"); p(10, -10, 2, 2, "#ffeb3b"); p(-15, -8, 5, 3, L.skin);
    return;
  }
  if (L.body === "plant") {
    p(-5, 2, 4, 9 + leg, "#2e7d32"); p(1, 2, 4, 9 - leg, "#2e7d32"); p(-6, -8, 12, 11, L.skin); p(-9, -6, 3, 8, L.skin); p(6, -6, 3, 8, L.skin);
    p(-6, -20, 12, 12, L.skin); p(-7, -16, 2, 5, "#2e7d32"); p(5, -16, 2, 5, "#2e7d32"); p(-4, -15, 3, 3, eye); p(1, -15, 3, 3, eye); p(-3, -20, 6, 2, "#81c784");
    return;
  }
  if (L.body === "robot") {
    p(-6, 3, 5, 9 + leg, "#607d8b"); p(1, 3, 5, 9 - leg, "#607d8b"); p(-9, -9, 18, 13, L.skin); p(-5, -6, 10, 6, "#37474f"); p(-12, -8, 3, 10, "#607d8b"); p(9, -8, 3, 10, "#607d8b");
    p(-6, -20, 12, 11, L.skin); p(-5, -16, 10, 3, "#263238"); p(-4, -16, 3, 2, eye); p(1, -16, 3, 2, eye); p(-1, -24, 2, 4, "#263238"); p(-2, -25, 4, 2, eye);
    return;
  }
  if (L.body === "giant") {
    p(-8, 2, 6, 10 + leg, "#5a3418"); p(2, 2, 6, 10 - leg, "#5a3418"); p(-10, -12, 20, 16, L.skin); p(-6, -8, 12, 10, "#d8b48a");
    p(-8, -24, 16, 13, L.skin); p(-5, -18, 10, 6, "#d8b48a"); p(-5, -21, 3, 2, eye); p(2, -21, 3, 2, eye); p(-14, -10, 4, 12, L.skin); p(10, -10, 4, 12, L.skin);
    return;
  }
  const fat = L.extra === "fat" ? 2 : 0;
  if (L.tail) p(5, 0, 7, 3, L.tail);
  if (L.hair === "long") p(-6, -20, 12, 30, L.hairC);
  p(-6, 4, 5, 8 + leg, L.pants); p(1, 4, 5, 8 - leg, L.pants); p(-6, 11 + leg, 5, 2, L.boots); p(1, 11 - leg, 5, 2, L.boots);
  p(-7 - fat, -8, 14 + fat * 2, 12, L.top); p(-7 - fat, 2, 14 + fat * 2, 2, L.belt);
  if (L.top === "#e8e8e8") { p(-9 - fat, -9, 4, 3, L.belt); p(5 + fat, -9, 4, 3, L.belt); }
  if (L.extra && L.extra.startsWith("#")) p(-3, -8, 6, 3, L.extra);
  const armC = L.top === "#f2c299" ? L.skin : L.skin;
  p(-10 - fat, -7, 3, 9, armC); p(7 + fat, -7, 3, 9, armC);
  p(-5, -18, 10, 10, L.skin);
  if (facingDown) { p(-3, -14, 2, 2, eye); p(1, -14, 2, 2, eye); }
  const hc = L.hairC;
  switch (L.hair) {
    case "spiky": p(-6, -22, 12, 5, hc); p(-8, -24, 3, 6, hc); p(-3, -26, 3, 5, hc); p(1, -27, 3, 6, hc); p(5, -24, 3, 6, hc); break;
    case "long": p(-6, -23, 12, 6, hc); p(-8, -25, 3, 6, hc); p(-2, -27, 4, 5, hc); p(5, -25, 3, 6, hc); break;
    case "flat": p(-6, -21, 12, 4, hc); break;
    case "mohawk": p(-2, -25, 4, 8, hc); break;
    case "pony": p(-6, -21, 12, 4, hc); p(4, -18, 3, 12, hc); break;
    case "ears": p(-6, -26, 3, 8, hc); p(3, -26, 3, 8, hc); break;
    case "horns": p(-7, -23, 2, 6, hc); p(5, -23, 2, 6, hc); break;
    case "wild": p(-8, -23, 16, 6, hc); p(-10, -26, 4, 8, hc); p(-4, -29, 3, 7, hc); p(1, -30, 3, 8, hc); p(6, -26, 4, 8, hc); break;
  }
  if (L.top === "#f5f5f5") { p(-4, -21, 8, 3, L.extra!); p(-2, -6, 4, 4, L.extra!); }
  if (L.extra === "halo") { c.strokeStyle = "#fff59d"; c.lineWidth = 1; c.beginPath(); c.ellipse(0, -30, 6, 2, 0, 0, 6.28); c.stroke(); }
}
