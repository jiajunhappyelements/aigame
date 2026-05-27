import Phaser from "phaser";
import type { AllyId, GameState } from "../types";
import { ALLY_SPECS } from "../config/units";
import { FIELD_LIMITS, GAME_HEIGHT, GAME_WIDTH } from "../config/game";

const CARD_W = 48;
const CARD_H = 48;
const CARD_GAP = 3;
const PANEL_X = 4;

export class CardPanel {
  private scene: Phaser.Scene;
  private gs: GameState;
  private onSelectCard: (allyId: AllyId) => void;
  private cards: Map<AllyId, Phaser.GameObjects.Container> = new Map();
  private bg: Phaser.GameObjects.Rectangle;
  private staminaBarBg: Phaser.GameObjects.Rectangle;
  private staminaBarFill: Phaser.GameObjects.Rectangle;
  private staminaText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gs: GameState, onSelectCard: (allyId: AllyId) => void) {
    this.scene = scene;
    this.gs = gs;
    this.onSelectCard = onSelectCard;

    this.bg = scene.add.rectangle(PANEL_X + CARD_W / 2, GAME_HEIGHT - 60, CARD_W + 4, 320, 0x1a2a38, 0.85)
      .setStrokeStyle(2, 0x3a5a72)
      .setDepth(40);

    this.staminaBarBg = scene.add.rectangle(PANEL_X + CARD_W / 2, GAME_HEIGHT - 35, CARD_W, 8, 0x142028, 1)
      .setStrokeStyle(1, 0x3a5a72)
      .setDepth(41);

    this.staminaBarFill = scene.add.rectangle(PANEL_X, GAME_HEIGHT - 35, CARD_W, 6, 0x4af0a0, 1)
      .setOrigin(0, 0.5)
      .setDepth(41);

    this.staminaText = scene.add.text(PANEL_X + CARD_W / 2, GAME_HEIGHT - 22, "", {
      fontFamily: "Arial", fontSize: "9px", color: "#ffffff",
      stroke: "#173040", strokeThickness: 2
    }).setOrigin(0.5).setDepth(41);

    this.refreshCards();
  }

  refreshCards(): void {
    for (const [, card] of this.cards) {
      card.destroy();
    }
    this.cards.clear();

    const allies = this.gs.unlockedAllies;
    const totalHeight = allies.length * (CARD_H + CARD_GAP);
    let y = GAME_HEIGHT - 50 - totalHeight;
    for (const allyId of allies) {
      const spec = ALLY_SPECS[allyId];
      const card = this.createCard(PANEL_X + CARD_W / 2, y, allyId, spec);
      this.cards.set(allyId, card);
      y += CARD_H + CARD_GAP;
    }
  }

  private createCard(x: number, y: number, allyId: AllyId, spec: typeof ALLY_SPECS[AllyId]): Phaser.GameObjects.Container {
    const card = this.scene.add.container(x, y).setDepth(42);
    card.setSize(CARD_W, CARD_H);

    const bgRect = this.scene.add.rectangle(0, 0, CARD_W, CARD_H, spec.tint, 0.7)
      .setStrokeStyle(2, 0xffffff);

    const icon = this.scene.add.image(0, -4, spec.texture).setDisplaySize(28, 28);
    const costText = this.scene.add.text(CARD_W / 2 - 2, -CARD_H / 2 + 2, `${spec.staminaCost}`, {
      fontFamily: "Arial", fontSize: "10px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(1, 0);
    costText.name = "cost";
    const remainText = this.scene.add.text(CARD_W / 2 - 2, CARD_H / 2 - 2, `${spec.maxSameName}`, {
      fontFamily: "Arial", fontSize: "10px", color: "#4af0a0",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(1, 1);
    remainText.name = "remain";
    const nameText = this.scene.add.text(0, 14, spec.name.substring(0, 2), {
      fontFamily: "Arial", fontSize: "10px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 2
    }).setOrigin(0.5);

    const hitZone = this.scene.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    hitZone.on("pointerdown", () => {
      if (this.gs.ballActive) return;
      this.onSelectCard(allyId);
    });

    // Keep the hit zone last so art and labels never intercept selecting the card.
    card.add([bgRect, icon, remainText, costText, nameText, hitZone]);

    return card;
  }

  update(): void {
    const maxSt = this.gs.staminaMax;
    const curSt = this.gs.stamina;
    this.staminaBarFill.width = CARD_W * (curSt / maxSt);
    this.staminaText.setText(`${curSt}/${maxSt}`);

    for (const [allyId, card] of this.cards) {
      const spec = ALLY_SPECS[allyId];
      const sameNameCount = this.gs.allies.filter(a => a.id === allyId && a.active).length;
      const remain = spec.maxSameName - sameNameCount;
      const remainObj = card.getByName("remain") as Phaser.GameObjects.Text;
      if (remainObj) {
        remainObj.setText(`${remain}`);
        remainObj.setColor(remain > 0 ? "#4af0a0" : "#ff5b4f");
      }

      const canAfford = curSt >= spec.staminaCost;
      const atFieldLimit = this.gs.allies.filter(a => a.active).length >= FIELD_LIMITS.maxAllies;
      const hasBall = this.gs.ballActive;
      const available = canAfford && !atFieldLimit && !hasBall && remain > 0;
      card.setAlpha(available ? 1 : 0.4);

      if (allyId === this.gs.pendingCardId) {
        card.setAlpha(1);
        (card.getAt(0) as Phaser.GameObjects.Rectangle).setStrokeStyle(3, 0x4a9eff);
      } else {
        (card.getAt(0) as Phaser.GameObjects.Rectangle).setStrokeStyle(2, 0xffffff);
      }
    }
  }
}
