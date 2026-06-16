import Phaser from "phaser";

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  color = 0x4a9eff,
  fontSize = "22px",
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  bg.fillStyle(color, 1);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
  bg.lineStyle(3, 0xffffff, 0.6);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

  const label = scene.add.text(0, 0, text, {
    fontFamily: "Arial",
    fontSize,
    color: "#ffffff",
    align: "center",
    stroke: "#000000",
    strokeThickness: 4,
  }).setOrigin(0.5);

  container.add([bg, label]);
  container.setSize(width, height);
  container.setInteractive();
  container.setData("clickSound", "hud-button-click");

  container.on("pointerover", () => container.setScale(1.05));
  container.on("pointerout", () => container.setScale(1.0));

  return container;
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  color = 0x1a2a3a,
  alpha = 0.9,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
  g.lineStyle(2, 0xffffff, 0.3);
  g.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);
  return g;
}

export function createTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize = "36px",
  color = "#ffd700",
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: "Arial",
    fontSize,
    color,
    align: "center",
    stroke: "#000000",
    strokeThickness: 6,
  }).setOrigin(0.5);
}

export function createStarDisplay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  count: number,
  max = 3,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const spacing = 40;
  const startX = -((max - 1) * spacing) / 2;

  for (let i = 0; i < max; i++) {
    const star = scene.add.text(startX + i * spacing, 0, i < count ? "★" : "☆", {
      fontFamily: "Arial",
      fontSize: "32px",
      color: i < count ? "#ffd700" : "#666666",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(star);
  }

  return container;
}
