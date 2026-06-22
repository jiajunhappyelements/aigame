import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/game";

export type LoadingOverlayHandle = {
  destroy: () => void;
};

export type LoadingOverlayOptions = {
  backgroundKey?: string;
  backgroundAlpha?: number;
  shadeAlpha?: number;
};

export function createLoadingOverlay(
  scene: Phaser.Scene,
  label = "加载中...",
  options: LoadingOverlayOptions = {},
): LoadingOverlayHandle {
  const root = scene.add.container(0, 0).setDepth(1000);
  root.setScrollFactor(0);

  const hasBackground = Boolean(options.backgroundKey && scene.textures.exists(options.backgroundKey));

  if (hasBackground) {
    const bg = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, options.backgroundKey!)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(options.backgroundAlpha ?? 1);
    root.add(bg);
  } else {
    const fallbackBg = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0f1720, 1);
    fallbackBg.setOrigin(0.5);
    root.add(fallbackBg);
  }

  const shade = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x0b1118,
    hasBackground ? (options.shadeAlpha ?? 0.18) : 0.45,
  );
  shade.setOrigin(0.5);
  root.add(shade);

  const spinner = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18);
  const dotCount = 12;
  const radius = 18;
  for (let i = 0; i < dotCount; i++) {
    const angle = (Math.PI * 2 * i) / dotCount;
    const progress = i / dotCount;
    const dot = scene.add.circle(Math.cos(angle) * radius, Math.sin(angle) * radius, 3.5, 0xe8f1ff, 0.25 + progress * 0.75);
    dot.setScale(0.9 + progress * 0.25);
    spinner.add(dot);
  }
  root.add(spinner);

  const text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24, label, {
    fontFamily: "Arial",
    fontSize: "20px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  }).setOrigin(0.5);
  root.add(text);

  const subText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 58, "请稍候", {
    fontFamily: "Arial",
    fontSize: "14px",
    color: "#c7d5e6",
  }).setOrigin(0.5);
  root.add(subText);

  const spinEvent = scene.time.addEvent({
    delay: 50,
    loop: true,
    callback: () => {
      spinner.angle = (spinner.angle + 18) % 360;
    },
  });

  const pulseEvent = scene.time.addEvent({
    delay: 120,
    loop: true,
    callback: () => {
      const current = text.alpha;
      const next = current > 0.9 ? 0.75 : 1;
      text.setAlpha(next);
      subText.setAlpha(next);
    },
  });

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    spinEvent.remove(false);
    pulseEvent.remove(false);
    root.destroy(true);
  };

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
  scene.events.once(Phaser.Scenes.Events.DESTROY, destroy);

  return { destroy };
}
