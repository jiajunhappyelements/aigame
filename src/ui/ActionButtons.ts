import Phaser from "phaser";
import type { GameState } from "../types";
import { GAME_WIDTH } from "../config/game";

const BTN_W = 56;
const BTN_H = 44;

export class ActionButtons {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;

  constructor(
    private scene: Phaser.Scene,
    private gs: GameState,
    onUpgrade: () => void
  ) {
    const x = GAME_WIDTH - 40;
    const y = 110;

    this.container = scene.add.container(x, y).setDepth(42);

    this.bg = scene.add.rectangle(0, 0, BTN_W, BTN_H, 0x3b4f56, 1)
      .setStrokeStyle(3, 0xbea479);

    const icon = scene.add.image(0, -6, "coin").setDisplaySize(24, 24);

    const label = scene.add.text(0, 14, "强化", {
      fontFamily: "Arial", fontSize: "12px", color: "#f6f1c7",
      stroke: "#342814", strokeThickness: 3
    }).setOrigin(0.5);

    // Invisible hit zone on top — last child, intercepts all clicks
    const hitZone = scene.add.rectangle(0, 0, BTN_W, BTN_H, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    this.container.add([this.bg, icon, label, hitZone]);

    hitZone.on("pointerdown", onUpgrade);
    hitZone.on("pointerover", () => {
      this.container.setScale(1.1);
      this.bg.setStrokeStyle(3, 0xffd700, 1);
    });
    hitZone.on("pointerout", () => {
      this.container.setScale(1.0);
      this.bg.setStrokeStyle(3, 0xbea479);
    });
  }

  update(): void {
    const alpha = !this.gs.modalOpen ? 1 : 0.55;
    this.container.setAlpha(alpha);
  }
}
