import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";
import { AudioSystem } from "../systems/AudioSystem";
import { createButton } from "../ui/UIHelper";

export class TitleScene extends Phaser.Scene {
  private audio = new AudioSystem();

  constructor() {
    super({ key: "TitleScene" });
  }

  preload() {
    this.load.image("ui-title-bg", "assets/ui/弹弓传奇.png");
    this.audio.preload(this);
  }

  create() {
    // 背景图（置底）
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "ui-title-bg")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    // 开始按钮
    const startBtn = createButton(this, GAME_WIDTH / 2, 890, 220, 60, "开始游戏", 0x4a9eff, "28px");
    startBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene");
      });
    });

    // 版本号
    this.add.text(GAME_WIDTH / 2, 930, "v0.1.0", {
      fontFamily: "Arial",
      fontSize: "15px",
      color: "#ffffff",
      align: "center",
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.audio.playBgm(this, "hud-bgm");
  }
}
