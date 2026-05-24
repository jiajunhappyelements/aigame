import { GAME_WIDTH, LANES, CASTLE } from "../config/game";

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

export function createBallState(x: number, y: number, vx: number, vy: number): BallState {
  return { x, y, vx, vy, onGround: false };
}

const GROUND_Y = CASTLE.y - 50;
const TOP_BOUND = LANES.topBound;
const DECEL = 0.985;
const BOUNCE_DAMPING = 0.7;
const STOP_SPEED = 15;

export function updateBallPhysics(state: BallState, dt: number): BallState {
  const frames = dt / 16.67;
  let { x, y, vx, vy } = state;

  x += vx * (dt / 1000);
  y += vy * (dt / 1000);

  const drag = Math.pow(DECEL, frames);
  vx *= drag;
  vy *= drag;

  if (x < 20) { x = 20; vx = Math.abs(vx) * BOUNCE_DAMPING; }
  if (x > GAME_WIDTH - 20) { x = GAME_WIDTH - 20; vx = -Math.abs(vx) * BOUNCE_DAMPING; }
  if (y < TOP_BOUND) { y = TOP_BOUND; vy = Math.abs(vy) * BOUNCE_DAMPING; }
  if (y > GROUND_Y) { y = GROUND_Y; vy = -Math.abs(vy) * BOUNCE_DAMPING; }

  return { x, y, vx, vy, onGround: false };
}

export function isBallStopped(state: BallState): boolean {
  const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
  return speed < STOP_SPEED;
}
