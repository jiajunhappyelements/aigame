import type { EnemyId, EnemySpec } from "../types";
import { TILE_SIZE } from "./game";

export const ENEMY_SPECS: Record<EnemyId, EnemySpec> = {
  E01: {
    id: "E01", name: "哥布林", attackType: "melee", moveMode: "ground",
    unlockLevel: 1, hp: 160, atk: 16, atkSpd: 1.0, moveSpd: 1.2 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: [], traitDesc: "基础近战单位",
    bounty: 5, texture: "enemy-goblin", tint: 0x6b8e23, scale: 0.18
  },
  E02: {
    id: "E02", name: "骷髅", attackType: "ranged", moveMode: "ground",
    unlockLevel: 1, hp: 110, atk: 24, atkSpd: 0.7, moveSpd: 0.8 * TILE_SIZE,
    range: 80, detectionRange: 400, traits: [], traitDesc: "基础远程单位",
    bounty: 6, texture: "enemy-E02", tint: 0xc0c0c0, scale: 0.16
  },
  E03: {
    id: "E03", name: "兽人", attackType: "melee", moveMode: "ground",
    unlockLevel: 2, hp: 380, atk: 28, atkSpd: 0.8, moveSpd: 0.9 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["heavy"], traitDesc: "受伤减免15%",
    bounty: 10, texture: "enemy-ogre", tint: 0x8b4513, scale: 0.2
  },
  E04: {
    id: "E04", name: "蝙蝠", attackType: "melee", moveMode: "flying",
    unlockLevel: 3, hp: 140, atk: 22, atkSpd: 1.2, moveSpd: 1.8 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["flying"], traitDesc: "仅被飞行单位攻击",
    bounty: 8, texture: "enemy-E04", tint: 0x4a4a6a, scale: 0.15
  },
  E05: {
    id: "E05", name: "幽灵", attackType: "melee", moveMode: "ground",
    unlockLevel: 4, hp: 320, atk: 34, atkSpd: 0.9, moveSpd: 2.0 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["swift"], traitDesc: "移动速度+50%",
    bounty: 12, texture: "enemy-E05", tint: 0xdcdcdc, scale: 0.17
  },
  E06: {
    id: "E06", name: "影鹰", attackType: "ranged", moveMode: "flying",
    unlockLevel: 5, hp: 200, atk: 26, atkSpd: 0.8, moveSpd: 1.5 * TILE_SIZE,
    range: 80, detectionRange: 400, traits: ["flying"], traitDesc: "仅被飞行单位攻击",
    bounty: 15, texture: "enemy-E06", tint: 0x6a0dad, scale: 0.16
  },
  E07: {
    id: "E07", name: "飞龙", attackType: "melee", moveMode: "flying",
    unlockLevel: 5, hp: 280, atk: 30, atkSpd: 0.9, moveSpd: 1.4 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["flying", "dragonAura"], traitDesc: "飞行+攻击溅射35%",
    bounty: 18, texture: "enemy-E07", tint: 0xcc2200, scale: 0.19
  },
  E08: {
    id: "E08", name: "巨魔", attackType: "melee", moveMode: "ground",
    unlockLevel: 6, hp: 600, atk: 38, atkSpd: 0.7, moveSpd: 0.7 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["heavy", "siege"], traitDesc: "受伤减免20%+对基地伤害×2",
    bounty: 22, texture: "enemy-E08", tint: 0x556b2f, scale: 0.22
  },
  E09: {
    id: "E09", name: "幻影龙", attackType: "melee", moveMode: "flying",
    unlockLevel: 7, hp: 500, atk: 36, atkSpd: 0.8, moveSpd: 1.6 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["flying", "dragonAura"], traitDesc: "飞行+攻击溅射35%",
    bounty: 25, texture: "enemy-E09", tint: 0x1a1a6e, scale: 0.2
  },
  E10: {
    id: "E10", name: "恶魔领主", attackType: "melee", moveMode: "ground",
    unlockLevel: 7, hp: 900, atk: 46, atkSpd: 0.6, moveSpd: 0.6 * TILE_SIZE,
    range: 54, detectionRange: 250, traits: ["heavy", "siege", "command"], traitDesc: "受伤减免25%+对基地伤害×2+全体敌方ATK+10%",
    bounty: 30, texture: "enemy-E10", tint: 0x2a0a2a, scale: 0.24
  }
};