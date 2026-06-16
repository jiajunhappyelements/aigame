export type AudioKey =
  | "game-over"
  | "game-win"
  | "hud-bgm"
  | "hud-button-click"
  | "stage-click"
  | "stage1"
  | "stage2";

export const AUDIO_DEFS: Record<AudioKey, { path: string; loop?: boolean; volume?: number }> = {
  "game-over": { path: "/assets/sound/game_over.mp3", volume: 0.9 },
  "game-win": { path: "/assets/sound/GAME_WIN.mp3", volume: 0.9 },
  "hud-bgm": { path: "/assets/sound/HUD_BGM.mp3", loop: true, volume: 0.45 },
  "hud-button-click": { path: "/assets/sound/HUD_button_click.mp3", volume: 0.75 },
  "stage-click": { path: "/assets/sound/stage_click.mp3", volume: 0.75 },
  "stage1": { path: "/assets/sound/stage1.mp4", loop: true, volume: 0.5 },
  "stage2": { path: "/assets/sound/stage2.mp4", loop: true, volume: 0.5 },
};
