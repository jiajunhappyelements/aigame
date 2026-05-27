import type { AllyId, EnemyId, FighterAnimationDef } from "../types";

export const ANIMATION_ATLAS = {
  key: "animation-atlas",
  dataPath: "/assets/atlas/animations.json",
  texturePath: "/assets/atlas/",
} as const;

const sequence = (path: string, action: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${path}/${action}_${String(index).padStart(2, "0")}.png`);

export const FIGHTER_ANIMATIONS: Partial<Record<AllyId | EnemyId, FighterAnimationDef>> = {
  A01: {
    animationKey: "A01-idle",
    frames: sequence("allies/A01/idle", "idle", 4),
    frameRate: 5,
    displayWidth: 72,
    displayHeight: 84,
  },
  E01: {
    animationKey: "E01-walk",
    frames: sequence("enemies/E01/walk", "walk", 4),
    frameRate: 7,
    displayWidth: 60,
    displayHeight: 70,
  },
};

export function getFighterAnimation(id: AllyId | EnemyId): FighterAnimationDef | undefined {
  return FIGHTER_ANIMATIONS[id];
}
