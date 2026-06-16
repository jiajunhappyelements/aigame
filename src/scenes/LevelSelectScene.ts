import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_COUNT, LEVEL_NAMES, loadSave } from "../config/game";
import { AudioSystem } from "../systems/AudioSystem";
import { createButton, createTitle } from "../ui/UIHelper";

const CARD_W = 160;
const CARD_H = 220;
const CARD_GAP = 30;
const CARD_SPACING = CARD_W + CARD_GAP;

export class LevelSelectScene extends Phaser.Scene {
  private audio = new AudioSystem();
  private cards: Phaser.GameObjects.Container[] = [];
  private currentIndex = 0;
  private scrollX = 0;
  private targetScrollX = 0;
  private dragging = false;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private cardContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "LevelSelectScene" });
  }

  preload() {
    this.audio.preload(this);
  }

  create() {
    const save = loadSave();

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a3a5a, 0x1a3a5a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const deco = this.add.graphics();
    deco.lineStyle(1, 0x4a9eff, 0.15);
    for (let i = 0; i < 10; i++) {
      deco.lineBetween(0, 100 + i * 80, GAME_WIDTH, 100 + i * 80);
    }

    createTitle(this, GAME_WIDTH / 2, 80, "选择关卡", "40px", "#ffd700");

    this.cardContainer = this.add.container(0, 0);
    this.cards = [];

    const centerY = GAME_HEIGHT / 2 + 20;

    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const card = this.createLevelCard(i);
      card.setData("index", i - 1);
      card.setData("baseY", centerY);
      this.cardContainer.add(card);
      this.cards.push(card);
    }

    this.scrollX = 0;
    this.targetScrollX = 0;
    this.currentIndex = 0;
    this.updateCardPositions();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartX = pointer.x;
      this.dragStartScroll = this.scrollX;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dx = pointer.x - this.dragStartX;
      this.targetScrollX = this.dragStartScroll - dx;
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;

      const dx = pointer.x - this.dragStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0 && this.currentIndex < LEVEL_COUNT - 1) {
          this.currentIndex++;
        } else if (dx > 0 && this.currentIndex > 0) {
          this.currentIndex--;
        }
      } else {
        const clickIndex = this.getCardIndexAt(pointer.x);
        if (clickIndex >= 0 && clickIndex < LEVEL_COUNT) {
          if (clickIndex === this.currentIndex) {
            this.startLevel(clickIndex + 1);
            return;
          }
          this.currentIndex = clickIndex;
        }
      }

      this.targetScrollX = this.currentIndex * CARD_SPACING;
    });

    const arrowY = centerY;
    const leftBtn = createButton(this, 40, arrowY, 50, 80, "<", 0x333333, "32px");
    leftBtn.setDepth(10);
    leftBtn.on("pointerdown", () => {
      this.audio.play(this, "stage-click");
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.targetScrollX = this.currentIndex * CARD_SPACING;
      }
    });

    const rightBtn = createButton(this, GAME_WIDTH - 40, arrowY, 50, 80, ">", 0x333333, "32px");
    rightBtn.setDepth(10);
    rightBtn.on("pointerdown", () => {
      this.audio.play(this, "stage-click");
      if (this.currentIndex < LEVEL_COUNT - 1) {
        this.currentIndex++;
        this.targetScrollX = this.currentIndex * CARD_SPACING;
      }
    });

    const startBtn = createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 130, 240, 60, "开始挑战", 0x4a9eff, "26px");
    startBtn.setDepth(10);
    startBtn.on("pointerdown", () => {
      this.audio.play(this, "stage-click");
      this.startLevel(this.currentIndex + 1);
    });

    const backBtn = createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, 180, 45, "返回主菜单", 0x555555, "18px");
    backBtn.setDepth(10);
    backBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TitleScene");
      });
    });

    this.add.text(GAME_WIDTH - 20, 20, `💰 ${save.gold}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(10);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 170, "← 左右滑动选择关卡 →", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#888888",
    }).setOrigin(0.5).setDepth(10);

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.audio.playBgm(this, "hud-bgm");
  }

  update(_time: number, delta: number) {
    this.scrollX += (this.targetScrollX - this.scrollX) * Math.min(1, delta * 0.008);
    this.updateCardPositions();
  }

  private updateCardPositions() {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 + 20;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cardX = centerX + i * CARD_SPACING - this.scrollX;
      const distFromCenter = Math.abs(i - this.currentIndex);
      const scale = distFromCenter === 0 ? 1.0 : distFromCenter === 1 ? 0.75 : 0.55;
      const alpha = distFromCenter === 0 ? 1.0 : distFromCenter === 1 ? 0.7 : 0.4;

      card.setPosition(cardX, centerY);
      card.setScale(scale);
      card.setAlpha(alpha);
      card.setDepth(distFromCenter === 0 ? 5 : distFromCenter === 1 ? 3 : 1);
    }
  }

  private createLevelCard(level: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a3a5a, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
    bg.lineStyle(3, 0x4a9eff, 0.6);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
    container.add(bg);

    const numText = this.add.text(0, -60, `${level}`, {
      fontFamily: "Arial",
      fontSize: "56px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);
    container.add(numText);

    const nameText = this.add.text(0, 20, LEVEL_NAMES[level] || "", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#cccccc",
      align: "center",
    }).setOrigin(0.5);
    container.add(nameText);

    const corner = this.add.graphics();
    corner.fillStyle(0x4a9eff, 0.3);
    corner.fillTriangle(-CARD_W / 2, -CARD_H / 2, -CARD_W / 2 + 30, -CARD_H / 2, -CARD_W / 2, -CARD_H / 2 + 30);
    container.add(corner);

    return container;
  }

  private getCardIndexAt(px: number): number {
    const centerX = GAME_WIDTH / 2;
    for (let i = 0; i < this.cards.length; i++) {
      const cardX = centerX + i * CARD_SPACING - this.scrollX;
      const halfW = (CARD_W * (i === this.currentIndex ? 1.0 : i === this.currentIndex - 1 || i === this.currentIndex + 1 ? 0.75 : 0.55)) / 2;
      if (px >= cardX - halfW && px <= cardX + halfW) return i;
    }
    return -1;
  }

  private startLevel(level: number) {
    this.audio.stopBgm();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { level });
    });
  }
}
