import Phaser from "phaser";
import type { GameState, Upgrade } from "../types";
import { ALLY_SPECS } from "../config/units";
import { GAME_WIDTH } from "../config/game";

export class UpgradeModal {
  static readonly optionCount = 3;

  constructor(private scene: Phaser.Scene) {}

  open(upgrades: Upgrade[], onPick: (upgrade: Upgrade) => void): void {
    const modal = this.scene.add.container(GAME_WIDTH / 2, 480).setDepth(200);
    const shade = this.scene.add.rectangle(0, 0, GAME_WIDTH, 960, 0x071019, 0.72);
    const title = this.scene.add.text(0, -210, "选择强化", {
      fontFamily: "Arial", fontSize: "30px", color: "#f2fbff",
      stroke: "#132535", strokeThickness: 7
    }).setOrigin(0.5);
    modal.add([shade, title]);

    upgrades.forEach((upgrade, index) => {
      const x = -166 + index * 166;
      const card = this.scene.add.container(x, -20);
      card.setSize(146, 250);
      card.setInteractive(new Phaser.Geom.Rectangle(-73, -125, 146, 250), Phaser.Geom.Rectangle.Contains);
      card.on("pointerdown", () => {
        modal.destroy();
        onPick(upgrade);
      });

      const bg = this.scene.add.rectangle(0, 0, 146, 250, 0xf1ead7, 1).setStrokeStyle(5, 0x4c7b91);
      const cap = this.scene.add.rectangle(0, -103, 138, 42, 0x3d788e, 1);
      const name = this.scene.add.text(0, -104, upgrade.title, {
        fontFamily: "Arial", fontSize: "18px", color: "#ffffff",
        stroke: "#1d3c48", strokeThickness: 4
      }).setOrigin(0.5);
      const desc = this.scene.add.text(0, 56, upgrade.desc, {
        fontFamily: "Arial", fontSize: "16px", color: "#3a352d",
        align: "center", wordWrap: { width: 116, useAdvancedWrap: true }
      }).setOrigin(0.5);

      const icon = this.scene.add.image(0, -35, upgrade.icon).setDisplaySize(74, 74);
      card.add([bg, cap, name, icon, desc]);
      modal.add(card);
    });
  }
}