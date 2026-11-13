// Core simulation: movement, combat, enemies, progression, transformations, houses.
import { DECOR, FORMS, HOUSES, RARITY_INFO, comboStats, enemyBase, getMapDef, makeItem, rollRarity, toggleForm, xpToNext, type EnemyDef, type Item, type Rarity, type Slot } from "./data";
import { writeSave, type SaveData, type ShadowUnit, type ShadowCommand } from "./state";
import { T, TILE, collides, genInterior, genMap, tileAt, type GameMap } from "./world";

export interface Enemy { id: number; def: EnemyDef; boss: boolean; rarity: Rarity; x: number; y: number; hx: number; hy: number; hp: number; maxHp: number; atk: number; dfn: number; xp: number; gold: number; alive: boolean; respawnAt: number; atkCd: number; specialCd: number; flash: number; wander: { x: number; y: number; t: number } }
interface Proj { x: number; y: number; vx: number; vy: number; dmg: number; r: number; from: "p" | "e"; life: number; color: string; pierce: boolean; hit: Set<number> }
interface FText { x: number; y: number; text: string; color: string; life: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
export interface Corpse { id: number; name: string; x: number; y: number; level: number; boss: boolean; rank: string; attempted: boolean }
export type Ctx = { type: "portal" } | { type: "door"; houseId: string } | { type: "exit" } | { type: "chest" } | { type: "corpse"; corpseId: number } | null;
const HALF = 9;

export class Game {
  s: SaveData; map!: GameMap; enemies: Enemy[] = []; corpses: Corpse[] = []; projs: Proj[] = []; texts: FText[] = []; parts: Part[] = [];
  time = 0; keys = new Set<string>(); joy = { x: 0, y: 0 }; facing = { x: 0, y: 1 }; moving = false; chargingKi = false; animT = 0; punchT = 0;
  cd = { punch: 0, blast: 0, kame: 0, train: 0 }; active: string[] = []; strain = 0;
  log: { t: string; c: string }[] = []; context: Ctx = null; private saveT = 0; private nextId = 1; private nextCorpseId = 1; private cache = new Map<string, GameMap>();

  constructor(s: SaveData) {
    this.s = s;
    this.loadMap(s.mapId, s.x > 0 ? s.x : undefined, s.y > 0 ? s.y : undefined);
    this.msg("O Sistema foi ativado. Sobreviva à Masmorra Dupla, Sung Jin-Woo.", "#ffb020");
  }
  msg(t: string, c = "#ffffff") { this.log.unshift({ t, c }); if (this.log.length > 6) this.log.pop(); }

  loadMap(id: string, x?: number, y?: number) {
    if (id.startsWith("casa:") && !this.s.houses[id.slice(5)]) id = "double-dungeon";
    let m = this.cache.get(id);
    if (!m) { m = id.startsWith("casa:") ? genInterior(id.slice(5)) : genMap(id); this.cache.set(id, m); }
    this.map = m; this.s.mapId = id;
    this.s.x = x ?? m.spawn.x * TILE + 16; this.s.y = y ?? m.spawn.y * TILE + 16;
    if (collides(m, this.s.x, this.s.y, HALF)) { this.s.x = m.spawn.x * TILE + 16; this.s.y = m.spawn.y * TILE + 16; }
    this.projs = []; this.enemies = []; this.corpses = [];
    if (!m.interior) this.spawnEnemies();
  }

