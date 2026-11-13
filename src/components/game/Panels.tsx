import type { ReactNode } from "react";
import { DECOR, FORMS, HOUSES, MAPS, RARITY_INFO, SLOTS, SLOT_NAMES, VALID_COMBOS, comboStats, isFormUnlocked, type Item } from "@/game/data";
import type { Game } from "@/game/engine";

export type PanelId = "forms" | "inv" | "train" | "travel" | "house" | "chest" | null;
const Btn = ({ children, onClick, disabled, active }: { children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) => (
  <button onClick={onClick} disabled={disabled}
    className={`rounded border-2 px-2 py-1 text-[10px] transition-colors disabled:opacity-40 ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-secondary-foreground hover:border-primary"}`}>{children}</button>
);
function ItemLine({ it, children }: { it: Item; children?: ReactNode }) {
  const st = [it.atk && `ATK+${it.atk}`, it.def && `DEF+${it.def}`, it.hp && `HP+${it.hp}`, it.ki && `Mana+${it.ki}`, it.kiRegen && `Reg. Mana+${it.kiRegen}`].filter(Boolean).join(" ");
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border py-1.5">
      <div className="min-w-0">
        <div className="truncate text-[10px]" style={{ color: RARITY_INFO[it.rarity].color }}>{it.name} <span className="text-muted-foreground">Nv{it.level}</span></div>
        <div className="text-[9px] text-muted-foreground">{SLOT_NAMES[it.slot]} · {st}</div>
      </div>
      <div className="flex shrink-0 gap-1">{children}</div>
    </div>
  );
}

