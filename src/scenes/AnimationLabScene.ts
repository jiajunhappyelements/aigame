import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/game";
import { ALLY_SPECS } from "../config/units";
import { ENEMY_SPECS } from "../config/enemies";
import { ANIMATION_ATLAS, EFFECT_ANIMATIONS, FIGHTER_ANIMATIONS } from "../config/animations";
import { createConfiguredAnimations } from "../render/animations";
import type { AllyId, AnimationClipDef, EnemyId } from "../types";

type LabCategory = "all" | "ally" | "enemy" | "effect";
type BackgroundMode = "dark" | "light" | "checker" | "field";

type LabEntry = {
  id: string;
  label: string;
  category: Exclude<LabCategory, "all">;
  clip: AnimationClipDef;
  meta: string;
};

type LabCard = {
  entry: LabEntry;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Sprite;
  frameText: Phaser.GameObjects.Text;
  frameBox: Phaser.GameObjects.Rectangle;
  centerLineH: Phaser.GameObjects.Line;
  centerLineV: Phaser.GameObjects.Line;
  index: number;
};

const FILTERS: { id: LabCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "ally", label: "我方" },
  { id: "enemy", label: "敌方" },
  { id: "effect", label: "特效" },
];

const BG_MODES: { id: BackgroundMode; label: string; color: number }[] = [
  { id: "dark", label: "深色", color: 0x101820 },
  { id: "light", label: "浅色", color: 0xdfe7ec },
  { id: "checker", label: "棋盘", color: 0x2a2e35 },
  { id: "field", label: "场景", color: 0x6d7f82 },
];

