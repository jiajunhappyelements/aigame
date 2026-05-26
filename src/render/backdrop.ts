import { GAME_WIDTH, GAME_HEIGHT, LANES, CASTLE } from "../config/game";
const { wallY, slingX, slingY } = LANES;

export function createBackdrop(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(0);
  g.fillStyle(0x283f54, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.fillStyle(0x6d7f82, 1).fillRoundedRect(54, 118, GAME_WIDTH - 108, wallY - 130, 72);
  g.fillStyle(0x87918c, 1).fillRoundedRect(82, 145, GAME_WIDTH - 164, wallY - 160, 48);
  for (let y = 165; y < wallY - 40; y += 72) {
    g.lineStyle(2, 0x707b79, 0.32).lineBetween(105, y, GAME_WIDTH - 105, y + 8);
  }
  for (let x = 126; x < GAME_WIDTH - 100; x += 74) {
    g.lineStyle(2, 0x707b79, 0.25).lineBetween(x, 160, x - 12, wallY - 50);
  }
  g.strokePath();

  scene.add.image(GAME_WIDTH / 2, wallY + 8, "wall").setDisplaySize(410, 120).setDepth(1);
  scene.add.rectangle(GAME_WIDTH / 2, wallY + 72, GAME_WIDTH, 110, 0x2b3542, 0.84).setDepth(1);

  scene.add.circle(slingX - 33, slingY - 2, 7, 0xd7b27c).setDepth(2);
  scene.add.circle(slingX + 33, slingY - 2, 7, 0xd7b27c).setDepth(2);
}