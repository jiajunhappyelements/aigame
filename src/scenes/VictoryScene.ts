import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, LEVEL_COUNT, loadSave, saveSave } from "../config/game";
import { createButton, createPanel, createTitle } from "../ui/UIHelper";
import type { GameData } from "../types";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: "VictoryScene" });
  }

  create(data: GameData) {
    const level = data.level || 1;
    const goldEarned = data.goldEarned || 0;

    // 更新存档
    const save = loadSave();
    save.gold += goldEarned;
    if (level >= save.unlockedLevel && level < LEVEL_COUNT) {
      save.unlockedLevel = level + 1;
    }
    saveSave(save);

    // 半透明遮罩
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    // 面板
    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 400, 420, 0x1a2a3a, 0.95);

    // 标题
    createTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 130, "胜利!", "52px", "#ffd700");

    // 金币奖励
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, `获得金币: +${goldEarned}`, {
      fontFamily: "Arial",
      fontSize: "22px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 总金币
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `总金币: ${save.gold}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#cccccc",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);

    // 按钮
    const btnY = GAME_HEIGHT / 2 + 90;

    if (level < LEVEL_COUNT) {
      const nextBtn = createButton(this, GAME_WIDTH / 2, btnY, 200, 55, "下一关", 0x4a9eff, "24px");
      nextBtn.on("pointerdown", () => {
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
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("LevelSelectScene");
      });
    });

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }
}
