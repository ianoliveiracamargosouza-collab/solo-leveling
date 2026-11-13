import { describe, expect, it } from "vitest";
import { FORMS, comboStats, toggleForm } from "./data";

describe("transformações", () => {
  it("níveis de desbloqueio", () => {
    expect(Object.fromEntries(FORMS.map((f) => [f.id, f.level]))).toEqual({ ozaru: 2, kaioken: 3, ssj1: 5, ssj2: 7, ssj3: 9, god: 12, blue: 15, ui: 18, ego: 20 });
  });
  it("bloqueia forma abaixo do nível fora do modo de testes", () => {
    expect(toggleForm([], "ssj1", 4, false).error).toBeTruthy();
    expect(toggleForm([], "ssj1", 5, false).active).toEqual(["ssj1"]);
  });
  it("modo de testes libera IS + EG + Kaioken no nível 1", () => {
    let a = toggleForm([], "ui", 1, true).active;
    a = toggleForm(a, "ego", 1, true).active;
    a = toggleForm(a, "kaioken", 1, true).active;
    expect(a.sort()).toEqual(["ego", "kaioken", "ui"]);
  });
  it("combinação inválida substitui a forma (SSJ1 + SSJ2)", () => {
    expect(toggleForm(["ssj1"], "ssj2", 30, false).active).toEqual(["ssj2"]);
  });
  it("combinação multiplica poder e aumenta gasto de Ki", () => {
    const c = comboStats(["kaioken", "ssj1"]);
    expect(c.mult).toBe(3);
    expect(c.drain).toBe(9);
  });
});
