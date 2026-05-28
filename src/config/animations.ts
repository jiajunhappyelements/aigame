import type { AllyId, EnemyId, EffectAnimationDef, FighterAnimationDef } from "../types";

export const ANIMATION_ATLAS = {
  key: "animation-atlas",
  dataPath: "/assets/atlas/animations.json",
  texturePath: "/assets/atlas/",
} as const;

const sequence = (path: string, action: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${path}/${action}_${String(index).padStart(2, "0")}.png`);

function fighter(
  id: AllyId | EnemyId,
  baseAction: string,
  baseWidth: number,
  baseHeight: number,
  baseFrameRate: number,
  attackAction: string,
  attackWidth: number,
  attackHeight: number,
): FighterAnimationDef {
  const group = id.startsWith("A") ? "allies" : "enemies";

  return {
    base: {
      animationKey: `${id}-${baseAction}`,
      frames: sequence(`${group}/${id}/${baseAction}`, baseAction, 4),
      frameRate: baseFrameRate,
      displayWidth: baseWidth,
      displayHeight: baseHeight,
      repeat: -1,
    },
    attack: {
      animationKey: `${id}-${attackAction}`,
      frames: sequence(`${group}/${id}/${attackAction}`, attackAction, 4),
      frameRate: 12,
      displayWidth: attackWidth,
      displayHeight: attackHeight,
    },
  };
}

export const FIGHTER_ANIMATIONS: Partial<Record<AllyId | EnemyId, FighterAnimationDef>> = {
  A01: fighter("A01", "idle", 72, 84, 5, "attack", 180, 84),
  A02: fighter("A02", "idle", 72, 84, 5, "attack", 168, 96),
  A03: fighter("A03", "idle", 72, 84, 5, "attack", 168, 96),
  A04: fighter("A04", "idle", 72, 84, 5, "attack", 168, 96),
  A05: fighter("A05", "fly", 58, 58, 8, "attack", 96, 58),
  A06: fighter("A06", "idle", 72, 84, 6, "attack", 126, 84),
  A07: fighter("A07", "fly", 112, 78, 7, "attack", 146, 78),
  A08: fighter("A08", "idle", 72, 84, 5, "attack", 168, 96),
  A09: fighter("A09", "fly", 120, 84, 7, "attack", 168, 96),
  A10: fighter("A10", "idle", 72, 84, 5, "attack", 168, 96),
  E01: fighter("E01", "walk", 60, 70, 7, "attack", 100, 80),
  E02: fighter("E02", "walk", 60, 70, 7, "attack", 120, 80),
  E03: fighter("E03", "walk", 70, 80, 6, "attack", 140, 90),
  E04: fighter("E04", "fly", 58, 58, 8, "attack", 96, 58),
  E05: fighter("E05", "float", 60, 70, 7, "attack", 100, 80),
  E06: fighter("E06", "fly", 58, 58, 8, "attack", 96, 58),
  E07: fighter("E07", "fly", 90, 78, 7, "attack", 134, 78),
  E08: fighter("E08", "walk", 80, 90, 6, "attack", 160, 100),
  E09: fighter("E09", "fly", 124, 90, 7, "attack", 180, 90),
  E10: fighter("E10", "walk", 100, 112, 6, "attack", 200, 122),
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
