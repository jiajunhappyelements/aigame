import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_COUNT } from "../config/game";

const LEVEL_IMAGE_KEYS: Record<number, string> = {
  1: "card-哥布林入侵",
  2: "card-骷髅军团",
  3: "card-暗夜蝙蝠",
  4: "card-幽灵来袭",
  5: "card-巨龙之巢",
  6: "card-巨魔攻城",
  7: "card-魔王降临",
};

const CARD_W = 280;
const CARD_H = 400;
const CARD_SPACING = 320;
const DRAG_THRESHOLD = 130; // 拖动超过此距离自动切到下一关

export class LevelSelectScene extends Phaser.Scene {
  private currentIndex = 0;
  private cards: Phaser.GameObjects.Image[] = [];
  private levelNumImages: Phaser.GameObjects.Image[] = [];
  private levelNameTexts: Phaser.GameObjects.Text[] = [];
  private pendingLevel = 1;
  private scrollX = 0;
  private targetScrollX = 0;
  private dragging = false;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private lastSwitchX = 0;

  constructor() {
    super({ key: "LevelSelectScene" });
  }

  preload() {
    this.load.image("ui-level-bg", "assets/ui/关卡选择背景图.png");
    this.load.image("btn-start", "assets/ui/开始挑战.png");
    this.load.image("btn-back", "assets/ui/返回主菜单.png");
    const names = ["哥布林入侵", "骷髅军团", "暗夜蝙蝠", "幽灵来袭", "巨龙之巢", "巨魔攻城", "魔王降临"];
    for (const name of names) {
      this.load.image(`card-${name}`, `assets/ui/${name}.png`);
    }
  }

  create(data?: { level?: number }) {
    this.pendingLevel = data?.level || 1;

    // 清理旧卡片和文字（防止返回时重复创建）
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards = [];
    for (const img of this.levelNumImages) img.destroy();
    this.levelNumImages = [];
    for (const t of this.levelNameTexts) t.destroy();
    this.levelNameTexts = [];

    // 确保关卡卡片纹理已加载（从 GameScene 返回时可能丢失）
    const names = ["哥布林入侵", "骷髅军团", "暗夜蝙蝠", "幽灵来袭", "巨龙之巢", "巨魔攻城", "魔王降临"];
    let needsReload = false;
    for (const name of names) {
      if (!this.textures.exists(`card-${name}`)) {
        needsReload = true;
        this.load.image(`card-${name}`, `assets/ui/${name}.png`);
      }
    }
    if (needsReload) {
      this.load.start();
      this.load.once("complete", () => {
        this.buildScene();
      });
    } else {
      this.buildScene();
    }
  }

  private buildScene() {
    // 背景
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "ui-level-bg")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    // 创建所有关卡卡片 + 关卡数字图片 + 关卡名称
    const centerY = 400;
    const levelNames = ["哥布林入侵", "骷髅军团", "暗夜蝙蝠", "幽灵来袭", "巨龙之巢", "巨魔攻城", "魔王降临"];
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const card = this.add.image(0, centerY, LEVEL_IMAGE_KEYS[i]);
      card.setDepth(1);
      this.cards.push(card);

      // 关卡数字（图片，显示在卡片上；无图片资源时用文字）
      if (this.textures.exists(`num-${i}`)) {
        const numImg = this.add.image(0, centerY - 20, `num-${i}`);
        numImg.setScale(0.012);
        numImg.setDepth(2);
        this.levelNumImages.push(numImg);
      } else {
        const numImg = this.add.text(0, centerY - 20, `${i}`, {
          fontFamily: "Arial",
          fontSize: "80px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          fontStyle: "bold",
        }).setOrigin(0.5).setDepth(2);
        this.levelNumImages.push(numImg as unknown as Phaser.GameObjects.Image);
      }

