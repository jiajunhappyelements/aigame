import Phaser from "phaser";
import { AUDIO_DEFS, type AudioKey } from "../config/audio";

export class AudioSystem {
  private static currentBgm: Phaser.Sound.BaseSound | null = null;

  preload(scene: Phaser.Scene, keys?: AudioKey[]): void {
    const entries = keys
      ? keys.map((key) => [key, AUDIO_DEFS[key]] as const)
      : (Object.entries(AUDIO_DEFS) as [AudioKey, (typeof AUDIO_DEFS)[AudioKey]][]);

    for (const [key, def] of entries) {
      if (scene.cache.audio.exists(key)) continue;
      scene.load.audio(key, def.source);
    }
  }

  play(scene: Phaser.Scene, key: AudioKey, volume?: number): void {
    if (!scene.cache.audio.exists(key)) return;

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
    if (!scene.cache.audio.exists(key)) {
      this.stopBgm();
      return;
    }

    if (AudioSystem.currentBgm && AudioSystem.currentBgm.key === key) return;
    this.stopBgm();
    AudioSystem.currentBgm = scene.sound.add(key, {
      loop: AUDIO_DEFS[key].loop ?? true,
      volume: AUDIO_DEFS[key].volume ?? 1,
    });
    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        if (AudioSystem.currentBgm) AudioSystem.currentBgm.play();
      });
      return;
    }
    AudioSystem.currentBgm.play();
  }

  stopBgm(): void {
    if (!AudioSystem.currentBgm) return;
    AudioSystem.currentBgm.stop();
    AudioSystem.currentBgm.destroy();
    AudioSystem.currentBgm = null;
  }
}
