export interface SpawnPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface SpawnPoint2D {
  x: number;
  z: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MapSpawnConfig {
  bounds: MapBounds;
  team0: readonly SpawnPoint2D[];
  team1: readonly SpawnPoint2D[];
  extra?: readonly SpawnPoint2D[];
}

export interface SymmetryBlock {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  team?: 'red' | 'blue' | 'neutral';
}

export interface RampSpec {
  count: number;
  stepHeight: number;
}

export interface TargetGridDoorState {
  doorVisible: boolean;
  maskVisible: boolean;
  colliderPassable: boolean;
}

export const GRAVITY_DEFAULT = 26;
export const JUMP_MAT_VY = 28;
export const TRIPMINE_BOUNCE_VY = JUMP_MAT_VY * Math.sqrt(3);

export const REVOLVER_BALANCE = {
  dmg: 54,
  head: 1.85,
  rate: 0.44,
  mag: 6,
  reload: 1.85,
  spread: 0.002,
  recoil: 1.15,
  fanDamageScale: 0.65,
  fanIntervalSec: 0.072,
  fanCooldownSec: 4.2,
} as const;

export const HC_MAP_SPAWN_CONFIGS: Record<string, MapSpawnConfig> = {
  'Target Grid': {
    bounds: { minX: -32.5, maxX: 32.5, minZ: -21.5, maxZ: 21.5 },
    team0: [
      { x: -25, z: 11 },
      { x: -25, z: -11 },
      { x: -25, z: 0 },
    ],
    team1: [
      { x: 25, z: -11 },
      { x: 25, z: 11 },
      { x: 25, z: 0 },
    ],
    extra: [
      { x: 0, z: 17.5 },
      { x: 0, z: -18 },
    ],
  },
  'Laser Arena': {
    bounds: { minX: -31.5, maxX: 31.5, minZ: -14.5, maxZ: 21.5 },
    team0: [
      { x: -27.5, z: 13.5 },
      { x: -21.0, z: 18.0 },
      { x: -27.5, z: 6.0 },
    ],
    team1: [
      { x: 27.5, z: 13.5 },
      { x: 21.0, z: 18.0 },
      { x: 27.5, z: 6.0 },
    ],
    extra: [
      { x: -18.0, z: -11.5 },
      { x: 18.0, z: -11.5 },
    ],
  },
  'Redline Arena': {
    bounds: { minX: -25.8, maxX: 25.8, minZ: -25.8, maxZ: 25.8 },
    team0: [
      { x: -24.0, z: 22.0 },
      { x: -24.0, z: -23.0 },
      { x: -16.0, z: 23.0 },
    ],
    team1: [
      { x: 24.0, z: -22.0 },
      { x: 24.0, z: 23.0 },
      { x: 16.0, z: -23.0 },
    ],
    extra: [
      { x: -24.0, z: -1.0 },
      { x: 24.0, z: 1.0 },
    ],
  },
  Overpass: {
    bounds: { minX: -44.0, maxX: 44.0, minZ: -44.0, maxZ: 44.0 },
    team0: [
      { x: -38.0, z: 0.0 },
      { x: -38.0, z: -10.0 },
      { x: -18.0, z: -38.0 },
    ],
    team1: [
      { x: 38.0, z: 0.0 },
      { x: 38.0, z: 10.0 },
      { x: 18.0, z: 38.0 },
    ],
    extra: [
      { x: 18.0, z: -38.0 },
      { x: -18.0, z: 38.0 },
    ],
  },
  'Pool Party': {
    bounds: { minX: -38.0, maxX: 38.0, minZ: -38.0, maxZ: 38.0 },
    team0: [
      { x: 0.0, z: 30.0 },
      { x: -18.0, z: 28.0 },
      { x: 18.0, z: 28.0 },
    ],
    team1: [
      { x: 0.0, z: -30.0 },
      { x: 18.0, z: -28.0 },
      { x: -18.0, z: -28.0 },
    ],
    extra: [
      { x: -30.0, z: 0.0 },
      { x: 30.0, z: 0.0 },
    ],
  },
  'Assembly Plant': {
    bounds: { minX: -31.8, maxX: 31.8, minZ: -25.8, maxZ: 25.8 },
    team0: [
      { x: 0.0, z: 22.0 },
      { x: -28.0, z: 0.0 },
      { x: -10.5, z: 21.5 },
    ],
    team1: [
      { x: 0.0, z: -22.0 },
      { x: 28.0, z: 0.0 },
      { x: 10.5, z: -21.5 },
    ],
    extra: [
      { x: -10.5, z: -21.5 },
      { x: 10.5, z: 21.5 },
    ],
  },
  'Blockworks Arena': {
    bounds: { minX: -30.8, maxX: 30.8, minZ: -27.8, maxZ: 27.8 },
    team0: [
      { x: -28.2, z: 0.0 },
      { x: 0.0, z: 25.5 },
      { x: -15.5, z: 24.5 },
    ],
    team1: [
      { x: 28.2, z: 0.0 },
      { x: 0.0, z: -25.5 },
      { x: 15.5, z: -24.5 },
    ],
    extra: [
      { x: -15.5, z: -24.5 },
      { x: 15.5, z: 24.5 },
    ],
  },
  'Violet Voltage': {
    bounds: { minX: -32.8, maxX: 32.8, minZ: -32.8, maxZ: 32.8 },
    team0: [
      { x: -31.5, z: -15.0 },
      { x: 0.0, z: -29.0 },
      { x: -31.5, z: 15.0 },
    ],
    team1: [
      { x: 31.5, z: 15.0 },
      { x: 0.0, z: 29.0 },
      { x: 31.5, z: -15.0 },
    ],
    extra: [
      { x: -16.0, z: -31.0 },
      { x: 16.0, z: 31.0 },
    ],
  },
  'Hypercore Arena': {
    bounds: { minX: -32.8, maxX: 32.8, minZ: -32.8, maxZ: 32.8 },
    team0: [
      { x: -31.5, z: -14.0 },
      { x: -15.0, z: -31.0 },
      { x: -31.5, z: 14.0 },
    ],
    team1: [
      { x: 31.5, z: 14.0 },
      { x: 15.0, z: 31.0 },
      { x: 31.5, z: -14.0 },
    ],
    extra: [
      { x: 15.0, z: -31.0 },
      { x: -15.0, z: 31.0 },
    ],
  },
  'Overlord Citadel': {
    bounds: { minX: -32.0, maxX: 32.0, minZ: -30.0, maxZ: 30.0 },
    team0: [
      { x: 0.0, z: 26.0 },
      { x: -16.0, z: 25.0 },
      { x: 16.0, z: 25.0 },
    ],
    team1: [
      { x: 0.0, z: -26.0 },
      { x: 16.0, z: -25.0 },
      { x: -16.0, z: -25.0 },
    ],
    extra: [
      { x: -26.0, z: 0.0 },
      { x: 26.0, z: 0.0 },
    ],
  },
  'CritHits Sanctum': {
    bounds: { minX: -16.2, maxX: 16.2, minZ: -16.2, maxZ: 16.2 },
    team0: [
      { x: 0.0, z: 14.0 },
      { x: -14.0, z: 0.0 },
      { x: -7.5, z: 14.0 },
    ],
    team1: [
      { x: 0.0, z: -14.0 },
      { x: 14.0, z: 0.0 },
      { x: 7.5, z: -14.0 },
    ],
    extra: [
      { x: -14.0, z: 5.5 },
      { x: 14.0, z: -5.5 },
    ],
  },
  'Acid Flats': {
    bounds: { minX: -54.0, maxX: 54.0, minZ: -54.0, maxZ: 54.0 },
    team0: [
      { x: -34.0, z: -25.0 },
      { x: 0.0, z: -28.0 },
      { x: -34.0, z: 0.0 },
    ],
    team1: [
      { x: 34.0, z: 25.0 },
      { x: 0.0, z: 28.0 },
      { x: 34.0, z: 0.0 },
    ],
    extra: [
      { x: -34.0, z: 25.0 },
      { x: 34.0, z: -25.0 },
    ],
  },
};

export const SPEAR_DEF_SPEC = {
  id: 'spear',
  dmg: 40,
  head: 1.5,
  headshotDamage: 60,
  sw: 0.6,
  hitRadius: 0.5,
} as const;

export const C4_MAGAZINE_SIZE = 3;

export function isWithinMapBounds(x: number, z: number, bounds: MapBounds): boolean {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x >= bounds.minX &&
    x <= bounds.maxX &&
    z >= bounds.minZ &&
    z <= bounds.maxZ
  );
}

