import Phaser from "phaser";
import { GAME_WIDTH } from "../config/game";
import { ANIMATION_ATLAS, getEffectAnimation } from "../config/animations";

export function floatText(scene: Phaser.Scene, x: number, y: number, str: string, color: number): void {
  const t = scene.add.text(x, y, str, {
    fontFamily: "Arial",
    fontSize: "16px",
    color: `#${color.toString(16).padStart(6, "0")}`,
    stroke: "#000000",
    strokeThickness: 4,
  });
  t.setDepth(100);
  scene.tweens.add({
    targets: t, y: y - 50, alpha: 0,
    duration: 900, ease: "Cubic.easeOut", onComplete: () => t.destroy(),
  });
}

export function impact(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(80);
  g.fillStyle(0xf4e842, 0.8);
  g.fillCircle(x, y, 8);
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: 2.5, scaleY: 2.5,
    duration: 180, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function landingBlast(scene: Phaser.Scene, x: number, y: number, radius: number): void {
  const animation = getEffectAnimation("landing-impact");
  if (animation) {
    const sprite = scene.add
      .sprite(x, y, ANIMATION_ATLAS.key, animation.frames[0])
      .setDisplaySize(animation.displayWidth, animation.displayHeight)
      .setDepth(animation.depth);
    sprite.play(animation.animationKey);
    sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + animation.animationKey, () => sprite.destroy());
    return;
  }

  const g = scene.add.graphics().setDepth(79);
  g.lineStyle(3, 0xf4e842, 0.8);
  g.strokeCircle(x, y, 10);
  scene.tweens.add({
    targets: g, alpha: 0,
    scaleX: radius / 10, scaleY: radius / 10,
    duration: 350, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function exposureFlash(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(90);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, y, 30);
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: 2, scaleY: 2,
    duration: 250, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function frostEffect(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(80);
  g.fillStyle(0x8ed8f8, 0.6);
  g.fillCircle(x, y, 12);
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: 1.5, scaleY: 1.5,
    duration: 400, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function burnEffect(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(80);
  g.fillStyle(0xff6600, 0.7);
  g.fillCircle(x, y, 10);
  scene.tweens.add({
    targets: g, alpha: 0, scaleX: 1.3, scaleY: 1.3,
    duration: 300, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function healEffect(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(80);
  g.fillStyle(0x44ff88, 0.6);
  g.fillCircle(x, y - 10, 14);
  scene.tweens.add({
    targets: g, alpha: 0, y: y - 30,
    duration: 500, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function auraEffect(scene: Phaser.Scene, x: number, y: number, color: number): void {
  const g = scene.add.graphics().setDepth(7);
  g.lineStyle(2, color, 0.3);
  g.strokeCircle(x, y, 48);
  scene.tweens.add({
    targets: g, alpha: 0,
    duration: 800, ease: "Quad.easeOut", onComplete: () => g.destroy(),
  });
}

export function coinBounty(scene: Phaser.Scene, x: number, y: number, amount: number): void {
  const coin = scene.add.circle(x, y, 6, 0xffd700, 1).setDepth(100);
  const label = scene.add.text(x + 10, y - 5, `+${amount}`, {
    fontFamily: "Arial", fontSize: "12px", color: "#ffd700",
    stroke: "#000000", strokeThickness: 3
  }).setDepth(100);
  scene.tweens.add({
    targets: [coin, label],
    x: GAME_WIDTH - 20, y: 30,
    duration: 600, ease: "Cubic.easeIn",
    onComplete: () => { coin.destroy(); label.destroy(); }
  });
}
