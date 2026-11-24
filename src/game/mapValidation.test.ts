import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ballisticApexHeight,
  buildFanBurstSchedule,
  C4_MAGAZINE_SIZE,
  canTriggerPortalTeleport,
  classifyGroundBoostWeapon,
  computeAirDashReset,
  computeDiveToSlideVelocity,
  computeGroundShotBoostImpulse,
  computePortalExit,
  computeSlideHopVelocity,
  computeStyleMultiplier,
  computeTripmineBounceVy,
  computeWalkableSteps,
  computeWalkRunWeaponSway,
  computeWallJumpVelocity,
  canCoyoteJump,
  chooseBotWeaponSlot,
  computeStyleSpeedMultiplier,
  computeSurfaceModifierSpeed,
  computeWebSwingVelocity,
  detectLaserBeamHits,
  HC_MAP_SPAWN_CONFIGS,
  isCoOwnerRedeemCode,
  isPointInsideWalls,
  isStepClimbable,
  isTargetGridLobbyDoorOpen,
  isWithinMapBounds,
  JUMP_MAT_VY,
  normalizeTargetGridDoorState,
  parseSpawnStart,
  pickPersistentRoundBot,
  projectWorldBoxToThumb,
  resolveDoubleTroubleArms,
  resolveInfiniteLoadoutPoolIds,
  resolveTargetGridSecretBoss,
  REVOLVER_BALANCE,
  selectBuiltInPadPower,
  SPEAR_DEF_SPEC,
  verifyRotationalSymmetry,
  type SymmetryBlock,
} from './mapValidation';

test('parseSpawnStart parses 3-element Target Grid start [0, 0, 19] accurately', () => {
  assert.deepEqual(parseSpawnStart([0, 0, 19]), { x: 0, y: 0, z: 19 });
  assert.deepEqual(parseSpawnStart([-14, 34, 20]), { x: -14, y: 34, z: 20 });
  assert.deepEqual(parseSpawnStart([12, -16]), { x: 12, y: 0, z: -16 });
});

test('computeWalkableSteps guarantees every ramp and stair riser is <= 0.61m', () => {
  for (const rise of [2.7, 3.2, 4.6, 5.44, 5.6, 6.4, 7.0, 9.8]) {
    const spec = computeWalkableSteps(rise);
    assert.equal(
      isStepClimbable(spec.stepHeight),
      true,
      `rise=${rise} produced unclimbable step ${spec.stepHeight}`
    );
    assert.ok(spec.stepHeight <= 0.55);
  }
});

test('Target Grid spawn (0, 19) is inside 35x24 walls and clear of central tower (radius 6.2)', () => {
  const sp = parseSpawnStart([0, 0, 19]);
  assert.equal(isPointInsideWalls(sp.x, sp.z, 35, 24, 1.0, 6.2), true);
  assert.equal(isPointInsideWalls(0, 0, 35, 24, 1.0, 6.2), false);
});

test('Target Grid secret boss portal stays hidden until unlocked and routes X to CritHits vs + to Bloxwaffles', () => {
  assert.deepEqual(normalizeTargetGridDoorState(false), {
    doorVisible: false,
    maskVisible: true,
    colliderPassable: false,
  });
  assert.deepEqual(normalizeTargetGridDoorState(true), {
    doorVisible: true,
    maskVisible: false,
    colliderPassable: true,
  });
  assert.equal(resolveTargetGridSecretBoss('X'), 'crithits');
  assert.equal(resolveTargetGridSecretBoss('+'), 'bloxwaffles');
  assert.equal(isTargetGridLobbyDoorOpen(true), true);
  assert.equal(isTargetGridLobbyDoorOpen(false), false);
});

