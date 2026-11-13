import { describe, expect, it } from "vitest";
import { FORMS, MAPS, comboStats, toggleForm } from "./data";

describe("progressão de Solo Leveling", () => {
  it("define habilidades do Monarca com desbloqueios graduais", () => {
    expect(FORMS.map((f) => f.id)).toEqual(["shadow-authority", "shadow-reinforcement", "monarch-presence", "shadow-assault", "monarch-domain"]);
    expect(FORMS[0]?.level).toBe(1);
    expect(FORMS[4]?.level).toBe(15);
  });
  it("bloqueia habilidade antes do nível necessário", () => {
    expect(toggleForm([], "shadow-reinforcement", 2, false).error).toBeTruthy();
    expect(toggleForm([], "shadow-reinforcement", 3, false).active).toEqual(["shadow-reinforcement"]);
  });
  it("permite alternar uma habilidade sem empilhar poderes incompatíveis", () => {
    expect(toggleForm(["shadow-authority"], "monarch-presence", 20, false).active).toEqual(["monarch-presence"]);
  });
  it("usa progressão de portais E até S e Castelo do Monarca", () => {
    expect(MAPS.map((m) => m.id)).toEqual(["double-dungeon", "dungeon-e", "dungeon-d", "dungeon-c", "dungeon-b", "dungeon-a", "dungeon-s", "shadow-castle"]);
  });
  it("mantém multiplicador e consumo de mana da habilidade ativa", () => {
    const c = comboStats(["shadow-authority"]);
    expect(c.mult).toBeGreaterThan(1);
    expect(c.drain).toBe(1);
  });
});
