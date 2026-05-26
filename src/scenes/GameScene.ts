import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, createInitialState, LANES, CASTLE } from "../config/game";
import { createBackdrop } from "../render/backdrop";
import { createSpriteTextures } from "../render/spriteTextures";
import { SPRITE_DEFS } from "../config/sprites";
import { CombatSystem } from "../systems/CombatSystem";
import { StaminaSystem } from "../systems/StaminaSystem";
import { SlingshotSystem } from "../systems/SlingshotSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { UpgradeSystem } from "../systems/UpgradeSystem";
import { SummonSystem } from "../systems/SummonSystem";
import { UpgradeModal } from "../ui/UpgradeModal";
import { Hud } from "../ui/Hud";
import { ActionButtons } from "../ui/ActionButtons";
import { CardPanel } from "../ui/CardPanel";
import { ALLY_SPECS } from "../config/units";
import type { AllyId, GameState } from "../types";

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private hud!: Hud;
  private cardPanel!: CardPanel;
  private actionButtons!: ActionButtons;
  private waveSystem!: WaveSystem;
  private combatSystem!: CombatSystem;
  private staminaSystem!: StaminaSystem;
  private slingshotSystem!: SlingshotSystem;
  private summonSystem!: SummonSystem;
  private upgradeSystem!: UpgradeSystem;

  preload() {
    for (const def of SPRITE_DEFS) {
      this.load.image(def.key, def.path);
    }
  }

  create() {
    this.state = createInitialState();
    createSpriteTextures(this);
    createBackdrop(this);

    this.staminaSystem = new StaminaSystem(this.state);
    this.combatSystem = new CombatSystem(this, this.state);
    this.waveSystem = new WaveSystem(this, this.state);
    this.summonSystem = new SummonSystem(this.state);
    this.slingshotSystem = new SlingshotSystem(this, this.state);

    const upgradeModal = new UpgradeModal(this);
    this.upgradeSystem = new UpgradeSystem(this.state, (upgrades, onPick) => {
      this.slingshotSystem.cancelPending();
      upgradeModal.open(upgrades, onPick);
    });

    this.cardPanel = new CardPanel(this, this.state, (allyId: AllyId) => {
      if (this.state.ballActive) return;
      if (this.summonSystem.selectCard(allyId, this)) {
        this.slingshotSystem.showBall(allyId);
      }
    });

    this.actionButtons = new ActionButtons(this, this.state, () => {
      this.upgradeSystem.tryOpenUpgradeModal(this);
    });

    this.slingshotSystem.setCombatSystem(this.combatSystem);
    this.hud = new Hud(this, this.state);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.state.modalOpen) return;
      if (pointer.x < 56) return;
      this.slingshotSystem.startDrag(pointer);
    });

    this.waveSystem.setWaveCompleteCallback(() => {
      this.staminaSystem.addWaveStamina();
      this.state.summonCountsThisWave = {};
      this.cardPanel.refreshCards();
      this.applyHpGrowth();
    });
    this.waveSystem.setVictoryCallback(() => this.showVictory());

    this.waveSystem.startWave();
  }

  update(_time: number, delta: number) {
    if (!this.state) return;
    if (this.state.modalOpen) {
      this.updateUi();
      return;
    }

    this.staminaSystem.update(delta);
    this.waveSystem.update(delta);
    this.combatSystem.update(delta, this.time.now);
    this.slingshotSystem.update(delta);
    this.updateUi();
  }

  private updateUi() {
    this.hud.update();
    this.cardPanel.update();
    this.actionButtons.update();
    this.updateHpBars();

    if (this.state.castleHp <= 0) {
      this.showGameOver();
    }
  }

  private updateHpBars() {
    const allFighters = [...this.state.allies, ...this.state.enemies];
    for (const f of allFighters) {
      if (!f.active) continue;
      const hpBar = f.getByName("hp") as Phaser.GameObjects.Rectangle | null;
      if (!hpBar) continue;
      const ratio = Math.max(0, f.hp / f.maxHp);
      hpBar.width = 44 * ratio;
      if (f.team === "ally") {
        hpBar.fillColor = ratio > 0.6 ? 0x4af06a : ratio > 0.3 ? 0xf4e842 : 0xff5b4f;
      }
    }
  }

  private gameOverShown = false;

  private showGameOver() {
    if (this.gameOverShown) return;
    this.gameOverShown = true;
    this.scene.pause();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(100);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, "GAME OVER", {
        fontFamily: "Arial", fontSize: "48px", color: "#ff3333",
        align: "center", stroke: "#000000", strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(101);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "基地被攻破", {
        fontFamily: "Arial", fontSize: "20px", color: "#ffffff",
        align: "center", stroke: "#000000", strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101);
    const restartBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "重新开始", {
        fontFamily: "Arial", fontSize: "24px", color: "#4a9eff",
        align: "center", stroke: "#000000", strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive();
    restartBtn.on("pointerdown", () => this.scene.restart());
    this.state.castleHp = 0;
    this.slingshotSystem.cancelPending();
  }

  private showVictory() {
    this.scene.pause();
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75).setDepth(100);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, "胜利!", {
        fontFamily: "Arial", fontSize: "48px", color: "#ffd700",
        align: "center", stroke: "#000000", strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(101);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, "所有关卡已通关!", {
        fontFamily: "Arial", fontSize: "20px", color: "#ffffff",
        align: "center", stroke: "#000000", strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101);
    const restartBtn = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "再来一局", {
        fontFamily: "Arial", fontSize: "24px", color: "#4a9eff",
        align: "center", stroke: "#000000", strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive();
    restartBtn.on("pointerdown", () => this.scene.restart());
  }

  private applyHpGrowth() {
    for (const ally of this.state.allies) {
      if (!ally.active) continue;
      const spec = ALLY_SPECS[ally.id as AllyId];
      if (!spec) continue;
      const gain = spec.hpGrowth;
      ally.maxHp = Math.min(spec.hpCap, ally.maxHp + gain);
      ally.hp = Math.min(ally.maxHp, ally.hp + gain);
    }
  }
}