test('verifyRotationalSymmetry passes for symmetric Redline Arena / Laser Arena and rejects asymmetry', () => {
  const redlineBlocks: SymmetryBlock[] = [
    { x: -21, z: -15, w: 7, d: 6, h: 4.0, team: 'blue' },
    { x: 21, z: 15, w: 7, d: 6, h: 4.0, team: 'red' },
    { x: -12, z: -21, w: 5, d: 5, h: 2.8, team: 'red' },
    { x: 12, z: 21, w: 5, d: 5, h: 2.8, team: 'blue' },
    { x: -8, z: -10, w: 4.5, d: 3.5, h: 1.2, team: 'neutral' },
    { x: 8, z: 10, w: 4.5, d: 3.5, h: 1.2, team: 'neutral' },
  ];
  assert.equal(verifyRotationalSymmetry(redlineBlocks), true);

  const asymmetric = [
    ...redlineBlocks,
    { x: -15, z: 6, w: 4, d: 4, h: 2.0, team: 'red' as const },
  ];
  assert.equal(verifyRotationalSymmetry(asymmetric), false);
});

test('every configured map spawn point (including Overpass & Pool Party) sits inside playable bounds', () => {
  assert.ok('Pool Party' in HC_MAP_SPAWN_CONFIGS);
  for (const [mapName, cfg] of Object.entries(HC_MAP_SPAWN_CONFIGS)) {
    const allPts = [...cfg.team0, ...cfg.team1, ...(cfg.extra ?? [])];
    assert.ok(cfg.team0.length >= 2 && cfg.team1.length >= 2, `${mapName} needs >= 2 spawns per team`);
    for (const pt of allPts) {
      assert.equal(
        isWithinMapBounds(pt.x, pt.z, cfg.bounds),
        true,
        `${mapName} spawn (${pt.x}, ${pt.z}) is outside bounds`
      );
    }
  }
});

test('Tripmine owner bounce delivers exact 3x Jump Mat apex height', () => {
  const jumpMatApex = ballisticApexHeight(JUMP_MAT_VY);
  const tripmineVy = computeTripmineBounceVy(JUMP_MAT_VY);
  const tripmineApex = ballisticApexHeight(tripmineVy);
  assert.ok(Math.abs(tripmineApex / jumpMatApex - 3.0) < 1e-6);
  assert.ok(tripmineVy > 48.4 && tripmineVy < 48.6);
});

test('Spear quick-swap burst spec & 3-satchel C4 magazine match requirements', () => {
  assert.equal(SPEAR_DEF_SPEC.sw, 0.6);
  assert.equal(SPEAR_DEF_SPEC.hitRadius, 0.5);
  assert.equal(SPEAR_DEF_SPEC.dmg * SPEAR_DEF_SPEC.head, SPEAR_DEF_SPEC.headshotDamage);
  assert.equal(C4_MAGAZINE_SIZE, 3);
});

test('Laser beam hit detection damages players near beam segments and respects cooldown', () => {
  const beams = [
    { a: { x: -5, y: 1.4, z: 0 }, b: { x: 5, y: 1.4, z: 0 }, radius: 0.11, lastHitSec: -10 },
    { a: { x: 0, y: 9.0, z: -10 }, b: { x: 0, y: 9.0, z: 10 }, radius: 0.11, lastHitSec: -10 },
  ];
  assert.deepEqual(detectLaserBeamHits({ x: 0, y: 0, z: 0 }, beams, 5.0), [0]);
  beams[0].lastHitSec = 5.0;
  assert.deepEqual(detectLaserBeamHits({ x: 0, y: 0, z: 0 }, beams, 5.2), []);
  assert.deepEqual(detectLaserBeamHits({ x: 0, y: 0, z: 0 }, beams, 5.6), [0]);
});

test('Walk and run weapon sway oscillate left-to-right during both walking and running', () => {
  const walkLeft = computeWalkRunWeaponSway(7.2, 0, Math.PI, true, false);
  const walkRight = computeWalkRunWeaponSway(7.2, 0, 0, true, false);
  const runLeft = computeWalkRunWeaponSway(14.0, 0, Math.PI, true, true);
  assert.ok(walkLeft.horizSway < 0 && walkRight.horizSway > 0);
  assert.ok(Math.abs(runLeft.horizSway) >= Math.abs(walkLeft.horizSway));
});

