import Phaser from "phaser";
import type { Fighter, GameState, AllyId, Projectile } from "../types";
import { ALLY_SPECS } from "../config/units";
import { LANES, SLINGSHOT, FIELD_LIMITS, GAME_WIDTH, GAME_HEIGHT, CASTLE } from "../config/game";
import { updateBallPhysics, createBallState, isBallStopped, type BallState } from "./BallPhysics";
import { CombatSystem } from "./CombatSystem";
import { createFighter } from "../entities/FighterFactory";
import { landingBlast, exposureFlash, floatText } from "./Effects";

const BALL_RADIUS = 14;
const RUBBER_COLOR = 0xaa6633;
const RUBBER_WIDTH = 3;
const TRAJECTORY_COLOR = 0x4a9eff;
const TRAJECTORY_DOT_R = 3;
const TRAJECTORY_STEPS = 20;
const TRAJECTORY_DT_MS = 40;
const MAX_ANGLE = 70 * Math.PI / 180;

export class SlingshotSystem {
  private scene: Phaser.Scene;
  private gs: GameState;
  private combatSystem: CombatSystem | null = null;
  private ball!: Phaser.GameObjects.Container;
  private ballGraphic!: Phaser.GameObjects.Graphics;
  private rubberBand!: Phaser.GameObjects.Graphics;
  private trajectoryDots: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, gs: GameState) {
    this.scene = scene;
    this.gs = gs;

    this.ball = this.scene.add.container(LANES.slingX, LANES.slingY);
    this.ball.setVisible(false);
    this.ball.setDepth(50);

    this.ballGraphic = this.scene.add.graphics();
    this.ballGraphic.fillStyle(0x4a9eff, 1);
    this.ballGraphic.fillCircle(0, 0, BALL_RADIUS);
    this.ballGraphic.lineStyle(2, 0xffffff, 0.8);
    this.ballGraphic.strokeCircle(0, 0, BALL_RADIUS);
    this.ball.add(this.ballGraphic);

    this.rubberBand = this.scene.add.graphics();
    this.rubberBand.setDepth(49);

    for (let i = 0; i < TRAJECTORY_STEPS; i++) {
      const dot = this.scene.add.circle(0, 0, TRAJECTORY_DOT_R, TRAJECTORY_COLOR, 0.4);
      dot.setVisible(false);
      dot.setDepth(48);
      this.trajectoryDots.push(dot);
    }

    this.setupInput();
  }

  private setupInput(): void {
    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.gs.pendingCardId || !this.gs.dragging) return;
      this.handleDrag(pointer);
    });

    this.scene.input.on("pointerup", () => {
      if (!this.gs.pendingCardId || !this.gs.dragging) return;
      this.handleRelease();
    });
  }

  showBall(cardId: AllyId): void {
    this.gs.pendingCardId = cardId;
    this.gs.dragging = false;

    this.ball.setPosition(LANES.slingX, LANES.slingY);
    this.ball.setVisible(true);
    this.rubberBand.clear();
    this.hideTrajectory();
  }

  startDrag(pointer: Phaser.Input.Pointer): boolean {
    if (!this.gs.pendingCardId) return false;
    this.gs.dragging = true;
    return true;
  }

  private handleDrag(pointer: Phaser.Input.Pointer): void {
    let dx = pointer.x - LANES.slingX;
    let dy = pointer.y - LANES.slingY;

    const launchDx = -dx;
    const launchDy = -dy;
    const angle = Math.atan2(launchDx, -launchDy);
    if (Math.abs(angle) > MAX_ANGLE) {
      const clampedAngle = Math.sign(angle) * MAX_ANGLE;
      const pullDist = Math.sqrt(dx * dx + dy * dy);
      dx = -Math.sin(clampedAngle) * pullDist;
      dy = Math.cos(clampedAngle) * pullDist;
    }

    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > SLINGSHOT.pullMax) {
      dx = (dx / dist) * SLINGSHOT.pullMax;
      dy = (dy / dist) * SLINGSHOT.pullMax;
      dist = SLINGSHOT.pullMax;
    }

    let bx = LANES.slingX + dx;
    let by = LANES.slingY + dy;

    bx = Phaser.Math.Clamp(bx, 30, GAME_WIDTH - 30);
    by = Phaser.Math.Clamp(by, 30, GAME_HEIGHT - 30);

    this.ball.setPosition(bx, by);
    this.drawRubberBand(bx, by);

    if (dist >= SLINGSHOT.pullMin) {
      const launch = this.computeLaunchVelocity(bx, by);
      if (launch) {
        this.showTrajectory(bx, by, launch.vx, launch.vy);
      }
    } else {
      this.hideTrajectory();
    }
  }

  private handleRelease(): void {
    this.gs.dragging = false;
    this.rubberBand.clear();
    this.hideTrajectory();

    const bx = this.ball.x;
    const by = this.ball.y;
    const launch = this.computeLaunchVelocity(bx, by);

    if (!launch) {
      this.ball.setPosition(LANES.slingX, LANES.slingY);
      return;
    }

    const cardId = this.gs.pendingCardId!;

    // 创建投射物精灵
    const projSprite = this.scene.add.container(bx, by);
    projSprite.setDepth(50);
    const projGraphic = this.scene.add.graphics();
    projGraphic.fillStyle(0x4a9eff, 1);
    projGraphic.fillCircle(0, 0, BALL_RADIUS);
    projGraphic.lineStyle(2, 0xffffff, 0.8);
    projGraphic.strokeCircle(0, 0, BALL_RADIUS);
    projSprite.add(projGraphic);

    // 加入飞行队列
    this.gs.projectiles.push({
      sprite: projSprite,
      cardId,
      state: createBallState(bx, by, launch.vx, launch.vy),
    });

    // 弹射器立即重置，可以选下一张卡
    this.ball.setVisible(false);
    this.gs.pendingCardId = null;
  }

  private computeLaunchVelocity(
    ballX: number,
    ballY: number
  ): { vx: number; vy: number } | null {
    const dx = LANES.slingX - ballX;
    const dy = LANES.slingY - ballY;
    const pullDist = Math.sqrt(dx * dx + dy * dy);

    if (pullDist < SLINGSHOT.pullMin) return null;

    const clampedDist = Math.min(pullDist, SLINGSHOT.pullMax);
    const t = clampedDist / SLINGSHOT.pullMax;
    const v0 = SLINGSHOT.v0Min + (SLINGSHOT.v0Max - SLINGSHOT.v0Min) * t;
    const dirX = dx / pullDist;
    const dirY = dy / pullDist;
    return { vx: dirX * v0, vy: dirY * v0 };
  }

  update(dt: number): void {
    // 遍历所有飞行中的投射物
    for (let i = this.gs.projectiles.length - 1; i >= 0; i--) {
      const proj = this.gs.projectiles[i];
      proj.state = updateBallPhysics(proj.state, dt);
      proj.sprite.setPosition(proj.state.x, proj.state.y);

      const hitEnemy = this.findEnemyHit(proj.state.x, proj.state.y);
      if (hitEnemy) {
        this.landBall(proj, hitEnemy);
        continue;
      }

      if (isBallStopped(proj.state)) {
        this.landBall(proj, null);
      }
    }
  }

  private findEnemyHit(bx: number, by: number): Fighter | null {
    const hitRadius = BALL_RADIUS + 16;
    for (const enemy of this.gs.enemies) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Between(bx, by, enemy.x, enemy.y);
      if (d < hitRadius) return enemy;
    }
    return null;
  }

  private landBall(proj: Projectile, hitEnemy: Fighter | null): void {
    const cardId = proj.cardId;
    const x = proj.state.x;
    const y = proj.state.y;

    // 从飞行队列中移除
    const idx = this.gs.projectiles.indexOf(proj);
    if (idx !== -1) this.gs.projectiles.splice(idx, 1);

    exposureFlash(this.scene, x, y);

    // 投射物淡出
    this.scene.tweens.add({
      targets: proj.sprite,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        proj.sprite.destroy();

        const spec = ALLY_SPECS[cardId];
        const fighter = createFighter(this.scene, cardId, "ally", x, y, spec);
        fighter.launched = false;
        fighter.setAlpha(0);
        this.gs.allies.push(fighter);
        this.countSummon(cardId);

        this.scene.tweens.add({
          targets: fighter,
          alpha: 1,
          duration: 200,
        });

        if (hitEnemy) {
          const dmg = Math.round(spec.atk * SLINGSHOT.landingDamageMultiplier);
          landingBlast(this.scene, x, y, SLINGSHOT.landingRadius);
          this.applyLandingDamage(x, y, dmg);
        }

        floatText(this.scene, x, y - 20, spec.name, 0x4a9eff);
      }
    });
  }

  private applyLandingDamage(cx: number, cy: number, dmg: number): void {
    for (const enemy of this.gs.enemies) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, enemy.x, enemy.y);
      if (d <= SLINGSHOT.landingRadius) {
        let finalDmg = dmg;
        if (this.combatSystem) {
          finalDmg = this.combatSystem.applyDefensiveReductions(dmg, enemy, true);
        }
        enemy.hp -= finalDmg;
        floatText(this.scene, enemy.x, enemy.y - 20, `-${finalDmg}`, 0xff4444);
      }
    }
  }

  private countSummon(cardId: AllyId): void {
    const key = cardId as string;
    this.gs.summonCountsThisWave[key] = (this.gs.summonCountsThisWave[key] || 0) + 1;
  }

  private drawRubberBand(bx: number, by: number): void {
    this.rubberBand.clear();
    this.rubberBand.lineStyle(RUBBER_WIDTH, RUBBER_COLOR, 1);
    this.rubberBand.moveTo(LANES.slingX - 33, LANES.slingY - 2);
    this.rubberBand.lineTo(bx, by);
    this.rubberBand.lineTo(LANES.slingX + 33, LANES.slingY - 2);
    this.rubberBand.strokePath();
  }

  private showTrajectory(sx: number, sy: number, vx: number, vy: number): void {
    let state = createBallState(sx, sy, vx, vy);
    for (let i = 0; i < this.trajectoryDots.length; i++) {
      state = updateBallPhysics(state, TRAJECTORY_DT_MS);
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      if (speed < 15) {
        this.trajectoryDots[i].setVisible(false);
        continue;
      }
      this.trajectoryDots[i].setPosition(state.x, state.y);
      this.trajectoryDots[i].setVisible(true);
      this.trajectoryDots[i].setAlpha(0.6 - (i / TRAJECTORY_STEPS) * 0.4);
    }
  }

  private hideTrajectory(): void {
    for (const dot of this.trajectoryDots) {
      dot.setVisible(false);
    }
  }

  setCombatSystem(cs: CombatSystem): void {
    this.combatSystem = cs;
  }

  cancelPending(): void {
    if (this.gs.pendingCardId) {
      const spec = ALLY_SPECS[this.gs.pendingCardId];
      if (spec) {
        this.gs.stamina += spec.staminaCost;
      }
    }
    this.gs.pendingCardId = null;
    this.gs.dragging = false;
    this.ball.setVisible(false);
    this.rubberBand.clear();
    this.hideTrajectory();
  }
}
