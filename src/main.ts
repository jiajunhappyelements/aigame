import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/game";
import { TitleScene } from "./scenes/TitleScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameScene } from "./scenes/GameScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { DefeatScene } from "./scenes/DefeatScene";
import { AnimationLabScene } from "./scenes/AnimationLabScene";
import "./style.css";

const bootScreen = document.getElementById("boot-screen");
const hideBootScreen = () => {
  bootScreen?.classList.add("is-hidden");
};

window.addEventListener("aigame:title-ready", hideBootScreen, { once: true });

const debugScene = new URLSearchParams(window.location.search).get("debug");
const gameScenes = [TitleScene, LevelSelectScene, GameScene, VictoryScene, DefeatScene];
const scenes = debugScene === "animations" ? [AnimationLabScene, ...gameScenes] : gameScenes;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#20364a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: scenes
});
