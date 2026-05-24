import Phaser from "phaser";
import { ALLY_SPECS } from "./units";
import { ENEMY_SPECS } from "./enemies";

type TextureDef = { key: string; color: number; shape: "circle" | "diamond" | "largeCircle"; icon: "cross" | "dot" | "shield" | "plus" | "flame" | "wing" | "horn" | "none" };

const ALLY_TEXTURES: TextureDef[] = [
  { key: "ally-A02", color: 0xff4444, shape: "circle", icon: "cross" },
  { key: "ally-A04", color: 0x3366cc, shape: "largeCircle", icon: "shield" },
  { key: "ally-A05", color: 0xffa040, shape: "diamond", icon: "none" },
  { key: "ally-A07", color: 0xe0e0ff, shape: "diamond", icon: "plus" },
  { key: "ally-A08", color: 0xff3300, shape: "circle", icon: "flame" },
  { key: "ally-A09", color: 0x9944ff, shape: "diamond", icon: "wing" },
  { key: "ally-A10", color: 0xffd700, shape: "circle", icon: "plus" },
];

const ENEMY_TEXTURES: TextureDef[] = [
  { key: "enemy-E02", color: 0xc0c0c0, shape: "circle", icon: "dot" },
  { key: "enemy-E04", color: 0x4a4a6a, shape: "diamond", icon: "none" },
  { key: "enemy-E05", color: 0xdcdcdc, shape: "diamond", icon: "none" },
  { key: "enemy-E06", color: 0x6a0dad, shape: "diamond", icon: "dot" },
  { key: "enemy-E07", color: 0xcc2200, shape: "diamond", icon: "wing" },
  { key: "enemy-E08", color: 0x556b2f, shape: "largeCircle", icon: "shield" },
  { key: "enemy-E09", color: 0x1a1a6e, shape: "diamond", icon: "wing" },
  { key: "enemy-E10", color: 0x2a0a2a, shape: "largeCircle", icon: "horn" },
];

export function createProceduralTextures(scene: Phaser.Scene): void {
  for (const def of [...ALLY_TEXTURES, ...ENEMY_TEXTURES]) {
    if (scene.textures.exists(def.key)) continue;
    const size = def.shape === "largeCircle" ? 64 : 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    if (def.shape === "circle" || def.shape === "largeCircle") {
      const r = size / 2 - 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = `#${def.color.toString(16).padStart(6, "0")}`;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (def.shape === "diamond") {
      const r = size / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fillStyle = `#${def.color.toString(16).padStart(6, "0")}`;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 2;
    if (def.icon === "cross") {
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8);
      ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8);
      ctx.stroke();
    } else if (def.icon === "dot") {
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (def.icon === "shield") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + 8, cy - 2);
      ctx.lineTo(cx + 6, cy + 8);
      ctx.lineTo(cx, cy + 10);
      ctx.lineTo(cx - 6, cy + 8);
      ctx.lineTo(cx - 8, cy - 2);
      ctx.closePath();
      ctx.stroke();
    } else if (def.icon === "plus") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.stroke();
    } else if (def.icon === "flame") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.quadraticCurveTo(cx + 8, cy - 2, cx, cy + 10);
      ctx.quadraticCurveTo(cx - 8, cy - 2, cx, cy - 10);
      ctx.stroke();
    } else if (def.icon === "wing") {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + 12, cy - 10, cx + 8, cy + 4);
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx - 12, cy - 10, cx - 8, cy + 4);
      ctx.stroke();
    } else if (def.icon === "horn") {
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 4); ctx.lineTo(cx - 10, cy - 14);
      ctx.moveTo(cx + 6, cy - 4); ctx.lineTo(cx + 10, cy - 14);
      ctx.stroke();
    }

    scene.textures.addCanvas(def.key, canvas);
  }
}
