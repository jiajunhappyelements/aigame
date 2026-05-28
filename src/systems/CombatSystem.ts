import Phaser from "phaser";
import type { Fighter, GameState } from "../types";
import { ALLY_SPECS } from "../config/units";
import { CASTLE, GAME_WIDTH } from "../config/game";
import { impact, floatText, frostEffect, burnEffect, healEffect, auraEffect, coinBounty } from "./Effects";
import { playFighterAttackAnimation } from "../render/animations";

const CRIT_CHANCE = 0.05;
const CRIT_MULT = 1.5;
const CASTLE_ATTACK_LINE = CASTLE.y - 35;

export class CombatSystem {
  private scene: Phaser.Scene;
  private gs: GameState;
  private healTimers: Map<string, number> = new Map();
  private auraTimers: Map<string, number> = new Map();

  constructor(scene: Phaser.Scene, gs: GameState) {
    this.scene = scene;
    this.gs = gs;
  }

  update(dt: number, now: number): void {
    this.processAllies(dt, now);
    this.processEnemies(dt, now);
    this.processBuffs(dt, now);
    this.processHealAuras(dt);
    this.processAuras(dt);
    this.checkDeaths();
  }

  private processAllies(dt: number, now: number): void {
    for (const ally of this.gs.allies) {
      if (!ally.active) continue;
      const target = this.findAllyTarget(ally);
      if (!target) {
        ally.attackTimer = Math.max(0, ally.attackTimer - dt);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(ally.x, ally.y, target.x, target.y);
      if (dist > ally.range) {
        this.moveToward(ally, target.x, target.y, dt, now);
        ally.attackTimer = 0;
      } else {
        ally.attackTimer -= dt;
        if (ally.attackTimer <= 0) {
          this.allyAttack(ally, target, now);
          ally.attackTimer = ally.attackCd;
        }
      }
    }
  }

  private processEnemies(dt: number, now: number): void {
    for (const enemy of this.gs.enemies) {
      if (!enemy.active) continue;
      let allyTarget = this.findEnemyTarget(enemy);
      if (allyTarget && allyTarget.y > enemy.y && enemy.y >= CASTLE_ATTACK_LINE) {
        allyTarget = null;
      }
      if (allyTarget) {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, allyTarget.x, allyTarget.y);
        if (dist > enemy.range) {
          this.moveToward(enemy, allyTarget.x, allyTarget.y, dt, now);
          enemy.attackTimer = 0;
        } else {
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0) {
            this.enemyAttack(enemy, allyTarget, now);
            enemy.attackTimer = enemy.attackCd;
          }
        }
      } else {
        // No ally target: move toward castle or attack it
        if (enemy.y < CASTLE_ATTACK_LINE) {
          this.moveToward(enemy, enemy.x, CASTLE_ATTACK_LINE, dt, now);
          enemy.attackTimer = 0;
        } else {
          // At castle: attack it periodically
          enemy.attackTimer -= dt;
          if (enemy.attackTimer <= 0) {
            this.enemyAttackCastle(enemy);
            enemy.attackTimer = enemy.attackCd;
          }
        }
      }
    }
  }

  private findAllyTarget(ally: Fighter): Fighter | null {
    const activeEnemies = this.gs.enemies.filter(e => e.active);
    if (activeEnemies.length === 0) return null;

    if (ally.targeting === "nearestFlying") {
      const flying = activeEnemies.filter(e => e.moveMode === "flying");
      if (flying.length > 0) return this.nearest(ally, flying);
      return this.nearest(ally, activeEnemies);
    }

    if (ally.moveMode === "flying") {
      const flying = activeEnemies.filter(e => e.moveMode === "flying");
      const ground = activeEnemies.filter(e => e.moveMode === "ground");
      if (ground.length > 0 && flying.length > 0) return this.nearest(ally, activeEnemies);
      if (ground.length > 0) return this.nearest(ally, ground);
      if (flying.length > 0) return this.nearest(ally, flying);
      return null;
    }

    const nonFlying = activeEnemies.filter(e => e.moveMode !== "flying");
    if (nonFlying.length > 0) {
      if (ally.targeting === "lowestHp") {
        return nonFlying.reduce((a, b) => a.hp < b.hp ? a : b);
      }
      return this.nearest(ally, nonFlying);
    }

    if (ally.targeting === "lowestHp") {
      return activeEnemies.reduce((a, b) => a.hp < b.hp ? a : b);
    }
    return this.nearest(ally, activeEnemies);
  }

  private findEnemyTarget(enemy: Fighter): Fighter | null {
    const activeAllies = this.gs.allies.filter(a => a.active);
    if (activeAllies.length === 0) return null;

    if (enemy.moveMode === "flying") {
      return this.nearest(enemy, activeAllies);
    }

    const nonFlying = activeAllies.filter(a => a.moveMode !== "flying");
    if (nonFlying.length > 0) return this.nearest(enemy, nonFlying);
    return this.nearest(enemy, activeAllies);
  }

  private nearest(fighter: Fighter, candidates: Fighter[]): Fighter {
    let best = candidates[0];
    let bestDist = Infinity;
    for (const c of candidates) {
      const d = Phaser.Math.Distance.Between(fighter.x, fighter.y, c.x, c.y);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  }

  private moveToward(fighter: Fighter, tx: number, ty: number, dt: number, now: number): void {
    let speed = fighter.speed;
    if (fighter.traits?.includes("swift")) speed *= 1.5;
    const slowUntil = fighter.slowUntil ?? 0;
    const slowPct = fighter.slowPercent ?? 0;
    if (slowUntil > 0 && now < slowUntil) {
      speed *= (1 - slowPct);
    }
    const dx = tx - fighter.x;
    const dy = ty - fighter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) {
      fighter.x = tx;
      fighter.y = ty;
      const body = fighter.body as Phaser.Physics.Arcade.Body | undefined;
      if (body) body.reset(fighter.x, fighter.y);
      return;
    }
    const step = speed * (dt / 1000);
    const moveX = (dx / dist) * Math.min(step, dist);
    const moveY = (dy / dist) * Math.min(step, dist);
    fighter.x += moveX;
    fighter.y += moveY;
    const body = fighter.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.reset(fighter.x, fighter.y);
  }

  private allyAttack(ally: Fighter, target: Fighter, now: number): void {
    playFighterAttackAnimation(ally);
    let dmg = ally.atk * this.gs.unitDamageMultiplier;
    const spec = ALLY_SPECS[ally.id as keyof typeof ALLY_SPECS];
    if (spec) {
      dmg = this.applySkillBonus(ally, target, dmg, spec, now);
    }
    if (Math.random() < CRIT_CHANCE) {
      dmg = Math.round(dmg * CRIT_MULT);
      floatText(this.scene, target.x, target.y - 30, "暴击!", 0xffdd00);
    }
    dmg = this.applyDefensiveReductions(dmg, target, true);
    target.hp -= dmg;
    impact(this.scene, target.x, target.y);
    floatText(this.scene, target.x, target.y - 20, `-${dmg}`, 0x4af06a);
  }

  private enemyAttack(enemy: Fighter, target: Fighter, now: number): void {
    playFighterAttackAnimation(enemy);
    let dmg = enemy.atk;
    if (this.hasCommandBuff()) dmg = Math.round(dmg * 1.1);
    dmg = this.applyDefensiveReductions(dmg, target, false);
    target.hp -= dmg;
    impact(this.scene, target.x, target.y);
    floatText(this.scene, target.x, target.y - 20, `-${dmg}`, 0xff5b4f);

    if (enemy.traits?.includes("dragonAura")) {
      this.applyDragonAuraSplash(target, dmg);
    }
  }

  applyDefensiveReductions(dmg: number, target: Fighter, attackerIsAlly: boolean): number {
    let result = dmg;
    if (target.traits?.includes("heavy")) {
      result = Math.round(result * (1 - this.getHeavyReduction(target)));
    }
    const knightRed = this.getKnightReduction(target);
    if (knightRed > 0) result = Math.round(result * (1 - knightRed));
    if (!attackerIsAlly && target.team === "ally") {
      const guardianRed = this.getGuardianReductionForAlly(target);
      if (guardianRed > 0) result = Math.round(result * (1 - guardianRed));
    }
    return result;
  }

  private applySkillBonus(ally: Fighter, target: Fighter, baseDmg: number, spec: typeof ALLY_SPECS[keyof typeof ALLY_SPECS], now: number): number {
    let dmg = baseDmg;
    const lv = ally.skill1Level;

    if (spec.skill1 && lv > 0) {
      switch (spec.id) {
        case "A01": dmg = Math.round(dmg * (1 + [0, 0.2, 0.35, 0.5][lv])); break;
        case "A02": this.applySplashWithReduction(target, Math.round(dmg * [0, 0.6, 0.75, 0.9][lv])); break;
        case "A03": {
          const aoeDmg = Math.round(dmg * [0, 0.7, 0.85, 1.0][lv]);
          this.applyAoeWithReduction(target.x, target.y, 1.2 * 96, aoeDmg);
          break;
        }
        case "A05":
          if (target.moveMode === "flying") dmg = Math.round(dmg * (1 + [0, 0.25, 0.45, 0.65][lv]));
          break;
        case "A06":
          if (Math.random() < [0, 0.15, 0.25, 0.4][lv]) {
            dmg = Math.round(dmg * CRIT_MULT);
            floatText(this.scene, target.x, target.y - 30, "精准!", 0x00ff88);
          }
          break;
        case "A08": {
          const meteorDmg = Math.round(dmg * [0, 0.8, 0.95, 1.1][lv]);
          this.applyAoeWithReduction(target.x, target.y, 1.5 * 96, meteorDmg);
          break;
        }
        case "A09": {
          const breathDmg = Math.round(dmg * [0, 0.75, 0.9, 1.1][lv]);
          this.applyAoeWithReduction(target.x, target.y, 1.5 * 96, breathDmg);
          break;
        }
      }
    }

    const lv2 = ally.skill2Level;
    if (spec.skill2 && lv2 > 0) {
      switch (spec.id) {
        case "A03":
          target.slowUntil = now + 1500;
          target.slowPercent = [0, 0.3, 0.45, 0.6][lv2];
          frostEffect(this.scene, target.x, target.y);
          break;
        case "A08":
          target.burnUntil = now + 3000;
          target.burnDps = Math.round(spec.atk * [0, 0.08, 0.12, 0.18][lv2]);
          burnEffect(this.scene, target.x, target.y);
          break;
      }
    }

    return dmg;
  }

  private applySplashWithReduction(target: Fighter, splashDmg: number): void {
    for (const enemy of this.gs.enemies) {
      if (enemy === target || !enemy.active) continue;
      const d = Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y);
      if (d < 96) {
        const reduced = this.applyDefensiveReductions(splashDmg, enemy, true);
        enemy.hp -= reduced;
        floatText(this.scene, enemy.x, enemy.y - 20, `-${reduced}`, 0xffaa00);
      }
    }
  }

  private applyAoeWithReduction(cx: number, cy: number, radius: number, dmg: number): void {
    for (const enemy of this.gs.enemies) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
      if (d < radius) {
        const reduced = this.applyDefensiveReductions(dmg, enemy, true);
        enemy.hp -= reduced;
        floatText(this.scene, enemy.x, enemy.y - 20, `-${reduced}`, 0xff8800);
      }
    }
  }

  private applyDragonAuraSplash(target: Fighter, baseDmg: number): void {
    const splashDmg = Math.round(baseDmg * 0.35);
    for (const ally of this.gs.allies) {
      if (ally === target || !ally.active) continue;
      const d = Phaser.Math.Distance.Between(target.x, target.y, ally.x, ally.y);
      if (d < 96) {
        const reduced = this.applyDefensiveReductions(splashDmg, ally, false);
        ally.hp -= reduced;
        floatText(this.scene, ally.x, ally.y - 20, `-${reduced}`, 0xff5b4f);
      }
    }
  }

  private getHeavyReduction(fighter: Fighter): number {
    if (!fighter.traits?.includes("heavy")) return 0;
    if (fighter.id === "E03") return 0.15;
    if (fighter.id === "E08") return 0.20;
    if (fighter.id === "E10") return 0.25;
    return 0.15;
  }

  private getKnightReduction(fighter: Fighter): number {
    if (fighter.id !== "A04" || fighter.skill1Level <= 0) return 0;
    return [0, 0.15, 0.25, 0.35][fighter.skill1Level];
  }

  private getGuardianReductionForAlly(fighter: Fighter): number {
    const pegasusAllies = this.gs.allies.filter(a => a.active && a.id === "A07" && a.skill1Level > 0);
    if (pegasusAllies.length === 0) return 0;
    let maxReduction = 0;
    for (const p of pegasusAllies) {
      const d = Phaser.Math.Distance.Between(fighter.x, fighter.y, p.x, p.y);
      if (d < 1.5 * 96) {
        const red = [0, 0.10, 0.18, 0.28][p.skill1Level];
        maxReduction = Math.max(maxReduction, red);
      }
    }
    return maxReduction;
  }

  private hasCommandBuff(): boolean {
    return this.gs.enemies.some(e => e.active && e.traits?.includes("command"));
  }

  private processBuffs(dt: number, now: number): void {
    const all = [...this.gs.allies, ...this.gs.enemies];
    for (const f of all) {
      if (!f.active) continue;
      const slowUntil = f.slowUntil ?? 0;
      if (slowUntil > 0 && now >= slowUntil) {
        f.slowUntil = 0;
        f.slowPercent = 0;
      }
      const burnUntil = f.burnUntil ?? 0;
      const burnDps = f.burnDps ?? 0;
      if (burnUntil > 0 && now < burnUntil && burnDps > 0) {
        const tick = burnDps * (dt / 1000);
        f.hp -= tick;
      }
      if (burnUntil > 0 && now >= burnUntil) {
        f.burnUntil = 0;
        f.burnDps = 0;
      }
    }
  }

  private processHealAuras(dt: number): void {
    for (let i = 0; i < this.gs.allies.length; i++) {
      const ally = this.gs.allies[i];
      if (!ally.active || ally.id !== "A10" || ally.skill1Level <= 0) continue;
      const key = "heal_" + i;
      if (!this.healTimers.has(key)) this.healTimers.set(key, 0);
      const timer = (this.healTimers.get(key) ?? 0) + dt;
      this.healTimers.set(key, timer);

      if (timer >= 2000) {
        this.healTimers.set(key, 0);
        const spec = ALLY_SPECS["A10"];
        const healPct = [0, 0.2, 0.35, 0.5][ally.skill1Level];
        const healAmt = Math.round(spec.atk * healPct);

        let lowestAlly: Fighter | null = null;
        let lowestHp = Infinity;
        for (const a of this.gs.allies) {
          if (!a.active) continue;
          const d = Phaser.Math.Distance.Between(ally.x, ally.y, a.x, a.y);
          if (d < 288 && a.hp < a.maxHp && a.hp < lowestHp) {
            lowestHp = a.hp;
            lowestAlly = a;
          }
        }
        if (lowestAlly) {
          lowestAlly.hp = Math.min(lowestAlly.maxHp, lowestAlly.hp + healAmt);
          healEffect(this.scene, lowestAlly.x, lowestAlly.y);
          floatText(this.scene, lowestAlly.x, lowestAlly.y - 20, `+${healAmt}`, 0x44ff88);
        }
      }
    }
  }

  private processAuras(dt: number): void {
    for (let i = 0; i < this.gs.allies.length; i++) {
      const ally = this.gs.allies[i];
      if (!ally.active || ally.id !== "A07" || ally.skill1Level <= 0) continue;
      const key = "aura_" + i;
      if (!this.auraTimers.has(key)) this.auraTimers.set(key, 0);
      const timer = (this.auraTimers.get(key) ?? 0) + dt;
      this.auraTimers.set(key, timer);
      if (timer >= 800) {
        this.auraTimers.set(key, 0);
        auraEffect(this.scene, ally.x, ally.y, 0xffffff);
      }
    }
  }

  private checkDeaths(): void {
    for (let i = this.gs.enemies.length - 1; i >= 0; i--) {
      const e = this.gs.enemies[i];
      if (e.hp <= 0 && e.active) {
        const bounty = Math.round((e.bounty ?? 0) * this.gs.bountyMultiplier);
        this.gs.gold += bounty;
        if (bounty > 0) coinBounty(this.scene, e.x, e.y, bounty);
        e.destroy();
        this.gs.enemies.splice(i, 1);
      }
    }
    for (let i = this.gs.allies.length - 1; i >= 0; i--) {
      const a = this.gs.allies[i];
      if (a.hp <= 0 && a.active) {
        a.destroy();
        this.gs.allies.splice(i, 1);
      }
    }
  }

  private enemyAttackCastle(enemy: Fighter): void {
    let dmg = enemy.atk;
    if (enemy.traits?.includes("siege")) dmg = Math.round(dmg * 2);
    if (this.hasCommandBuff()) dmg = Math.round(dmg * 1.1);
    this.gs.castleHp -= dmg;
    impact(this.scene, enemy.x, CASTLE.y - 10);
    floatText(this.scene, enemy.x, CASTLE.y - 30, `基地-${dmg}`, 0xff3333);
  }
}
