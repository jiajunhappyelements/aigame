import Phaser from "phaser";
import { ANIMATION_ATLAS, FIGHTER_ANIMATIONS } from "../config/animations";

export function createConfiguredAnimations(scene: Phaser.Scene): void {
  for (const def of Object.values(FIGHTER_ANIMATIONS)) {
    if (!def) continue;
    if (scene.anims.exists(def.animationKey)) continue;
    scene.anims.create({
      key: def.animationKey,
      frames: def.frames.map(frame => ({ key: ANIMATION_ATLAS.key, frame })),
      frameRate: def.frameRate,
      repeat: -1,
    });
  }
}
