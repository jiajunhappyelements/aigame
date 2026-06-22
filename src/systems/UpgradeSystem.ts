import Phaser from "phaser";
import type { AllyId, GameState, Upgrade } from "../types";
import { getAllyPortrait } from "../config/portraits";
import { ALLY_SPECS } from "../config/units";
import { showToast } from "./Effects";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/game";

const SKILL_COST: Record<number, number> = { 1: 75, 2: 150, 3: 300 };
const MAX_DISPLAY = 8;

export class UpgradeSystem {
  private gs: GameState;
  private skill1Levels: Record<string, number> = {};
  private skill2Levels: Record<string, number> = {};

  constructor(
    private gsRef: GameState,
    private openModal: (
      upgrades: Upgrade[],
      onPick: (upgrade: Upgrade) => boolean,
      onClose: () => void
    ) => void
  ) {
    this.gs = gsRef;
  }

  getSkillLevels(allyId: AllyId): { sk1: number; sk2: number } {
    return {
      sk1: this.skill1Levels[`${allyId}_s1`] ?? 0,
      sk2: this.skill2Levels[`${allyId}_s2`] ?? 0,
    };
  }

  tryOpenUpgradeModal(scene: Phaser.Scene): void {
    if (this.gs.modalOpen) return;
    this.gs.modalOpen = true;
    const pool = this.createUpgradePool();
    this.openModal(
      pool,
      (upgrade) => this.applyUpgrade(scene, upgrade),
      () => this.closeModal()
    );
  }

  private closeModal(): void {
    this.gs.modalOpen = false;
  }

  private applyUpgrade(scene: Phaser.Scene, upgrade: Upgrade): boolean {
    if (this.gs.gold < upgrade.cost) {
      showToast(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, `金币不足 (需要${upgrade.cost})`);
      return false;
    }
    this.gs.gold -= upgrade.cost;
    upgrade.apply();
    this.gs.modalOpen = false;
    showToast(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, `${upgrade.skillName} 强化成功!`);
    return true;
  }

  private createUpgradePool(): Upgrade[] {
    const pool: Upgrade[] = [];

    // Show skills for all units unlocked at current level (not just those on field)
    for (const allyId of this.gs.unlockedAllies) {
      const spec = ALLY_SPECS[allyId];
      if (!spec) continue;

      const sk1Key = `${allyId}_s1`;
      const sk2Key = `${allyId}_s2`;
      const sk1Lv = this.skill1Levels[sk1Key] ?? 0;
      const sk2Lv = this.skill2Levels[sk2Key] ?? 0;

      if (spec.skill1 && sk1Lv < 3) {
        const nextLv = sk1Lv + 1;
        const cost = SKILL_COST[nextLv];
        const lvKey = `lv${nextLv}` as keyof typeof spec.skill1;
        const effectDesc = spec.skill1[lvKey] as string;
        const fullDesc = spec.skill1.desc.replace(
          /\d+%\/\d+%\/\d+%/,
          effectDesc
        );
        pool.push({
          id: `${allyId}_s1_lv${nextLv}`,
          title: `${spec.name}`,
          desc: `${spec.skill1.name} Lv${sk1Lv}→${nextLv}: ${fullDesc}`,
          icon: getAllyPortrait(allyId),
          cost,
          unitName: spec.name,
          skillName: spec.skill1.name,
          nextLevel: nextLv,
          apply: () => {
            this.skill1Levels[sk1Key] = nextLv;
            // Apply to all existing allies of this type
            for (const a of this.gs.allies) {
              if (a.id === allyId) a.skill1Level = nextLv;
            }
          }
        });
      }

      if (spec.skill2 && sk2Lv < 3) {
        const nextLv = sk2Lv + 1;
        const cost = SKILL_COST[nextLv];
        const lvKey = `lv${nextLv}` as keyof typeof spec.skill2;
        const effectDesc = spec.skill2![lvKey] as string;
        const fullDesc = spec.skill2!.desc.replace(
          /\d+%\/\d+%\/\d+%/,
          effectDesc
        );
        pool.push({
          id: `${allyId}_s2_lv${nextLv}`,
          title: `${spec.name}`,
          desc: `${spec.skill2!.name} Lv${sk2Lv}→${nextLv}: ${fullDesc}`,
          icon: getAllyPortrait(allyId),
          cost,
          unitName: spec.name,
          skillName: spec.skill2!.name,
          nextLevel: nextLv,
          apply: () => {
            this.skill2Levels[sk2Key] = nextLv;
            for (const a of this.gs.allies) {
              if (a.id === allyId) a.skill2Level = nextLv;
            }
          }
        });
      }
    }

    // Randomly pick MAX_DISPLAY if pool exceeds limit
    if (pool.length > MAX_DISPLAY) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool.slice(0, MAX_DISPLAY);
    }
    return pool;
  }
}
