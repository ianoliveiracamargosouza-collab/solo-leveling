import { afterEach, describe, expect, it, vi } from "vitest";
import { Game } from "./engine";
import { defaultSave } from "./state";

afterEach(() => vi.restoreAllMocks());

describe("Exército das Sombras", () => {
  it("extrai um monstro comum e adiciona a sombra ao exército", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const save = defaultSave();
    const game = new Game(save);
    game.corpses.push({ id: 9001, name: "Goblin", x: save.x, y: save.y, level: 1, boss: false, rank: "E", attempted: false });

    expect(game.extractShadow(9001)).toBe(true);
    expect(save.shadowArmy).toHaveLength(1);
    expect(save.shadowArmy[0]?.name).toBe("Sombra de Goblin");
    expect(save.shadowsSummoned).toBe(true);
    expect(game.corpses).toHaveLength(0);
  });

  it("mantém o corpo quando a extração falha e impede uma segunda tentativa", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const save = defaultSave();
    const game = new Game(save);
    game.corpses.push({ id: 9002, name: "Goblin", x: save.x, y: save.y, level: 1, boss: false, rank: "E", attempted: false });

    expect(game.extractShadow(9002)).toBe(false);
    expect(game.corpses[0]?.attempted).toBe(true);
    expect(game.extractShadow(9002)).toBe(false);
    expect(save.shadowArmy).toHaveLength(0);
  });

  it("controla invocação, recolhimento e ordens táticas", () => {
    const save = defaultSave();
    const game = new Game(save);
    save.shadowArmy.push({ id: "s1", name: "Igris", rank: "A", level: 1, xp: 0, hp: 100, maxHp: 100, atk: 20, def: 10, x: save.x, y: save.y, cooldown: 0, kind: "warrior" });

    game.setShadowCommand("focus");
    expect(save.shadowCommand).toBe("focus");
    game.toggleShadows();
    expect(save.shadowsSummoned).toBe(false);
    game.toggleShadows();
    expect(save.shadowsSummoned).toBe(true);
  });

  it("aumenta o limite de sombras com nível e prestígio", () => {
    const save = defaultSave();
    const game = new Game(save);
    expect(game.shadowCapacity()).toBe(3);
    save.level = 10;
    save.prestige = 1;
    expect(game.shadowCapacity()).toBe(6);
  });
});
