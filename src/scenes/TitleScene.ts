import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";
import { AudioSystem } from "../systems/AudioSystem";
import { createButton, createTitle } from "../ui/UIHelper";

export class TitleScene extends Phaser.Scene {
  private audio = new AudioSystem();

  constructor() {
    super({ key: "TitleScene" });
  }

  preload() {
    this.audio.preload(this);
  }

  create() {
    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a3a5a, 0x1a3a5a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 装饰线条
    const deco = this.add.graphics();
    deco.lineStyle(2, 0x4a9eff, 0.3);
    for (let i = 0; i < 8; i++) {
      const y = 100 + i * 100;
      deco.lineBetween(0, y, GAME_WIDTH, y);
    }

    // 标题
    createTitle(this, GAME_WIDTH / 2, 280, "进击的哥布林", "56px", "#ffd700");

    // 副标题
    this.add.text(GAME_WIDTH / 2, 360, "Sling Guardians", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#8ab4f8",
      align: "center",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 版本号
    this.add.text(GAME_WIDTH / 2, 400, "v0.1.0", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#666666",
      align: "center",
    }).setOrigin(0.5);

    // 开始按钮
    const startBtn = createButton(this, GAME_WIDTH / 2, 560, 220, 60, "开始游戏", 0x4a9eff, "28px");
    startBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene");
      });
    });

    // 提示文字
    this.add.text(GAME_WIDTH / 2, 700, "拖拽发射英雄，消灭入侵的哥布林！", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#aaaaaa",
      align: "center",
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.audio.playBgm(this, "hud-bgm");
  }
}
