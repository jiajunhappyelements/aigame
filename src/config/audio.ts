export type AudioKey =
  | "game-over"
  | "game-win"
  | "hud-bgm"
  | "hud-button-click"
  | "stage-click"
  | "stage1"
  | "stage2";

type AudioUrlConfig = { url: string; type: string };
type AudioSource = string | AudioUrlConfig | string[] | AudioUrlConfig[];

export const AUDIO_DEFS: Record<AudioKey, { source: AudioSource; loop?: boolean; volume?: number }> = {
  "game-over": { source: "assets/sound/game_over.mp3", volume: 0.9 },
  "game-win": { source: "assets/sound/GAME_WIN.mp3", volume: 0.9 },
  "hud-bgm": { source: "assets/sound/HUD_BGM.mp3", loop: true, volume: 0.45 },
  "hud-button-click": { source: "assets/sound/HUD_button_click.mp3", volume: 0.75 },
  "stage-click": { source: "assets/sound/stage_click.mp3", volume: 0.75 },
  "stage1": {
    source: [
      { url: "assets/sound/stage1.mp4", type: "m4a" },
      { url: "assets/sound/stage1.mp4", type: "aac" },
    ],
    loop: true,
    volume: 0.5,
  },
  "stage2": {
    source: [
      { url: "assets/sound/stage2.mp4", type: "m4a" },
      { url: "assets/sound/stage2.mp4", type: "aac" },
    ],
    loop: true,
    volume: 0.5,
  },
};