test('Double Trouble arm pairing & Infinite Loadouts pool include all unique items', () => {
  assert.deepEqual(resolveDoubleTroubleArms(0, 1, 2, 5), { cur: 2, offCur: 0 });
  assert.deepEqual(resolveDoubleTroubleArms(2, 0, 0, 5), { cur: 0, offCur: 2 });

  const pool = resolveInfiniteLoadoutPoolIds([
    [{ id: 'rifle' }, { id: 'revolver' }],
    [{ id: 'knife' }, { id: 'spear' }],
    [{ id: 'c4' }],
    [{ id: 'grapplehook' }, { id: 'glider' }, { id: 'rifle' }],
  ]);
  assert.deepEqual(pool, ['rifle', 'revolver', 'knife', 'spear', 'c4', 'grapplehook', 'glider']);
});

test('Revolver balance & Fan the Hammer sequential burst timing', () => {
  assert.ok(REVOLVER_BALANCE.dmg >= 50 && REVOLVER_BALANCE.dmg * REVOLVER_BALANCE.head < 120);
  const burst6 = buildFanBurstSchedule(6);
  assert.equal(burst6.length, 6);
  assert.equal(burst6[0], 0);
  assert.ok(burst6[5] > burst6[4] && burst6[5] < 0.45);
  assert.deepEqual(buildFanBurstSchedule(0), []);
});

test('Portal Gun teleport exit preserves clearance along surface normal and enforces cooldown', () => {
  assert.equal(canTriggerPortalTeleport(10.0, 10.75), false);
  assert.equal(canTriggerPortalTeleport(10.75, 10.75), true);

  const wallExit = computePortalExit(
    { point: { x: 10, y: 1.5, z: -20 }, normal: { x: 0, y: 0, z: 1 } },
    8.0
  );
  assert.ok(wallExit.pos.z > -19.0);
  assert.ok(wallExit.pos.y >= 0);
  assert.ok(wallExit.vel.z > 5.0);
  assert.ok(wallExit.yaw !== null && Math.abs(wallExit.yaw - Math.PI) < 0.01);

  const floorExit = computePortalExit(
    { point: { x: 5, y: 0, z: 5 }, normal: { x: 0, y: 1, z: 0 } },
    10.0
  );
  assert.ok(floorExit.vel.y >= 9.9);
  assert.equal(floorExit.yaw, null);
});

test('Ground-shot boost hierarchy prioritizes explosives > shotguns > snipers > revolvers > light weapons', () => {
  const exp = computeGroundShotBoostImpulse(classifyGroundBoostWeapon('rocket', 'Launcher', true), 1.8, -0.9, true);
  const sg = computeGroundShotBoostImpulse(classifyGroundBoostWeapon('shotgun', 'Shotgun', false), 1.8, -0.9);
  const sn = computeGroundShotBoostImpulse(classifyGroundBoostWeapon('sniper', 'Sniper', false), 1.8, -0.9);
  const rv = computeGroundShotBoostImpulse(classifyGroundBoostWeapon('revolver', 'Sidearm', false), 1.8, -0.9);
  const smg = computeGroundShotBoostImpulse(classifyGroundBoostWeapon('scar', 'Rifle', false), 1.8, -0.9);
  assert.ok(exp > sg && sg > sn && sn > rv && rv > smg && smg > 0);
  assert.equal(computeGroundShotBoostImpulse('shotgun', 1.8, 0.25), 0);
  assert.equal(computeGroundShotBoostImpulse('shotgun', 18, -0.9), 0);
});

