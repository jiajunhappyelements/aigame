import Phaser from "phaser";
import { SPRITES } from "../config/sprites";
import { createProceduralTextures } from "../config/proceduralTextures";

export function createSpriteTextures(scene: Phaser.Scene): void {
  const source = scene.textures.get("ai-sprite-sheet").getSourceImage() as HTMLImageElement;
  for (const sprite of SPRITES) {
    const canvas = document.createElement("canvas");
    canvas.width = sprite.w;
    canvas.height = sprite.h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    ctx.drawImage(source, sprite.x, sprite.y, sprite.w, sprite.h, 0, 0, sprite.w, sprite.h);
    const img = ctx.getImageData(0, 0, sprite.w, sprite.h);
    for (let i = 0; i < img.data.length; i += 4) {
      const r = img.data[i];
      const g = img.data[i + 1];
      const b = img.data[i + 2];
      if (r > 210 && g < 65 && b > 210) img.data[i + 3] = 0;
    }
    ctx.putImageData(img, 0, 0);
    scene.textures.addCanvas(sprite.key, canvas);
  }

  createProceduralTextures(scene);
}