export function ballisticApexHeight(vy: number, gravity = GRAVITY_DEFAULT): number {
  if (!Number.isFinite(vy) || vy <= 0 || !Number.isFinite(gravity) || gravity <= 0) return 0;
  return (vy * vy) / (2 * gravity);
}

export function computeTripmineBounceVy(baseJumpMatVy = JUMP_MAT_VY): number {
  return baseJumpMatVy * Math.sqrt(3);
}

export function buildFanBurstSchedule(ammo: number, intervalSec = REVOLVER_BALANCE.fanIntervalSec): number[] {
  const count = Math.max(0, Math.min(6, Math.floor(ammo)));
  const offsets: number[] = [];
  for (let i = 0; i < count; i++) {
    offsets.push(Number((i * intervalSec).toFixed(4)));
  }
  return offsets;
}

export interface PortalGateLike {
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
}

export function canTriggerPortalTeleport(nowSec: number, nextAllowedAt: number): boolean {
  return Number.isFinite(nowSec) && nowSec >= (Number.isFinite(nextAllowedAt) ? nextAllowedAt : 0);
}

export function computePortalExit(
  exit: PortalGateLike,
  incomingSpeed = 6.0,
  pushOut = 1.2
): {
  pos: SpawnPoint3D;
  vel: SpawnPoint3D;
  yaw: number | null;
} {
  const nLen = Math.hypot(exit.normal.x, exit.normal.y, exit.normal.z) || 1;
  const nx = exit.normal.x / nLen;
  const ny = exit.normal.y / nLen;
  const nz = exit.normal.z / nLen;

  const isHorizontalWall = Math.abs(ny) < 0.45;
  const x = exit.point.x + nx * pushOut;
  const z = exit.point.z + nz * pushOut;
  const rawY = ny > 0.7 ? exit.point.y + 0.2 : ny < -0.7 ? exit.point.y - 2.05 : exit.point.y - 0.85;
  const y = Math.max(0, rawY);

  const launchSpeed = Math.max(5.2, Number(incomingSpeed) || 0);
  const vx = nx * launchSpeed;
  const vz = nz * launchSpeed;
  const vy = isHorizontalWall ? Math.max(2.6, ny * launchSpeed) : ny * launchSpeed;
  const horiz = Math.hypot(nx, nz);
  const ax = Math.abs(nx) < 1e-9 ? 0 : -nx;
  const az = Math.abs(nz) < 1e-9 ? 0 : -nz;
  const yaw = horiz > 0.45 ? Math.atan2(ax, az) : null;

  return {
    pos: { x, y, z },
    vel: { x: vx, y: vy, z: vz },
    yaw,
  };
}

