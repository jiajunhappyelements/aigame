import Phaser from "phaser";
import type { Upgrade } from "../types";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";
import { createButton } from "../ui/UIHelper";

const BAR_W = 460;
const BAR_H = 70;
const BAR_GAP = 12;
const PANEL_X = GAME_WIDTH / 2;

export class UpgradeModal {
  constructor(private scene: Phaser.Scene) {}

  open(
    upgrades: Upgrade[],
    onPick: (upgrade: Upgrade) => boolean,
    onClose: () => void
  ): void {
    const modal = this.scene.add.container(0, 0).setDepth(200);

    // Full-screen shade
    const shade = this.scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x071019, 0.75
    ).setInteractive();
    modal.add(shade);

    if (upgrades.length === 0) {
      const msg = this.scene.add.text(GAME_WIDTH / 2, 460, "没有可强化的技能", {
        fontFamily: "Arial", fontSize: "22px", color: "#aaaaaa",
        stroke: "#000000", strokeThickness: 4
      }).setOrigin(0.5);
      modal.add(msg);

      const closeBtn = createButton(this.scene, GAME_WIDTH / 2, 530, 160, 45, "关闭", 0x555555, "18px");
      closeBtn.setDepth(201);
      closeBtn.on("pointerdown", () => {
        modal.destroy();
        onClose();
      });
      modal.add(closeBtn);
      return;
    }

    const count = upgrades.length;
    const totalH = count * BAR_H + (count - 1) * BAR_GAP;
    const listTop = 460 - totalH / 2 + BAR_H / 2;

    const title = this.scene.add.text(GAME_WIDTH / 2, listTop - 55, "选择强化", {
      fontFamily: "Arial", fontSize: "28px", color: "#f2fbff",
      stroke: "#132535", strokeThickness: 6
    }).setOrigin(0.5);
    modal.add(title);

    upgrades.forEach((upgrade, index) => {
      const y = listTop + index * (BAR_H + BAR_GAP);
      this.createUpgradeBar(modal, y, upgrade, () => {
        const success = onPick(upgrade);
        if (success) {
          modal.destroy();
        }
      });
    });

    // Close button
    const closeY = listTop + count * (BAR_H + BAR_GAP) + 30;
    const closeBtn = createButton(this.scene, GAME_WIDTH / 2, closeY, 160, 45, "关闭", 0x555555, "18px");
    closeBtn.setDepth(201);
    closeBtn.on("pointerdown", () => {
      modal.destroy();
      onClose();
    });
    modal.add(closeBtn);
  }

  private createUpgradeBar(
    modal: Phaser.GameObjects.Container,
    y: number,
    upgrade: Upgrade,
    onPick: () => void
  ): void {
    // Background bar — this is the interactive element
    const bg = this.scene.add.rectangle(PANEL_X, y, BAR_W, BAR_H, 0x1a2a3a, 0.95)
      .setStrokeStyle(2, 0x4a9eff, 0.5)
      .setInteractive({ useHandCursor: true });
    modal.add(bg);

    // Unit icon
    const iconX = PANEL_X - BAR_W / 2 + 40;
    const icon = this.scene.add.image(iconX, y, upgrade.icon).setDisplaySize(44, 44);
    modal.add(icon);

    // Unit name + skill desc
    const textX = iconX + 35;
    const nameText = this.scene.add.text(textX, y - 9, upgrade.unitName || upgrade.title, {
      fontFamily: "Arial", fontSize: "16px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0, 0.5);
    modal.add(nameText);

    const descText = this.scene.add.text(textX, y + 11, upgrade.desc, {
      fontFamily: "Arial", fontSize: "13px", color: "#aaaaaa",
      stroke: "#000000", strokeThickness: 2
    }).setOrigin(0, 0.5);
    modal.add(descText);

    // Button area (visual only, click handled by bg)
    const btnX = PANEL_X + BAR_W / 2 - 56;
    const btnBg = this.scene.add.rectangle(btnX, y, 80, 44, 0xffd700, 1)
      .setStrokeStyle(2, 0xffffff, 0.4);
    const coinIcon = this.scene.add.image(btnX - 14, y, "coin").setDisplaySize(18, 18);
    const costText = this.scene.add.text(btnX + 8, y, `${upgrade.cost}`, {
      fontFamily: "Arial", fontSize: "16px", color: "#3a352d",
      stroke: "#ffffff", strokeThickness: 2
    }).setOrigin(0, 0.5);
    modal.add([btnBg, coinIcon, costText]);

    // Button area bounds for hit detection
    const btnLeft = PANEL_X + BAR_W / 2 - 96;
    const btnRight = PANEL_X + BAR_W / 2 - 16;

    bg.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.x >= btnLeft && pointer.x <= btnRight) {
        onPick();
      }
    });
    bg.on("pointerover", () => {
      bg.setStrokeStyle(3, 0xffd700, 1);
      btnBg.setStrokeStyle(3, 0xffffff, 1);
    });
    bg.on("pointerout", () => {
      bg.setStrokeStyle(2, 0x4a9eff, 0.5);
      btnBg.setStrokeStyle(2, 0xffffff, 0.4);
    });
  }
}
