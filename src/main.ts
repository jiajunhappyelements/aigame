import Phaser from "phaser";
import "./style.css";

const WIDTH = 540;
const HEIGHT = 960;
const WALL_Y = 788;
const SUMMON_Y = 846;
const SLING_X = WIDTH / 2;
const SLING_Y = 826;
const BASE_SUMMON_COST = 10;
const BASE_UPGRADE_COST = 100;

type UnitKind = "slinger" | "archer" | "mage";
type EnemyKind = "goblin" | "ogre";

type Fighter = Phaser.GameObjects.Container & {
  kind: UnitKind | EnemyKind;
  team: "ally" | "enemy";
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  speed: number;
  attackCd: number;
  attackTimer: number;
  launched?: boolean;
  target?: Fighter;
  slowUntil?: number;
  bounty?: number;
};

type UnitSpec = {
  kind: UnitKind;
  name: string;
  cost: number;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  texture: string;
  tint: number;
};

type EnemySpec = {
  kind: EnemyKind;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  bounty: number;
  texture: string;
  scale: number;
};

type Upgrade = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  apply: () => void;
};

const UNIT_SPECS: Record<UnitKind, UnitSpec> = {
  slinger: {
    kind: "slinger",
    name: "弹弓兵",
    cost: 35,
    hp: 90,
    damage: 20,
    range: 44,
    speed: 78,
    texture: "unit-slinger",
    tint: 0xff6f48
  },
  archer: {
    kind: "archer",
    name: "弓箭手",
    cost: 55,
    hp: 70,
    damage: 18,
    range: 150,
    speed: 58,
    texture: "unit-archer",
    tint: 0x78d47d
  },
  mage: {
    kind: "mage",
    name: "冰法师",
    cost: 75,
    hp: 60,
    damage: 14,
    range: 128,
    speed: 48,
    texture: "unit-mage",
    tint: 0x76dfff
  }
};

const ENEMY_SPECS: Record<EnemyKind, EnemySpec> = {
  goblin: {
    kind: "goblin",
    hp: 55,
    damage: 8,
    range: 34,
    speed: 34,
    bounty: 18,
    texture: "enemy-goblin",
    scale: 0.18
  },
  ogre: {
    kind: "ogre",
    hp: 180,
    damage: 20,
    range: 44,
    speed: 20,
    bounty: 55,
    texture: "enemy-ogre",
    scale: 0.2
  }
};

const SPRITES = [
  { key: "enemy-goblin", x: 85, y: 150, w: 310, h: 330 },
  { key: "enemy-ogre", x: 590, y: 32, w: 520, h: 465 },
  { key: "unit-slinger", x: 105, y: 560, w: 300, h: 330 },
  { key: "unit-archer", x: 465, y: 555, w: 330, h: 320 },
  { key: "unit-mage", x: 820, y: 550, w: 360, h: 335 },
  { key: "coin", x: 82, y: 945, w: 260, h: 260 },
  { key: "wall", x: 420, y: 940, w: 380, h: 265 },
  { key: "impact", x: 850, y: 930, w: 340, h: 300 }
];

class GameScene extends Phaser.Scene {
  private gold = 100;
  private castleHp = 600;
  private wave = 1;
  private waveTime = 0;
  private spawnTimer = 1400;
  private allies: Fighter[] = [];
  private enemies: Fighter[] = [];
  private actionButtons: Phaser.GameObjects.Container[] = [];
  private pending?: Fighter;
  private dragging = false;
  private modalOpen = false;
  private aimLine!: Phaser.GameObjects.Graphics;
  private hudText!: Phaser.GameObjects.Text;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private waveText!: Phaser.GameObjects.Text;
  private launchHint!: Phaser.GameObjects.Text;
  private summonBag: UnitKind[] = [];
  private summonCost = BASE_SUMMON_COST;
  private upgradeCost = BASE_UPGRADE_COST;
  private unitDamageMultiplier: Record<UnitKind, number> = { slinger: 1, archer: 1, mage: 1 };
  private hpMultiplier = 1;
  private archerRangeMultiplier = 1;
  private mageFreezeMs = 1500;
  private bountyMultiplier = 1;
  private launchImpactDamage = 0;

  preload() {
    this.load.image("ai-sprite-sheet", "/assets/ai-sprite-sheet-keyed.png");
  }

