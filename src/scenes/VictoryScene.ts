import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_COUNT, loadSave, saveSave } from "../config/game";
import { AudioSystem } from "../systems/AudioSystem";
import { createButton, createPanel, createTitle } from "../ui/UIHelper";
import type { GameData } from "../types";

export class VictoryScene extends Phaser.Scene {
  private audio = new AudioSystem();

  constructor() {
    super({ key: "VictoryScene" });
  }

  preload() {
    this.load.image("ui-victory-bg", "assets/ui/闯关成功.png");
    this.audio.preload(this, ["hud-button-click"]);
  }

  create(data: GameData) {
    const level = data.level || 1;
    const goldEarned = data.goldEarned || 0;

    const save = loadSave();
    save.gold += goldEarned;
    if (level >= save.unlockedLevel && level < LEVEL_COUNT) {
      save.unlockedLevel = level + 1;
    }
    saveSave(save);

    // 背景图
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "ui-victory-bg")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    // 面板
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 400, 350, 0x1a2a3a, 0.55);

    // 标题
    createTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, "胜利!", "52px", "#ffd700");

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, "通关成功！", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 金币奖励
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `获得金币: +${goldEarned}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 总金币
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `总金币: ${save.gold}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#cccccc",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 按钮
    const btnY = GAME_HEIGHT / 2 + 40;

    if (level < LEVEL_COUNT) {
      const nextBtn = createButton(this, GAME_WIDTH / 2, btnY, 200, 55, "下一关", 0x4a9eff, "24px");
      nextBtn.on("pointerdown", () => {
        this.audio.play(this, "hud-button-click");
        this.audio.stopBgm();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("GameScene", { level: level + 1 });
        });
      });
    }

    const backBtn = createButton(
      this,
      GAME_WIDTH / 2,
      level < LEVEL_COUNT ? btnY + 70 : btnY,
      200,
      55,
      "返回关卡选择",
      0x555555,
      "20px",
    );
    backBtn.on("pointerdown", () => {
      this.audio.play(this, "hud-button-click");
      this.audio.stopBgm();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene", { level: level + 1 });
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