  private spawnEnemies() {
    const def = getMapDef(this.map.id); const pts = this.map.spawnPoints;
    for (let i = 0; i < 16; i++) { const p = pts[Math.floor(Math.random() * pts.length)]!; this.enemies.push(this.makeEnemy(def.enemies[Math.floor(Math.random() * def.enemies.length)]!, false, p.x, p.y)); }
    const far = [...pts].sort((a, b) => Math.hypot(b.x - 24, b.y - 19) - Math.hypot(a.x - 24, a.y - 19));
    def.bosses.forEach((b, i) => { const p = (far[i * 7] ?? far[0])!; this.enemies.push(this.makeEnemy(b, true, p.x, p.y)); });
  }
  private makeEnemy(d: EnemyDef, boss: boolean, tx: number, ty: number): Enemy {
    const e = { id: this.nextId++, def: d, boss, x: tx * TILE + 16, y: ty * TILE + 16, hx: tx * TILE + 16, hy: ty * TILE + 16, alive: true, respawnAt: 0, atkCd: 1, specialCd: 3, flash: 0, wander: { x: 0, y: 0, t: 0 } } as Enemy;
    this.rollEnemy(e); return e;
  }
  private rollEnemy(e: Enemy) {
    e.rarity = e.boss ? "comum" : rollRarity();
    const rm = RARITY_INFO[e.rarity].mult; const ps = this.map.id === "shadow-castle" ? 1 + 0.3 * this.s.prestige : 1;
    const phaseMult = Math.pow(2, this.s.phaseBoost);
    const b = enemyBase(e.def.level * phaseMult, e.boss);
    e.maxHp = e.hp = Math.round(b.hp * rm * ps); e.atk = Math.round(b.atk * (1 + (rm - 1) * 0.4) * ps); e.dfn = Math.round(b.def * ps);
    const baseXp = enemyBase(e.def.level, e.boss).xp;
    const xpMultiplier = Math.pow(1.25, this.s.phaseBoost);
    e.xp = Math.round(baseXp * rm * ps * xpMultiplier); e.gold = Math.round(b.gold * rm * Math.max(1, phaseMult * 0.5));
  }

  stats() {
    const eq = Object.values(this.s.equipped).filter(Boolean) as Item[];
    const sum = (k: "atk" | "def" | "hp" | "ki" | "kiRegen") => eq.reduce((a, i) => a + i[k], 0);
    const L = this.s.level - 1, t = this.s.train, c = comboStats(this.active);
    return {
      atk: Math.round((10 + L * 3 + t.str * 2 + sum("atk")) * c.mult),
      def: Math.round((5 + L * 2 + t.def * 2 + sum("def")) * Math.sqrt(c.mult)),
      maxHp: Math.round((100 + L * 25 + t.hp * 15 + sum("hp")) * (c.giant ? 1.5 : 1)),
      maxKi: Math.round(100 + L * 15 + t.ki * 6 + sum("ki")),
      kiRegen: Math.round((2 + L * 0.2 + t.ki * 0.1 + sum("kiRegen")) * 10) / 10,
      speed: 130 * Math.min(1.6, 1 + (c.mult - 1) * 0.02) * (c.giant ? 0.85 : 1),
      mult: c.mult, drain: c.drain,
    };
  }

  update(dt: number) {
    dt = Math.min(dt, 0.05); this.time += dt; const s = this.s; let st = this.stats();
    // Movement (8 directions)
    let ix = 0, iy = 0; const k = this.keys;
    if (k.has("w") || k.has("arrowup")) iy -= 1; if (k.has("s") || k.has("arrowdown")) iy += 1;
    if (k.has("a") || k.has("arrowleft")) ix -= 1; if (k.has("d") || k.has("arrowright")) ix += 1;
    ix += this.joy.x; iy += this.joy.y;
    this.moving = Math.hypot(ix, iy) > 0.2;
    if (this.moving) this.chargingKi = false;
    if (this.moving) {
      const a = Math.round(Math.atan2(iy, ix) / (Math.PI / 4)) * (Math.PI / 4);
      const dx = Math.round(Math.cos(a) * 1000) / 1000, dy = Math.round(Math.sin(a) * 1000) / 1000;
      this.facing = { x: dx, y: dy }; this.animT += dt * 10;
      this.moveBody(s, dx * st.speed * dt, dy * st.speed * dt, HALF);
    }
    // Context
    const tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE), tile = tileAt(this.map, tx, ty);
    this.context = null;
    if (tile === T.PORTAL) this.context = { type: "portal" };
    else if (tile === T.DOOR) { const d = this.map.doors.find((d) => d.x === tx && d.y === ty); if (d) this.context = { type: "door", houseId: d.houseId }; }
    else if (tile === T.EXIT) this.context = { type: "exit" };
    else if (this.map.interior && ty <= 2 && Math.abs(tx - Math.floor(this.map.w / 2)) <= 1) this.context = { type: "chest" };
    else { const corpse = this.nearestCorpse(48); if (corpse) this.context = { type: "corpse", corpseId: corpse.id }; }
    // Ki, forms, strain. Never read aura data after a depletion-triggered revert.
    const wasTransformed = this.active.length > 0;
    if (wasTransformed) {
      const chargeMultiplier = 4 + s.level * 0.05;
      s.ki = Math.max(0, s.ki - st.drain * dt + (this.chargingKi ? st.kiRegen * chargeMultiplier * dt : 0));
      if (s.ki <= 0) {
        this.revert("Mana esgotada! Habilidade desativada.");
        st = this.stats(); // Immediately restore normal attributes for this frame.
      } else {
        const forms = this.active
          .map((id) => FORMS.find((f) => f.id === id))
          .filter((f): f is (typeof FORMS)[number] => Boolean(f));
        for (let i = 0; i < 2 && forms.length > 0; i++) {
          const f = forms[Math.floor(Math.random() * forms.length)]!;
          this.parts.push({ x: s.x + (Math.random() - 0.5) * 26, y: s.y + 10, vx: 0, vy: -40 - Math.random() * 50, life: 0.6, color: f.aura, size: 2 + Math.random() * 2 });
        }
      }
    } else {
      s.ki += st.kiRegen * dt * (this.chargingKi ? 1 + 4 + s.level * 0.05 : 1);
    }

