import Phaser from "phaser";
import type { GameState } from "../types";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";

export class ActionButtons {
  private upgradeButton: Phaser.GameObjects.Container;
  private goldText: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private gs: GameState,
    onUpgrade: () => void
  ) {
    this.upgradeButton = this.createButton(GAME_WIDTH - 40, GAME_HEIGHT - 40, "强化", "coin", onUpgrade);

    // 金币数量显示在右下角按钮旁边
    this.goldText = scene.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 80, "", {
      fontFamily: "Arial", fontSize: "18px", color: "#ffd700",
      stroke: "#173040", strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
  }

  update(): void {
    this.upgradeButton.setAlpha(!this.gs.modalOpen ? 1 : 0.55);
    this.goldText.setText(`金币 ${this.gs.gold}`);
  }

  private createButton(x: number, y: number, title: string, iconKey: string, onClick: () => void): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y).setDepth(42);
    button.setSize(56, 44);
    button.setInteractive(new Phaser.Geom.Rectangle(-28, -22, 56, 44), Phaser.Geom.Rectangle.Contains);
    button.on("pointerdown", onClick);

    const bg = this.scene.add.rectangle(0, 0, 56, 44, 0x3b4f56, 1).setStrokeStyle(3, 0xbea479);
    const icon = this.scene.add.image(0, -6, iconKey).setDisplaySize(24, 24);
    const label = this.scene.add.text(0, 14, title, {
      fontFamily: "Arial", fontSize: "12px", color: "#f6f1c7",
      stroke: "#342814", strokeThickness: 3
    }).setOrigin(0.5);

    button.add([bg, icon, label]);
    return button;
  }
}