export function Panel({ id, g, close }: { id: PanelId; g: Game; close: () => void }) {
  if (!id) return null;
  const s = g.s; const st = g.stats();
  const titles: Record<string, string> = { forms: "Habilidades do Monarca", inv: "Mochila & Equipamento", train: "Atributos & Treino", travel: "Viajar (Portal)", house: "Casa", chest: "Baú" };
  let body: ReactNode = null;
  if (id === "forms") {
    const cs = comboStats(g.active);
    body = (<>
      <label className="mb-3 flex items-center gap-2 text-[10px]">
        <input type="checkbox" checked={s.testMode} onChange={(e) => g.setTestMode(e.target.checked)} /> Modo de testes (tudo liberado)
      </label>
      <div className="mb-2 text-[10px] text-muted-foreground">Ativo: x{cs.mult.toFixed(1)} poder · -{cs.drain.toFixed(1)} Mana/s {cs.combo && `· Desgaste ${g.strain.toFixed(0)}s`}</div>
      <div className="grid grid-cols-1 gap-1.5">
        {FORMS.map((f) => { const un = isFormUnlocked(f.id, s.level, s.testMode); const on = g.active.includes(f.id); return (
          <button key={f.id} onClick={() => g.toggleForm(f.id)} disabled={!un}
            className={`flex items-center justify-between rounded border-2 px-2 py-1.5 text-left text-[10px] disabled:opacity-40 ${on ? "border-primary bg-primary/20" : "border-border bg-secondary"}`}>
            <span><span className="mr-2 inline-block h-2 w-2" style={{ background: f.aura }} />{f.name}</span>
            <span className="text-muted-foreground">{un ? `x${f.mult} · ${f.kiDrain}Mana/s` : `Nv ${f.level}`}</span>
          </button>); })}
      </div>
      <div className="mt-3 text-[9px] leading-relaxed text-muted-foreground">Habilidades disponíveis: {VALID_COMBOS.map((c) => c.map((id) => FORMS.find((f) => f.id === id)!.short).join("+")).join(", ")}. Ative uma habilidade do Monarca para aumentar seu poder. O uso contínuo consome mana.</div>
    </>);
  }
  if (id === "inv") body = (<>
    <div className="mb-2 flex items-center justify-between rounded border border-primary/40 bg-primary/10 px-2 py-1.5 text-[10px]"><span className="text-muted-foreground">Dinheiro na mochila</span><strong className="text-accent">{s.gold.toLocaleString("pt-BR")} z</strong></div>
    <div className="mb-1 text-[10px] text-primary">Equipado</div>
    {SLOTS.map((sl) => { const it = s.equipped[sl]; return it ? <ItemLine key={sl} it={it}><Btn onClick={() => g.unequip(sl)}>Tirar</Btn></ItemLine> : <div key={sl} className="border-b border-border py-1.5 text-[9px] text-muted-foreground">{SLOT_NAMES[sl]}: vazio</div>; })}
    <div className="mb-1 mt-3 text-[10px] text-primary">Mochila ({s.inventory.length}/30)</div>
    {s.inventory.length === 0 && <div className="text-[9px] text-muted-foreground">Derrote inimigos para conseguir itens.</div>}
    {s.inventory.map((it) => <ItemLine key={it.uid} it={it}><Btn onClick={() => g.equip(it.uid)}>Usar</Btn><Btn onClick={() => g.sell(it.uid)}>{it.value}z</Btn></ItemLine>)}
  </>);
  if (id === "train") body = (<>
    <div className="grid grid-cols-2 gap-1 text-[10px]">
      <div>Ataque: {st.atk}</div><div>Defesa: {st.def}</div><div>Vida: {st.maxHp}</div><div>Mana: {st.maxKi}</div><div>Regen. Mana: {st.kiRegen}/s</div><div>Ouro: {s.gold}z</div>
    </div>
    <div className="mb-2 mt-3 text-[10px] text-primary">Nível do personagem: {s.level} · Pontos disponíveis: {s.trainPoints}</div>
    <div className="mb-2 text-[9px] text-muted-foreground">Você ganha 3 pontos de status a cada nível e distribui instantaneamente.</div>
    {(["str", "def", "hp", "ki"] as const).map((k) => (
      <div key={k} className="mb-1.5 flex items-center justify-between text-[10px]">
        <span>{{ str: "Força", def: "Defesa", hp: "Vida", ki: "Mana" }[k]}: {s.train[k]}</span><Btn disabled={s.trainPoints <= 0} onClick={() => g.train(k)}>+1 ponto</Btn>
      </div>))}
    <div className="mt-3 border-t border-border pt-2 text-[9px] text-muted-foreground">Chefes derrotados: {s.bossesDefeated.join(", ") || "nenhum"}<br/>Fase infinita: {s.phaseBoost + 1} · Força dos inimigos x{Math.pow(2, s.phaseBoost)} · XP x{Math.pow(1.25, s.phaseBoost).toFixed(2)} {s.bossesDefeated.includes("Jiren") && <Btn onClick={() => g.buyNextPhase()}>Dobrar fase — {g.phaseUpgradeCost()}z</Btn>}</div>
  </>);
  if (id === "travel") body = (<div className="grid gap-1.5">
    {MAPS.map((m) => <button key={m.id} disabled={s.level < m.level} onClick={() => { if (g.travel(m.id)) close(); }}
      className={`flex justify-between rounded border-2 px-2 py-1.5 text-[10px] disabled:opacity-40 ${g.map.id === m.id ? "border-primary" : "border-border"} bg-secondary`}>
      <span>{m.name}</span><span className="text-muted-foreground">Nv {m.level} · Chefe: {m.bosses.map((b) => b.name).join(", ")}</span></button>)}
  </div>);
  if (id === "house") {
    const hid = g.context?.type === "door" ? g.context.houseId : g.map.interior;
    const hd = HOUSES.find((h) => h.id === hid);
    if (g.map.interior) body = (<>
      <div className="mb-2 text-[10px] text-muted-foreground">Fique onde quer colocar a decoração.</div>
      {Object.entries(DECOR).map(([k, d]) => <div key={k} className="mb-1.5 flex justify-between text-[10px]"><span>{d.name}</span><Btn onClick={() => g.buyDecor(k)}>{d.price}z</Btn></div>)}
      <div className="mt-3 border-t border-border pt-2 text-[10px] text-primary">Loja da casa</div><div className="mb-2 flex items-center justify-between text-[10px]"><span>Poção de Recuperação · restaura toda Vida e Mana<br/><span className="text-muted-foreground">Você tem: {s.senzuBeans}</span></span><Btn onClick={() => g.buySenzu()}>250z Comprar</Btn></div><Btn onClick={() => g.removeDecor()}>Remover decoração aqui (50%)</Btn>
    </>);
    else if (hd) body = s.houses[hd.id] ? (<Btn onClick={() => { g.enterHouse(hd.id); close(); }}>Entrar na {hd.name}</Btn>) : (<>
      <div className="mb-3 text-[10px]">{hd.name}<br /><span className="text-muted-foreground">Preço {hd.price}z · Nível mínimo {hd.level} · Você tem {s.gold}z</span></div>
      <Btn onClick={() => g.buyHouse(hd.id)} disabled={s.level < hd.level || s.gold < hd.price}>Comprar</Btn>
    </>);
  }
  if (id === "chest") { const h = g.house; body = h ? (<>
    <div className="mb-1 text-[10px] text-primary">No baú ({h.chest.length})</div>
    {h.chest.map((it) => <ItemLine key={it.uid} it={it}><Btn onClick={() => g.take(it.uid)}>Pegar</Btn></ItemLine>)}
    <div className="mb-1 mt-3 text-[10px] text-primary">Mochila</div>
    {s.inventory.map((it) => <ItemLine key={it.uid} it={it}><Btn onClick={() => g.store(it.uid)}>Guardar</Btn></ItemLine>)}
  </>) : null; }
  return (
    <div className="absolute inset-x-2 top-16 bottom-44 z-20 mx-auto flex max-w-md flex-col rounded-lg border-2 border-primary bg-card/95 text-card-foreground shadow-2xl md:bottom-6">
      <div className="flex items-center justify-between border-b-2 border-border px-3 py-2">
        <h2 className="text-xs text-primary">{titles[id]}</h2>
        <button onClick={close} className="text-xs text-muted-foreground hover:text-foreground" aria-label="Fechar">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{body}</div>
    </div>
  );
}
