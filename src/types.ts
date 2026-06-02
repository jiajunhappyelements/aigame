export type AllyId = "A01" | "A02" | "A03" | "A04" | "A05" | "A06" | "A07" | "A08" | "A09" | "A10";
export type EnemyId = "E01" | "E02" | "E03" | "E04" | "E05" | "E06" | "E07" | "E08" | "E09" | "E10";
export type Team = "ally" | "enemy";

export type SkillDef = {
  name: string;
  desc: string;
  lv1: string;
  lv2: string;
  lv3: string;
};

export type AllySpec = {
  id: AllyId;
  name: string;
  role: string;
  attackType: "melee" | "ranged";
  moveMode: "ground" | "flying";
  unlockLevel: number;
  hp: number;
  hpGrowth: number;
  hpCap: number;
  atk: number;
  atkSpd: number;
  range: number;
  moveSpd: number;
  targeting: string;
  staminaCost: number;
  maxSameName: number;
  maxField: number;
  skill1: SkillDef | null;
  skill2: SkillDef | null;
  texture: string;
  tint: number;
};

export type EnemySpec = {
  id: EnemyId;
  name: string;
  attackType: "melee" | "ranged";
  moveMode: "ground" | "flying";
  unlockLevel: number;
  hp: number;
  atk: number;
  atkSpd: number;
  moveSpd: number;
  range: number;
  traits: string[];
  traitDesc: string;
  bounty: number;
  texture: string;
  tint: number;
  scale: number;
};

export type Fighter = Phaser.GameObjects.Container & {
  id: AllyId | EnemyId;
  kind: AllyId | EnemyId;
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  range: number;
  speed: number;
  attackCd: number;
  attackTimer: number;
  launched?: boolean;
  slowUntil?: number;
  slowPercent?: number;
  burnUntil?: number;
  burnDps?: number;
  bounty?: number;
  moveMode: "ground" | "flying";
  attackType: "melee" | "ranged";
  targeting: string;
  traits: string[];
  skill1Level: number;
  skill2Level: number;
  attacking?: boolean;
  dying?: boolean;
};

export type SpriteDef = {
  key: string;
  path: string;
};

export type AnimationClipDef = {
  animationKey: string;
  frames: string[];
  frameRate: number;
  displayWidth: number;
  displayHeight: number;
  repeat?: number;
};

export type FighterAnimationDef = {
  base: AnimationClipDef;
  attack?: AnimationClipDef;
};

export type EffectAnimationDef = AnimationClipDef & {
  depth: number;
};

export type Upgrade = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  apply: () => void;
};

export type GameState = {
  level: number;
  wave: number;
  waveTime: number;
  spawnTimer: number;
  castleHp: number;
  castleMaxHp: number;
  stamina: number;
  staminaMax: number;
  staminaRegenTimer: number;
  gold: number;
  allies: Fighter[];
  enemies: Fighter[];
  pendingCardId: AllyId | null;
  pendingBall: Phaser.GameObjects.Container | null;
  dragging: boolean;
  modalOpen: boolean;
  ballVx: number;
  ballVy: number;
  ballActive: boolean;
  launchCooldown: number;
  summonCountsThisWave: Record<string, number>;
  unlockedAllies: AllyId[];
  unlockedEnemies: EnemyId[];
  unitDamageMultiplier: number;
  hpMultiplier: number;
  bountyMultiplier: number;
  waveEnemyQueue: { enemyId: EnemyId; delay: number }[];
  waveEnemyTimer: number;
};