/**
 * Parses either a 2-tuple [x, z] or 3-tuple [x, y, z] spawn coordinate.
 */
export function parseSpawnStart(startTuple: readonly number[] | undefined | null): SpawnPoint3D {
  if (!Array.isArray(startTuple) || startTuple.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  if (startTuple.length >= 3) {
    return {
      x: Number(startTuple[0]) || 0,
      y: Number(startTuple[1]) || 0,
      z: Number(startTuple[2]) || 0,
    };
  }
  if (startTuple.length === 2) {
    return {
      x: Number(startTuple[0]) || 0,
      y: 0,
      z: Number(startTuple[1]) || 0,
    };
  }
  return { x: Number(startTuple[0]) || 0, y: 0, z: 0 };
}

export function isStepClimbable(stepHeight: number, maxStep = 0.61): boolean {
  return Number.isFinite(stepHeight) && stepHeight > 0 && stepHeight <= maxStep;
}

export function computeWalkableSteps(rise: number, maxStep = 0.52, minCount = 8): RampSpec {
  const safeRise = Math.max(0.1, Number(rise) || 0.1);
  const safeMax = Math.min(0.6, Math.max(0.15, maxStep));
  const count = Math.max(minCount, Math.ceil(safeRise / safeMax));
  return {
    count,
    stepHeight: safeRise / count,
  };
}

export function isPointInsideWalls(
  x: number,
  z: number,
  halfX: number,
  halfZ: number,
  wallMargin = 1.0,
  blockedHubRadius = 0
): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (Math.abs(x) > halfX - wallMargin || Math.abs(z) > halfZ - wallMargin) return false;
  if (blockedHubRadius > 0 && Math.hypot(x, z) < blockedHubRadius) return false;
  return true;
}