test('Movement helpers verify coyote time, slide-hop, dive-to-slide, wall-jump, air-dash resets & style multiplier', () => {
  assert.equal(canCoyoteJump(false, 0.1), true);
  assert.equal(canCoyoteJump(false, 0), false);
  const hop = computeSlideHopVelocity(12, 2);
  assert.ok(hop.horiz > 12 && hop.vy > 9.2);
  assert.ok(computeDiveToSlideVelocity(12) >= 15.2);
  const wj = computeWallJumpVelocity({ x: 1, y: 0, z: 0 });
  assert.ok(wj.vx > 10 && wj.vy > 10);
  assert.equal(computeAirDashReset(0, 1, 'walljump'), 1);
  assert.ok(computeStyleMultiplier(230) > computeStyleMultiplier(60));
  assert.equal(computeStyleMultiplier(10), 1.0);
});

test('projectWorldBoxToThumb centers world coordinates cleanly inside 2D thumbnail frame', () => {
  const center = projectWorldBoxToThumb(0, 0, 10, 10, 40, 192, 108);
  assert.ok(Math.abs(center.px + center.pw / 2 - 96) < 0.1);
  assert.ok(Math.abs(center.py + center.ph / 2 - 54) < 0.1);
  assert.ok(center.pw > 10 && center.ph > 8);
});

test('chooseBotWeaponSlot switches between primary, secondary, and melee based on range and magazine state', () => {
  const slots = [
    { id: 'sniper', range: 90, pref: 32, ammo: 5, mag: 5, rel: 0 },
    { id: 'revolver', range: 60, pref: 14, ammo: 6, mag: 6, rel: 0 },
    { id: 'knife', range: 2.5, melee: true, ammo: 1, mag: 1, rel: 0 },
  ];
  assert.equal(chooseBotWeaponSlot(slots, 28, true), 0);
  assert.equal(chooseBotWeaponSlot(slots, 8.5, true), 1);
  assert.equal(chooseBotWeaponSlot(slots, 2.2, true), 2);
  const emptyPri = [{ ...slots[0], ammo: 0, rel: 1.5 }, slots[1], slots[2]];
  assert.equal(chooseBotWeaponSlot(emptyPri, 24, true), 1);
});

test('pickPersistentRoundBot preserves the same opponent across rounds and picks consistently on round 1', () => {
  const first = pickPersistentRoundBot(null, ['Noob_472', 'ObbyKing'], ['classic', 'neon', 'galaxy'], 'classic', 1);
  assert.equal(first.name, 'ObbyKing');
  assert.notEqual(first.skinId, 'classic');
  const round2 = pickPersistentRoundBot(first, ['Noob_472', 'ObbyKing'], ['classic', 'neon', 'galaxy'], 'classic', 0);
  assert.deepEqual(round2, first);
});

test('isCoOwnerRedeemCode validates exact BloxWaffles redeem code and selectBuiltInPadPower reads power or vy', () => {
  assert.equal(isCoOwnerRedeemCode('IDontKnowThePasswordOfThis334'), true);
  assert.equal(isCoOwnerRedeemCode(':IDontKnowThePasswordOfThis334'), true);
  assert.equal(isCoOwnerRedeemCode('wrongcode'), false);

  assert.equal(selectBuiltInPadPower({ vy: 27 }), 27);
  assert.equal(selectBuiltInPadPower({ power: 31 }), 31);
  assert.equal(selectBuiltInPadPower(undefined), 28);
});

test('Style speed, surface modifier speed, and web-swing tension constraint produce expected kinematics', () => {
  assert.equal(computeStyleSpeedMultiplier(1), 1);
  assert.equal(computeStyleSpeedMultiplier(5), 1.32);
  assert.ok(computeSurfaceModifierSpeed(10, 'slippery', true) > computeSurfaceModifierSpeed(10, 'sticky', false));
  const sw = computeWebSwingVelocity(
    { x: 0, y: -12, z: 0 },
    { x: 0, y: 2, z: 0 },
    { x: 0, y: 14, z: 0 },
    10,
    { x: 0, z: -1 },
    0.016
  );
  assert.ok(sw.vy > -12);
  assert.ok(sw.vz < 0);
});
