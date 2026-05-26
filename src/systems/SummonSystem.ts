import type { AllyId, GameState } from "../types";
import { ALLY_SPECS } from "../config/units";
import { FIELD_LIMITS, GAME_WIDTH, LANES } from "../config/game";
import { floatText } from "./Effects";

export class SummonSystem {
  private gs: GameState;

  constructor(gs: GameState) {
    this.gs = gs;
  }

  selectCard(cardId: AllyId, scene: Phaser.Scene): boolean {
    const spec = ALLY_SPECS[cardId];

    // If this card is already pending, don't re-select (avoid double stamina deduct)
    if (this.gs.pendingCardId === cardId) return false;

    // If already pending a different card, cancel and refund
    if (this.gs.pendingCardId && this.gs.pendingCardId !== cardId) {
      const prevSpec = ALLY_SPECS[this.gs.pendingCardId];
      if (prevSpec) {
        this.gs.stamina += prevSpec.staminaCost;
      }
      this.gs.pendingCardId = null;
      this.gs.dragging = false;
    }

    if (this.gs.ballActive) return false;

    if (this.gs.stamina < spec.staminaCost) {
      floatText(scene, GAME_WIDTH / 2, LANES.summonY - 30, "体力不足", 0xff5b4f);
      return false;
    }

    if (this.gs.allies.filter(a => a.active).length >= FIELD_LIMITS.maxAllies) {
      floatText(scene, GAME_WIDTH / 2, LANES.summonY - 30, "已到上场限制", 0xff5b4f);
      return false;
    }

    const sameNameCount = this.gs.allies.filter(a => a.id === cardId && a.active).length;
    if (sameNameCount >= spec.maxSameName) {
      floatText(scene, GAME_WIDTH / 2, LANES.summonY - 30, `已到同名上限(${spec.maxSameName})`, 0xff5b4f);
      return false;
    }

    this.gs.stamina -= spec.staminaCost;
    return true;
  }
}