export function verifyRotationalSymmetry(blocks: readonly SymmetryBlock[], eps = 0.01): boolean {
  const swapTeam = (t?: 'red' | 'blue' | 'neutral') =>
    t === 'red' ? 'blue' : t === 'blue' ? 'red' : t ?? 'neutral';

  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const expectedTeam = swapTeam(a.team);
    const match = blocks.some(
      (b) =>
        Math.abs(b.x + a.x) <= eps &&
        Math.abs(b.z + a.z) <= eps &&
        Math.abs(b.w - a.w) <= eps &&
        Math.abs(b.d - a.d) <= eps &&
        Math.abs(b.h - a.h) <= eps &&
        (b.team ?? 'neutral') === expectedTeam
    );
    if (!match) return false;
  }
  return true;
}

export function normalizeTargetGridDoorState(unlocked: boolean): TargetGridDoorState {
  const isOpen = Boolean(unlocked);
  return {
    doorVisible: isOpen,
    maskVisible: !isOpen,
    colliderPassable: isOpen,
  };
}

export function resolveTargetGridSecretBoss(symbol: string | null | undefined): 'crithits' | 'bloxwaffles' {
  return String(symbol || '').trim().toUpperCase() === 'X' ? 'crithits' : 'bloxwaffles';
}

export function isTargetGridLobbyDoorOpen(isPractice: boolean): boolean {
  return Boolean(isPractice);
}

export interface LaserBeamSpec {
  a: SpawnPoint3D;
  b: SpawnPoint3D;
  radius: number;
  lastHitSec?: number;
}

export function pointToSegmentDistanceSq3D(p: SpawnPoint3D, a: SpawnPoint3D, b: SpawnPoint3D): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const apz = p.z - a.z;
  const abLenSq = abx * abx + aby * aby + abz * abz;
  const t = abLenSq > 1e-8 ? Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / abLenSq)) : 0;
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const cz = a.z + abz * t;
  const dx = p.x - cx;
  const dy = p.y - cy;
  const dz = p.z - cz;
  return dx * dx + dy * dy + dz * dz;
}

export function detectLaserBeamHits(
  playerPos: SpawnPoint3D,
  beams: readonly LaserBeamSpec[],
  nowSec: number,
  cooldownSec = 0.55,
  bodyRadius = 0.42
): number[] {
  const hitIndices: number[] = [];
  const sampleYs = [0.55, 1.05, 1.55];
  for (let i = 0; i < beams.length; i++) {
    const beam = beams[i];
    if ((beam.lastHitSec ?? -999) + cooldownSec > nowSec) continue;
    const hitDist = Math.max(0.05, Number(beam.radius) || 0.1) + bodyRadius;
    const hitDistSq = hitDist * hitDist;
    for (const dy of sampleYs) {
      const distSq = pointToSegmentDistanceSq3D(
        { x: playerPos.x, y: playerPos.y + dy, z: playerPos.z },
        beam.a,
        beam.b
      );
      if (distSq <= hitDistSq) {
        hitIndices.push(i);
        break;
      }
    }
  }
  return hitIndices;
}