    if (this.active.length >= 2) {
      this.strain += dt;
      s.hp -= st.maxHp * 0.0015 * this.active.length * (1 + this.strain / 8) * dt;
      if (s.hp < st.maxHp * 0.1) {
        this.revert("Seu corpo chegou ao limite! Habilidade desativada.");
        st = this.stats();
      }
    } else {
      this.strain = Math.max(0, this.strain - dt * 2);
      s.hp += st.maxHp * 0.008 * dt;
    }
    s.hp = Math.max(0, Math.min(s.hp, st.maxHp));
    s.ki = Math.max(0, Math.min(s.ki, st.maxKi));
    for (const key of Object.keys(this.cd) as (keyof typeof this.cd)[]) this.cd[key] = Math.max(0, this.cd[key] - dt);
    this.punchT = Math.max(0, this.punchT - dt);
    this.updateEnemies(dt, st.def);
    this.updateProjs(dt, st.def);
    for (const t of this.texts) { t.y -= 24 * dt; t.life -= dt; } this.texts = this.texts.filter((t) => t.life > 0);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } this.parts = this.parts.filter((p) => p.life > 0);
    this.saveT += dt; if (this.saveT > 5) { this.saveT = 0; writeSave(s); }
  }

  private moveBody(o: { x: number; y: number }, dx: number, dy: number, half: number) {
    if (!collides(this.map, o.x + dx, o.y, half)) o.x += dx;
    if (!collides(this.map, o.x, o.y + dy, half)) o.y += dy;
  }

  private updateEnemies(dt: number, pdef: number) {
    const s = this.s;
    for (const e of this.enemies) {
      if (!e.alive) { if (this.time >= e.respawnAt) { e.alive = true; e.x = e.hx; e.y = e.hy; this.rollEnemy(e); } continue; }
      e.flash = Math.max(0, e.flash - dt); e.atkCd -= dt; e.specialCd -= dt;
      const dx = s.x - e.x, dy = s.y - e.y, d = Math.hypot(dx, dy);
      const aggro = (e.boss ? 8 : 5) * TILE, speed = e.boss ? 80 : 65, reach = 22 + 12 * e.def.size;
      if (d < aggro) {
        if (d > reach - 4) this.moveBody(e, (dx / d) * speed * dt, (dy / d) * speed * dt, 8);
        if (d < reach && e.atkCd <= 0) { e.atkCd = e.boss ? 1 : 1.3; this.damagePlayer(e.atk * (0.85 + Math.random() * 0.3), pdef); }
        if (e.boss && d < 300 && e.specialCd <= 0) {
          e.specialCd = 4; this.projs.push({ x: e.x, y: e.y, vx: (dx / d) * 240, vy: (dy / d) * 240, dmg: e.atk * 1.8, r: 10, from: "e", life: 2, color: "#ff4444", pierce: false, hit: new Set() });
        }
      } else {
        e.wander.t -= dt;
        if (e.wander.t <= 0) { const a = Math.random() * Math.PI * 2; e.wander = Math.random() < 0.5 ? { x: 0, y: 0, t: 1.5 } : { x: Math.cos(a), y: Math.sin(a), t: 1 }; }
        if (Math.hypot(e.x - e.hx, e.y - e.hy) > 4 * TILE) { const hd = Math.hypot(e.hx - e.x, e.hy - e.y); e.wander.x = (e.hx - e.x) / hd; e.wander.y = (e.hy - e.y) / hd; }
        this.moveBody(e, e.wander.x * 35 * dt, e.wander.y * 35 * dt, 8);
      }
    }
  }

  private updateProjs(dt: number, pdef: number) {
    for (const p of this.projs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (tileAt(this.map, Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === T.WALL || tileAt(this.map, Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === T.HWALL) p.life = 0;
      if (p.life <= 0) continue;
      if (p.from === "p") {
        for (const e of this.enemies) {
          if (!e.alive || p.hit.has(e.id)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < p.r + 12 * e.def.size) { p.hit.add(e.id); this.hitEnemy(e, p.dmg); if (!p.pierce) { p.life = 0; break; } }
        }
      } else if (Math.hypot(this.s.x - p.x, this.s.y - p.y) < p.r + 10) { this.damagePlayer(p.dmg, pdef); p.life = 0; }
      this.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.2, color: p.color, size: p.r * 0.6 });
    }
    this.projs = this.projs.filter((p) => p.life > 0);
  }

  private damagePlayer(raw: number, def: number) {
    const dmg = Math.max(1, Math.round(raw - def * 0.5));
    this.s.hp -= dmg; this.texts.push({ x: this.s.x, y: this.s.y - 20, text: `-${dmg}`, color: "#ff5555", life: 0.8 });
    if (this.s.hp <= 0) this.die();
  }
  private die() {
    const lost = Math.floor(this.s.xp * 0.1); this.s.xp -= lost;
    this.active = []; this.strain = 0; this.msg(`Você foi derrotado! Perdeu ${lost} XP.`, "#ff5555");
    this.loadMap("double-dungeon"); const st = this.stats(); this.s.hp = st.maxHp; this.s.ki = st.maxKi;
  }

  nearest(range: number) {
    let best: Enemy | null = null, bd = range;
    for (const e of this.enemies) { if (!e.alive) continue; const d = Math.hypot(e.x - this.s.x, e.y - this.s.y) - 10 * e.def.size; if (d < bd) { bd = d; best = e; } }
    return best;
  }
  private hitEnemy(e: Enemy, raw: number) {
    const crit = Math.random() < 0.1;
    const dmg = Math.max(1, Math.round((raw * (0.85 + Math.random() * 0.3) - e.dfn * 0.5) * (crit ? 2 : 1)));
    e.hp -= dmg; e.flash = 0.12;
    this.texts.push({ x: e.x, y: e.y - 18 * e.def.size, text: crit ? `${dmg}!` : `${dmg}`, color: crit ? "#ffdd33" : "#ffffff", life: 0.8 });
    if (e.hp <= 0) this.kill(e);
  }
  private kill(e: Enemy) {
    e.alive = false; e.respawnAt = this.time + (e.boss ? 90 : 12);
    this.corpses.push({ id: this.nextCorpseId++, name: e.def.name, x: e.x, y: e.y, level: e.def.level, boss: e.boss, rank: this.currentRank(), attempted: false });
    this.s.gold += e.gold; this.msg(`${e.def.name} derrotado! +${e.xp} XP, +${e.gold}z`, "#9fe870");
    for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28; this.parts.push({ x: e.x, y: e.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.5, color: e.def.color, size: 3 }); }
    if (e.boss || Math.random() < 0.3 + (e.rarity !== "comum" ? 0.3 : 0)) {
      const it = makeItem(e.def.level, rollRarity(e.boss ? 0.6 : e.rarity === "comum" ? 0 : 0.2));
      if (this.s.inventory.length < 30) { this.s.inventory.push(it); this.msg(`Item: ${it.name} (${RARITY_INFO[it.rarity].name})`, RARITY_INFO[it.rarity].color); }
      else this.msg("Mochila cheia!", "#ff5555");
    }
    if (e.boss) {
      if (!this.s.bossesDefeated.includes(e.def.name)) this.s.bossesDefeated.push(e.def.name);
      if (e.def.name === "Bellion") { this.s.prestige++; this.msg(`MONARCA DAS SOMBRAS! Castelo do Monarca agora nível ${this.s.prestige + 1}.`, "#ffb020"); }
    }
    this.gainXp(e.xp);
    this.gainShadowXp(Math.max(1, Math.floor(e.xp * 0.2)));
  }
  gainXp(x: number) {
    this.s.xp += x;
    while (this.s.xp >= xpToNext(this.s.level)) {
      this.s.xp -= xpToNext(this.s.level); this.s.level++;
      const st = this.stats(); this.s.hp = st.maxHp; this.s.ki = st.maxKi;
      this.s.trainPoints += 3; this.msg(`Subiu para o nível ${this.s.level}! +3 pontos de status`, "#ffb020");
      const f = FORMS.find((f) => f.level === this.s.level); if (f) this.msg(`Nova habilidade do Monarca: ${f.name}!`, f.aura);
    }
  }


  private currentRank() {
    const id = this.map.id;
    if (id === "dungeon-s" || id === "shadow-castle") return "S";
    if (id === "dungeon-a") return "A";
    if (id === "dungeon-b") return "B";
    if (id === "dungeon-c") return "C";
    if (id === "dungeon-d") return "D";
    return "E";
  }

  nearestCorpse(range: number) {
    let best: Corpse | null = null, bd = range;
    for (const corpse of this.corpses) {
      if (corpse.attempted) continue;
      const d = Math.hypot(corpse.x - this.s.x, corpse.y - this.s.y);
      if (d < bd) { bd = d; best = corpse; }
    }
    return best;
  }

  extractionChance(corpse: Corpse) {
    if (["Igris", "Beru", "Bellion", "Arquiteto", "Iron", "Tusk"].includes(corpse.name)) return corpse.name === "Igris" ? 0.25 : corpse.name === "Beru" ? 0.15 : corpse.name === "Bellion" ? 0.05 : corpse.name === "Tusk" ? 0.2 : 0.25;
    if (corpse.boss) return corpse.rank === "S" ? 0.15 : corpse.rank === "A" ? 0.3 : 0.45;
    if (corpse.rank === "S") return 0.45;
    if (corpse.rank === "A") return 0.5;
    if (corpse.rank === "B") return 0.6;
    if (corpse.level >= 12) return 0.65;
    return 0.8;
  }

  shadowCapacity() { return Math.min(20, 3 + Math.floor(this.s.level / 5) + this.s.prestige); }

  extractShadow(corpseId: number) {
    const corpse = this.corpses.find((x) => x.id === corpseId);
    if (!corpse || corpse.attempted) { this.msg("Este corpo já não pode ser extraído.", "#ff7777"); return false; }
    if (this.s.shadowArmy.length >= this.shadowCapacity()) { this.msg(`Exército cheio! Limite atual: ${this.shadowCapacity()} sombras.`, "#ff7777"); return false; }
    if (["Igris", "Beru", "Bellion", "Arquiteto", "Iron", "Tusk"].includes(corpse.name) && this.s.shadowArmy.some((x) => x.name === corpse.name)) {
      this.msg(`${corpse.name} já faz parte do seu exército.`, "#ff7777"); corpse.attempted = true; return false;
    }
    corpse.attempted = true;
    const chance = this.extractionChance(corpse);
    if (Math.random() > chance) {
      this.msg(`A extração de ${corpse.name} falhou (${Math.round(chance * 100)}% de chance). O corpo permaneceu.`, "#a78bfa");
      return false;
    }
    const unique = ["Igris", "Beru", "Bellion", "Arquiteto", "Iron", "Tusk"].includes(corpse.name);
    const kind: ShadowUnit["kind"] = corpse.name === "Beru" ? "assassin" : corpse.name === "Tusk" ? "mage" : corpse.name === "Iron" || /golem|orc/i.test(corpse.name) ? "tank" : corpse.name === "Bellion" ? "elite" : "warrior";
    const shadow: ShadowUnit = {
      id: `shadow-${corpse.id}-${Date.now()}`, name: unique ? corpse.name : `Sombra de ${corpse.name}`,
      rank: corpse.rank, level: Math.max(1, corpse.level), xp: 0,
      maxHp: Math.round(80 + corpse.level * (kind === "tank" ? 24 : 16)),
      hp: Math.round(80 + corpse.level * (kind === "tank" ? 24 : 16)),
      atk: Math.round(6 + corpse.level * (kind === "assassin" ? 5 : kind === "mage" ? 4.5 : 4)),
      def: Math.round(3 + corpse.level * (kind === "tank" ? 3 : 2)),
      x: this.s.x + (Math.random() - 0.5) * 42, y: this.s.y + 26, cooldown: 0, kind,
    };
    this.s.shadowArmy.push(shadow);
    for (let i = 0; i < 28; i++) { const a = Math.random() * Math.PI * 2; this.parts.push({ x: corpse.x, y: corpse.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: 0.65, color: "#8b5cf6", size: 3 + Math.random() * 2 }); }
    this.corpses = this.corpses.filter((x) => x.id !== corpseId);
    this.msg(`${shadow.name} foi adicionada ao Exército das Sombras!`, "#a78bfa");
    this.s.shadowsSummoned = true; writeSave(this.s); return true;
  }

  setShadowCommand(command: ShadowCommand) {
    this.s.shadowCommand = command;
    const names: Record<ShadowCommand, string> = { follow: "Seguir", attack: "Atacar", defend: "Defender", focus: "Focar alvo" };
    this.msg(`Comando do exército: ${names[command]}.`, "#a78bfa"); writeSave(this.s);
  }

  toggleShadows() {
    if (!this.s.shadowArmy.length) { this.msg("Seu exército ainda está vazio. Extraia uma sombra primeiro.", "#ff7777"); return; }
    this.s.shadowsSummoned = !this.s.shadowsSummoned;
    this.msg(this.s.shadowsSummoned ? "Exército das Sombras invocado!" : "Exército das Sombras recolhido.", "#a78bfa");
    writeSave(this.s);
  }

  private gainShadowXp(amount: number) {
    for (const shadow of this.s.shadowArmy) {
      shadow.xp += amount;
      while (shadow.xp >= shadow.level * 35) {
        shadow.xp -= shadow.level * 35; shadow.level++;
        shadow.maxHp += shadow.kind === "tank" ? 24 : 16; shadow.hp = shadow.maxHp;
        shadow.atk += shadow.kind === "assassin" ? 5 : 4; shadow.def += shadow.kind === "tank" ? 3 : 2;
        this.msg(`${shadow.name} evoluiu para o nível ${shadow.level}!`, "#a78bfa");
      }
    }
  }

  private updateShadows(dt: number) {
    if (!this.s.shadowsSummoned || this.map.interior) return;
    for (const shadow of this.s.shadowArmy) {
      shadow.cooldown = Math.max(0, shadow.cooldown - dt);
      let target: Enemy | null = null, best = Infinity;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        const d = Math.hypot(enemy.x - shadow.x, enemy.y - shadow.y);
        const fromPlayer = Math.hypot(enemy.x - this.s.x, enemy.y - this.s.y);
        const limit = this.s.shadowCommand === "defend" ? 90 : this.s.shadowCommand === "follow" ? 150 : this.s.shadowCommand === "focus" ? 520 : 420;
        if (fromPlayer > limit && this.s.shadowCommand !== "attack") continue;
        if (d < best) { best = d; target = enemy; }
      }
      if (this.s.shadowCommand === "focus") target = this.nearest(520);
      if (target) {
        const dx = target.x - shadow.x, dy = target.y - shadow.y, d = Math.hypot(dx, dy) || 1;
        const reach = shadow.kind === "mage" ? 92 : 28;
        if (d > reach) this.moveBody(shadow, dx / d * (shadow.kind === "assassin" ? 145 : 105) * dt, dy / d * (shadow.kind === "assassin" ? 145 : 105) * dt, 7);
        else if (shadow.cooldown <= 0) {
          shadow.cooldown = shadow.kind === "assassin" ? 0.55 : shadow.kind === "mage" ? 1.2 : 0.85;
          this.hitEnemy(target, shadow.atk * (shadow.kind === "elite" ? 1.35 : 1));
          if (shadow.kind === "mage") this.parts.push({ x: target.x, y: target.y, vx: 0, vy: -25, life: 0.35, color: "#a78bfa", size: 7 });
        }
      } else {
        const dx = this.s.x - shadow.x, dy = this.s.y - shadow.y, d = Math.hypot(dx, dy);
        if (d > 42) this.moveBody(shadow, dx / d * 115 * dt, dy / d * 115 * dt, 7);
      }
    }
  }

  punch() {
    this.chargingKi = false;
    if (this.cd.punch > 0) return; this.cd.punch = 0.35; this.punchT = 0.15;
    const e = this.nearest(48); if (e) { this.faceTo(e); this.hitEnemy(e, this.stats().atk); }
  }
  blast() {
    this.chargingKi = false;
    if (this.cd.blast > 0 || this.s.ki < 8) { if (this.s.ki < 8) this.msg("Mana insuficiente", "#7fd6ff"); return; }
    this.cd.blast = 0.3; this.s.ki -= 8; this.fire(this.stats().atk * 1.4, 380, 6, "#8b5cf6", false, 1);
  }
  kame() {
    this.chargingKi = false;
    if (this.cd.kame > 0 || this.s.ki < 35) { if (this.s.ki < 35) this.msg("Mana insuficiente para a habilidade", "#7fd6ff"); return; }
    this.cd.kame = 2.5; this.s.ki -= 35; this.fire(this.stats().atk * 3.5, 420, 14, "#a78bfa", true, 1.2);
  }
  private faceTo(e: Enemy) { const d = Math.hypot(e.x - this.s.x, e.y - this.s.y) || 1; this.facing = { x: (e.x - this.s.x) / d, y: (e.y - this.s.y) / d }; }
  private fire(dmg: number, speed: number, r: number, color: string, pierce: boolean, life: number) {
    const e = this.nearest(320); if (e) this.faceTo(e); this.punchT = 0.2;
    this.projs.push({ x: this.s.x, y: this.s.y, vx: this.facing.x * speed, vy: this.facing.y * speed, dmg, r, from: "p", life, color, pierce, hit: new Set() });
  }

  toggleForm(id: string) {
    this.chargingKi = false;
    const r = toggleForm(this.active, id, this.s.level, this.s.testMode);
    if (r.error) { this.msg(r.error, "#ff7777"); return; }
    const wasOn = this.active.includes(id); this.active = r.active;
    if (!this.active.length) this.strain = 0;
    const f = FORMS.find((f) => f.id === id)!;
    if (!wasOn) {
      for (let i = 0; i < 30; i++) { const a = Math.random() * 6.28; this.parts.push({ x: this.s.x, y: this.s.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, life: 0.5, color: f.aura, size: 3 }); }
      this.msg(this.active.length > 1 ? `Habilidade ativa: ${this.active.map((a) => FORMS.find((f) => f.id === a)!.name).join(" + ")}` : `${f.name} ativada!`, f.aura);
    }
  }
  setChargingKi(value: boolean) { this.chargingKi = value && !this.moving; }
  revert(reason?: string) { if (this.active.length) { this.active = []; this.strain = 0; if (reason) this.msg(reason, "#ff9955"); } }
  setTestMode(v: boolean) { this.s.testMode = v; if (!v) this.revert(); }

  train(stat: "str" | "def" | "hp" | "ki") {
    if (this.s.trainPoints <= 0) { this.msg("Você não tem pontos de status disponíveis", "#aaaaaa"); return; }
    this.s.train[stat]++; this.s.trainPoints--;
    const names = { str: "Força", def: "Defesa", hp: "Vida", ki: "Mana" };
    const st = this.stats(); this.s.hp = Math.min(this.s.hp, st.maxHp); this.s.ki = Math.min(this.s.ki, st.maxKi);
    this.msg(names[stat] + " +1 · Pontos restantes: " + this.s.trainPoints, "#9fe870");
  }

  phaseUpgradeCost() { return Math.round(1000 * Math.pow(2, this.s.phaseBoost)); }
  buyNextPhase() {
    if (!this.s.bossesDefeated.includes("Bellion")) { this.msg("Derrote Bellion para liberar a progressão de ameaça", "#ff7777"); return; }
    const cost = this.phaseUpgradeCost();
    if (this.s.gold < cost) { this.msg("Faltam " + (cost - this.s.gold) + "z", "#ff7777"); return; }
    this.s.gold -= cost; this.s.phaseBoost++;
    this.loadMap(this.map.interior ? "double-dungeon" : this.map.id);
    this.msg("Ameaça " + (this.s.phaseBoost + 1) + ": força dos monstros x" + Math.pow(2, this.s.phaseBoost) + " · XP x" + Math.pow(1.25, this.s.phaseBoost).toFixed(2), "#ffb020");
    writeSave(this.s);
  }

  buySenzu() {
    if (!this.map.interior) { this.msg("A Poção de Recuperação só pode ser comprada dentro da sua casa", "#ff7777"); return; }
    const cost = 250;
    if (this.s.gold < cost) { this.msg("Faltam " + (cost - this.s.gold) + "z", "#ff7777"); return; }
    this.s.gold -= cost; this.s.senzuBeans++; this.msg("Você comprou uma Poção de Recuperação!", "#9fe870");
  }
  useSenzu() {
    if (this.s.senzuBeans <= 0) { this.msg("Você não tem Poção de Recuperação", "#ff7777"); return; }
    const st = this.stats(); this.s.senzuBeans--; this.s.hp = st.maxHp; this.s.ki = st.maxKi;
    this.msg("Poção de Recuperação usada: Vida e Mana restaurada!", "#9fe870");
  }

  travel(mapId: string) {
    const def = getMapDef(mapId);
    if (this.s.level < def.level) { this.msg(`${def.name} requer nível ${def.level}`, "#ff7777"); return false; }
    this.loadMap(mapId); this.msg(`Viajou para ${def.name}`, "#ffb020"); writeSave(this.s); return true;
  }

  equip(uid: string) {
    const i = this.s.inventory.findIndex((x) => x.uid === uid); if (i < 0) return;
    const it = this.s.inventory[i]!; const old = this.s.equipped[it.slot];
    this.s.inventory.splice(i, 1); if (old) this.s.inventory.push(old); this.s.equipped[it.slot] = it;
  }
  unequip(slot: Slot) { const it = this.s.equipped[slot]; if (!it || this.s.inventory.length >= 30) return; delete this.s.equipped[slot]; this.s.inventory.push(it); }
  sell(uid: string) {
    const i = this.s.inventory.findIndex((x) => x.uid === uid); if (i < 0) return;
    const it = this.s.inventory.splice(i, 1)[0]!; this.s.gold += it.value; this.msg(`Vendeu ${it.name} por ${it.value}z`, "#ffd54f");
  }

  buyHouse(id: string) {
    const h = HOUSES.find((x) => x.id === id)!;
    if (this.s.houses[id]) return;
    if (this.s.level < h.level) { this.msg(`Requer nível ${h.level}`, "#ff7777"); return; }
    if (this.s.gold < h.price) { this.msg(`Faltam ${h.price - this.s.gold}z`, "#ff7777"); return; }
    this.s.gold -= h.price; this.s.houses[id] = { decor: [], chest: [] }; this.msg(`Você comprou: ${h.name}!`, "#9fe870"); writeSave(this.s);
  }
  enterHouse(id: string) { if (!this.s.houses[id]) return; this.loadMap("casa:" + id); }
  exitHouse() {
    const id = this.map.interior; const d = id && genMap("double-dungeon").doors.find((d) => d.houseId === id);
    this.loadMap("double-dungeon", d ? d.x * TILE + 16 : undefined, d ? (d.y + 1) * TILE + 16 : undefined);
  }
  get house() { return this.map.interior ? this.s.houses[this.map.interior] : undefined; }
  store(uid: string) {
    const h = this.house; const i = this.s.inventory.findIndex((x) => x.uid === uid); if (!h || i < 0) return;
    h.chest.push(...this.s.inventory.splice(i, 1));
  }
  take(uid: string) {
    const h = this.house; if (!h || this.s.inventory.length >= 30) return; const i = h.chest.findIndex((x) => x.uid === uid); if (i < 0) return;
    this.s.inventory.push(...h.chest.splice(i, 1));
  }
  buyDecor(type: string) {
    const h = this.house; const d = DECOR[type]; if (!h || !d) return;
    const tx = Math.floor(this.s.x / TILE), ty = Math.floor(this.s.y / TILE);
    if (tileAt(this.map, tx, ty) !== T.FLOOR || h.decor.some((o) => o.x === tx && o.y === ty)) { this.msg("Não dá para decorar aqui", "#ff7777"); return; }
    if (this.s.gold < d.price) { this.msg(`Faltam ${d.price - this.s.gold}z`, "#ff7777"); return; }
    this.s.gold -= d.price; h.decor.push({ type, x: tx, y: ty }); this.msg(`${d.name} colocado(a)!`, "#9fe870");
  }
  removeDecor() {
    const h = this.house; if (!h) return; const tx = Math.floor(this.s.x / TILE), ty = Math.floor(this.s.y / TILE);
    const i = h.decor.findIndex((o) => o.x === tx && o.y === ty); if (i < 0) { this.msg("Fique sobre a decoração para remover", "#aaaaaa"); return; }
    const o = h.decor.splice(i, 1)[0]!; this.s.gold += Math.floor((DECOR[o.type]?.price ?? 0) / 2);
  }
  save() { writeSave(this.s); }
}
