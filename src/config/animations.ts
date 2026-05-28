import type { AllyId, EnemyId, EffectAnimationDef, FighterAnimationDef } from "../types";

export const ANIMATION_ATLAS = {
  key: "animation-atlas",
  dataPath: "/assets/atlas/animations.json",
  texturePath: "/assets/atlas/",
} as const;

const sequence = (path: string, action: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${path}/${action}_${String(index).padStart(2, "0")}.png`);

export const FIGHTER_ANIMATIONS: Partial<Record<AllyId | EnemyId, FighterAnimationDef>> = {
  A01: {
    base: {
      animationKey: "A01-idle",
      frames: sequence("allies/A01/idle", "idle", 4),
      frameRate: 5,
      displayWidth: 72,
      displayHeight: 84,
      repeat: -1,
    },
    attack: {
      animationKey: "A01-attack",
      frames: sequence("allies/A01/attack", "attack", 4),
      frameRate: 12,
      displayWidth: 180,
      displayHeight: 84,
    },
  },
  A02: {
    base: {
      animationKey: "A02-idle",
      frames: sequence("allies/A02/idle", "idle", 4),
      frameRate: 5,
      displayWidth: 72,
      displayHeight: 84,
      repeat: -1,
    },
    attack: {
      animationKey: "A02-attack",
      frames: sequence("allies/A02/attack", "attack", 4),
      frameRate: 12,
      displayWidth: 168,
      displayHeight: 96,
    },
  },
  A03: {
    base: {
      animationKey: "A03-idle",
      frames: sequence("allies/A03/idle", "idle", 4),
      frameRate: 5,
      displayWidth: 72,
      displayHeight: 84,
      repeat: -1,
    },
    attack: {
      animationKey: "A03-attack",
      frames: sequence("allies/A03/attack", "attack", 4),
      frameRate: 12,
      displayWidth: 168,
      displayHeight: 96,
    },
  },
  E01: {
    base: {
      animationKey: "E01-walk",
      frames: sequence("enemies/E01/walk", "walk", 4),
      frameRate: 7,
      displayWidth: 60,
      displayHeight: 70,
      repeat: -1,
    },
    attack: {
      animationKey: "E01-attack",
      frames: sequence("enemies/E01/attack", "attack", 4),
      frameRate: 12,
      displayWidth: 100,
      displayHeight: 80,
    },
  },
  E02: {
    base: {
      animationKey: "E02-walk",
      frames: sequence("enemies/E02/walk", "walk", 4),
      frameRate: 7,
      displayWidth: 60,
      displayHeight: 70,
      repeat: -1,
    },
    attack: {
      animationKey: "E02-attack",
      frames: sequence("enemies/E02/attack", "attack", 4),
      frameRate: 12,
      displayWidth: 120,
      displayHeight: 80,
    },
  },
};

export const EFFECT_ANIMATIONS: Record<string, EffectAnimationDef> = {
  "landing-impact": {
    animationKey: "landing-impact",
    frames: sequence("effects/landing-impact", "impact", 4),
    frameRate: 14,
    displayWidth: 132,
    displayHeight: 88,
    depth: 82,
  },
};

export function getFighterAnimation(id: AllyId | EnemyId): FighterAnimationDef | undefined {
  return FIGHTER_ANIMATIONS[id];
}

export function getEffectAnimation(key: string): EffectAnimationDef | undefined {
  return EFFECT_ANIMATIONS[key];
}