  create() {
    this.makeSpriteTextures();
    this.createBackdrop();
    this.createHud();
    this.createActionButtons();
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  update(_time: number, delta: number) {
    if (this.modalOpen) {
      this.updateHud();
      return;
    }
    this.waveTime += delta;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(620, 1650 - this.wave * 70);
    }
    if (this.waveTime > 26000) {
      this.wave += 1;
      this.waveTime = 0;
      this.gold += 40;
      this.floatText(WIDTH / 2, 180, `第 ${this.wave} 波 +40`, "#fff7aa");
    }
    this.updateFighters(delta);
    this.updateHud();
  }

  private makeSpriteTextures() {
    const source = this.textures.get("ai-sprite-sheet").getSourceImage() as HTMLImageElement;
    for (const sprite of SPRITES) {
      const canvas = document.createElement("canvas");
      canvas.width = sprite.w;
      canvas.height = sprite.h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) continue;
      ctx.drawImage(source, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);
      const img = ctx.getImageData(0, 0, sprite.w, sprite.h);
      for (let i = 0; i < img.data.length; i += 4) {
        const r = img.data[i];
        const g = img.data[i + 1];
        const b = img.data[i + 2];
        if (r > 210 && g < 65 && b > 210) img.data[i + 3] = 0;
      }
      ctx.putImageData(img, 0, 0);
      this.textures.addCanvas(sprite.key, canvas);
    }
  }

  private createBackdrop() {
    this.cameras.main.setBackgroundColor("#20364a");
    const g = this.add.graphics();
    g.fillStyle(0x283f54, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x6d7f82, 1).fillRoundedRect(54, 118, WIDTH - 108, 650, 72);
    g.fillStyle(0x87918c, 1).fillRoundedRect(82, 145, WIDTH - 164, 595, 48);
    for (let y = 165; y < 720; y += 72) {
      g.lineStyle(2, 0x707b79, 0.32).lineBetween(105, y, WIDTH - 105, y + 8);
    }
    for (let x = 126; x < WIDTH - 100; x += 74) {
      g.lineStyle(2, 0x707b79, 0.25).lineBetween(x, 160, x - 12, 722);
    }
    this.add.image(WIDTH / 2, WALL_Y + 8, "wall").setDisplaySize(410, 120);
    this.add.rectangle(WIDTH / 2, WALL_Y + 72, WIDTH, 110, 0x2b3542, 0.84);
    this.add.circle(SLING_X - 33, SLING_Y - 2, 7, 0xd7b27c);
    this.add.circle(SLING_X + 33, SLING_Y - 2, 7, 0xd7b27c);
    this.add.line(SLING_X, SLING_Y, -31, 0, 0, 28, 0xc9965a, 1).setLineWidth(8);
    this.add.line(SLING_X, SLING_Y, 31, 0, 0, 28, 0xc9965a, 1).setLineWidth(8);
    this.aimLine = this.add.graphics();
  }

  private createHud() {
    this.hudText = this.add.text(20, 18, "", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#173040",
      strokeThickness: 5
    });
    this.waveText = this.add.text(WIDTH / 2, 34, "", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#f5fbff",
      stroke: "#173040",
      strokeThickness: 6
    }).setOrigin(0.5);
    this.add.rectangle(WIDTH / 2, HEIGHT - 28, WIDTH - 70, 20, 0x142028, 1).setStrokeStyle(3, 0x314958);
    this.hpBar = this.add.rectangle(36, HEIGHT - 28, WIDTH - 72, 14, 0x41df56, 1).setOrigin(0, 0.5);
    this.launchHint = this.add.text(WIDTH / 2, 736, "点右下角召唤，再拖拽士兵发射到战场", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#e9fbff",
      stroke: "#173040",
      strokeThickness: 5
    }).setOrigin(0.5);
  }

  private createActionButtons() {
    const upgradeButton = this.createActionButton(118, 900, "强化", this.upgradeCost.toString(), "coin", () => {
      this.tryOpenUpgradeModal();
    });
    const summonButton = this.createActionButton(422, 900, "召唤", this.summonCost.toString(), "unit-slinger", () => {
      this.summonRandomUnit();
    });
    this.actionButtons.push(upgradeButton, summonButton);
  }

  private createActionButton(
    x: number,
    y: number,
    title: string,
    cost: string,
    iconKey: string,
    onClick: () => void
  ) {
    const button = this.add.container(x, y);
    button.setSize(150, 82);
    button.setInteractive(new Phaser.Geom.Rectangle(-75, -41, 150, 82), Phaser.Geom.Rectangle.Contains);
    button.on("pointerdown", onClick);
    const bg = this.add.rectangle(0, 0, 150, 82, 0x3b4f56, 1).setStrokeStyle(4, 0xbea479);
    const icon = this.add.image(-42, -5, iconKey).setDisplaySize(48, 48);
    const label = this.add.text(8, -24, title, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#f6f1c7",
      stroke: "#342814",
      strokeThickness: 5
    });
    const costText = this.add.text(16, 10, cost, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#342814",
      strokeThickness: 5
    });
    costText.name = "cost";
    button.add([bg, icon, label, costText]);
    return button;
  }

  private summonRandomUnit() {
    if (this.modalOpen) return;
    if (this.pending) {
      this.floatText(WIDTH / 2, SUMMON_Y - 70, "先把当前士兵射出去", "#ffdf9a");
      return;
    }
    if (this.gold < this.summonCost) {
      this.floatText(WIDTH / 2, SUMMON_Y - 70, "金币不足", "#ffb3a7");
      return;
    }
    this.gold -= this.summonCost;
    this.prepareUnit(this.drawUnitKind());
  }

  private drawUnitKind() {
    if (this.summonBag.length === 0) {
      this.summonBag = Phaser.Utils.Array.Shuffle<UnitKind>(["slinger", "archer", "mage"]);
    }
    return this.summonBag.pop() ?? "slinger";
  }

  private prepareUnit(kind: UnitKind) {
    const spec = UNIT_SPECS[kind];
    const unit = this.createFighter(SLING_X, SUMMON_Y - 42, spec.texture, kind, "ally", spec);
    unit.setDepth(20);
    unit.launched = false;
    this.pending = unit;
    this.floatText(SLING_X, SUMMON_Y - 105, `${spec.name} 准备`, "#d8fbff");
  }

  private createFighter(
    x: number,
    y: number,
    texture: string,
    kind: UnitKind | EnemyKind,
    team: "ally" | "enemy",
    spec: UnitSpec | EnemySpec
  ): Fighter {
    const bodyScale = team === "ally" ? 0.2 : (spec as EnemySpec).scale;
    const container = this.add.container(x, y) as Fighter;
    const shadow = this.add.ellipse(0, 34, 46, 16, 0x0e1b20, 0.28);
    const img = this.add.image(0, 0, texture).setScale(bodyScale);
    const hpBg = this.add.rectangle(0, -42, 44, 5, 0x211d22, 0.9);
    const hpFg = this.add.rectangle(-22, -42, 44, 5, team === "ally" ? 0x4af06a : 0xff5b4f, 1).setOrigin(0, 0.5);
    hpFg.name = "hp";
    container.add([shadow, img, hpBg, hpFg]);
    container.kind = kind;
    container.team = team;
    const hp = team === "ally" ? spec.hp * this.hpMultiplier : spec.hp;
    container.hp = hp;
    container.maxHp = hp;
    container.damage = team === "ally" ? spec.damage * this.unitDamageMultiplier[kind as UnitKind] : spec.damage;
    container.range = kind === "archer" ? spec.range * this.archerRangeMultiplier : spec.range;
    container.speed = spec.speed;
    container.attackCd = team === "ally" ? 760 : 980;
    container.attackTimer = Phaser.Math.Between(0, 400);
    if (team === "enemy") container.bounty = (spec as EnemySpec).bounty;
    this.physics.add.existing(container);
    const body = container.body as Phaser.Physics.Arcade.Body;
    body.setCircle(22, -22, 12);
    body.setCollideWorldBounds(false);
    if (team === "ally") this.allies.push(container);
    else this.enemies.push(container);
    return container;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.modalOpen) return;
    if (!this.pending) return;
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.pending.x, this.pending.y) < 90) {
      this.dragging = true;
      this.pending.setPosition(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.dragging || !this.pending) return;
    const clampedX = Phaser.Math.Clamp(pointer.x, 70, WIDTH - 70);
    const clampedY = Phaser.Math.Clamp(pointer.y, 640, 900);
    this.pending.setPosition(clampedX, clampedY);
    this.drawAim(clampedX, clampedY);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.dragging || !this.pending) return;
    const unit = this.pending;
    const pullX = SLING_X - pointer.x;
    const pullY = SLING_Y - pointer.y;
    const body = unit.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Phaser.Math.Clamp(pullX * 3.7, -620, 620),
      Phaser.Math.Clamp(pullY * 3.3, -820, -160)
    );
    body.setDrag(0, 260);
    unit.launched = true;
    this.pending = undefined;
    this.dragging = false;
    this.aimLine.clear();
    this.launchHint.setVisible(false);
    this.time.delayedCall(850, () => {
      if (!unit.active) return;
      const landY = Phaser.Math.Clamp(unit.y, 190, WALL_Y - 70);
      unit.setPosition(Phaser.Math.Clamp(unit.x, 64, WIDTH - 64), landY);
      body.setVelocity(0, 0);
      body.setDrag(0, 0);
      this.applyLandingImpact(unit);
    });
  }

  private applyLandingImpact(unit: Fighter) {
    if (this.launchImpactDamage <= 0) return;
    const blast = this.add.circle(unit.x, unit.y, 48, 0xffd36a, 0.22).setDepth(17);
    this.tweens.add({
      targets: blast,
      scale: 1.8,
      alpha: 0,
      duration: 260,
      onComplete: () => blast.destroy()
    });
    for (const enemy of [...this.enemies]) {
      if (!enemy.active) continue;
      if (Phaser.Math.Distance.Between(unit.x, unit.y, enemy.x, enemy.y) <= 95) {
        this.applyDamage(enemy, this.launchImpactDamage);
      }
    }
  }

  private drawAim(x: number, y: number) {
    const vx = Phaser.Math.Clamp((SLING_X - x) * 3.7, -620, 620);
    const vy = Phaser.Math.Clamp((SLING_Y - y) * 3.3, -820, -160);
    this.aimLine.clear();
    this.aimLine.lineStyle(4, 0xfff2a5, 0.9);
    let px = x;
    let py = y;
    for (let i = 1; i < 15; i += 1) {
      const t = i / 9;
      const nx = x + vx * t * 0.16;
      const ny = y + vy * t * 0.16 + 420 * t * t * 0.16;
      this.aimLine.lineBetween(px, py, nx, ny);
      px = nx;
      py = ny;
    }
  }

  private spawnEnemy() {
    const kind: EnemyKind = this.wave > 2 && Math.random() < 0.24 ? "ogre" : "goblin";
    const spec = ENEMY_SPECS[kind];
    const x = Phaser.Math.Between(90, WIDTH - 90);
    this.createFighter(x, -60, spec.texture, kind, "enemy", spec).setDepth(8);
  }

  private updateFighters(delta: number) {
    for (const enemy of [...this.enemies]) {
      if (!enemy.active) continue;
      enemy.attackTimer -= delta;
      const target = this.nearest(enemy, this.allies);
      if (target && Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) <= enemy.range) {
        this.attack(enemy, target);
      } else if (enemy.y >= WALL_Y - 10) {
        this.damageCastle(enemy.damage * delta * 0.001);
      } else {
        const slow = enemy.slowUntil && enemy.slowUntil > this.time.now ? 0.42 : 1;
        enemy.y += enemy.speed * slow * delta * 0.001;
      }
    }

    for (const ally of [...this.allies]) {
      if (!ally.active || !ally.launched || this.pending === ally) continue;
      ally.attackTimer -= delta;
      const target = this.nearest(ally, this.enemies);
      if (!target) continue;
      const dist = Phaser.Math.Distance.Between(ally.x, ally.y, target.x, target.y);
      if (dist <= ally.range) {
        this.attack(ally, target);
      } else {
        const angle = Phaser.Math.Angle.Between(ally.x, ally.y, target.x, target.y);
        ally.x += Math.cos(angle) * ally.speed * delta * 0.001;
        ally.y += Math.sin(angle) * ally.speed * delta * 0.001;
      }
    }
  }

  private nearest(source: Fighter, list: Fighter[]) {
    let best: Fighter | undefined;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const candidate of list) {
      if (!candidate.active || candidate === source) continue;
      const d = Phaser.Math.Distance.Squared(source.x, source.y, candidate.x, candidate.y);
      if (d < bestDist) {
        best = candidate;
        bestDist = d;
      }
    }
    return best;
  }

  private attack(attacker: Fighter, target: Fighter) {
    if (attacker.attackTimer > 0) return;
    attacker.attackTimer = attacker.attackCd;
    this.tweens.add({ targets: attacker, scaleX: 1.08, scaleY: 1.08, yoyo: true, duration: 80 });
    let damage = attacker.damage;
    if (attacker.kind === "mage") {
      target.slowUntil = this.time.now + this.mageFreezeMs;
      damage *= 0.85;
      const frost = this.add.circle(target.x, target.y, 28, 0x8cecff, 0.25).setDepth(18);
      this.tweens.add({
        targets: frost,
        scale: 1.6,
        alpha: 0,
        duration: 260,
        onComplete: () => frost.destroy()
      });
    }
    if (attacker.kind === "archer") this.spawnProjectile(attacker, target, damage);
    else this.applyDamage(target, damage);
  }

  private spawnProjectile(attacker: Fighter, target: Fighter, damage: number) {
    const dart = this.add.circle(attacker.x, attacker.y - 20, 5, 0xf5e28a, 1).setDepth(18);
    this.tweens.add({
      targets: dart,
      x: target.x,
      y: target.y - 18,
      duration: 180,
      onComplete: () => {
        dart.destroy();
        if (target.active) this.applyDamage(target, damage);
      }
    });
  }

  private applyDamage(target: Fighter, amount: number) {
    target.hp -= amount;
    this.floatText(target.x, target.y - 55, Math.round(amount).toString(), "#ffffff");
    const bar = target.getByName("hp") as Phaser.GameObjects.Rectangle;
    bar.width = Math.max(0, 44 * (target.hp / target.maxHp));
    target.setAlpha(target.slowUntil && target.slowUntil > this.time.now ? 0.72 : 1);
    if (target.hp <= 0) this.killFighter(target);
  }

  private killFighter(fighter: Fighter) {
    if (fighter.team === "enemy") {
      const bounty = Math.round((fighter.bounty ?? 0) * this.bountyMultiplier);
      this.gold += bounty;
      this.floatText(fighter.x, fighter.y - 20, `+${bounty}`, "#ffe27a");
      const boom = this.add.image(fighter.x, fighter.y, "impact").setDisplaySize(76, 68).setDepth(30).setAlpha(0.9);
      this.tweens.add({
        targets: boom,
        scale: 1.25,
        alpha: 0,
        duration: 260,
        onComplete: () => boom.destroy()
      });
      this.enemies = this.enemies.filter((e) => e !== fighter);
    } else {
      this.allies = this.allies.filter((a) => a !== fighter);
    }
    fighter.destroy();
  }

  private damageCastle(amount: number) {
    this.castleHp = Math.max(0, this.castleHp - amount);
    if (this.castleHp <= 0) {
      this.scene.pause();
      this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x071019, 0.72).setDepth(100);
      this.add.text(WIDTH / 2, HEIGHT / 2, "城墙被攻破\n刷新页面再来一局", {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#ffffff",
        align: "center",
        stroke: "#152430",
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(101);
    }
  }

  private floatText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Arial",
      fontSize: "22px",
      color,
      stroke: "#1a2630",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: label,
      y: y - 36,
      alpha: 0,
      duration: 720,
      onComplete: () => label.destroy()
    });
  }

  private tryOpenUpgradeModal() {
    if (this.modalOpen) return;
    if (this.gold < this.upgradeCost) {
      this.floatText(WIDTH / 2, SUMMON_Y - 70, "金币不足", "#ffb3a7");
      return;
    }
    this.gold -= this.upgradeCost;
    this.openUpgradeModal();
  }

  private openUpgradeModal() {
    this.modalOpen = true;
    this.dragging = false;
    this.aimLine.clear();
    const modal = this.add.container(WIDTH / 2, HEIGHT / 2).setDepth(200);
    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x071019, 0.72);
    const title = this.add.text(0, -210, "选择强化", {
      fontFamily: "Arial",
      fontSize: "34px",
      color: "#f2fbff",
      stroke: "#132535",
      strokeThickness: 7
    }).setOrigin(0.5);
    modal.add([shade, title]);

    const upgrades = Phaser.Utils.Array.Shuffle(this.createUpgradePool()).slice(0, 3);
    upgrades.forEach((upgrade, index) => {
      const x = -166 + index * 166;
      const card = this.add.container(x, -20);
      card.setSize(146, 250);
      card.setInteractive(new Phaser.Geom.Rectangle(-73, -125, 146, 250), Phaser.Geom.Rectangle.Contains);
      card.on("pointerdown", () => {
        upgrade.apply();
        this.upgradeCost = Math.round(this.upgradeCost * 1.55);
        this.modalOpen = false;
        modal.destroy();
        this.floatText(WIDTH / 2, 210, upgrade.title, "#fff0a8");
      });
      const bg = this.add.rectangle(0, 0, 146, 250, 0xf1ead7, 1).setStrokeStyle(5, 0x4c7b91);
      const cap = this.add.rectangle(0, -103, 138, 42, 0x3d788e, 1);
      const name = this.add.text(0, -104, upgrade.title, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffffff",
        stroke: "#1d3c48",
        strokeThickness: 4
      }).setOrigin(0.5);
      const icon = this.add.image(0, -35, upgrade.icon).setDisplaySize(74, 74);
      const desc = this.add.text(0, 56, upgrade.desc, {
        fontFamily: "Arial",
        fontSize: "19px",
        color: "#3a352d",
        align: "center",
        wordWrap: { width: 116, useAdvancedWrap: true }
      }).setOrigin(0.5);
      card.add([bg, cap, name, icon, desc]);
      modal.add(card);
    });
  }

  private createUpgradePool(): Upgrade[] {
    return [
      {
        id: "slinger_damage",
        title: "强力弹丸",
        desc: "弹弓兵伤害 +40%",
        icon: "unit-slinger",
        apply: () => {
          this.unitDamageMultiplier.slinger += 0.4;
          this.allies.filter((a) => a.kind === "slinger").forEach((a) => {
            a.damage *= 1.4;
          });
        }
      },
      {
        id: "archer_range",
        title: "鹰眼箭术",
        desc: "弓箭手射程 +30%",
        icon: "unit-archer",
        apply: () => {
          this.archerRangeMultiplier += 0.3;
          this.allies.filter((a) => a.kind === "archer").forEach((a) => {
            a.range *= 1.3;
          });
        }
      },
      {
        id: "mage_freeze",
        title: "寒霜禁锢",
        desc: "冰法减速时间 +1 秒",
        icon: "unit-mage",
        apply: () => {
          this.mageFreezeMs += 1000;
        }
      },
      {
        id: "all_hp",
        title: "坚韧护符",
        desc: "所有单位生命 +25%",
        icon: "wall",
        apply: () => {
          this.hpMultiplier += 0.25;
          this.allies.forEach((a) => {
            const gain = a.maxHp * 0.25;
            a.maxHp += gain;
            a.hp += gain;
          });
        }
      },
      {
        id: "cheap_summon",
        title: "征召令",
        desc: "召唤价格 -2",
        icon: "coin",
        apply: () => {
          this.summonCost = Math.max(4, this.summonCost - 2);
        }
      },
      {
        id: "bounty",
        title: "赏金契约",
        desc: "击杀金币 +25%",
        icon: "coin",
        apply: () => {
          this.bountyMultiplier += 0.25;
        }
      },
      {
        id: "landing_blast",
        title: "坠落冲击",
        desc: "落地造成范围伤害",
        icon: "impact",
        apply: () => {
          this.launchImpactDamage += 18;
        }
      }
    ];
  }

  private updateHud() {
    this.hudText.setText(`金币 ${Math.floor(this.gold)}`);
    this.waveText.setText(`第 ${this.wave} 波`);
    this.hpBar.width = (WIDTH - 72) * (this.castleHp / 600);
    const [upgradeButton, summonButton] = this.actionButtons;
    if (!upgradeButton || !summonButton) return;
    const upgradeCost = upgradeButton.getByName("cost") as Phaser.GameObjects.Text;
    const summonCost = summonButton.getByName("cost") as Phaser.GameObjects.Text;
    upgradeCost.setText(this.upgradeCost.toString());
    summonCost.setText(this.summonCost.toString());
    upgradeButton.setAlpha(this.gold >= this.upgradeCost && !this.modalOpen ? 1 : 0.55);
    summonButton.setAlpha(this.gold >= this.summonCost && !this.pending && !this.modalOpen ? 1 : 0.55);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: "#20364a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
});
