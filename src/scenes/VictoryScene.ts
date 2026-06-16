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
    this.audio.preload(this);
  }

  create(data: GameData) {
    const level = data.level || 1;
    const stars = data.stars || 1;
    const goldEarned = data.goldEarned || 0;

    const save = loadSave();
    if (stars > (save.stars[level] || 0)) {
      save.stars[level] = stars;
    }
    save.gold += goldEarned;
    if (level >= save.unlockedLevel && level < LEVEL_COUNT) {
      save.unlockedLevel = level + 1;
    }
    saveSave(save);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 400, 420, 0x1a2a3a, 0.95);
    createTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, "胜利!", "52px", "#ffd700");

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, "通关成功！", {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `获得金币: +${goldEarned}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `总金币: ${save.gold}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#cccccc",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    const btnY = GAME_HEIGHT / 2 + 90;

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
        this.scene.start("LevelSelectScene");
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
