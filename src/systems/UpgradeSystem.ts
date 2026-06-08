import Phaser from "phaser";
import type { AllyId, GameState, Upgrade } from "../types";
import { getAllyPortrait } from "../config/portraits";
import { ALLY_SPECS } from "../config/units";
import { floatText } from "./Effects";

export class UpgradeSystem {
  private gs: GameState;
  private upgradeCost = 100;
  private costMultiplier = 1.55;

  constructor(
    private gsRef: GameState,
    private openModal: (upgrades: Upgrade[], onPick: (upgrade: Upgrade) => void) => void
  ) {
    this.gs = gsRef;
  }

  tryOpenUpgradeModal(scene: Phaser.Scene): void {
    if (this.gs.modalOpen) return;
    if (this.gs.gold < this.upgradeCost) {
      floatText(scene, 270, 860, "金币不足", 0xffb3a7);
      return;
    }
    this.gs.gold -= this.upgradeCost;
    this.gs.modalOpen = true;
    const options = Phaser.Utils.Array.Shuffle(this.createUpgradePool()).slice(0, 3);
    this.openModal(options, (upgrade) => this.applyUpgrade(scene, upgrade));
  }

  private applyUpgrade(scene: Phaser.Scene, upgrade: Upgrade): void {
    upgrade.apply();
    this.upgradeCost = Math.round(this.upgradeCost * this.costMultiplier);
    this.gs.modalOpen = false;
    floatText(scene, 270, 210, upgrade.title, 0xfff0a8);
  }

  get currentCost(): number {
    return this.upgradeCost;
  }

  private createUpgradePool(): Upgrade[] {
    const pool: Upgrade[] = [];

    for (const ally of this.gs.allies) {
      const allyId = ally.id as AllyId;
      const spec = ALLY_SPECS[allyId];
      if (!spec) continue;

      if (spec.skill1 && ally.skill1Level < 3) {
        const lv = ally.skill1Level + 1;
        const cost = lv === 2 ? 80 : 200;
        pool.push({
          id: `${ally.id}_s1_lv${lv}`,
          title: `${spec.name}·${spec.skill1.name}`,
          desc: `技能升至Lv${lv}`,
          icon: getAllyPortrait(allyId),
          apply: () => { ally.skill1Level = lv; }
        });
      }

      if (spec.skill2 && ally.skill2Level < 3) {
        const lv = ally.skill2Level + 1;
        const cost = lv === 2 ? 80 : 200;
        pool.push({
          id: `${ally.id}_s2_lv${lv}`,
          title: `${spec.name}·${spec.skill2.name}`,
          desc: `技能升至Lv${lv}`,
          icon: getAllyPortrait(allyId),
          apply: () => { ally.skill2Level = lv; }
        });
      }
    }

    pool.push({
      id: "all_hp",
      title: "坚韧护符",
      desc: "所有单位生命+25%",
      icon: "wall",
      apply: () => {
        this.gs.hpMultiplier += 0.25;
        for (const a of this.gs.allies) {
          const gain = a.maxHp * 0.25;
          a.maxHp += gain;
          a.hp += gain;
        }
      }
    });

    pool.push({
      id: "bounty",
      title: "赏金契约",
      desc: "击杀金币+25%",
      icon: "coin",
      apply: () => { this.gs.bountyMultiplier += 0.25; }
    });

    return pool;
  }
}
