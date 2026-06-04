import type { AllyId, EnemyId, GameState } from "../types";
import { ALLY_SPECS } from "./units";
import { ENEMY_SPECS } from "./enemies";

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;
export const TILE_SIZE = 96;

export const LANES = {
  wallY: 780,
  summonY: 870,
  slingX: 270,
  slingY: 870,
  topBound: 50,
  leftBound: 0,
  rightBound: GAME_WIDTH,
  bottomBound: GAME_HEIGHT,
};

export const STAMINA = {
  max: 30,
  regenInterval: 1.5,
  regenAmount: 1,
  initialPerWave: 15,
};

export const FIELD_LIMITS = {
  maxAllies: 8,
  maxSameName: 2,
};

export const SLINGSHOT = {
  pullMin: 30,
  pullMax: 150,
  v0Min: 2 * TILE_SIZE,
  v0Max: 14 * TILE_SIZE,
  friction: 8 * TILE_SIZE,
  gravity: 600,
  airDrag: 0.998,
  bounceDamping: 0.45,
  landingDamageMultiplier: 0.5,
  landingRadius: 1.0 * TILE_SIZE,
};

export const CASTLE = {
  maxHp: 2800,
  y: LANES.wallY,
};

export const WAVE = {
  countPerLevel: 8,
  totalLevels: 7,
  interWaveDelay: 3.0,
  spawnPadding: 200,
};

export const LEVEL_COUNT = 7;

export const LEVEL_NAMES: Record<number, string> = {
  1: "哥布林入侵",
  2: "骷髅军团",
  3: "暗夜蝙蝠",
  4: "幽灵来袭",
  5: "巨龙之巢",
  6: "巨魔攻城",
  7: "魔王降临",
};

const SAVE_KEY = "sling-guardians-save";

export function loadSave(): { unlockedLevel: number; stars: Record<number, number>; gold: number } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unlockedLevel: 1, stars: {}, gold: 0 };
}

export function saveSave(data: { unlockedLevel: number; stars: Record<number, number>; gold: number }) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export const LEVEL_UNLOCKS: Record<number, { allies: AllyId[]; enemies: EnemyId[] }> = {
  1: { allies: ["A01", "A02", "A03"], enemies: ["E01", "E02"] },
  2: { allies: ["A04", "A10"], enemies: ["E03"] },
  3: { allies: ["A05"], enemies: ["E04"] },
  4: { allies: ["A06"], enemies: ["E05"] },
  5: { allies: ["A07"], enemies: ["E06", "E07"] },
  6: { allies: ["A08"], enemies: ["E08"] },
  7: { allies: ["A09"], enemies: ["E09", "E10"] },
};

export function getUnlockedAllies(level: number): AllyId[] {
  const result: AllyId[] = [];
  for (let i = 1; i <= level && i <= 7; i++) {
    result.push(...LEVEL_UNLOCKS[i].allies);
  }
  return result;
}

export function getUnlockedEnemies(level: number): EnemyId[] {
  const result: EnemyId[] = [];
  for (let i = 1; i <= level && i <= 7; i++) {
    result.push(...LEVEL_UNLOCKS[i].enemies);
  }
  return result;
}

export function createInitialState(startLevel = 1): GameState {
  const level = startLevel;
  return {
    level,
    wave: 1,
    waveTime: 0,
    spawnTimer: 0,
    castleHp: CASTLE.maxHp,
    castleMaxHp: CASTLE.maxHp,
    stamina: STAMINA.initialPerWave,
    staminaMax: STAMINA.max,
    staminaRegenTimer: 0,
    gold: 0,
    allies: [],
    enemies: [],
    pendingCardId: null,
    pendingBall: null,
    dragging: false,
    modalOpen: false,
    projectiles: [],
    launchCooldown: 0,
    summonCountsThisWave: {},
    unlockedAllies: getUnlockedAllies(level),
    unlockedEnemies: getUnlockedEnemies(level),
    unitDamageMultiplier: 1.0,
    hpMultiplier: 1.0,
    bountyMultiplier: 1.0,
    waveEnemyQueue: [],
    waveEnemyTimer: 0,
  };
}
