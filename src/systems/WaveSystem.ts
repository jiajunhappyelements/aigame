import type { EnemyId, GameState } from "../types";
import { ENEMY_SPECS } from "../config/enemies";
import { createFighter } from "../entities/FighterFactory";
import { WAVE_CONFIGS } from "../config/waveConfigs";
import { WAVE, GAME_WIDTH, getUnlockedAllies, getUnlockedEnemies, CASTLE } from "../config/game";
import { floatText } from "./Effects";
import Phaser from "phaser";

export class WaveSystem {
  private scene: Phaser.Scene;
  private gs: GameState;
  private spawnQueue: { enemyId: EnemyId; time: number }[] = [];
  private spawnTimer = 0;
  private waveActive = false;
  private nextWaveTimer = 0;
  private waitingForNextWave = false;
  private onWaveComplete?: () => void;
  private onVictory?: () => void;

  constructor(scene: Phaser.Scene, gs: GameState) {
    this.scene = scene;
    this.gs = gs;
  }

  setWaveCompleteCallback(cb: () => void): void {
    this.onWaveComplete = cb;
  }

  setVictoryCallback(cb: () => void): void {
    this.onVictory = cb;
  }

  startWave(): void {
    const key = `${this.gs.level}-${this.gs.wave}`;
    const config = WAVE_CONFIGS[key];
    if (!config) {
      if (this.onVictory) this.onVictory();
      return;
    }

    this.waveActive = true;
    this.spawnQueue = [];
    let t = 0;
    for (const entry of config) {
      for (let i = 0; i < entry.count; i++) {
        this.spawnQueue.push({ enemyId: entry.enemyId, time: t });
        t += entry.delay;
      }
    }
    this.spawnTimer = 0;
    floatText(this.scene, GAME_WIDTH / 2, 200, `第${this.gs.level}关 第${this.gs.wave}波`, 0xffffff);
  }

  update(dt: number): void {
    if (this.waveActive) {
      this.spawnTimer += dt / 1000;

      while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= this.spawnTimer) {
        const entry = this.spawnQueue.shift()!;
        this.spawnEnemy(entry.enemyId);
      }

      if (this.spawnQueue.length === 0 && this.gs.enemies.length === 0) {
        this.waveActive = false;
        this.advanceWave();
      }
    } else if (this.waitingForNextWave) {
      this.nextWaveTimer -= dt / 1000;
      if (this.nextWaveTimer <= 0) {
        this.waitingForNextWave = false;
        this.startWave();
      }
    }
  }

  private spawnEnemy(enemyId: EnemyId): void {
    const spec = ENEMY_SPECS[enemyId];
    const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
    const y = Phaser.Math.Between(20, 60);
    const enemy = createFighter(this.scene, enemyId, "enemy", x, y, spec);
    enemy.setDepth(enemy.moveMode === "flying" ? 16 : 8);
    this.gs.enemies.push(enemy);
  }

  private advanceWave(): void {
    this.gs.wave++;
    if (this.gs.wave > WAVE.countPerLevel) {
      if (this.onVictory) this.onVictory();
      return;
    }
    if (this.onWaveComplete) this.onWaveComplete();
    this.nextWaveTimer = WAVE.interWaveDelay;
    this.waitingForNextWave = true;
  }

  isWaveActive(): boolean {
    return this.waveActive;
  }
}