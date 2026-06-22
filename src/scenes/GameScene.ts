import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, createInitialState, LANES, CASTLE, LEVEL_COUNT, loadSave, saveSave, WAVE } from "../config/game";
import { createSpriteTextures } from "../render/spriteTextures";
import { createConfiguredAnimations } from "../render/animations";
import { ANIMATION_ATLAS } from "../config/animations";
import { SPRITE_DEFS } from "../config/sprites";
import { CombatSystem } from "../systems/CombatSystem";
import { StaminaSystem } from "../systems/StaminaSystem";
import { SlingshotSystem } from "../systems/SlingshotSystem";
import { WaveSystem } from "../systems/WaveSystem";
import { UpgradeSystem } from "../systems/UpgradeSystem";
import { SummonSystem } from "../systems/SummonSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { UpgradeModal } from "../ui/UpgradeModal";
import { Hud } from "../ui/Hud";
import { ActionButtons } from "../ui/ActionButtons";
import { CardPanel } from "../ui/CardPanel";
import { createButton, createPanel, createTitle } from "../ui/UIHelper";
import { createLoadingOverlay, type LoadingOverlayHandle } from "../ui/LoadingOverlay";
import { ALLY_SPECS } from "../config/units";
import type { AllyId, GameState } from "../types";

export class GameScene extends Phaser.Scene {
  private audio = new AudioSystem();
  private loadingOverlay: LoadingOverlayHandle | null = null;
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
  private currentLevel = 1;
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.loadingOverlay = createLoadingOverlay(this, "正在载入战斗");
    this.audio.preload(this, ["stage1", "stage2", "game-over", "game-win"]);
    for (const def of SPRITE_DEFS) {
      this.load.image(def.key, def.path);
    }
    this.load.multiatlas(ANIMATION_ATLAS.key, ANIMATION_ATLAS.dataPath, ANIMATION_ATLAS.texturePath);
  }

  create(data?: { level?: number }) {
    this.loadingOverlay?.destroy();
    this.loadingOverlay = null;
    this.currentLevel = data?.level || 1;
    this.paused = false;
    this.pauseOverlay = null;
    this.gameOverShown = false;
    this.state = createInitialState(this.currentLevel);
    createSpriteTextures(this);
    createConfiguredAnimations(this);
    this.audio.playBgm(this, this.currentLevel <= 4 ? "stage1" : "stage2");

    // 游戏背景
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg-battle");
    bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    // 城墙（底部）
    const wall = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT, "wall-new");
    wall.setOrigin(0.5, 1);
    wall.setDisplaySize(GAME_WIDTH, wall.height * (GAME_WIDTH / wall.width));
    wall.setDepth(1);

    // 弹弓支架
    const { slingX, slingY } = LANES;
    this.add.circle(slingX - 55, slingY - 2, 7, 0xd7b27c).setDepth(2);
    this.add.circle(slingX + 55, slingY - 2, 7, 0xd7b27c).setDepth(2);

    this.staminaSystem = new StaminaSystem(this.state);
    this.combatSystem = new CombatSystem(this, this.state);
    this.waveSystem = new WaveSystem(this, this.state);
    this.summonSystem = new SummonSystem(this.state);
    this.slingshotSystem = new SlingshotSystem(this, this.state);

    const upgradeModal = new UpgradeModal(this);
    this.upgradeSystem = new UpgradeSystem(this.state, (upgrades, onPick, onClose) => {
      this.slingshotSystem.cancelPending();
      upgradeModal.open(upgrades, onPick, onClose);
    });

    this.cardPanel = new CardPanel(this, this.state, (allyId: AllyId) => {
      if (this.summonSystem.selectCard(allyId, this)) {
        this.slingshotSystem.showBall(allyId);
      }
    });

    this.actionButtons = new ActionButtons(this, this.state, () => {
      this.upgradeSystem.tryOpenUpgradeModal(this);
    });

    this.slingshotSystem.setCombatSystem(this.combatSystem);
    this.slingshotSystem.setUpgradeSystem(this.upgradeSystem);
    this.hud = new Hud(this, this.state);

    // 暂停按钮
    const pauseBtn = createButton(this, GAME_WIDTH - 40, 30, 50, 36, "||", 0x555555, "20px");
    pauseBtn.setDepth(50);
    pauseBtn.on("pointerdown", () => this.togglePause());

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.state.modalOpen) return;
      // Skip left panel area and top-right button area
      if (pointer.x < 56) return;
      if (pointer.x > GAME_WIDTH - 80 && pointer.y < 120) return;
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
    this.slingshotSystem.cancelPending();
    this.state.castleHp = 0;
    this.audio.stopBgm();
    this.audio.play(this, "game-over");

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("DefeatScene", { level: this.currentLevel });
    });
  }

  private showVictory() {
    // 计算金币奖励
    const goldEarned = this.state.gold + this.currentLevel * 50;
    this.audio.stopBgm();
    this.audio.play(this, "game-win");

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("VictoryScene", {
        level: this.currentLevel,
        goldEarned,
      });
    });
  }

  private togglePause() {
    if (this.gameOverShown) return;
    this.paused = !this.state.modalOpen && this.paused ? false : !this.paused;

    if (this.paused) {
      this.state.modalOpen = true;
      this.showPauseOverlay();
    } else {
      this.state.modalOpen = false;
      this.hidePauseOverlay();
    }
  }

  private showPauseOverlay() {
    if (this.pauseOverlay) return;

    const container = this.add.container(0, 0).setDepth(150);

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    container.add(shade);

    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 320, 280, 0x1a2a3a, 0.95).setDepth(150);
    container.add(this.children.list[this.children.list.length - 1]);

    const title = createTitle(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, "已暂停", "40px", "#ffffff");
    title.setDepth(151);
    container.add(title);

    const continueBtn = createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 200, 50, "继续游戏", 0x4a9eff, "22px");
    continueBtn.setDepth(151);
    continueBtn.on("pointerdown", () => this.togglePause());
    container.add(continueBtn);

    const returnBtn = createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 200, 50, "返回关卡选择", 0x555555, "18px");
    returnBtn.setDepth(151);
    returnBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.paused = false;
        this.state.modalOpen = false;
        this.scene.start("LevelSelectScene");
      });
    });
    container.add(returnBtn);

    this.pauseOverlay = container;
  }

  private hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
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
