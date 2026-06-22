import type { AllyId, EnemyId, EffectAnimationDef, FighterAnimationDef } from "../types";

export const ANIMATION_ATLAS = {
  key: "animation-atlas",
  dataPath: "assets/atlas/animations.json",
  texturePath: "assets/atlas/",
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
  attackSrcW: number,
  attackSrcH: number,
): FighterAnimationDef {
  const group = id.startsWith("A") ? "allies" : "enemies";

  // Attack displayHeight is locked to base, so both animations occupy the same vertical space.
  // Attack displayWidth scales proportionally from the source strip aspect ratio.
  const attackHeight = baseHeight;
  const attackWidth = Math.round(baseHeight * (attackSrcW / attackSrcH));

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
  // Ally ground: idle 4f → 8fps (halves loop duration from 0.8s→0.5s for less sliding)
  A01: fighter("A01", "idle", 72, 84, 8, "attack", 180, 84),
  A02: fighter("A02", "idle", 72, 84, 8, "attack", 168, 96),
  A03: fighter("A03", "idle", 72, 84, 8, "attack", 168, 96),
  A04: fighter("A04", "idle", 72, 84, 8, "attack", 168, 96),
  // Ally flying: keep fast flutter
  A05: fighter("A05", "fly", 58, 58, 10, "attack", 96, 58),
  A06: fighter("A06", "idle", 72, 84, 8, "attack", 126, 84),
  A07: fighter("A07", "fly", 112, 78, 9, "attack", 146, 78),
  A08: fighter("A08", "idle", 72, 84, 8, "attack", 168, 96),
  A09: fighter("A09", "fly", 120, 84, 9, "attack", 168, 96),
  A10: fighter("A10", "idle", 72, 84, 8, "attack", 168, 96),
  // Enemy ground: walk loop faster to match movement pace
  E01: fighter("E01", "walk", 60, 70, 9, "attack", 100, 80),
  E02: fighter("E02", "walk", 60, 70, 9, "attack", 120, 80),
  E03: fighter("E03", "walk", 70, 80, 8, "attack", 140, 90),
  E04: fighter("E04", "fly", 58, 58, 10, "attack", 96, 58),
  E05: fighter("E05", "float", 60, 70, 10, "attack", 100, 80),  // swift → fastest
  E06: fighter("E06", "fly", 58, 58, 10, "attack", 96, 58),
  E07: fighter("E07", "fly", 90, 78, 9, "attack", 134, 78),
  E08: fighter("E08", "walk", 80, 90, 8, "attack", 160, 100),
  E09: fighter("E09", "fly", 124, 90, 9, "attack", 180, 90),
  E10: fighter("E10", "walk", 100, 112, 8, "attack", 200, 122),
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
  "fireball-explosion": {
    animationKey: "fireball-explosion",
    frames: sequence("effects/fireball-explosion", "explosion", 4),
    frameRate: 14,
    displayWidth: 144,
    displayHeight: 96,
    depth: 82,
  },
  "sword-wave": {
    animationKey: "sword-wave",
    frames: sequence("effects/sword-wave", "wave", 4),
    frameRate: 14,
    displayWidth: 168,
    displayHeight: 96,
    depth: 83,
  },
  "thrust-impact": {
    animationKey: "thrust-impact",
    frames: sequence("effects/thrust-impact", "thrust", 4),
    frameRate: 14,
    displayWidth: 154,
    displayHeight: 77,
    depth: 83,
  },
  "shield-guard": {
    animationKey: "shield-guard",
    frames: sequence("effects/shield-guard", "shield", 4),
    frameRate: 12,
    displayWidth: 106,
    displayHeight: 96,
    depth: 84,
  },
  "dive-strike": {
    animationKey: "dive-strike",
    frames: sequence("effects/dive-strike", "dive", 4),
    frameRate: 14,
    displayWidth: 144,
    displayHeight: 96,
    depth: 83,
  },
  "crit-hit": {
    animationKey: "crit-hit",
    frames: sequence("effects/crit-hit", "crit", 4),
    frameRate: 14,
    displayWidth: 120,
    displayHeight: 96,
    depth: 84,
  },
  "meteor-impact": {
    animationKey: "meteor-impact",
    frames: sequence("effects/meteor-impact", "meteor", 4),
    frameRate: 12,
    displayWidth: 144,
    displayHeight: 108,
    depth: 84,
  },
  "dragon-breath": {
    animationKey: "dragon-breath",
    frames: sequence("effects/dragon-breath", "breath", 4),
    frameRate: 14,
    displayWidth: 168,
    displayHeight: 96,
    depth: 84,
  },
};

export function getFighterAnimation(id: AllyId | EnemyId): FighterAnimationDef | undefined {
  return FIGHTER_ANIMATIONS[id];
}

export function getEffectAnimation(key: string): EffectAnimationDef | undefined {
  return EFFECT_ANIMATIONS[key];
}
