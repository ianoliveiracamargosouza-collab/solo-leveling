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

  it("permite três tentativas e remove o corpo após a terceira falha", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const save = defaultSave();
    const game = new Game(save);
    game.corpses.push({ id: 9002, name: "Goblin", x: save.x, y: save.y, level: 1, boss: false, rank: "E", attempts: 0, attempted: false });
    expect(game.extractShadow(9002)).toBe(false);
    expect(game.corpses[0]?.attempts).toBe(1);
    expect(game.extractShadow(9002)).toBe(false);
    expect(game.corpses[0]?.attempts).toBe(2);
    expect(game.extractShadow(9002)).toBe(false);
    expect(game.corpses).toHaveLength(0);
    expect(game.extractShadow(9002)).toBe(false);
  });

  it("extrai mesmo com a mochila cheia e mantém a aparência original do inimigo", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const save = defaultSave();
    const game = new Game(save);
    save.inventory = Array.from({ length: 30 }, (_, i) => ({ uid: String(i), name: "Item", slot: "arma" as const, rarity: "comum" as const, level: 1, atk: 1, def: 0, hp: 0, ki: 0, kiRegen: 0, value: 1 }));
    game.corpses.push({ id: 9003, name: "Aranha da Masmorra", x: save.x, y: save.y, level: 4, boss: false, rank: "E", attempts: 0, attempted: false });
    expect(game.extractShadow(9003)).toBe(true);
    expect(save.shadowArmy[0]?.appearanceName).toBe("Aranha da Masmorra");
    expect(save.shadowArmy[0]?.size).toBe(1);
    expect(save.inventory).toHaveLength(30);
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

  it("expulsa uma sombra ao removê-la do menu e salva a alteração", () => {
    const save = defaultSave();
    const game = new Game(save);
    save.shadowArmy.push({ id: "remove-me", name: "Sombra de Goblin", rank: "E", level: 1, xp: 0, hp: 96, maxHp: 96, atk: 10, def: 5, x: save.x, y: save.y, cooldown: 0, kind: "warrior" });
    expect(game.dismissShadow("remove-me")).toBe(true);
    expect(save.shadowArmy).toHaveLength(0);
    expect(save.shadowsSummoned).toBe(false);
    expect(game.dismissShadow("remove-me")).toBe(false);
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
