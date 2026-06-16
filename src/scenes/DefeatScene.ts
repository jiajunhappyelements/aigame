import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";
import { AudioSystem } from "../systems/AudioSystem";
import { createButton, createPanel, createTitle } from "../ui/UIHelper";
import type { GameData } from "../types";

export class DefeatScene extends Phaser.Scene {
  private audio = new AudioSystem();

  constructor() {
    super({ key: "DefeatScene" });
  }

  preload() {
    this.audio.preload(this);
  }

  create(data: GameData) {
    const level = data.level || 1;

    // 半透明遮罩
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    // 面板
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 400, 350, 0x2a1a1a, 0.95);

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
    const btnY = GAME_HEIGHT / 2 + 60;

    const retryBtn = createButton(this, GAME_WIDTH / 2, btnY, 200, 55, "再试一次", 0xff6644, "24px");
    retryBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene", { level });
      });
    });

    const backBtn = createButton(this, GAME_WIDTH / 2, btnY + 70, 200, 55, "返回关卡选择", 0x555555, "20px");
    backBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene");
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
