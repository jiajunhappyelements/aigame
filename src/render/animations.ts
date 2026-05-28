import Phaser from "phaser";
import { ANIMATION_ATLAS, EFFECT_ANIMATIONS, FIGHTER_ANIMATIONS, getFighterAnimation } from "../config/animations";
import type { AllyId, EnemyId, Fighter, AnimationClipDef } from "../types";

export function createConfiguredAnimations(scene: Phaser.Scene): void {
  for (const def of Object.values(FIGHTER_ANIMATIONS)) {
    if (!def) continue;
    createAnimation(scene, def.base);
    if (def.attack) createAnimation(scene, def.attack);
  }
  for (const def of Object.values(EFFECT_ANIMATIONS)) {
    createAnimation(scene, def);
  }
}

export function playFighterBaseAnimation(fighter: Fighter): void {
  const def = getFighterAnimation(fighter.id as AllyId | EnemyId);
  if (!def) return;
  playClip(fighter, def.base, true);
}

export function playFighterAttackAnimation(fighter: Fighter): void {
  const def = getFighterAnimation(fighter.id as AllyId | EnemyId);
  if (!def?.attack) return;
  const sprite = playClip(fighter, def.attack, true);
  if (!sprite) return;
  sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + def.attack.animationKey, () => {
    if (fighter.active) playFighterBaseAnimation(fighter);
  });
}

function createAnimation(scene: Phaser.Scene, clip: AnimationClipDef): void {
  if (scene.anims.exists(clip.animationKey)) return;
  scene.anims.create({
    key: clip.animationKey,
    frames: clip.frames.map(frame => ({ key: ANIMATION_ATLAS.key, frame })),
    frameRate: clip.frameRate,
    repeat: clip.repeat ?? 0,
  });
}

function playClip(fighter: Fighter, clip: AnimationClipDef, ignoreIfPlaying: boolean): Phaser.GameObjects.Sprite | null {
  const sprite = fighter.getByName("sprite") as Phaser.GameObjects.Sprite | null;
  if (!sprite?.anims) return null;
  sprite.setDisplaySize(clip.displayWidth, clip.displayHeight);
  sprite.play(clip.animationKey, ignoreIfPlaying);
  return sprite;
}
