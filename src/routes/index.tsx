import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FORMS, comboStats, getMapDef, isFormUnlocked, xpToNext } from "@/game/data";
import { Game } from "@/game/engine";
import { render } from "@/game/render";
import { clearSave, loadSave } from "@/game/state";
import { Joystick } from "@/components/game/Joystick";
import { Panel, type PanelId } from "@/components/game/Panels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dragon Ball Tibia RPG — Evolua seu Saiyajin" },
      { name: "description", content: "RPG 2D pixel art estilo Tibia no universo Dragon Ball: explore planetas, lute, transforme-se e compre casas." },
      { property: "og:title", content: "Dragon Ball Tibia RPG" },
      { property: "og:description", content: "Evolua seu Saiyajin até o guerreiro mais forte do multiverso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Bar({ v, max, color, label }: { v: number; max: number; color: string; label: string }) {
  return (
    <div className="relative h-3.5 w-full overflow-hidden rounded-sm border border-border bg-background/80">
      <div className="h-full transition-[width]" style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, background: color }} />
      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-foreground [text-shadow:1px_1px_0_#000]">{label}</span>
    </div>
  );
}

function Index() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gref = useRef<Game | null>(null);
  const [, setTick] = useState(0);
  const [panel, setPanel] = useState<PanelId>(null);

  useEffect(() => {
    const g = new Game(loadSave()); gref.current = g;
    const cv = canvas.current!; const ctx = cv.getContext("2d")!;
    let raf = 0, last = performance.now(), uiT = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now; g.update(dt);
      const dpr = window.devicePixelRatio || 1, vw = window.innerWidth, vh = window.innerHeight;
      if (cv.width !== Math.round(vw * dpr) || cv.height !== Math.round(vh * dpr)) { cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); }
      const zoom = Math.max(1.5, Math.min(3, Math.min(vw, vh) / 320));
      render(ctx, g, vw, vh, dpr, zoom);
      uiT += dt; if (uiT > 0.1) { uiT = 0; setTick((t) => t + 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toLowerCase(); g.keys.add(k);
      if (k === " ") { e.preventDefault(); g.punch(); } if (k === "q") g.blast(); if (k === "e") g.kame();
      if (k === "f") interact(); if (k === "r") g.setChargingKi(true); if (k === "escape") setPanel(null);
      const n = Number(k); if (n >= 1 && n <= 9) g.toggleForm(FORMS[n - 1]!.id);
    };
    const up = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); g.keys.delete(k); if (k === "r") g.setChargingKi(false); };
    const save = () => g.save();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("beforeunload", save);
    return () => { cancelAnimationFrame(raf); save(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("beforeunload", save); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function interact() {
    const g = gref.current; if (!g || !g.context) return;
    const c = g.context;
    if (c.type === "portal") setPanel("travel");
    else if (c.type === "door") { if (g.s.houses[c.houseId]) g.enterHouse(c.houseId); else setPanel("house"); }
    else if (c.type === "exit") g.exitHouse();
    else if (c.type === "chest") setPanel("chest");
  }

  const g = gref.current;
  const st = g?.stats();
  const ctxLabel = g?.context ? { portal: "Viajar", door: g.context.type === "door" && g.s.houses[g.context.houseId] ? "Entrar" : "Comprar casa", exit: "Sair", chest: "Abrir baú" }[g.context.type] : null;
  const ActBtn = ({ label, onPress, cd, big }: { label: string; onPress: () => void; cd?: number; big?: boolean }) => (
    <button onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      className={`relative touch-none select-none rounded-full border-2 border-primary bg-primary/30 text-[9px] text-foreground active:bg-primary/70 ${big ? "h-20 w-20" : "h-14 w-14"}`}>
      {label}{cd ? <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">{cd.toFixed(1)}</span> : null}
    </button>
  );

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-background font-pixel text-foreground">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
      {g && st && (<>
        <div className="absolute left-2 top-2 z-10 w-52 space-y-1 rounded-md border-2 border-border bg-card/80 p-2">
          <div className="flex justify-between text-[9px]"><span className="text-primary">{g.s.name} Nv {g.s.level}</span><span className="text-accent">{g.s.gold}z</span></div>
          <Bar v={g.s.hp} max={st.maxHp} color="var(--hp)" label={`${Math.ceil(g.s.hp)}/${st.maxHp}`} />
          <Bar v={g.s.ki} max={st.maxKi} color="var(--ki)" label={`Ki ${Math.floor(g.s.ki)}/${st.maxKi}`} />
          <Bar v={g.s.xp} max={xpToNext(g.s.level)} color="var(--xp)" label={`XP ${g.s.xp}/${xpToNext(g.s.level)}`} />
          <div className="text-[8px] text-muted-foreground">{g.map.interior ? g.map.name : getMapDef(g.map.id).name}{g.active.length ? ` · x${comboStats(g.active).mult.toFixed(1)}` : ""}</div>
        </div>
        <div className="absolute right-2 top-2 z-10 flex flex-wrap justify-end gap-1">
          {([["forms", "Formas"], ["inv", "Mochila"], ["train", "Treino"]] as const).map(([id, l]) => (
            <button key={id} onClick={() => setPanel(panel === id ? null : id)} className="rounded border-2 border-border bg-card/85 px-2 py-1.5 text-[9px] hover:border-primary">{l}</button>))}
          {g.map.interior && <button onClick={() => setPanel(panel === "house" ? null : "house")} className="rounded border-2 border-border bg-card/85 px-2 py-1.5 text-[9px] hover:border-primary">Decorar</button>}
          <button onClick={() => { if (confirm("Apagar todo o progresso?")) { clearSave(); location.reload(); } }} className="rounded border-2 border-border bg-card/85 px-2 py-1.5 text-[9px] text-destructive">Reset</button>
        </div>
        <div className="pointer-events-none absolute left-2 top-36 z-10 max-w-[60vw] space-y-0.5 md:max-w-sm">
          {g.log.map((l, i) => <div key={i} className="text-[8px] [text-shadow:1px_1px_0_#000]" style={{ color: l.c, opacity: 1 - i * 0.13 }}>{l.t}</div>)}
        </div>
        <div className="absolute inset-x-0 bottom-52 z-10 flex justify-center gap-1 px-2 md:bottom-4">
          {FORMS.map((f, i) => { const un = isFormUnlocked(f.id, g.s.level, g.s.testMode); const on = g.active.includes(f.id); return (
            <button key={f.id} onClick={() => g.toggleForm(f.id)} disabled={!un} title={`${f.name} [${i + 1}]`}
              className="h-9 w-9 rounded border-2 text-[8px] disabled:opacity-30" style={{ borderColor: on ? f.aura : "var(--border)", background: on ? f.aura + "55" : "var(--card)", boxShadow: on ? `0 0 10px ${f.aura}` : undefined }}>{f.short}</button>); })}
        </div>
        <div className="absolute bottom-4 left-4 z-10"><Joystick onMove={(x, y) => { g.joy = { x, y }; }} /></div>
        <div className="absolute bottom-4 right-4 z-10 grid grid-cols-2 items-end gap-2">
          {ctxLabel ? <button onClick={interact} className="col-span-2 rounded border-2 border-accent bg-accent/30 px-3 py-2 text-[9px] text-foreground">{ctxLabel} [F]</button> : null}
          <button onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); g.setChargingKi(true); }} onPointerUp={() => g.setChargingKi(false)} onPointerCancel={() => g.setChargingKi(false)} onContextMenu={(e) => e.preventDefault()} className={`h-14 w-14 touch-none select-none rounded-full border-2 text-[9px] text-foreground ${g.chargingKi ? "border-sky-300 bg-sky-400/50 shadow-[0_0_14px_#38bdf8]" : "border-sky-500 bg-sky-500/20"}`} title="Segure para carregar Ki [R]">Carregar Ki</button>
          <ActBtn label={`Senzu (${g.s.senzuBeans})`} onPress={() => g.useSenzu()} />
          <ActBtn label="Ki [Q]" onPress={() => g.blast()} cd={g.cd.blast > 0.05 ? g.cd.blast : 0} />
          <ActBtn label="Kame [E]" onPress={() => g.kame()} cd={g.cd.kame > 0.05 ? g.cd.kame : 0} />
          <div className="col-span-2 flex justify-end"><ActBtn big label="Soco [Espaço]" onPress={() => g.punch()} /></div>
        </div>
        <Panel id={panel} g={g} close={() => setPanel(null)} />
      </>)}
    </main>
  );
}
