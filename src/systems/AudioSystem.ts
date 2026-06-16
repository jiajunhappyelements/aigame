import Phaser from "phaser";
import { AUDIO_DEFS, type AudioKey } from "../config/audio";

export class AudioSystem {
  private currentBgm: Phaser.Sound.BaseSound | null = null;

  preload(scene: Phaser.Scene): void {
    for (const [key, def] of Object.entries(AUDIO_DEFS) as [AudioKey, (typeof AUDIO_DEFS)[AudioKey]][]) {
      if (scene.cache.audio.exists(key)) continue;
      scene.load.audio(key, def.path);
    }
  }

  play(scene: Phaser.Scene, key: AudioKey, volume?: number): void {
    if (!scene.sound.locked) {
      scene.sound.play(key, { volume: volume ?? AUDIO_DEFS[key].volume ?? 1 });
      return;
    }

    const sound = scene.sound.add(key, { volume: volume ?? AUDIO_DEFS[key].volume ?? 1 });
    scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
      if (!sound.isPlaying) sound.play();
    });
  }

  playBgm(scene: Phaser.Scene, key: AudioKey): void {
    if (this.currentBgm && this.currentBgm.key === key) return;
    this.stopBgm();
    this.currentBgm = scene.sound.add(key, {
      loop: AUDIO_DEFS[key].loop ?? true,
      volume: AUDIO_DEFS[key].volume ?? 1,
    });
    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (this.currentBgm) this.currentBgm.play();
      });
      return;
    }
    this.currentBgm.play();
  }

  stopBgm(): void {
    if (!this.currentBgm) return;
    this.currentBgm.stop();
    this.currentBgm.destroy();
    this.currentBgm = null;
  }
}