export function computeWalkRunWeaponSway(
  velX: number,
  velZ: number,
  bobT: number,
  onGround: boolean,
  isDashing: boolean
): { horizSway: number; vertBob: number; roll: number } {
  const speed = Math.hypot(velX, velZ);
  const airScale = onGround ? 1 : 0.25;
  const sf = Math.min(1.35, speed / 7.5) * airScale;
  const ampScale = isDashing ? 1.25 : 1.0;
  const waveX = Math.cos(bobT);
  const waveY = Math.sin(bobT * 2);
  return {
    horizSway: waveX * 0.018 * sf * ampScale,
    vertBob: waveY * 0.012 * sf * ampScale,
    roll: -waveX * 0.028 * sf * ampScale,
  };
}

export function resolveDoubleTroubleArms(
  cur: number,
  offCur: number,
  requestedSlot: number,
  slotCount: number
): { cur: number; offCur: number } {
  if (slotCount <= 0) return { cur: 0, offCur: -1 };
  if (slotCount === 1) return { cur: 0, offCur: -1 };
  const target = ((requestedSlot % slotCount) + slotCount) % slotCount;
  if (target === cur) return { cur, offCur };
  if (target === offCur) return { cur: offCur, offCur: cur };
  return { cur: target, offCur: cur };
}

export function resolveInfiniteLoadoutPoolIds(
  categories: ReadonlyArray<ReadonlyArray<{ id: string }>>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of categories) {
    for (const item of list) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        out.push(item.id);
      }
    }
  }
  return out;
}

export type GroundBoostClass = 'explosive' | 'shotgun' | 'sniper' | 'revolver' | 'light';

export function classifyGroundBoostWeapon(id: string, cls?: string, isExplosive?: boolean): GroundBoostClass {
  const low = String(id || '').toLowerCase();
  const c = String(cls || '').toLowerCase();
  if (
    isExplosive ||
    ['rocket', 'rocketpod', 'mega', 'plasmacannon', 'sticky', 'fraggrenade', 'sodacan', 'grenadelauncher'].includes(low) ||
    c.includes('launch') ||
    c.includes('heavy')
  ) {
    return 'explosive';
  }
  if (['shotgun', 'dbl', 'combat', 'coach', 'doublebarrel'].includes(low) || c.includes('shotgun')) {
    return 'shotgun';
  }
  if (['sniper', 'railgun', 'hunter', 'lever', 'm1garand', 'awp'].includes(low) || c.includes('sniper') || c.includes('marksman')) {
    return 'sniper';
  }
  if (['revolver', 'm500', 'handcannon', 'deagle'].includes(low)) {
    return 'revolver';
  }
  return 'light';
}

export function computeGroundShotBoostImpulse(
  weaponClass: GroundBoostClass,
  hitDist: number,
  aimDirY: number,
  isExplosive = false
): number {
  const classBase: Record<GroundBoostClass, number> = {
    explosive: 19.5,
    shotgun: 13.8,
    sniper: 10.6,
    revolver: 7.4,
    light: 3.1,
  };
  const base = isExplosive ? Math.max(classBase[weaponClass], classBase.explosive) : classBase[weaponClass];
  if (!Number.isFinite(hitDist) || hitDist > 8.5 || !Number.isFinite(aimDirY) || aimDirY > -0.15) {
    return 0;
  }
  const distFactor = Math.max(0.25, Math.min(1.0, 1 - hitDist / 8.5));
  const downwardFactor = Math.max(0.2, Math.min(1.0, -aimDirY));
  return Number((base * (0.45 + 0.55 * distFactor) * (0.55 + 0.45 * downwardFactor)).toFixed(3));
}

export function canCoyoteJump(onGround: boolean, coyoteRemainingSec: number): boolean {
  return Boolean(onGround) || (Number.isFinite(coyoteRemainingSec) && coyoteRemainingSec > 0);
}

