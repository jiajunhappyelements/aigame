import Phaser from "phaser";
import type { GameState } from "../types";
import { CASTLE, GAME_WIDTH, GAME_HEIGHT } from "../config/game";

export class Hud {
  private scene: Phaser.Scene;
  private gs: GameState;
  private waveText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFill: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gs: GameState) {
    this.scene = scene;
    this.gs = gs;

    this.waveText = scene.add.text(GAME_WIDTH / 2, 30, "", {
      fontFamily: "Arial", fontSize: "22px", color: "#f5fbff",
      stroke: "#173040", strokeThickness: 5
    }).setOrigin(0.5).setDepth(60);

    this.goldText = scene.add.text(GAME_WIDTH - 20, 30, "", {
      fontFamily: "Arial", fontSize: "18px", color: "#ffd700",
      stroke: "#173040", strokeThickness: 4
    }).setOrigin(1, 0.5).setDepth(60);

    const hpBarY = CASTLE.y + 15;
    const hpBarWidth = 200;

    this.hpBarBg = scene.add.rectangle(GAME_WIDTH / 2, hpBarY, hpBarWidth, 14, 0x142028, 1)
      .setStrokeStyle(2, 0x314958).setDepth(60);
    this.hpBarFill = scene.add.rectangle(GAME_WIDTH / 2 - hpBarWidth / 2 + 2, hpBarY, hpBarWidth - 4, 10, 0x41df56, 1)
      .setOrigin(0, 0.5).setDepth(61);
    this.hpText = scene.add.text(GAME_WIDTH / 2, hpBarY, "", {
      fontFamily: "Arial", fontSize: "11px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 2
    }).setOrigin(0.5).setDepth(62);
  }

  update(): void {
    this.waveText.setText(`第${this.gs.level}关 第${this.gs.wave}波`);

    const hpRatio = Math.max(0, this.gs.castleHp / this.gs.castleMaxHp);
    this.hpBarFill.width = 196 * hpRatio;
    this.hpBarFill.fillColor = hpRatio > 0.5 ? 0x41df56 : hpRatio > 0.25 ? 0xffaa00 : 0xff3333;
    this.hpText.setText(`${Math.max(0, Math.round(this.gs.castleHp))}/${this.gs.castleMaxHp}`);
  }
}