      // 关卡名称（显示在卡片下方）
      const nameText = this.add.text(0, centerY + 160, levelNames[i - 1], {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(2);
      this.levelNameTexts.push(nameText);
    }

    // 初始位置（定位到指定关卡）
    this.currentIndex = Math.max(0, Math.min(this.pendingLevel - 1, LEVEL_COUNT - 1));
    this.scrollX = this.currentIndex * CARD_SPACING;
    this.targetScrollX = this.currentIndex * CARD_SPACING;
    this.updateCardPositions();

    // 开始挑战按钮
    const startBtn = this.add.image(GAME_WIDTH / 2, 740, "btn-start")
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    startBtn.setDisplaySize(240, 60);
    startBtn.on("pointerdown", () => {
      this.startLevel(this.currentIndex + 1);
    });

    // 返回主菜单按钮
    const backBtn = this.add.image(GAME_WIDTH / 2, 820, "btn-back")
      .setInteractive({ useHandCursor: true })
      .setDepth(10);
    backBtn.setDisplaySize(200, 50);
    backBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TitleScene");
      });
    });

    // 拖拽交互
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.dragging = true;
      this.dragStartX = pointer.x;
      this.dragStartScroll = this.scrollX;
      this.lastSwitchX = pointer.x;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dx = pointer.x - this.dragStartX;
      this.targetScrollX = this.dragStartScroll - dx;

      // 实时检测：从上次切换点算起，拖动超过阈值自动滚动到下一关
      const switchDx = pointer.x - this.lastSwitchX;
      if (Math.abs(switchDx) > DRAG_THRESHOLD) {
        const direction = switchDx < 0 ? 1 : -1;
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex < LEVEL_COUNT) {
          const oldTarget = this.targetScrollX;
          this.currentIndex = newIndex;
          this.targetScrollX = this.currentIndex * CARD_SPACING;
          this.lastSwitchX = pointer.x;
          // 根据切换前后的差值调整 dragStartScroll，保持视觉连续
          this.dragStartScroll += this.targetScrollX - oldTarget;
        }
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.snapToClosestCard();
    });

    // 原生 DOM 事件：监听 document 级别的 mouseup，捕获鼠标在画布外松开的情况
    const onDocMouseUp = () => {
      if (this.dragging) {
        this.dragging = false;
        this.snapToClosestCard();
      }
    };
    document.addEventListener("mouseup", onDocMouseUp);
    this.events.on("shutdown", () => {
      document.removeEventListener("mouseup", onDocMouseUp);
    });

    // 原生 DOM 事件：监听 mousemove，鼠标移近画布边缘时结束拖动
    const canvas = this.game.canvas;
    const onDocMouseMove = (e: MouseEvent) => {
      if (!this.dragging) return;
      const rect = canvas.getBoundingClientRect();
      const EDGE = 2; // 像素
      const mx = e.clientX;
      const my = e.clientY;
      const nearLeft = mx <= rect.left + EDGE;
      const nearRight = mx >= rect.right - EDGE;
      const nearTop = my <= rect.top + EDGE;
      const nearBottom = my >= rect.bottom - EDGE;
      if (nearLeft || nearRight || nearTop || nearBottom) {
        this.dragging = false;
        this.snapToClosestCard();
      }
    };
    document.addEventListener("mousemove", onDocMouseMove);
    this.events.on("shutdown", () => {
      document.removeEventListener("mousemove", onDocMouseMove);
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private snapToClosestCard() {
    const centerX = GAME_WIDTH / 2;
    let closestIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.cards.length; i++) {
      const cardX = centerX + i * CARD_SPACING - this.scrollX;
      const dist = Math.abs(cardX - centerX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    this.currentIndex = closestIndex;
    this.targetScrollX = this.currentIndex * CARD_SPACING;
  }

  update(_time: number, delta: number) {
    if (this.dragging) {
      // 拖动时直接跟随手指，无延迟
      this.scrollX = this.targetScrollX;
    } else {
      // 松手后平滑吸附
      this.scrollX += (this.targetScrollX - this.scrollX) * Math.min(1, delta * 0.008);
    }
    this.updateCardPositions();
  }

  private updateCardPositions() {
    const centerX = GAME_WIDTH / 2;
    const centerY = 380;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const cardX = centerX + i * CARD_SPACING - this.scrollX;
      const distFromCenter = Math.abs(i - this.currentIndex);

      // 圆柱效果：中间大，两边小（整体放大1.25倍）
      const scale = distFromCenter === 0 ? 1.125 : distFromCenter === 1 ? 0.875 : 0.625;
      const alpha = distFromCenter === 0 ? 1.0 : distFromCenter === 1 ? 0.6 : 0.3;

      // 第6关（索引5）往上挪25，第5关（索引4）往下挪25，第2关（索引1）往下挪35，整体再往下挪90
      let cardY = centerY + 90;
      if (i === 5) cardY = centerY + 90 - 25;
      if (i === 4) cardY = centerY + 90 + 25;
      if (i === 1) cardY = centerY + 90 + 35;

      card.setPosition(cardX, cardY);
      card.setScale(scale);
      card.setAlpha(alpha);
      card.setDepth(distFromCenter === 0 ? 5 : distFromCenter === 1 ? 3 : 1);

      // 同步移动关卡数字图片和关卡名称
      const numImg = this.levelNumImages[i];
      const nameText = this.levelNameTexts[i];
      if (numImg) {
        numImg.setPosition(cardX, cardY - 20);
        numImg.setScale(scale);
        numImg.setAlpha(alpha);
        numImg.setDepth(distFromCenter === 0 ? 6 : distFromCenter === 1 ? 4 : 2);
      }
      if (nameText) {
        let nameOffsetY = 160;
        if (i === 1) nameOffsetY = 125;
        if (i === 4) nameOffsetY = 135;
        nameText.setPosition(cardX, cardY + nameOffsetY);
        nameText.setScale(scale);
        nameText.setAlpha(alpha);
        nameText.setDepth(distFromCenter === 0 ? 6 : distFromCenter === 1 ? 4 : 2);
      }
    }
  }

  private startLevel(level: number) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("GameScene", { level });
    });
  }
}
