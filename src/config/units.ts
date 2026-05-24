import type { AllyId, AllySpec } from "../types";
import { TILE_SIZE } from "./game";

export const ALLY_SPECS: Record<AllyId, AllySpec> = {
  A01: {
    id: "A01", name: "赵云", role: "近战单体", attackType: "melee", moveMode: "ground",
    unlockLevel: 1, hp: 220, hpGrowth: 18, hpCap: 400, atk: 36, atkSpd: 1.0,
    range: 0.8 * TILE_SIZE, moveSpd: 2.0 * TILE_SIZE, targeting: "nearest",
    staminaCost: 3, maxSameName: 2, maxField: 8,
    skill1: { name: "枪突", desc: "ATK+20%/35%/50%", lv1: "+20%", lv2: "+35%", lv3: "+50%" },
    skill2: null, texture: "unit-slinger", tint: 0x4a9eff
  },
  A02: {
    id: "A02", name: "剑圣", role: "近战群攻", attackType: "melee", moveMode: "ground",
    unlockLevel: 1, hp: 180, hpGrowth: 15, hpCap: 340, atk: 44, atkSpd: 0.8,
    range: 0.8 * TILE_SIZE, moveSpd: 2.0 * TILE_SIZE, targeting: "nearest",
    staminaCost: 4, maxSameName: 2, maxField: 8,
    skill1: { name: "剑气横扫", desc: "溅射1.0格60%/75%/90%ATK", lv1: "60%", lv2: "75%", lv3: "90%" },
    skill2: null, texture: "ally-A02", tint: 0xff4444
  },
  A03: {
    id: "A03", name: "法师", role: "远程法师", attackType: "ranged", moveMode: "ground",
    unlockLevel: 1, hp: 140, hpGrowth: 12, hpCap: 280, atk: 32, atkSpd: 0.7,
    range: 3.0 * TILE_SIZE, moveSpd: 1.5 * TILE_SIZE, targeting: "lowestHp",
    staminaCost: 3, maxSameName: 2, maxField: 8,
    skill1: { name: "火球术", desc: "1.2格范围70%/85%/100%ATK", lv1: "70%", lv2: "85%", lv3: "100%" },
    skill2: { name: "冰霜减速", desc: "减速30%/45%/60%1.5秒", lv1: "30%", lv2: "45%", lv3: "60%" },
    texture: "unit-mage", tint: 0x76dfff
  },
  A04: {
    id: "A04", name: "骑士", role: "近战坦克", attackType: "melee", moveMode: "ground",
    unlockLevel: 2, hp: 320, hpGrowth: 25, hpCap: 550, atk: 28, atkSpd: 0.8,
    range: 0.8 * TILE_SIZE, moveSpd: 1.8 * TILE_SIZE, targeting: "nearest",
    staminaCost: 4, maxSameName: 2, maxField: 8,
    skill1: { name: "坚守", desc: "受伤减免15%/25%/35%", lv1: "15%", lv2: "25%", lv3: "35%" },
    skill2: null, texture: "ally-A04", tint: 0x3366cc
  },
  A05: {
    id: "A05", name: "猎鹰", role: "飞行单体", attackType: "melee", moveMode: "flying",
    unlockLevel: 3, hp: 190, hpGrowth: 16, hpCap: 350, atk: 30, atkSpd: 1.2,
    range: 0.8 * TILE_SIZE, moveSpd: 2.5 * TILE_SIZE, targeting: "nearestFlying",
    staminaCost: 3, maxSameName: 2, maxField: 8,
    skill1: { name: "俯冲", desc: "对飞行ATK+25%/45%/65%", lv1: "+25%", lv2: "+45%", lv3: "+65%" },
    skill2: null, texture: "ally-A05", tint: 0xffa040
  },
  A06: {
    id: "A06", name: "弓手", role: "远程单体", attackType: "ranged", moveMode: "ground",
    unlockLevel: 4, hp: 150, hpGrowth: 13, hpCap: 290, atk: 34, atkSpd: 1.0,
    range: 3.5 * TILE_SIZE, moveSpd: 1.5 * TILE_SIZE, targeting: "nearest",
    staminaCost: 3, maxSameName: 2, maxField: 8,
    skill1: { name: "精准射击", desc: "暴击+15%/25%/40%", lv1: "+15%", lv2: "+25%", lv3: "+40%" },
    skill2: null, texture: "unit-archer", tint: 0x78d47d
  },
  A07: {
    id: "A07", name: "天马", role: "飞行坦克", attackType: "melee", moveMode: "flying",
    unlockLevel: 5, hp: 280, hpGrowth: 22, hpCap: 480, atk: 26, atkSpd: 0.9,
    range: 0.8 * TILE_SIZE, moveSpd: 2.5 * TILE_SIZE, targeting: "nearestFlying",
    staminaCost: 5, maxSameName: 2, maxField: 8,
    skill1: { name: "守护光环", desc: "1.5格友军受伤-10%/18%/28%", lv1: "-10%", lv2: "-18%", lv3: "-28%" },
    skill2: null, texture: "ally-A07", tint: 0xffffff
  },
  A08: {
    id: "A08", name: "火法", role: "远程群攻", attackType: "ranged", moveMode: "ground",
    unlockLevel: 6, hp: 130, hpGrowth: 11, hpCap: 260, atk: 38, atkSpd: 0.6,
    range: 3.0 * TILE_SIZE, moveSpd: 1.5 * TILE_SIZE, targeting: "lowestHp",
    staminaCost: 4, maxSameName: 2, maxField: 8,
    skill1: { name: "陨石术", desc: "1.5格80%/95%/110%ATK+灼烧", lv1: "80%", lv2: "95%", lv3: "110%" },
    skill2: { name: "灼烧DOT", desc: "每秒ATK8%/12%/18%3秒", lv1: "8%", lv2: "12%", lv3: "18%" },
    texture: "ally-A08", tint: 0xff3300
  },
  A09: {
    id: "A09", name: "龙骑", role: "飞行近战", attackType: "melee", moveMode: "flying",
    unlockLevel: 7, hp: 260, hpGrowth: 20, hpCap: 450, atk: 40, atkSpd: 0.9,
    range: 0.8 * TILE_SIZE, moveSpd: 2.5 * TILE_SIZE, targeting: "nearest",
    staminaCost: 5, maxSameName: 2, maxField: 8,
    skill1: { name: "龙息", desc: "1.5格锥形75%/90%/110%ATK", lv1: "75%", lv2: "90%", lv3: "110%" },
    skill2: null, texture: "ally-A09", tint: 0x9944ff
  },
  A10: {
    id: "A10", name: "圣骑", role: "近战辅助", attackType: "melee", moveMode: "ground",
    unlockLevel: 2, hp: 240, hpGrowth: 20, hpCap: 420, atk: 24, atkSpd: 0.8,
    range: 0.8 * TILE_SIZE, moveSpd: 2.0 * TILE_SIZE, targeting: "nearest",
    staminaCost: 4, maxSameName: 2, maxField: 8,
    skill1: { name: "圣光", desc: "每2秒治疗ATK20%/35%/50%", lv1: "20%", lv2: "35%", lv3: "50%" },
    skill2: null, texture: "ally-A10", tint: 0xffd700
  }
};