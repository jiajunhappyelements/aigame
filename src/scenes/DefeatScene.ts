import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";
import { createButton, createPanel, createTitle } from "../ui/UIHelper";
import type { GameData } from "../types";

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: "DefeatScene" });
  }

  preload() {
    this.load.image("ui-defeat-bg", "assets/ui/关卡失败.png");
  }

  create(data: GameData) {
    const level = data.level || 1;

    // 背景图
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "ui-defeat-bg")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // 面板
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 400, 350, 0x2a1a1a, 0.55);

    // 标题
    createTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, "失败", "52px", "#ff4444");

    // 描述
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "城堡被攻破了！", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, "再试一次吧！", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#aaaaaa",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 按钮
    const btnY = GAME_HEIGHT / 2 + 40;

    const retryBtn = createButton(this, GAME_WIDTH / 2, btnY, 200, 55, "再试一次", 0xff6644, "24px");
    retryBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene", { level });
      });
    });

    const backBtn = createButton(this, GAME_WIDTH / 2, btnY + 70, 200, 55, "返回关卡选择", 0x555555, "20px");
    backBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene");
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