export function computeSlideHopVelocity(slideSpeed: number, bhopChainCount: number, baseJumpVy = 9.2): { horiz: number; vy: number } {
  const safeSlide = Math.max(7.2, Number(slideSpeed) || 0);
  const chainBoost = 1 + Math.min(4, Math.max(0, Math.floor(bhopChainCount))) * 0.045;
  return {
    horiz: Number(Math.min(24, safeSlide * 1.06 * chainBoost).toFixed(3)),
    vy: Number((baseJumpVy * 1.08).toFixed(3)),
  };
}

export function computeDiveToSlideVelocity(currentHorizSpeed: number): number {
  const safe = Math.max(0, Number(currentHorizSpeed) || 0);
  return Number(Math.min(24.5, Math.max(15.2, safe * 1.32)).toFixed(3));
}

export function computeWallJumpVelocity(
  wallNormal: { x: number; y: number; z: number },
  baseJumpVy = 9.2
): { vx: number; vy: number; vz: number } {
  const len = Math.hypot(wallNormal.x, wallNormal.z) || 1;
  const nx = wallNormal.x / len;
  const nz = wallNormal.z / len;
  return {
    vx: Number((nx * 10.6).toFixed(3)),
    vy: Number((baseJumpVy * 1.14).toFixed(3)),
    vz: Number((nz * 10.6).toFixed(3)),
  };
}

export function computeAirDashReset(
  currentDashes: number,
  maxDashes: number,
  reason: 'land' | 'walljump' | 'pogo' | 'jumppad' | 'portal' | 'kill'
): number {
  void currentDashes;
  void reason;
  return Math.max(1, Math.floor(maxDashes));
}

export function computeStyleMultiplier(stylePts: number): number {
  const pts = Math.max(0, Number(stylePts) || 0);
  if (pts >= 220) return 1.25;
  if (pts >= 120) return 1.18;
  if (pts >= 50) return 1.1;
  return 1.0;
}

export function projectWorldBoxToThumb(
  x: number,
  z: number,
  w: number,
  d: number,
  halfExtent: number,
  thumbW = 192,
  thumbH = 108
): { px: number; py: number; pw: number; ph: number } {
  const h = Math.max(10, Number(halfExtent) || 35);
  const padX = 8;
  const padY = 6;
  const usableW = Math.max(16, thumbW - padX * 2);
  const usableH = Math.max(16, thumbH - padY * 2);
  const cx = padX + ((x + h) / (2 * h)) * usableW;
  const cy = padY + ((z + h) / (2 * h)) * usableH;
  const pw = Math.max(2, (Math.max(0.2, w) / (2 * h)) * usableW);
  const ph = Math.max(2, (Math.max(0.2, d) / (2 * h)) * usableH);
  return {
    px: Number((cx - pw / 2).toFixed(2)),
    py: Number((cy - ph / 2).toFixed(2)),
    pw: Number(pw.toFixed(2)),
    ph: Number(ph.toFixed(2)),
  };
}

export interface BotSlotSpec {
  id: string;
  range: number;
  pref?: number;
  melee?: boolean;
  ammo: number;
  mag: number;
  rel: number;
  infiniteAmmo?: boolean;
}

export function chooseBotWeaponSlot(
  slots: ReadonlyArray<BotSlotSpec>,
  dist: number,
  hasLos: boolean
): number {
  if (!Array.isArray(slots) || slots.length === 0) return 0;
  const priIdx = 0;
  const secIdx = slots.length > 1 ? 1 : -1;
  const melIdx = slots.findIndex((s) => Boolean(s && s.melee));
  const ready = (idx: number) => {
    const s = slots[idx];
    if (!s) return false;
    if (s.melee || s.infiniteAmmo) return true;
    return s.rel <= 0 && s.ammo > 0;
  };
  if (melIdx >= 0 && Number.isFinite(dist) && dist <= 2.9 && hasLos) {
    return melIdx;
  }
  if (secIdx >= 0 && ready(secIdx)) {
    const pri = slots[priIdx];
    const priEmptyOrRel = !ready(priIdx);
    const priSniperClose = Boolean(pri && (pri.pref || 0) >= 26 && dist < 11);
    const closeSec = dist < 10 && (!pri || (pri.pref || 16) > 15);
    if (priEmptyOrRel || priSniperClose || closeSec) {
      return secIdx;
    }
  }
  if (ready(priIdx)) return priIdx;
  if (secIdx >= 0 && ready(secIdx)) return secIdx;
  if (melIdx >= 0 && dist < 6.5) return melIdx;
  return priIdx;
}

