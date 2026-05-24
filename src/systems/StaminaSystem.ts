import type { GameState } from "../types";
import { STAMINA } from "../config/game";

export class StaminaSystem {
  private gs: GameState;

  constructor(gs: GameState) {
    this.gs = gs;
  }

  update(dt: number): void {
    if (this.gs.stamina >= this.gs.staminaMax) {
      this.gs.staminaRegenTimer = 0;
      return;
    }
    this.gs.staminaRegenTimer += dt / 1000;
    if (this.gs.staminaRegenTimer >= STAMINA.regenInterval) {
      this.gs.staminaRegenTimer -= STAMINA.regenInterval;
      this.gs.stamina = Math.min(this.gs.staminaMax, this.gs.stamina + STAMINA.regenAmount);
    }
  }

  canAfford(cost: number): boolean {
    return this.gs.stamina >= cost;
  }

  spend(cost: number): void {
    this.gs.stamina -= cost;
  }

  addWaveStamina(): void {
    this.gs.stamina = Math.min(this.gs.staminaMax, this.gs.stamina + STAMINA.initialPerWave);
  }
}