import Phaser from "phaser";
import type { AllyId, AllySpec, EnemyId, EnemySpec, Fighter, GameState, Team } from "../types";
import { TILE_SIZE } from "../config/game";
import { ANIMATION_ATLAS, getFighterAnimation } from "../config/animations";

export function createFighter(
  scene: Phaser.Scene,
  id: AllyId | EnemyId,
  team: Team,
  x: number,
  y: number,
  spec: AllySpec | EnemySpec
): Fighter {
  const isAlly = team === "ally";
  const bodyScale = isAlly ? 0.3 : (spec as EnemySpec).scale ?? 0.2;
  const container = scene.add.container(x, y) as Fighter;
  const animation = getFighterAnimation(id);

  const shadow = scene.add.ellipse(0, 34, 46, 16, 0x0e1b20, 0.28);
  const img = animation
    ? scene.add
        .sprite(0, 0, ANIMATION_ATLAS.key, animation.base.frames[0])
        .setDisplaySize(animation.base.displayWidth, animation.base.displayHeight)
        .play(animation.base.animationKey)
    : scene.add.image(0, 0, spec.texture).setScale(bodyScale);
  img.name = "sprite";
  const hpBg = scene.add.rectangle(0, -42, 44, 5, 0x211d22, 0.9);
  const hpFg = scene.add
    .rectangle(-22, -42, 44, 5, isAlly ? 0x4af06a : 0xff5b4f, 1)
    .setOrigin(0, 0.5);
  hpFg.name = "hp";
  container.add([shadow, img, hpBg, hpFg]);

  const hp = spec.hp;
  container.id = id;
  container.kind = id;
  container.team = team;
  container.hp = hp;
  container.maxHp = hp;
  container.atk = spec.atk;
  container.range = spec.range;
  container.speed = spec.moveSpd;
  container.attackCd = Math.round(1000 / spec.atkSpd);
  container.attackTimer = Phaser.Math.Between(0, 400);
  container.launched = false;
  container.moveMode = spec.moveMode;
  container.attackType = spec.attackType;
  container.targeting = isAlly ? (spec as AllySpec).targeting : "base";
  container.traits = isAlly ? [] : (spec as EnemySpec).traits;
  container.skill1Level = 0;
  container.skill2Level = 0;
  container.slowUntil = 0;
  container.slowPercent = 0;
  container.burnUntil = 0;
  container.burnDps = 0;
  container.attacking = false;
  container.dying = false;
  if (!isAlly) {
    container.bounty = (spec as EnemySpec).bounty;
  }

  const depth = spec.moveMode === "flying" ? 16 : 8;
  container.setDepth(depth);

  scene.physics.add.existing(container);
  const body = container.body as Phaser.Physics.Arcade.Body;
  body.setCircle(22, -22, 12);
  body.setCollideWorldBounds(false);

  return container;
}