export interface PersistentBotIdentity {
  name: string;
  skinId: string;
  accountName: string;
}

export function pickPersistentRoundBot(
  existingBot: PersistentBotIdentity | null | undefined,
  names: ReadonlyArray<string>,
  skinIds: ReadonlyArray<string>,
  playerSkinId: string,
  pickIndex = 0
): PersistentBotIdentity {
  if (existingBot && existingBot.name && existingBot.skinId) {
    return existingBot;
  }
  const safeNames = names.length ? names : ['Bot_Rival'];
  const name = safeNames[((Math.floor(pickIndex) % safeNames.length) + safeNames.length) % safeNames.length];
  const poolSkins = skinIds.filter((s) => s !== playerSkinId);
  const safeSkins = poolSkins.length ? poolSkins : skinIds.length ? skinIds : ['classic'];
  const skinId = safeSkins[((Math.floor(pickIndex * 3) % safeSkins.length) + safeSkins.length) % safeSkins.length];
  return {
    name,
    skinId,
    accountName: name,
  };
}

export function isCoOwnerRedeemCode(rawCode: string): boolean {
  const clean = String(rawCode || '').replace(/^:+/, '').trim();
  return clean === 'IDontKnowThePasswordOfThis334';
}

export function selectBuiltInPadPower(pad: { power?: number; vy?: number } | null | undefined): number {
  if (!pad) return 28;
  const v = Number(pad.power) || Number(pad.vy) || 28;
  return Math.max(12, v);
}

export function computeStyleSpeedMultiplier(styleMult: number): number {
  const m = Math.max(1, Math.min(5, Number(styleMult) || 1));
  return Number((1 + (m - 1) * 0.08).toFixed(3));
}

export function computeSurfaceModifierSpeed(
  baseSpeed: number,
  surface: 'bouncy' | 'slippery' | 'sticky' | null | undefined,
  isSliding: boolean
): number {
  const sp = Math.max(0, Number(baseSpeed) || 0);
  if (surface === 'sticky') return Number((sp * 0.68).toFixed(3));
  if (surface === 'slippery') return Number((sp * (isSliding ? 1.24 : 1.12)).toFixed(3));
  return Number(sp.toFixed(3));
}

export function computeWebSwingVelocity(
  vel: { x: number; y: number; z: number },
  pos: { x: number; y: number; z: number },
  anchor: { x: number; y: number; z: number },
  ropeLen: number,
  forward: { x: number; z: number },
  dt: number
): { vx: number; vy: number; vz: number } {
  const safeDt = Math.max(0.001, Math.min(0.05, dt));
  let vx = vel.x + forward.x * 18 * safeDt;
  let vy = vel.y - 22 * safeDt;
  let vz = vel.z + forward.z * 18 * safeDt;

  const rx = pos.x - anchor.x;
  const ry = pos.y - anchor.y;
  const rz = pos.z - anchor.z;
  const dist = Math.hypot(rx, ry, rz) || 0.001;
  if (dist >= ropeLen * 0.92) {
    const nx = rx / dist;
    const ny = ry / dist;
    const nz = rz / dist;
    const radial = vx * nx + vy * ny + vz * nz;
    if (radial > 0) {
      vx -= nx * radial;
      vy -= ny * radial;
      vz -= nz * radial;
    }
    const pull = Math.min(26, (dist - ropeLen * 0.92) * 14) * safeDt;
    vx -= nx * pull;
    vy -= ny * pull;
    vz -= nz * pull;
  }
  return {
    vx: Number(vx.toFixed(3)),
    vy: Number(vy.toFixed(3)),
    vz: Number(vz.toFixed(3)),
  };
}