export class AnimationLabScene extends Phaser.Scene {
  private entries: LabEntry[] = [];
  private cards: LabCard[] = [];
  private content!: Phaser.GameObjects.Container;
  private maskShape!: Phaser.GameObjects.Graphics;
  private scrollY = 0;
  private maxScrollY = 0;
  private activeCategory: LabCategory = "all";
  private bgModeIndex = 0;
  private globalFps = 0;
  private paused = false;
  private showGuides = true;
  private manualFrame = false;
  private manualFrameIndex = 0;
  private statusText!: Phaser.GameObjects.Text;
  private bgLayer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "AnimationLabScene" });
  }

  preload(): void {
    this.load.multiatlas(ANIMATION_ATLAS.key, ANIMATION_ATLAS.dataPath, ANIMATION_ATLAS.texturePath);
  }

  create(): void {
    createConfiguredAnimations(this);
    this.entries = this.createEntries();

    this.bgLayer = this.add.container(0, 0).setDepth(-10);
    this.drawBackground();
    this.createHeader();
    this.createContent();
    this.rebuildGrid();
    this.setupInput();
  }

  update(): void {
    for (const card of this.cards) {
      const frameName = card.sprite.frame.name;
      const frameIndex = card.entry.clip.frames.indexOf(String(frameName));
      card.frameText.setText(`frame ${Math.max(0, frameIndex) + 1}/${card.entry.clip.frames.length}`);
    }
  }

  private createEntries(): LabEntry[] {
    const entries: LabEntry[] = [];

    for (const [id, def] of Object.entries(FIGHTER_ANIMATIONS) as [AllyId | EnemyId, NonNullable<(typeof FIGHTER_ANIMATIONS)[AllyId | EnemyId]>][]) {
      const isAlly = id.startsWith("A");
      const spec = isAlly ? ALLY_SPECS[id as AllyId] : ENEMY_SPECS[id as EnemyId];
      const category = isAlly ? "ally" : "enemy";
      const displayName = `${id} ${spec.name}`;

      entries.push({
        id: `${id}-base`,
        label: `${displayName} / ${def.base.animationKey.replace(`${id}-`, "")}`,
        category,
        clip: def.base,
        meta: `${spec.attackType} · ${spec.moveMode}`,
      });

      if (def.attack) {
        entries.push({
          id: `${id}-attack`,
          label: `${displayName} / attack`,
          category,
          clip: def.attack,
          meta: `${spec.attackType} · ${spec.moveMode}`,
        });
      }
    }

    for (const [id, clip] of Object.entries(EFFECT_ANIMATIONS)) {
      entries.push({
        id,
        label: `FX / ${id}`,
        category: "effect",
        clip,
        meta: `depth ${(clip as typeof clip & { depth: number }).depth}`,
      });
    }

    return entries;
  }

  private createHeader(): void {
    this.add.rectangle(GAME_WIDTH / 2, 56, GAME_WIDTH, 112, 0x14202a, 0.96).setDepth(100);
    this.add.text(16, 12, "Animation Lab", {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    }).setDepth(101);

    let x = 16;
    const y = 58;
    for (const filter of FILTERS) {
      this.createToggleButton(x, y, 54, filter.label, () => {
        this.activeCategory = filter.id;
        this.rebuildGrid();
      }, () => this.activeCategory === filter.id);
      x += 60;
    }

    this.createToggleButton(268, y, 56, "暂停", () => {
      this.paused = !this.paused;
      this.refreshPlayback();
    }, () => this.paused);

    this.createToggleButton(330, y, 56, "逐帧", () => {
      this.manualFrame = !this.manualFrame;
      this.manualFrameIndex = 0;
      this.refreshPlayback();
    }, () => this.manualFrame);

    this.createTextButton(392, y, 32, "-帧", () => this.stepManualFrame(-1));
    this.createTextButton(428, y, 32, "+帧", () => this.stepManualFrame(1));

    this.createTextButton(466, y, 28, "-速", () => this.adjustFps(-1));
    this.createTextButton(498, y, 28, "+速", () => this.adjustFps(1));

    this.createToggleButton(16, 92, 58, "辅助线", () => {
      this.showGuides = !this.showGuides;
      this.updateGuides();
    }, () => this.showGuides);

    this.createTextButton(80, 92, 58, "背景", () => {
      this.bgModeIndex = (this.bgModeIndex + 1) % BG_MODES.length;
      this.drawBackground();
    });

    this.statusText = this.add.text(150, 83, "", {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#c9d7df",
    }).setDepth(101);
    this.updateStatus();
  }

  private createContent(): void {
    this.content = this.add.container(0, 0).setDepth(10);
    this.maskShape = this.add.graphics();
    this.maskShape.fillStyle(0xffffff, 1);
    this.maskShape.fillRect(0, 112, GAME_WIDTH, GAME_HEIGHT - 112);
    this.maskShape.setVisible(false);
    this.content.setMask(this.maskShape.createGeometryMask());
  }

  private rebuildGrid(): void {
    for (const card of this.cards) {
      card.container.destroy();
    }
    this.cards = [];
    this.scrollY = 0;
    this.content.y = 0;

    const visibleEntries = this.entries.filter(entry => this.activeCategory === "all" || entry.category === this.activeCategory);
    const cardW = 164;
    const cardH = 182;
    const gap = 10;
    const cols = 3;
    const startX = 16;
    const startY = 124;

    visibleEntries.forEach((entry, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + gap);
      this.cards.push(this.createCard(entry, x, y, cardW, cardH, index));
    });

    const rows = Math.ceil(visibleEntries.length / cols);
    const contentHeight = startY + rows * (cardH + gap);
    this.maxScrollY = Math.max(0, contentHeight - GAME_HEIGHT + 18);
    this.updateStatus();
    this.updateGuides();
    this.refreshPlayback();
  }

  private createCard(entry: LabEntry, x: number, y: number, width: number, height: number, index: number): LabCard {
    const container = this.add.container(x, y);
    this.content.add(container);

    const bg = this.add.rectangle(0, 0, width, height, 0x182530, 0.92)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3f5668, 0.95);
    container.add(bg);

    const preview = this.add.rectangle(width / 2, 76, width - 18, 110, 0x303842, 0.95)
      .setStrokeStyle(1, 0x52606c, 0.9);
    container.add(preview);

    const frameBox = this.add.rectangle(width / 2, 76, entry.clip.displayWidth, entry.clip.displayHeight, 0xffffff, 0)
      .setStrokeStyle(1, 0xffd166, 0.8);
    container.add(frameBox);

    const centerLineH = this.add.line(0, 76, 12, 0, width - 12, 0, 0x80e6ff, 0.45);
    const centerLineV = this.add.line(width / 2, 0, 0, 22, 0, 130, 0x80e6ff, 0.45);
    container.add([centerLineH, centerLineV]);

    const sprite = this.add.sprite(width / 2, 76, ANIMATION_ATLAS.key, entry.clip.frames[0])
      .setDisplaySize(entry.clip.displayWidth, entry.clip.displayHeight);
    sprite.play(entry.clip.animationKey);
    sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.manualFrame && !this.paused && sprite.active) {
        sprite.play(entry.clip.animationKey);
      }
    });
    container.add(sprite);

    const label = this.add.text(8, 8, entry.label, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      wordWrap: { width: width - 16, useAdvancedWrap: true },
    });
    container.add(label);

    const meta = this.add.text(8, 136, `${entry.clip.frames.length}f · ${entry.clip.frameRate}fps · ${entry.clip.displayWidth}x${entry.clip.displayHeight}`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#b9c7cf",
    });
    container.add(meta);

    const pathText = this.add.text(8, 151, entry.clip.frames[0].replace(/\/[^/]+$/, "/..."), {
      fontFamily: "Arial",
      fontSize: "9px",
      color: "#82929d",
      wordWrap: { width: width - 16, useAdvancedWrap: true },
    });
    container.add(pathText);

    const frameText = this.add.text(width - 8, height - 8, "", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#e8f3f8",
    }).setOrigin(1, 1);
    container.add(frameText);

    return { entry, container, sprite, frameText, frameBox, centerLineH, centerLineV, index };
  }

  private setupInput(): void {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => {
      this.scrollTo(this.scrollY + dy * 0.6);
    });

    this.input.keyboard?.on("keydown-UP", () => this.scrollTo(this.scrollY - 80));
    this.input.keyboard?.on("keydown-DOWN", () => this.scrollTo(this.scrollY + 80));
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.paused = !this.paused;
      this.refreshPlayback();
      this.updateStatus();
    });
    this.input.keyboard?.on("keydown-LEFT", () => this.stepManualFrame(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.stepManualFrame(1));
  }

  private scrollTo(value: number): void {
    this.scrollY = Phaser.Math.Clamp(value, 0, this.maxScrollY);
    this.content.y = -this.scrollY;
  }

  private createToggleButton(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    isActive: () => boolean,
  ): void {
    const button = this.add.container(x, y).setDepth(101);
    const bg = this.add.rectangle(0, 0, width, 24, 0x2c3e4a, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6b8190, 0.85);
    const text = this.add.text(width / 2, 0, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#ffffff",
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(width, 24);
    button.setInteractive(new Phaser.Geom.Rectangle(0, -12, width, 24), Phaser.Geom.Rectangle.Contains);
    button.on("pointerdown", () => {
      onClick();
      this.updateStatus();
    });
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        bg.fillColor = isActive() ? 0x4a9eff : 0x2c3e4a;
      },
    });
  }

  private createTextButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    const button = this.add.container(x, y).setDepth(101);
    const bg = this.add.rectangle(0, 0, width, 24, 0x2c3e4a, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6b8190, 0.85);
    const text = this.add.text(width / 2, 0, label, {
      fontFamily: "Arial",
      fontSize: "11px",
      color: "#ffffff",
    }).setOrigin(0.5);
    button.add([bg, text]);
    button.setSize(width, 24);
    button.setInteractive(new Phaser.Geom.Rectangle(0, -12, width, 24), Phaser.Geom.Rectangle.Contains);
    button.on("pointerdown", () => {
      onClick();
      this.updateStatus();
    });
  }

  private adjustFps(delta: number): void {
    const fpsOptions = [0, 4, 8, 12, 14, 18, 24];
    const current = fpsOptions.indexOf(this.globalFps);
    const next = Phaser.Math.Clamp(current + delta, 0, fpsOptions.length - 1);
    this.globalFps = fpsOptions[next];

    for (const card of this.cards) {
      if (this.manualFrame) continue;
      const fps = this.globalFps || card.entry.clip.frameRate;
      const anim = this.anims.get(card.entry.clip.animationKey);
      if (anim) anim.frameRate = fps;
      card.sprite.play(card.entry.clip.animationKey, true);
      if (this.paused) card.sprite.anims.pause();
    }
  }

  private stepManualFrame(delta: number): void {
    if (!this.manualFrame) {
      this.manualFrame = true;
      this.manualFrameIndex = 0;
    } else {
      const maxFrames = Math.max(...this.cards.map(card => card.entry.clip.frames.length), 1);
      this.manualFrameIndex = (this.manualFrameIndex + delta + maxFrames) % maxFrames;
    }
    this.applyManualFrame();
    this.updateStatus();
  }

  private applyManualFrame(): void {
    for (const card of this.cards) {
      card.sprite.anims.stop();
      const frames = card.entry.clip.frames;
      const frame = frames[this.manualFrameIndex % frames.length];
      card.sprite.setFrame(frame);
    }
  }

  private refreshPlayback(): void {
    if (this.manualFrame) {
      this.applyManualFrame();
      return;
    }

    for (const card of this.cards) {
      card.sprite.play(card.entry.clip.animationKey, true);
      if (this.paused) card.sprite.anims.pause();
    }
  }

  private updateGuides(): void {
    for (const card of this.cards) {
      card.frameBox.setVisible(this.showGuides);
      card.centerLineH.setVisible(this.showGuides);
      card.centerLineV.setVisible(this.showGuides);
    }
  }

  private drawBackground(): void {
    this.bgLayer?.removeAll(true);
    const mode = BG_MODES[this.bgModeIndex];
    this.cameras.main.setBackgroundColor(mode.color);

    if (mode.id === "checker") {
      const g = this.add.graphics();
      const size = 24;
      for (let y = 0; y < GAME_HEIGHT; y += size) {
        for (let x = 0; x < GAME_WIDTH; x += size) {
          const color = ((x / size + y / size) % 2 === 0) ? 0x28313a : 0x1f252c;
          g.fillStyle(color, 1).fillRect(x, y, size, size);
        }
      }
      this.bgLayer.add(g);
    } else if (mode.id === "field") {
      const g = this.add.graphics();
      g.fillStyle(0x283f54, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      g.fillStyle(0x6d7f82, 1).fillRoundedRect(40, 112, GAME_WIDTH - 80, GAME_HEIGHT - 148, 36);
      g.lineStyle(2, 0x566463, 0.35);
      for (let y = 140; y < GAME_HEIGHT; y += 48) {
        g.lineBetween(52, y, GAME_WIDTH - 52, y + 8);
      }
      this.bgLayer.add(g);
    } else {
      this.bgLayer.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, mode.color, 1));
    }
    this.updateStatus();
  }

  private updateStatus(): void {
    if (!this.statusText) return;
    const visibleCount = this.entries.filter(entry => this.activeCategory === "all" || entry.category === this.activeCategory).length;
    const bg = BG_MODES[this.bgModeIndex].label;
    const fps = this.globalFps ? `${this.globalFps}fps` : "原速";
    this.statusText.setText(`${visibleCount}/${this.entries.length} · ${bg} · ${fps} · ${this.manualFrame ? `逐帧 ${this.manualFrameIndex + 1}` : "播放"}`);
  }
}
