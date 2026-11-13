// Pixel-art enemy sprites in the same style as the hero (procedural canvas drawing).
export type Hair = "none" | "spiky" | "long" | "flat" | "mohawk" | "ears" | "horns" | "pony" | "wild";
export type Body = "human" | "beast" | "robot" | "plant" | "giant";
export interface Look { body: Body; skin: string; hair: Hair; hairC: string; top: string; pants: string; belt: string; boots: string; eye?: string; extra?: string; tail?: string }
const H = (o: Partial<Look>): Look => ({ body: "human", skin: "#f2c299", hair: "none", hairC: "#1a1a1a", top: "#555", pants: "#333", belt: "#222", boots: "#ddd", ...o });
export const LOOKS: Record<string, Look> = {
  "Goblin": H({ body: "beast", skin: "#78934f", hair: "ears", hairC: "#3f542b", top: "#596b3c", pants: "#343b2a" }),
  "Lobo de Pedra": H({ body: "beast", skin: "#89919d", extra: "#555d69" }),
  "Estátua Guardiã": H({ body: "robot", skin: "#737b8b", top: "#454b5a", eye: "#a78bfa" }),
  "Estátua do Templo": H({ body: "giant", skin: "#a1a1aa", top: "#555568", eye: "#a78bfa" }),
  "Goblin Guerreiro": H({ body: "beast", skin: "#86a65b", extra: "#526b37" }),
  "Aranha da Masmorra": H({ body: "beast", skin: "#5d536e", extra: "#2d263b" }),
  "Orc Batedor": H({ skin: "#78904c", hair: "wild", hairC: "#26351c", top: "#4b5c38", pants: "#343b2a" }),
  "Chefe Orc": H({ skin: "#a3a35a", hair: "wild", hairC: "#303b21", top: "#59633d", pants: "#252b20", extra: "fat" }),
  "Lobisomem": H({ body: "beast", skin: "#8b817c", extra: "#514a47" }),
  "Mago das Sombras": H({ skin: "#78668f", hair: "mohawk", hairC: "#211a33", top: "#292238", pants: "#171522", extra: "#8b5cf6" }),
  "Orc Guerreiro": H({ skin: "#78904c", hair: "wild", hairC: "#26351c", top: "#59633d", pants: "#343b2a", extra: "fat" }),
  "Líder dos Orcs": H({ skin: "#b0a06a", hair: "wild", hairC: "#252b20", top: "#6a6545", pants: "#29291e", extra: "fat" }),
  "Cavaleiro Mágico": H({ hair: "flat", hairC: "#d1d5db", top: "#64748b", pants: "#263247", extra: "#a78bfa" }),
  "Guerreiro Lagarto": H({ body: "beast", skin: "#4e8b76", extra: "#285c4b" }),
  "Golem de Pedra": H({ body: "robot", skin: "#9299a3", top: "#5d6572", eye: "#a78bfa" }),
  "Guardião do Portal": H({ body: "robot", skin: "#7c83b8", top: "#41415f", eye: "#c4b5fd" }),
  "Demônio Menor": H({ skin: "#a65d78", hair: "horns", hairC: "#4b2035", top: "#54283e", pants: "#281827" }),
  "Assassino das Sombras": H({ skin: "#45415f", hair: "hood" as Hair, hairC: "#151421", top: "#222033", pants: "#11101b" }),
  "Cavaleiro Demoníaco": H({ skin: "#7d6b9e", hair: "horns", hairC: "#2e2140", top: "#39304d", pants: "#1c1728" }),
  "Comandante Demoníaco": H({ skin: "#b16a91", hair: "horns", hairC: "#3b172c", top: "#5c2946", pants: "#211522" }),
  "Cavaleiro de Elite": H({ hair: "flat", hairC: "#cbd5e1", top: "#7c8495", pants: "#293040", extra: "#a78bfa" }),
  "Escavador Gigante": H({ body: "giant", skin: "#8d796c", top: "#514239" }),
  "Mago de Fogo": H({ skin: "#d97757", hair: "wild", hairC: "#fbbf24", top: "#6b3029", pants: "#301b20" }),
  "Igris": H({ skin: "#9ca3af", hair: "none", top: "#34394b", pants: "#171a28", extra: "#a78bfa" }),
  "Formiga Soldado": H({ body: "beast", skin: "#5c6479", extra: "#30394c" }),
  "Formiga Guerreira": H({ body: "beast", skin: "#41465a", extra: "#202638" }),
  "Demônio de Alto Rank": H({ skin: "#805a9e", hair: "horns", hairC: "#291936", top: "#41284f", pants: "#1e1527" }),
  "Beru": H({ body: "beast", skin: "#6e8b57", extra: "#293e2a" }),
  "Arquiteto": H({ skin: "#9c8bb8", hair: "none", top: "#383047", pants: "#171421", extra: "#a78bfa" }),
  "Soldado das Sombras": H({ skin: "#42445c", hair: "none", top: "#252638", pants: "#11121d", extra: "#7c3aed" }),
  "Cavaleiro das Sombras": H({ skin: "#55566d", hair: "none", top: "#303248", pants: "#151624", extra: "#8b5cf6" }),
  "Bellion": H({ skin: "#8d91a8", hair: "none", top: "#42465e", pants: "#171a2b", extra: "#c4b5fd" }),
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
