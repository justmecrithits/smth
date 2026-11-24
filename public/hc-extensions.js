/* ============================================================================
 * HYPER CLASH — EXTENSIONS & FIXES MODULE
 * Runs inside the core engine lexical scope prior to the final IIFE close.
 * Fixes:
 *  1. sjedits skin smiley face (visible high-contrast eyes + upward smile)
 *  2. Target Grid 3-tuple start=[0,0,19] spawn + hidden portal behind solid wall
 *     + walk-into-portal transition to Bloxwaffles Overlord Citadel boss fight
 *  3. Exact half-extent MAP_SIZE & arenaHalf across all new maps
 *  4. Redline Arena strict 180-degree rotational symmetry & flush diagonal bridge
 *  5. Laser Arena (faithful 3D hall, central dais + emitter, twin side ramps,
 *     rear balcony portals, West cyan / East magenta doors, crisscrossing lasers)
 *  6. Richer map detail & walkable ramps (step <= 0.52m) across all new maps
 *  7. Improved character + bot locomotion, torso lean/twist, aim pitch, recoil,
 *     and 1st-person viewmodel breath/inertia animations
 *  8. Upgraded upper-left Chat system (#hcMatchChat) for both Lobby and Match
 * ============================================================================ */
(function hcExtensionsPatch() {
  'use strict';

  if (typeof THREE === 'undefined' || typeof MAPS === 'undefined') {
    console.warn('[HYPER CLASH] Extensions loaded outside core scope.');
    return;
  }

  window.HC_EXT_LOADED = true;

  /* -------------------------------------------------------------------------
   * 1. SJEDITS SKIN — VISIBLE SMILEY FACE
   * ------------------------------------------------------------------------- */
  if (typeof hcApplySJEditsAvatar === 'function') {
    const hcPrevSJEdits = hcApplySJEditsAvatar;
    hcApplySJEditsAvatar = function (vis) {
      hcPrevSJEdits(vis);
      if (!vis || !vis.pr) return;

      const makeFaceMat = (hex, em) =>
        new THREE.MeshLambertMaterial({
          color: hex,
          emissive: em,
          emissiveIntensity: 0.65,
        });

      const faceMat = makeFaceMat('#f4f7fc', '#b7d4f2');

      if (vis.pr.eyeL) {
        vis.pr.eyeL.visible = true;
        vis.pr.eyeL.material = faceMat;
        vis.pr.eyeL.position.set(-0.1, 1.76, -0.256);
        vis.pr.eyeL.scale.set(0.052, 0.068, 0.024);
      }
      if (vis.pr.eyeR) {
        vis.pr.eyeR.visible = true;
        vis.pr.eyeR.material = faceMat;
        vis.pr.eyeR.position.set(0.1, 1.76, -0.256);
        vis.pr.eyeR.scale.set(0.052, 0.068, 0.024);
      }
      if (vis.pr.mouth) {
        if (typeof smileG !== 'undefined') vis.pr.mouth.geometry = smileG;
        vis.pr.mouth.visible = true;
        vis.pr.mouth.material = faceMat;
        vis.pr.mouth.position.set(0, 1.645, -0.256);
        vis.pr.mouth.scale.set(0.24, 0.145, 0.028);
        vis.pr.mouth.rotation.set(0, 0, 0);
      }
      vis.userData = vis.userData || {};
      vis.userData.hcIsSjedits = true;
    };

    try {
      if (typeof ACT !== 'undefined' && Array.isArray(NPCS)) {
        NPCS.forEach((n, i) => {
          if (n && n.id === 'riley' && ACT[i] && ACT[i].vis) {
            hcApplySJEditsAvatar(ACT[i].vis);
          }
        });
      }
      if (typeof hcApplyCurrentAccountAvatar === 'function') {
        hcApplyCurrentAccountAvatar();
      }
    } catch (e) {}
  }

  /* -------------------------------------------------------------------------
   * 2. MAP SIZING & SPAWN TUPLE PARSING (TARGET GRID + NEW ARENAS)
   * ------------------------------------------------------------------------- */
  const HC_HALF_OVERRIDES = {
    'Target Grid': 35,
    'Assembly Plant': 34,
    'Blockworks Arena': 33,
    'Violet Voltage': 35,
    'Hypercore Arena': 35,
    'Redline Arena': 28,
    'Overpass': 46,
    'Laser Arena': 34,
    'Pool Party': 40,
  };

  if (typeof MAP_SIZE === 'object' && MAP_SIZE) {
    Object.assign(MAP_SIZE, HC_HALF_OVERRIDES);
  }

  if (typeof arenaHalf === 'function') {
    const hcPrevArenaHalf = arenaHalf;
    arenaHalf = function (M) {
      if (M && Object.prototype.hasOwnProperty.call(HC_HALF_OVERRIDES, M.name)) {
        return HC_HALF_OVERRIDES[M.name];
      }
      return hcPrevArenaHalf(M);
    };
  }

  if (typeof practiceInit === 'function') {
    practiceInit = function () {
      const M = MAPS[G.mapIdx];
      PRC.shots = PRC.hits = PRC.heads = PRC.dmg = PRC.targetsBroken = 0;
      G.practice = true;
      if (Array.isArray(M.dummies)) {
        M.dummies.forEach((d, i) => {
          const b = ACT[i];
          if (!b) return;
          b.dummy = true;
          b.dk = d.k;
          b.amp = d.amp || 0;
          b.ph = i * 1.3;
          b.home = { x: d.x, z: d.z };
          b.maxhp = d.k === 'a' ? 300 : d.k === 'm' && d.amp > 10 ? 150 : 100;
          b.hp = b.maxhp;
          b.pos.set(d.x, 0, d.z);
          b.vel.set(0, 0, 0);
          b.team = 1;
          b.name = d.k === 'a' ? 'Armored' : d.k === 'm' ? 'Mover' : 'Dummy';
          b.cnt = false;
          b.alive = true;
        });
      }
      const st = M && M.start ? M.start : [0, 0, 19];
      const sx = st.length >= 3 ? Number(st[0]) || 0 : Number(st[0]) || 0;
      const sy = st.length >= 3 ? Number(st[1]) || 0 : 0;
      const sz = st.length >= 3 ? Number(st[2]) || 0 : Number(st[1]) || 0;
      P.pos.set(sx, sy, sz);
      P.vel.set(0, 0, 0);
      P.yaw = 0;
      P.pitch = 0;
      P.prot = 1e9;
      P.hcTargetGridAccess = false;
      if (window.hcBuildRangeSecrets) window.hcBuildRangeSecrets();
    };
  }

  /* -------------------------------------------------------------------------
   * SHARED WALKABLE RAMP HELPER (guarantees every riser <= 0.52m)
   * ------------------------------------------------------------------------- */
  function hcWalkableRamp(m, x, zA, zB, rise, width, deckColor, trimColor) {
    const n = Math.max(8, Math.ceil(Math.abs(rise) / 0.49));
    const dz = zB - zA;
    const step = rise / n;
    const stepDepth = Math.abs(dz) / n;
    for (let i = 0; i < n; i++) {
      const z = zA + dz * ((i + 0.5) / n);
      m.add(x, z, width, stepDepth + 0.08, step + 0.06, '#000000', i * step, 0);
    }
    const len = Math.abs(dz) + 0.45;
    const slope = Math.atan2(rise, Math.abs(dz));
    const rx = zB < zA ? slope : -slope;
    m.part(unit, deckColor, x, rise / 2, (zA + zB) / 2, width, 0.2, len, rx, 0, 0);
    if (trimColor) {
      for (const side of [-1, 1]) {
        m.part(
          unit,
          trimColor,
          x + side * (width / 2 - 0.06),
          rise / 2 + 0.12,
          (zA + zB) / 2,
          0.12,
          0.12,
          len,
          rx,
          0,
          0
        );
      }
    }
  }

  function hcWalkableRampX(m, z, xA, xB, rise, depth, deckColor, trimColor) {
    const n = Math.max(8, Math.ceil(Math.abs(rise) / 0.49));
    const dx = xB - xA;
    const step = rise / n;
    const stepW = Math.abs(dx) / n;
    for (let i = 0; i < n; i++) {
      const x = xA + dx * ((i + 0.5) / n);
      m.add(x, z, stepW + 0.08, depth, step + 0.06, '#000000', i * step, 0);
    }
    const len = Math.abs(dx) + 0.45;
    const slope = Math.atan2(rise, Math.abs(dx));
    const rz = xB > xA ? slope : -slope;
    m.part(unit, deckColor, (xA + xB) / 2, rise / 2, z, len, 0.2, depth, 0, 0, rz);
    if (trimColor) {
      for (const side of [-1, 1]) {
        m.part(
          unit,
          trimColor,
          (xA + xB) / 2,
          rise / 2 + 0.12,
          z + side * (depth / 2 - 0.06),
          len,
          0.12,
          0.12,
          0,
          0,
          rz
        );
      }
    }
  }

  /* -------------------------------------------------------------------------
   * 3. TARGET GRID REBUILD — HIDE PORTAL BEHIND SEAMLESS GRIDDED WALL + WALK IN
   * ------------------------------------------------------------------------- */
  const tgMap = MAPS.find((m) => m && m.name === 'Target Grid');
  if (tgMap) {
    tgMap.desc =
      'A rectangular precision training hall with clean white grid walls, roofed corner towers, overhead skylights, walkable catwalk ramps, and red symbol bullseyes concealing a secret boss doorway.';
    tgMap.floor = '#e7ebf1';
    tgMap.line = '#c7ced8';
    tgMap.wall = '#f7f9fc';
    tgMap.wallH = 18;
    tgMap.noGrade = true;
    tgMap.noSeasonTint = true;
    tgMap.noClutter = true;
    tgMap.noOuterFill = true;
    tgMap.railEdges = true;
    tgMap.noDetail = true;
    tgMap.noEnvironment = true;
    tgMap.noPostSigns = true;
    tgMap.start = [0, 0, 19];
    tgMap.dummies = [
      { x: -15, z: -10, k: 's' },
      { x: 15, z: -10, k: 'a' },
      { x: 0, z: -16, k: 'm', amp: 8 },
    ];

    tgMap.build = function (m) {
      const W = 35,
        D = 24,
        H = 18;
      const wall = '#f7f9fc',
        wallEdge = '#aeb9c7',
        steel = '#3c4c60',
        steelHi = '#8395a9',
        deck = '#394a5c',
        yellow = '#e3b82f',
        mid = '#eef2f7';
      window.HC_TARGET_GRID_TARGETS = [];
      window.HC_TARGET_GRID_PADS = [];
      window.HC_TARGET_GRID_SECRET = {
        breaks: { X: 0, '+': 0, '-': 0, O: 0 },
        unlocked: false,
        symbol: null,
      };

      // Rectangular floor + calibration grid + south firing range lines
      m.add(0, 0, 72, 50, 0.24, '#e8edf3', -0.24);
      for (let x = -32; x <= 32; x += 4) {
        m.part(unit, '#c7d0db', x, 0.012, 0, 0.04, 0.025, 47);
        for (let z = -20; z <= 20; z += 4) {
          m.part(unit, '#aeb9c7', x, 0.026, z, 0.22, 0.025, 0.22);
        }
      }
      for (let z = -20; z <= 20; z += 4) {
        m.part(unit, '#c7d0db', 0, 0.014, z, 69, 0.025, 0.04);
      }
      // Range firing stance strip at z = 14.5 & z = 19 (facing central tower + targets)
      m.part(unit, '#23cfff', 0, 0.025, 14.2, 22, 0.03, 0.18);
      m.part(unit, '#ff8a1a', 0, 0.025, 19.0, 12, 0.03, 0.16);
      for (const x of [-6.5, 6.5]) {
        m.part(unit, '#394a5c', x, 0.55, 14.0, 2.2, 1.1, 0.45);
        m.add(x, 14.0, 2.2, 0.45, 1.1, '#394a5c', 0);
        m.part(unit, '#23cfff', x, 1.12, 14.0, 2.24, 0.06, 0.48);
      }

      // Perimeter walls & structural grid ribs (South wall has Lobby Exit/Entrance at x=-3.2..3.2, sealed in matches)
      m.add(0, -D, 2 * W + 1.4, 1.4, H, wall, 0);
      m.add(-19.1, D, 33.2, 1.4, H, wall, 0);
      m.add(19.1, D, 33.2, 1.4, H, wall, 0);
      m.add(0, D, 6.4, 1.4, H - 4.6, wall, 4.6);
      m.add(-W, 0, 1.4, 2 * D + 1.4, H, wall, 0);
      m.add(W, 0, 1.4, 2 * D + 1.4, H, wall, 0);
      if (G && !G.practice) {
        // Seal Lobby doorway during live matches with matching gridded white wall
        m.add(0, D, 6.4, 1.4, 4.6, mid, 0);
        for (const gx of [-1.8, 0, 1.8]) m.part(unit, '#b8c3d0', gx, 2.3, D - 0.72, 0.08, 4.6, 0.06);
        m.part(unit, '#b8c3d0', 0, 3.0, D - 0.72, 6.4, 0.08, 0.06);
      } else {
        // Open glowing archway directly back to Lobby in Practice
        m.part(unit, '#091421', 0, 2.25, D + 0.55, 6.2, 4.5, 0.2);
        m.neon(-3.2, 2.25, D - 0.74, 0.16, 4.5, 0.16, 0x20d9ff);
        m.neon(3.2, 2.25, D - 0.74, 0.16, 4.5, 0.16, 0x20d9ff);
        m.neon(0, 4.55, D - 0.74, 6.56, 0.16, 0.16, 0x20d9ff);
        m.part(unit, '#17324b', 0, 0.04, D - 0.85, 6.0, 0.08, 2.2);
        m.neon(0, 0.09, D - 1.9, 6.0, 0.06, 0.12, 0x20d9ff);
        window.HC_TARGET_GRID_LOBBY_EXIT = { x: 0, z: D - 0.5, open: true };
      }

      for (const x of [-28, -21, -14, -7, 0, 7, 14, 21, 28]) {
        m.add(x, -D + 0.78, 0.22, 0.18, H + 0.25, wallEdge, 0);
        if (Math.abs(x) > 3.5) m.add(x, D - 0.78, 0.22, 0.18, H + 0.25, wallEdge, 0);
      }
      for (const z of [-18, -12, -6, 0, 6, 12, 18]) {
        m.add(-W + 0.78, z, 0.18, 0.22, H + 0.25, wallEdge, 0);
        m.add(W - 0.78, z, 0.18, 0.22, H + 0.25, wallEdge, 0);
      }
      for (let x = -W + 4; x < W; x += 4) {
        m.part(unit, '#b8c3d0', x, H / 2, -D + 0.72, 0.08, H, 0.06);
        m.part(unit, '#b8c3d0', x, H / 2, D - 0.72, 0.08, H, 0.06);
      }
      for (let z = -D + 4; z < D; z += 4) {
        m.part(unit, '#b8c3d0', -W + 0.72, H / 2, z, 0.06, H, 0.08);
        m.part(unit, '#b8c3d0', W - 0.72, H / 2, z, 0.06, H, 0.08);
      }
      for (let y = 3; y < H; y += 3) {
        m.part(unit, '#b8c3d0', 0, y, -D + 0.72, 2 * W - 1.4, 0.08, 0.06);
        m.part(unit, '#b8c3d0', 0, y, D - 0.72, 2 * W - 1.4, 0.08, 0.06);
        m.part(unit, '#b8c3d0', -W + 0.72, y, 0, 0.06, 0.08, 2 * D - 1.4);
        m.part(unit, '#b8c3d0', W - 0.72, y, 0, 0.06, 0.08, 2 * D - 1.4);
      }

      // Upper wall caps, waist rails, and overhead skylight truss frame
      m.add(0, -D, 2 * W, 0.28, 0.36, steelHi, H - 0.36);
      m.add(0, D, 2 * W, 0.28, 0.36, steelHi, H - 0.36);
      m.add(-W, 0, 0.28, 2 * D, 0.36, steelHi, H - 0.36);
      m.add(W, 0, 0.28, 2 * D, 0.36, steelHi, H - 0.36);
      for (const y of [5.8, 11.6]) {
        m.part(unit, steel, 0, y, -D + 0.78, 2 * W - 1.4, 0.12, 0.14);
        m.part(unit, steel, 0, y, D - 0.78, 2 * W - 1.4, 0.12, 0.14);
        m.part(unit, steel, -W + 0.78, y, 0, 0.14, 0.12, 2 * D - 1.4);
        m.part(unit, steel, W - 0.78, y, 0, 0.14, 0.12, 2 * D - 1.4);
      }
      for (const x of [-18, 0, 18]) {
        m.part(unit, steel, x, H - 0.25, 0, 0.45, 0.5, 2 * D - 1.4);
        m.part(unit, '#e6f7ff', x, H - 0.54, 0, 0.26, 0.08, 2 * D - 4);
      }
      for (const z of [-10, 10]) {
        m.part(unit, steel, 0, H - 0.25, z, 2 * W - 1.4, 0.45, 0.45);
      }

      // Red symbol targets (X, +, -, O) with shared geometries for fast GPU upload
      const symbols = ['X', '+', '-', 'O'];
      let targetIndex = 0;
      const tgGeos = {
        c0: new THREE.CircleGeometry(1.12, 24),
        r0: new THREE.RingGeometry(0.96, 1.08, 24),
        c1: new THREE.CircleGeometry(0.91, 24),
        r1: new THREE.RingGeometry(0.7, 0.82, 24),
        c2: new THREE.CircleGeometry(0.68, 24),
        r2: new THREE.RingGeometry(0.49, 0.56, 24),
        barX: new THREE.BoxGeometry(0.7, 0.12, 0.055),
        barP: new THREE.BoxGeometry(0.72, 0.12, 0.055),
        barPV: new THREE.BoxGeometry(0.12, 0.72, 0.055),
        barM: new THREE.BoxGeometry(0.76, 0.14, 0.055),
        torO: new THREE.TorusGeometry(0.26, 0.065, 8, 20),
      };
      function addTarget(x, y, z, nx, ny, nz) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        group.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(nx, ny, nz).normalize()
        );
        const meshes = [];
        const material = (color) =>
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const addMesh = (geo, color, zz) => {
          const o = new THREE.Mesh(geo, material(color));
          o.position.z = zz;
          group.add(o);
          meshes.push(o);
          return o;
        };
        addMesh(tgGeos.c0, '#111923', 0);
        addMesh(tgGeos.r0, '#8c9bad', 0.018);
        addMesh(tgGeos.c1, '#dfe5ec', 0.032);
        addMesh(tgGeos.r1, '#e0242a', 0.047);
        addMesh(tgGeos.c2, '#ffffff', 0.061);
        addMesh(tgGeos.r2, '#e0242a', 0.076);
        const mark = symbols[targetIndex++ % symbols.length],
          ink = material('#e0242a');
        const bar = (geo, angle) => {
          const o = new THREE.Mesh(geo, ink);
          o.position.z = 0.098;
          if (angle) o.rotation.z = angle;
          group.add(o);
          meshes.push(o);
        };
        if (mark === 'X') {
          bar(tgGeos.barX, Math.PI / 4);
          bar(tgGeos.barX, -Math.PI / 4);
        } else if (mark === '+') {
          bar(tgGeos.barP, 0);
          bar(tgGeos.barPV, 0);
        } else if (mark === '-') {
          bar(tgGeos.barM, 0);
        } else {
          const o = new THREE.Mesh(tgGeos.torO, ink);
          o.position.z = 0.102;
          group.add(o);
          meshes.push(o);
        }
        mapGroup.add(group);
        window.HC_TARGET_GRID_TARGETS.push({
          meshes,
          hp: 3,
          maxHp: 3,
          position: new THREE.Vector3(x, y, z),
          broken: false,
          hitUntil: 0,
          baseColors: meshes.map((o) =>
            o.material && o.material.color ? o.material.color.clone() : null
          ),
          symbol: mark,
          secretCounted: false,
        });
      }

      const outerX = W - 0.74,
        outerZ = D - 0.74;
      const xs = [-27, -18, -9, 0, 9, 18, 27],
        zs = [-16, -8, 0, 8, 16],
        ys = [3.1, 7.4, 11.7];
      for (const y of ys) {
        for (const x of xs) {
          // Keep South doorway (x===0, y<=4.6) clear for the Lobby entrance/exit in Practice
          if (!(x === 0 && y < 4.8)) addTarget(x, y, outerZ, 0, 0, -1);
          addTarget(x, y, -outerZ, 0, 0, 1);
        }
        for (const z of zs) {
          addTarget(outerX, y, z, -1, 0, 0);
          addTarget(-outerX, y, z, 1, 0, 0);
        }
      }

      // Central tower with recessed south doorway (z = 5.55, x = -2.2..2.2)
      m.add(0, -5.55, 12, 0.9, 10.5, mid, 0);
      m.add(-5.55, 0, 0.9, 12, 10.5, mid, 0);
      m.add(5.55, 0, 0.9, 12, 10.5, mid, 0);
      m.add(-4.1, 5.55, 3.8, 0.9, 10.5, mid, 0);
      m.add(4.1, 5.55, 3.8, 0.9, 10.5, mid, 0);
      m.add(0, 5.55, 4.4, 0.9, 6.02, mid, 4.48);
      m.add(0, 0, 13.2, 13.2, 0.8, '#dfe5ec', 10.5);
      m.add(0, -6.3, 13.8, 0.45, 0.42, wallEdge, 10.7);
      m.add(0, 6.3, 13.8, 0.45, 0.42, wallEdge, 10.7);
      m.add(-6.3, 0, 0.45, 13.8, 0.42, wallEdge, 10.7);
      m.add(6.3, 0, 0.45, 13.8, 0.42, wallEdge, 10.7);
      for (const x of [-4, -2, 2, 4]) {
        m.part(unit, wallEdge, x, 5.25, 6.02, 0.08, 10.5, 0.06);
        m.part(unit, wallEdge, x, 5.25, -6.02, 0.08, 10.5, 0.06);
      }

      for (const y of [2.8, 6.8]) {
        for (const q of [-3.5, 0, 3.5]) {
          addTarget(5.06, y, q, -1, 0, 0);
          addTarget(-5.06, y, q, 1, 0, 0);
          addTarget(q, y, -5.06, 0, 0, 1);
          if (Math.abs(q) > 2.8) addTarget(q, y, 5.06, 0, 0, -1);
        }
      }
      addTarget(0, 7.2, 6.08, 0, 0, 1);

      // HIDDEN PORTAL + SEAMLESS SOLID GRIDDED WALL MASK
      const doorCollider = {
        minx: -2.22,
        maxx: 2.22,
        miny: 0,
        maxy: 4.5,
        minz: 5.08,
        maxz: 6.12,
        hcSecretDoor: true,
      };
      solids.push(doorCollider);

      // Seamless white gridded mask hides the portal completely until 10 matching targets break
      const doorMask = new THREE.Group();
      const maskWall = new THREE.Mesh(
        new THREE.BoxGeometry(4.42, 4.49, 0.9),
        new THREE.MeshStandardMaterial({ color: mid, roughness: 0.72, metalness: 0.06 })
      );
      maskWall.position.set(0, 2.245, 5.55);
      maskWall.castShadow = true;
      maskWall.receiveShadow = true;
      doorMask.add(maskWall);
      const lineMat = new THREE.MeshBasicMaterial({ color: '#aeb9c7' });
      for (const gx of [-1.4, 0, 1.4]) {
        const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.48, 0.06), lineMat);
        vBar.position.set(gx, 2.24, 6.02);
        doorMask.add(vBar);
      }
      for (const gy of [1.5, 3.0]) {
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.08, 0.06), lineMat);
        hBar.position.set(0, gy, 6.02);
        doorMask.add(hBar);
      }
      mapGroup.add(doorMask);

      // Actual glowing secret portal (starts HIDDEN behind doorMask!)
      const door = new THREE.Group();
      door.visible = false;
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = 256;
      bgCanvas.height = 320;
      const ctx = bgCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(128, 160, 8, 128, 160, 155);
      grad.addColorStop(0, '#07131f');
      grad.addColorStop(0.38, '#123b58');
      grad.addColorStop(0.72, '#101e35');
      grad.addColorStop(1, '#050912');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 320);
      for (let i = 0; i < 18; i++) {
        ctx.strokeStyle = i % 2 ? 'rgba(31,201,255,.26)' : 'rgba(255,138,26,.26)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(128, 160, 26 + i * 6, 35 + i * 7, i * 0.14, 0, Math.PI * 2);
        ctx.stroke();
      }
      const portalTex = new THREE.CanvasTexture(bgCanvas);
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(3.55, 4.28),
        new THREE.MeshBasicMaterial({
          map: portalTex,
          color: 0xffffff,
          transparent: true,
          opacity: 0.98,
          side: THREE.DoubleSide,
        })
      );
      panel.position.set(0, 2.22, 5.56);
      door.add(panel);
      const core = new THREE.Mesh(
        new THREE.PlaneGeometry(3.25, 4.04),
        new THREE.MeshBasicMaterial({
          color: 0x071321,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      core.position.set(0, 2.22, 5.58);
      door.add(core);
      const blue = new THREE.Mesh(
        new THREE.TorusGeometry(1.58, 0.11, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0x18caff })
      );
      blue.position.set(-0.18, 2.22, 5.66);
      blue.scale.y = 1.33;
      door.add(blue);
      const orange = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.095, 12, 64),
        new THREE.MeshBasicMaterial({ color: 0xff861c })
      );
      orange.position.set(0.22, 2.22, 5.72);
      orange.scale.y = 1.48;
      door.add(orange);
      const mkFrame = (x, y, w, h, color) => {
        const o = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, 0.94),
          new THREE.MeshStandardMaterial({
            color,
            metalness: 0.82,
            roughness: 0.24,
            emissive: color,
            emissiveIntensity: 0.45,
          })
        );
        o.position.set(x, y, 5.58);
        door.add(o);
      };
      mkFrame(-2.05, 2.22, 0.24, 4.55, 0x1c9bca);
      mkFrame(2.05, 2.22, 0.24, 4.55, 0xc66b22);
      mkFrame(0, 4.44, 4.34, 0.24, 0x8a9fb7);
      const threshold = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.14, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x1e3247, metalness: 0.65, roughness: 0.3 })
      );
      threshold.position.set(0, 0.07, 5.58);
      door.add(threshold);
      mapGroup.add(door);

      window.HC_TARGET_GRID_SECRET_DOOR = {
        group: door,
        mask: doorMask,
        panel,
        core,
        blue,
        orange,
        collider: doorCollider,
        opened: false,
        triggered: false,
      };
      if (P) P.hcTargetGridAccess = false;

      // Corner towers inside (W=35, D=24): centered at [±27, ±16.5]
      const towerCenters = [
        [-27, -16.5],
        [-27, 16.5],
        [27, -16.5],
        [27, 16.5],
      ];
      for (const [cx, cz] of towerCenters) {
        m.add(cx, cz, 8.2, 8.2, 0.65, deck, 8.4);
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) {
            m.add(cx + sx * 3.25, cz + sz * 3.25, 1.0, 1.0, 13.3, steel, 0);
            m.add(cx + sx * 3.25, cz + sz * 3.25, 1.35, 1.35, 0.24, steelHi, 13.3);
          }
        m.add(cx, cz, 10.2, 10.2, 0.75, wall, 13.55);
        m.add(cx, cz, 9.5, 9.5, 0.16, yellow, 14.3);
        m.add(cx, cz - 4.5, 9.5, 0.28, 0.8, wallEdge, 14.45);
        m.add(cx, cz + 4.5, 9.5, 0.28, 0.8, wallEdge, 14.45);
        m.add(cx - 4.5, cz, 0.28, 9.5, 0.8, wallEdge, 14.45);
        m.add(cx + 4.5, cz, 0.28, 9.5, 0.8, wallEdge, 14.45);
      }

      // Elevated bridge loop connecting [±27, ±16.5]
      m.add(0, -16.5, 50, 2.8, 0.55, '#495d72', 8.45);
      m.add(0, 16.5, 50, 2.8, 0.55, '#495d72', 8.45);
      m.add(-27, 0, 2.8, 30, 0.55, '#495d72', 8.45);
      m.add(27, 0, 2.8, 30, 0.55, '#495d72', 8.45);
      for (const z of [-16.5, 16.5]) {
        m.add(0, z - 1.28, 50, 0.14, 1.05, steelHi, 9.0);
        m.add(0, z + 1.28, 50, 0.14, 1.05, steelHi, 9.0);
        for (const x of [-20, -10, 0, 10, 20]) m.add(x, z, 0.16, 2.8, 1.0, yellow, 9.0);
      }
      for (const x of [-27, 27]) {
        m.add(x - 1.28, 0, 0.14, 30, 1.05, steelHi, 9.0);
        m.add(x + 1.28, 0, 0.14, 30, 1.05, steelHi, 9.0);
        for (const z of [-10, 0, 10]) m.add(x, z, 2.8, 0.16, 1.0, yellow, 9.0);
      }

      // Overhead structural connectors above bridge loop
      function connector(a, b, color, thick) {
        const va = new THREE.Vector3(a[0], a[1], a[2]),
          vb = new THREE.Vector3(b[0], b[1], b[2]),
          d = vb.clone().sub(va),
          len = d.length();
        const beam = m.part(
          unit,
          color,
          (va.x + vb.x) / 2,
          (va.y + vb.y) / 2,
          (va.z + vb.z) / 2,
          thick,
          len,
          thick
        );
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
      }
      for (const z of [-16.5, 16.5]) connector([-27, 12.2, z], [27, 12.2, z], 0x9dc4d6, 0.1);
      for (const x of [-27, 27]) connector([x, 12.2, -16.5], [x, 12.2, 16.5], 0x9dc4d6, 0.1);
      connector([-27, 13.4, -16.5], [27, 13.4, 16.5], 0xffb32e, 0.08);
      connector([-27, 13.4, 16.5], [27, 13.4, -16.5], 0x22bde9, 0.08);

      // Walkable 18-step ramps (0.467m per step <= 0.61m)
      hcWalkableRamp(m, -27, -22.2, -16.8, 8.45, 3.2, '#697d92', yellow);
      hcWalkableRamp(m, 27, -22.2, -16.8, 8.45, 3.2, '#697d92', yellow);
      hcWalkableRamp(m, -27, 22.2, 16.8, 8.45, 3.2, '#697d92', yellow);
      hcWalkableRamp(m, 27, 22.2, 16.8, 8.45, 3.2, '#697d92', yellow);
      hcWalkableRamp(m, -12, 22.2, 16.5, 8.45, 3.8, '#697d92', '#23cfff');
      hcWalkableRamp(m, 12, 22.2, 16.5, 8.45, 3.8, '#697d92', '#ff8a1a');

      // Short cross-links into central tower deck
      m.add(0, -10.2, 2.5, 7, 0.5, '#52677d', 8.45);
      m.add(0, 10.2, 2.5, 7, 0.5, '#52677d', 8.45);
      m.add(-10.2, 0, 7, 2.5, 0.5, '#52677d', 8.45);
      m.add(10.2, 0, 7, 2.5, 0.5, '#52677d', 8.45);

      // Clean interior instruction signage flush against interior walls
      const addRangeSign = (x, z, ry, label) => {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 128;
        const g = c.getContext('2d');
        g.fillStyle = '#101c2c';
        g.fillRect(0, 0, 512, 128);
        g.strokeStyle = '#28d9ff';
        g.lineWidth = 7;
        g.strokeRect(5, 5, 502, 118);
        g.fillStyle = '#ffffff';
        g.font = 'bold 32px Arial';
        g.textAlign = 'center';
        g.fillText(label, 256, 76);
        const tex = new THREE.CanvasTexture(c);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(5.2, 1.25),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        mesh.position.set(x, 5.2, z);
        mesh.rotation.y = ry;
        mapGroup.add(mesh);
      };
      addRangeSign(-17, -23.1, 0, 'X x10 -> CRITHITS · + x10 -> BOSS');
      addRangeSign(17, -23.1, 0, 'BREAK 10 MATCHING SYMBOLS');
      addRangeSign(-34.1, 0, Math.PI / 2, 'FIND THE HIDDEN PORTAL');
      addRangeSign(34.1, 0, -Math.PI / 2, 'SAME SYMBOL X10');
      if (G && G.practice) addRangeSign(0, D - 0.85, Math.PI, 'LOBBY EXIT · WALK THROUGH OR PRESS E');
    };
  }

  // Override secret-door unlock to hide doorMask, reveal portal, and notify chat
  window.hcOpenTargetGridSecret = function (symbol) {
    const state = window.HC_TARGET_GRID_SECRET;
    const door = window.HC_TARGET_GRID_SECRET_DOOR;
    if (!state || state.unlocked) return;
    state.unlocked = true;
    state.symbol = symbol;
    if (P) P.hcTargetGridAccess = true;
    if (door) {
      door.opened = true;
      door.symbol = symbol;
      if (door.mask) door.mask.visible = false;
      if (door.group) door.group.visible = true;
      if (door.panel) door.panel.visible = true;
      if (door.core && door.core.material) door.core.material.opacity = 0.24;
      if (door.collider) {
        door.collider.hcSecretDoor = true;
        door.collider.personalAccessOnly = true;
      }
      if (door.blue && door.blue.material) door.blue.material.color.setHex(0x23cfff);
      if (door.orange && door.orange.material) door.orange.material.color.setHex(0xff8a1a);
    }
    const at = new THREE.Vector3(0, 2.2, 5.8);
    if (typeof burst === 'function') {
      burst(at, 'cyan', 42, 7, 0.13, 0.7, 1);
      burst(at, 'fire', 32, 6, 0.12, 0.62, 1);
    }
    if (typeof sfx === 'function') {
      sfx([580, 0.18, 0.65], 0.9);
      sfx([920, 0.22, 0.5], 0.75);
    }
    const ce = document.getElementById('hcCritExplain');
    if (ce) ce.classList.add('hidden');
    if (typeof showMsg === 'function') {
      showMsg('SECRET ENTRANCE OPEN', '10 ' + symbol + ' targets broken · walk into the portal');
    }
    if (typeof showToast === 'function') {
      showToast('SECRET ENTRANCE OPEN · WALK INTO THE PORTAL');
    }
    if (window.HCMatchChat) {
      window.HCMatchChat.addLine('SYSTEM', 'Secret Boss Portal unlocked (' + symbol + ' x10)! Enter the south tower doorway.', 'system');
    }
    if (typeof render === 'function') render(0.016);
  };

  /* -------------------------------------------------------------------------
   * 4. REDLINE ARENA REBUILD — STRICT 180° ROTATIONAL SYMMETRY + DETAIL
   * ------------------------------------------------------------------------- */
  {
    const redline = mp(
      'Redline Arena',
      'A sleek symmetrical low-poly red-and-blue arena with a flush diagonal split-color bridge, mirrored rooftop platforms, support piers and tactical floor lanes.',
      {
        sky: '#10182c',
        fog: '#1d2944',
        floor: '#151d32',
        line: '#2a3855',
        style: 'grid',
        tile: 4,
        wall: '#0b1223',
        c: ['#202b45', '#303d5d', '#2869f2', '#ef3b64'],
        mood: 'indoor',
        hs: '#a9c9ed',
        hg: '#141d32',
        sp: [-14, 34, 20],
        wallH: 0,
      },
      function (m) {
        const navy = '#111a2d',
          dark = '#1b2740',
          mid = '#273653',
          steel = '#384b6b',
          red = '#e83d62',
          blue = '#3476f5',
          pale = '#8da6d6';

        // Floor & clean diagonal court markings (180-deg symmetric)
        m.add(0, 0, 56, 56, 0.4, navy, -0.4);
        m.part(unit, '#1d2b47', 0, 0.015, 0, 52, 0.025, 0.25);
        m.part(unit, '#1d2b47', 0, 0.015, 0, 0.25, 0.025, 52);
        m.part(torThin, 0x3476f5, 0, 0.04, 0, 4.5, 4.5, 4.5, Math.PI / 2);

        // Tall perimeter walls + pilasters + subtle symmetric neon bands
        m.add(0, -28, 58, 1.4, 11, dark);
        m.add(0, 28, 58, 1.4, 11, dark);
        m.add(-28, 0, 1.4, 56, 11, dark);
        m.add(28, 0, 1.4, 56, 11, dark);
        for (let p = -21; p <= 21; p += 7) {
          m.add(p, -27.2, 0.9, 0.5, 11, mid);
          m.add(-p, 27.2, 0.9, 0.5, 11, mid);
          m.add(-27.2, p, 0.5, 0.9, 11, mid);
          m.add(27.2, -p, 0.5, 0.9, 11, mid);
        }
        m.neon(0, 6.2, -27.2, 54, 0.14, 0.12, 0x3476f5);
        m.neon(0, 6.2, 27.2, 54, 0.14, 0.12, 0xe83d62);
        m.neon(-27.2, 6.2, 0, 0.12, 0.14, 54, 0x3476f5);
        m.neon(27.2, 6.2, 0, 0.12, 0.14, 54, 0xe83d62);

        // Centered diagonal split bridge (ang = -atan2(27,43) -> slope dx=cos, dz=-sin)
        // Red lane at -1.65*perp, Blue lane at +1.65*perp -> flush seam right through (0,0)!
        const ang = -Math.atan2(27, 43),
          perpX = Math.sin(ang),
          perpZ = Math.cos(ang);
        m.part(unit, red, -perpX * 1.65, 5.2, -perpZ * 1.65, 62, 0.56, 3.25, 0, ang, 0);
        m.part(unit, blue, perpX * 1.65, 5.2, perpZ * 1.65, 62, 0.56, 3.25, 0, ang, 0);
        m.part(unit, pale, 0, 5.5, 0, 62, 0.06, 0.14, 0, ang, 0);
        m.part(unit, red, -perpX * 3.38, 5.66, -perpZ * 3.38, 60, 0.24, 0.22, 0, ang, 0);
        m.part(unit, blue, perpX * 3.38, 5.66, perpZ * 3.38, 60, 0.24, 0.22, 0, ang, 0);

        // Flush diagonal structural under-beam + invisible inner collision cores (zero jagged overhang)
        m.part(unit, mid, 0, 4.78, 0, 62, 0.42, 6.2, 0, ang, 0);
        for (let i = -7; i <= 7; i++) {
          const x = i * 3.35,
            z = i * 2.1;
          m.col(x, z, 4.4, 4.4, 0.9, 4.65);
          if (i % 3 === 0 && i !== 0) {
            m.add(x + perpX * 2.4, z + perpZ * 2.4, 0.85, 0.85, 4.75, steel, 0);
            m.add(x - perpX * 2.4, z - perpZ * 2.4, 0.85, 0.85, 4.75, steel, 0);
          }
        }

        // Sleek dark indoor ceiling & symmetric overhead cross-girders
        m.add(0, 0, 58, 58, 0.5, '#0b1223', 11.4);
        for (const s of [-1, 1]) {
          m.part(unit, dark, 0, 10.6, s * 14, 55, 0.55, 0.7);
          m.part(unit, pale, 0, 10.28, s * 14, 52, 0.08, 0.14);
        }

        // Strict 180-degree rotationally symmetric rooftop platforms (x,z <-> -x,-z, blue <-> red)
        const basePairs = [
          [-20, -18, 7.5, 5.8, 4.2, 'red'],
          [-10, -22, 5.0, 5.0, 3.0, 'blue'],
          [15, -19, 7.8, 5.6, 4.6, 'red'],
          [21, -7, 5.2, 6.8, 3.5, 'blue'],
        ];
        for (const [x, z, w, d, h, teamSide] of basePairs) {
          for (const sign of [1, -1]) {
            const px = sign * x,
              pz = sign * z;
            const c = sign > 0 ? (teamSide === 'red' ? mid : dark) : teamSide === 'red' ? dark : mid;
            const cap =
              sign > 0
                ? teamSide === 'red'
                  ? red
                  : blue
                : teamSide === 'red'
                  ? blue
                  : red;
            m.add(px, pz, w, d, h, c);
            m.add(px, pz, w * 0.84, d * 0.84, 0.22, cap, h);
            m.add(px - sign * w * 0.32, pz - sign * d * 0.32, 0.55, 0.55, 0.5, pale, h + 0.22);
          }
        }

        // Mirrored floor-level cover bunkers & lane ribs
        m.addS(-8.5, -9.5, 4.6, 3.2, 1.15, dark);
        m.addS(-8.5, -9.5, 4.0, 0.18, 0.12, pale, 1.15);
        m.addS(11.5, -5.5, 3.2, 4.4, 1.35, mid);

        // Mirrored end decks + walkable 11-step ramps meeting bridge ends at (-20.5,-12.9) and (+20.5,+12.9)
        m.add(-23, -12.9, 6.5, 9.0, 0.6, blue, 0);
        m.add(23, 12.9, 6.5, 9.0, 0.6, red, 0);
        hcWalkableRamp(m, -21.0, -3.5, -12.5, 5.2, 4.2, '#38577f', pale);
        hcWalkableRamp(m, 21.0, 3.5, 12.5, 5.2, 4.2, '#744052', pale);

        // Open spawn clearance at all four corners
        m.reserve(-23, -22, 6.5);
        m.reserve(23, 22, 6.5);
        m.reserve(-23, 22, 6.5);
        m.reserve(23, -22, 6.5);
      }
    );
    Object.assign(redline, {
      noGrade: true,
      noSeasonTint: true,
      noClutter: true,
      noOuterFill: true,
      noDetail: true,
      noEnvironment: true,
      noPostSigns: true,
      railEdges: true,
    });
    const ri = MAPS.findIndex((m) => m && m.name === 'Redline Arena');
    if (ri >= 0) MAPS[ri] = redline;
    else MAPS.push(redline);
  }

  /* -------------------------------------------------------------------------
   * 5. OVERPASS, ASSEMBLY PLANT, BLOCKWORKS ARENA, VIOLET VOLTAGE, HYPERCORE ARENA
   *    (Fix placements, walkable stairs/ramps, and enrich architectural detail)
   * ------------------------------------------------------------------------- */
  const ov = MAPS.find((m) => m && m.name === 'Overpass');
  if (ov) {
    Object.assign(ov, {
      desc: 'Overpass: suspended blue-black steel cross bridges span a deep canyon between tall blocky green cliffs and symmetrical mountain ranges, with two exposed blue stair towers, sky islands, spring pads, and grind rails.',
      sky: '#8fc7f4',
      fog: '#a8c8e3',
      floor: '#202b3a',
      line: '#53677d',
      style: 'asphalt',
      tile: 5,
      wall: '#17283e',
      c: ['#26384d', '#385b83', '#182433', '#2b70c7'],
      mood: 'day',
      hemiSky: '#e2f4ff',
      hemiGround: '#465b70',
      wallH: 0,
      railEdges: true,
      noGround: false,
      noOuterFill: true,
      noClutter: true,
      noDetail: true,
      noEnvironment: true,
      start: [-38, 0, 0],
    });
    ov.build = function (m) {
      const deck = '#465365',
        beam = '#101c2c',
        blue = '#176bc0',
        bright = '#39a9ff',
        steel = '#75889b',
        rock = '#536579',
        rock2 = '#35485c';

      // Deep canyon scenery below playable bridge network (symmetrical)
      for (let i = 0; i < 9; i++) {
        const x = -49 + i * 12.2;
        m.sph(x, -19, -48, 15 + (i % 3) * 3, i % 2 ? rock : rock2, 0.96);
        m.sph(-x, -19, 48, 15 + (i % 3) * 3, i % 2 ? rock : rock2, 0.96);
      }
      for (let i = 0; i < 7; i++) {
        const z = -42 + i * 14;
        m.sph(-52, -18, z, 16, rock2, 0.95);
        m.sph(52, -18, -z, 16, rock2, 0.95);
      }

      // Tall, blocky green canyon walls and stepped cliff faces framing the ravine (symmetrical)
      const canyonGreens = ['#477b43', '#568d4a', '#679b50', '#3d6c3b'];
      for (const side of [-1, 1]) {
        for (let row = 0; row < 4; row++) {
          const y = -1 - row * 5.2,
            x = side * (42 + row * 1.2);
          for (let seg = 0; seg < 9; seg++) {
            const z = side * (-40 + seg * 10);
            const w = 8 + (seg % 3) * 2,
              h = 10 + (seg % 4) * 3;
            m.deco(x, y, z, w, h, 9 + (seg % 2) * 3, canyonGreens[(seg + row) % canyonGreens.length]);
            m.deco(x - side * 4, y + 4, z, 3, 7, 5, '#7cae61');
          }
        }
      }

      // Light-brown dirt paths along canyon floor beneath bridges
      for (const side of [-1, 1]) {
        m.deco(side * 25, -12, 0, 8, 0.22, 74, '#b99563');
        for (let z = -30; z <= 30; z += 12) {
          m.deco(side * (24 + (z % 2 ? 2 : 0)), -11.82, z, 10, 0.06, 3, '#d2b17b');
        }
      }
      m.deco(0, -12, 0, 7, 0.18, 52, '#b99563');

      // Sky clouds & symmetrical floating sky-island stone platforms
      for (let i = 0; i < 4; i++) {
        const x = -42 + i * 26,
          z = -31 - (i % 2) * 5;
        m.sph(x, 19 + (i % 2) * 2, z, 5.2, '#ffffff', 0.78);
        m.sph(-x, 19 + (i % 2) * 2, -z, 5.2, '#ffffff', 0.78);
      }
      for (const [sx, sz, y, w, d] of [
        [-31, -27, 14, 10, 9],
        [-31, 27, 17, 9, 8],
      ]) {
        for (const k of [-1, 1]) {
          const ix = k * sx,
            iz = k * sz;
          m.platform(ix, iz, w, d, y, '#9aa88a', k > 0 ? 'x+' : 'x-', '#6e8067');
          m.deco(ix, y - 1.2, iz, w * 0.92, 1.8, d * 0.92, '#536a62');
          m.deco(ix, y + 0.12, iz, w * 0.86, 0.12, d * 0.86, '#c1c9a9');
        }
      }

      // Four broad suspended bridge arms meeting at reinforced central junction
      m.add(0, 0, 64, 13, 0.65, deck, 2.4);
      m.add(0, 0, 13, 64, 0.65, deck, 2.4);
      m.add(0, 0, 18, 18, 0.9, '#5d7085', 2.45);
      m.add(0, 0, 9, 9, 0.12, blue, 3.0);
      for (const z of [-5.9, 5.9]) m.add(0, z, 62, 0.16, 0.035, bright, 3.08);
      for (const x of [-5.9, 5.9]) m.add(x, 0, 0.16, 62, 0.035, bright, 3.08);
      for (let i = -5; i <= 5; i++) {
        m.add(i * 6.2, 0, 0.09, 11, 0.025, steel, 3.08);
        m.add(0, i * 6.2, 11, 0.09, 0.025, steel, 3.08);
      }

      // Exposed bluish-black steel trusses beneath each bridge arm
      for (const side of [-1, 1]) {
        m.add(0, side * 6.1, 64, 0.38, 0.42, beam, 1.7);
        m.add(side * 6.1, 0, 0.38, 64, 0.42, beam, 1.7);
        for (let t = -27; t <= 27; t += 6) {
          m.add(t, side * 6.1, 0.32, 0.32, 1.5, beam, 0.15);
          m.add(side * 6.1, t, 0.32, 0.32, 1.5, beam, 0.15);
          m.add(t, side * 6.1, 0.28, 0.28, 2.2, blue, 0.15);
          m.add(side * 6.1, t, 0.28, 0.28, 2.2, blue, 0.15);
        }
      }

      // ONLY TWO open-frame blue stair towers (x = -24 and x = +24, z = 0) with 180° mirrored zig-zag stairs
      for (const x of [-24, 24]) {
        const sx = Math.sign(x),
          z = 0,
          w = 7,
          base = 3.05,
          top = 17;
        for (const ox of [-1, 1])
          for (const oz of [-1, 1]) {
            m.add(x + ox * 3.1, z + oz * 3.1, 0.62, 0.62, top, blue, base);
            m.add(x + ox * 3.1, z + oz * 3.1, 0.22, 0.22, top, beam, base);
          }
        for (const y of [base + 5.5, base + 11, base + 16.5]) {
          m.add(x, z, w, 0.42, 0.42, beam, y);
          m.add(x, z, 0.42, w, 0.42, beam, y);
          m.add(x, z, w + 0.5, 0.5, 0.18, bright, y + 0.5);
        }
        // Symmetrical mirrored zig-zag stair flights (sx flips both X & Z offsets & directions)
        m.stairs(x - sx * 2.4, z - sx * 2.2, sx > 0 ? 'z+' : 'z-', 2.6, 12, 0.453, 0.5, steel, base);
        m.add(x, z + sx * 4.2, 6.6, 5.2, 0.5, deck, base + 5.44);
        m.stairs(x + sx * 2.2, z + sx * 6.2, sx > 0 ? 'x+' : 'x-', 2.6, 12, 0.453, 0.5, steel, base + 5.44);
        m.add(x + sx * 8.0, z + sx * 6.2, 5.2, 6.6, 0.5, deck, base + 10.88);
        m.stairs(x + sx * 8.0, z + sx * 3.8, sx > 0 ? 'z-' : 'z+', 2.6, 12, 0.453, 0.5, steel, base + 10.88);
        m.add(x + sx * 8.0, z - sx * 4.2, 6.6, 5.2, 0.5, deck, base + 16.32);
        m.add(x + sx * 8.0, z - sx * 4.2, 7.2, 0.5, 0.22, bright, base + 16.9);
        m.reserve(x, z, 5.5);
      }

      // Elevated grind rails connecting cross bridges and tower approaches symmetrically
      m.grindRail(-22, 3.85, 6.2, 22, 3.85, 6.2, '#5ec8ff', 0.085);
      m.grindRail(-22, 3.85, -6.2, 22, 3.85, -6.2, '#5ec8ff', 0.085);
      m.grindRail(-6.2, 3.85, -24, -6.2, 3.85, 24, '#5ec8ff', 0.085);
      m.grindRail(6.2, 3.85, -24, 6.2, 3.85, 24, '#5ec8ff', 0.085);

      // Small mirrored cover crates across center
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = sx * 15,
            z = sz * 15;
          m.add(x, z, 2.6, 2.6, 1.45, '#26374b', 3.05);
          m.add(x, z, 2.1, 2.1, 0.12, blue, 4.5);
          m.add(x - sx * 3, z + sz * 2, 1.4, 1.4, 0.9, '#718398', 3.05);
          m.reserve(x, z, 4.5);
        }

      // Tall green canyon-block perimeter framing arena (at +/-45)
      const wallGreen = ['#3d7139', '#4b8241', '#5b9148'];
      for (const side of [-1, 1]) {
        m.add(side * 45, 0, 3, 92, 13, wallGreen[side < 0 ? 0 : 1], 1.2);
        m.add(0, side * 45, 92, 3, 13, wallGreen[side < 0 ? 1 : 2], 1.2);
        for (let t = -36; t <= 36; t += 12) {
          m.add(side * 43, t, 1.2, 7, 14, '#6a9d50', 1.2);
          m.add(t, side * 43, 7, 1.2, 14, '#6a9d50', 1.2);
        }
      }

      // Giant built-in spring pads at [0,-17] & [0,17] wired directly into G.jumpMats
      for (const [tx, tz] of [
        [0, -17],
        [0, 17],
      ]) {
        m.part(cylG, '#197bd2', tx, 3.14, tz, 6.3, 0.42, 6.3);
        m.part(cylG, '#080d15', tx, 3.39, tz, 5.72, 0.22, 5.72);
        m.part(cylG, '#182332', tx, 3.52, tz, 4.85, 0.06, 4.85);
        for (let a = 0; a < 12; a++) {
          const an = (a * Math.PI) / 6,
            px = tx + Math.cos(an) * 5.95,
            pz = tz + Math.sin(an) * 5.95;
          m.part(cylG, '#63c7ff', px, 3.43, pz, 0.16, 0.18, 0.16);
        }
        if (typeof G === 'object' && Array.isArray(G.jumpMats)) {
          G.jumpMats.push({
            staticMesh: true,
            pos: new THREE.Vector3(tx, 3.55, tz),
            normal: new THREE.Vector3(0, 1, 0),
            radius: 3.1,
            vy: 27,
            until: Infinity,
            lastLaunch: {},
          });
        }
        m.reserve(tx, tz, 7);
      }

      // Ground-level spawn aprons & broad stair-ramp connecting directly to bridge deck
      for (const side of [-1, 1]) {
        const x = side * 38;
        m.add(x, 0, 8, 16, 0.35, '#53677d', -0.35);
        m.add(x, 0, 6, 0.18, 0.08, bright, 0.04);
        m.stairs(side < 0 ? -34.5 : 34.5, 0, side < 0 ? 'x+' : 'x-', 7, 8, 0.38, 0.8, steel, 0.02);
        m.reserve(x, 0, 7);
      }

      // Symmetrical low rolling green hills + tall green mountain range horizon
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 8,
          r = 40 + (i % 3) * 3,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        const cHill = i % 2 ? '#526f4b' : '#688657',
          rw = 9 + (i % 4) * 1.7,
          rh = 3.4 + (i % 3) * 0.8,
          rd = 11 + (i % 2) * 2;
        m.part(sphG, cHill, x, 1.0 + (i % 3) * 0.35, z, rw, rh, rd, 0, 0, 0, 0.96);
        m.part(sphG, cHill, -x, 1.0 + (i % 3) * 0.35, -z, rw, rh, rd, 0, 0, 0, 0.96);
      }
      // Symmetrical green mountain range backdrop (pairs at (x,z) and (-x,-z))
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * Math.PI,
          mr = 64 + (i % 3) * 9,
          mx = Math.cos(an) * mr,
          mz = Math.sin(an) * mr,
          mw = 16 + (i % 3) * 5,
          mh = 28 + (i % 4) * 8,
          mc = i % 2 ? '#457644' : '#588c4e';
        m.part(coneG, mc, mx, mh * 0.45, mz, mw, mh, mw);
        m.part(coneG, mc, -mx, mh * 0.45, -mz, mw, mh, mw);
        m.part(sphG, '#689e56', mx * 0.86, 4.5, mz * 0.86, mw * 0.85, 9, mw * 0.85);
        m.part(sphG, '#689e56', -mx * 0.86, 4.5, -mz * 0.86, mw * 0.85, 9, mw * 0.85);
        if (i % 3 === 0) {
          m.part(coneG, '#eef6f2', mx, mh * 0.82, mz, mw * 0.28, mh * 0.26, mw * 0.28);
          m.part(coneG, '#eef6f2', -mx, mh * 0.82, -mz, mw * 0.28, mh * 0.26, mw * 0.28);
        }
      }

      // Two mirrored underpasses beneath outer bridge approaches
      for (const side of [-1, 1]) {
        const tx = side * 31,
          tunnel = '#26384b',
          trim = '#71869b',
          floorTone = '#8e9b9c';
        m.add(tx, 0, 28, 8, 0.22, floorTone, 0.02);
        m.add(tx, -4.15, 28, 0.65, 3.8, tunnel, 0.18);
        m.add(tx, 4.15, 28, 0.65, 3.8, tunnel, 0.18);
        m.add(tx, 0, 28, 8, 0.55, beam, 3.45);
        for (const end of [-1, 1]) {
          const ex = tx + end * 14;
          m.add(ex, -3.55, 1.1, 1.1, 3.6, trim, 0.1);
          m.add(ex, 3.55, 1.1, 1.1, 3.6, trim, 0.1);
          m.add(ex, 0, 1.2, 7.8, 0.8, blue, 3.1);
        }
        m.stairs(tx - side * 11, 0, side > 0 ? 'x+' : 'x-', 6.2, 8, 0.4, 0.9, '#9aaebe', 0.22);
        m.add(tx + side * 1.5, 0, 5.2, 8, 0.42, deck, 3.32);
        m.reserve(tx, 0, 5.5);
      }
    };
  }

  // Enrich Assembly Plant, Blockworks Arena, Violet Voltage, Hypercore Arena
  const asm = MAPS.find((m) => m && m.name === 'Assembly Plant');
  if (asm) {
    asm.build = function (m) {
      const wall = '#263441',
        steel = '#526574',
        trim = '#aab8c5',
        yellow = '#e0b52c',
        dark = '#1d2833';
      m.add(0, 0, 68, 56, 0.3, '#707c84', -0.3);
      m.add(0, -28, 68, 1.2, 16, wall);
      m.add(0, 28, 68, 1.2, 16, wall);
      m.add(-34, 0, 1.2, 56, 16, wall);
      m.add(34, 0, 1.2, 56, 16, wall);

      // Wall pilasters, ceiling trusses & skylights
      for (const x of [-24, -12, 0, 12, 24]) {
        m.add(x, -27.2, 1.1, 0.5, 16, dark);
        m.add(x, 27.2, 1.1, 0.5, 16, dark);
        m.part(unit, steel, x, 14.8, 0, 0.5, 0.7, 54);
        m.part(unit, '#dff5ff', x, 14.35, 0, 0.28, 0.08, 48);
      }
      for (const z of [-16, 0, 16]) {
        m.part(unit, steel, 0, 15.1, z, 66, 0.6, 0.5);
      }

      for (const x of [-20, 0, 20]) {
        m.add(x, 0, 12, 36, 0.35, '#55636d', 0);
        m.add(x, -7, 10, 8, 0.6, steel, 0.35);
        m.add(x, 7, 10, 8, 0.6, steel, 0.35);
        for (let r = -3; r <= 3; r += 1.5) {
          m.part(unit, trim, x, 0.99, r - 7, 8.8, 0.08, 0.25);
          m.part(unit, trim, x, 0.99, r + 7, 8.8, 0.08, 0.25);
        }
        m.add(x - 5, 0, 1.0, 28, 7, wall, 0);
        m.add(x + 5, 0, 1.0, 28, 7, wall, 0);
        m.add(x, 0, 9.2, 1.2, 0.18, yellow, 7.1);
        m.add(x, 0, 1.2, 26, 0.16, trim, 7.25);
      }

      // Walkable 10-step ramps (0.48m per step <= 0.61m) onto y=7? Wait: upper bridges are y=8.4!
      // Let's put upper bay bridge decks at y=4.8 (aligned cleanly to ramps) AND connect side walkways to center!
      m.add(0, -14, 43, 2.8, 0.55, '#465b6c', 4.5);
      m.add(0, 14, 43, 2.8, 0.55, '#465b6c', 4.5);
      m.add(-20, 0, 3.2, 28, 0.55, '#465b6c', 4.5);
      m.add(20, 0, 3.2, 28, 0.55, '#465b6c', 4.5);
      for (const x of [-31, -21, -11, 0, 11, 21, 31]) {
        m.add(x, -15.3, 0.18, 0.18, 1.0, trim, 5.05);
        m.add(x, 15.3, 0.18, 0.18, 1.0, trim, 5.05);
      }
      hcWalkableRamp(m, -20, -25, -14, 4.8, 5, yellow, trim);
      hcWalkableRamp(m, 20, -25, -14, 4.8, 5, yellow, trim);
      hcWalkableRamp(m, -20, 25, 14, 4.8, 5, yellow, trim);
      hcWalkableRamp(m, 20, 25, 14, 4.8, 5, yellow, trim);

      // Central rotating assembly machine
      m.add(0, 0, 13, 13, 0.9, '#303c46', 0.35);
      m.add(0, 0, 9.4, 9.4, 0.45, '#b58a20', 1.25);
      const rotor = new THREE.Group();
      rotor.position.set(0, 2.0, 0);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.45, 3.5, 20), mat('#b7c2cb'));
      hub.position.y = 1.75;
      rotor.add(hub);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.18, 10, 48), mat('#e1b632'));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.4;
      rotor.add(ring);
      for (let i = 0; i < 3; i++) {
        const panel = new THREE.Mesh(
          unit,
          mat(i === 0 ? '#465b6c' : i === 1 ? '#596f7f' : '#394b59')
        );
        panel.scale.set(7.2, 2.6, 0.42);
        panel.position.set(0, 2.0, 3.6);
        panel.rotation.y = (i * Math.PI * 2) / 3;
        rotor.add(panel);
        const stripe = new THREE.Mesh(unit, mat('#e2b62d'));
        stripe.scale.set(6.8, 0.12, 0.48);
        stripe.position.set(0, 3.1, 3.6);
        stripe.rotation.y = (i * Math.PI * 2) / 3;
        rotor.add(stripe);
      }
      mapGroup.add(rotor);
      window.HC_ASSEMBLY_ROTORS = [{ obj: rotor, speed: 0.34 }];
      m.add(0, -5.0, 13, 0.55, 1.3, steel);
      m.add(0, 5.0, 13, 0.55, 1.3, steel);
      m.add(-5.0, 0, 0.55, 10, 1.3, steel);
      m.add(5.0, 0, 0.55, 10, 1.3, steel);

      for (const sx of [-1, 1])
        for (const z of [-20, -10, 10, 20]) {
          m.add(sx * 28, z, 3.4, 4.4, 2.2, steel, 0);
          m.add(sx * 28, z, 2.7, 3.7, 0.18, yellow, 2.2);
        }
      m.reserve(-24, 0, 7);
      m.reserve(24, 0, 7);
      m.reserve(0, -22, 6);
      m.reserve(0, 22, 6);
    };
  }

  const blk = MAPS.find((m) => m && m.name === 'Blockworks Arena');
  if (blk) {
    blk.build = function (m) {
      const dark = '#263746',
        mid = '#42586a',
        light = '#91a4b3',
        cyan = '#28b8d5',
        orange = '#df9c2a';
      m.add(0, 0, 66, 60, 0.3, '#7c8992', -0.3);
      m.add(0, -30, 66, 1.2, 15, dark);
      m.add(0, 30, 66, 1.2, 15, dark);
      m.add(-33, 0, 1.2, 60, 15, dark);
      m.add(33, 0, 1.2, 60, 15, dark);

      // Wall pilasters & overhead skylight beams
      for (const x of [-22, -11, 0, 11, 22]) {
        m.add(x, -29.2, 0.9, 0.4, 15, mid);
        m.add(x, 29.2, 0.9, 0.4, 15, mid);
        m.part(unit, mid, x, 14.3, 0, 0.45, 0.65, 58);
      }

      const layout = [
        [-22, -16, 7.5, 5.5, 3.2, mid],
        [-10, -20, 5, 5, 1.8, light],
        [10, -20, 5, 5, 1.8, light],
        [22, -16, 7.5, 5.5, 3.2, mid],
        [-22, 16, 7.5, 5.5, 3.2, mid],
        [-10, 20, 5, 5, 1.8, light],
        [10, 20, 5, 5, 1.8, light],
        [22, 16, 7.5, 5.5, 3.2, mid],
        [-15, 0, 6.8, 6.8, 2.4, cyan],
        [15, 0, 6.8, 6.8, 2.4, orange],
        [0, -11, 9, 3, 1.4, light],
        [0, 11, 9, 3, 1.4, light],
      ];
      for (const [x, z, w, d, h, c] of layout) {
        m.add(x, z, w, d, h, c);
        m.add(x, z, w * 0.72, d * 0.72, 0.16, '#c6d0d8', h);
      }
      m.add(0, 0, 8, 8, 0.8, dark);
      m.add(0, 0, 5.4, 5.4, 0.25, orange, 0.8);

      // Flush y=3.2 corner pads + cross-bridges with grounded piers & 0.45m step walkable ramps
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = sx * 25,
            z = sz * 22;
          m.add(x, z, 7.2, 7.2, 0.5, mid, 0);
          m.add(x, z, 4.8, 4.8, 2.7, dark, 0.5);
          m.add(x, z, 4.2, 4.2, 0.18, cyan, 3.2);
          hcWalkableRamp(m, x, z + sz * 7.2, z - sz * 1.4, 3.2, 3.2, orange, light);
        }
      m.add(0, -22, 46, 2.6, 0.45, mid, 2.75);
      m.add(0, 22, 46, 2.6, 0.45, mid, 2.75);
      m.add(-25, 0, 2.6, 36, 0.45, mid, 2.75);
      m.add(25, 0, 2.6, 36, 0.45, mid, 2.75);
      for (const z of [-22, 22]) {
        m.add(0, z - 1.25, 46, 0.12, 0.85, light, 3.2);
        m.add(0, z + 1.25, 46, 0.12, 0.85, light, 3.2);
      }
      m.reserve(-25, 0, 7);
      m.reserve(25, 0, 7);
      m.reserve(0, -24, 7);
      m.reserve(0, 24, 7);
    };
  }

  const vio = MAPS.find((m) => m && m.name === 'Violet Voltage');
  if (vio) {
    vio.build = function (m) {
      const shell = '#11131f',
        purple = '#8834bd',
        deep = '#542075',
        yellow = '#e6c943',
        steel = '#2a2d43';
      m.add(0, 0, 70, 70, 0.45, '#171522', -0.45);
      m.add(0, -35, 72, 1.5, 13, shell);
      m.add(0, 35, 72, 1.5, 13, shell);
      m.add(-35, 0, 1.5, 70, 13, shell);
      m.add(35, 0, 1.5, 70, 13, shell);

      // Wall neon trim & overhead trusses
      for (const s of [-1, 1]) {
        m.neon(0, 7.2, s * 34.1, 66, 0.14, 0.12, 0xa83bd4);
        m.neon(s * 34.1, 7.2, 0, 0.12, 0.14, 66, 0xf1d34a);
        m.part(unit, steel, 0, 12.2, s * 18, 68, 0.5, 0.5);
        m.part(unit, steel, s * 18, 12.2, 0, 0.5, 0.5, 68);
      }

      // Corner keeps with 0.375m step ramps inside walls
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = sx * 24,
            z = sz * 23;
          m.add(x, z, 11, 10, 2.8, deep, 0);
          m.add(x, z, 9.4, 8.4, 0.22, yellow, 2.8);
          m.add(x - sx * 4.3, z, 1.0, 8, 5.8, purple, 2.8);
          m.add(x, z - sz * 3.8, 8, 1.0, 5.8, purple, 2.8);
          m.add(x - sx * 4.3, z - sz * 3.8, 1.0, 1.0, 6.4, yellow, 2.8);
          hcWalkableRamp(m, x - sx * 7.8, z - sz * 8.4, z - sz * 2.8, 3.0, 3.4, yellow, purple);
        }

      const pads = [
        [-18, -10, 8, 7, 2.4, purple],
        [-8, -20, 7, 6, 3.4, yellow],
        [18, -10, 8, 7, 2.4, yellow],
        [8, -20, 7, 6, 3.4, purple],
        [-18, 10, 8, 7, 2.4, yellow],
        [-8, 20, 7, 6, 3.4, purple],
        [18, 10, 8, 7, 2.4, purple],
        [8, 20, 7, 6, 3.4, yellow],
      ];
      for (const [x, z, w, d, h, c] of pads) {
        m.add(x, z, w, d, h, c);
        m.add(x, z, w * 0.8, d * 0.8, 0.18, c === purple ? yellow : purple, h);
      }

      // Upper sky-bridge loop (y = 5.4m) + 12-step walkable staircases (0.45m step) + piers
      for (const side of [-1, 1]) {
        m.add(side * 13, 0, 2.6, 26, 0.55, yellow, 5.2);
        m.add(side * 13, -12.6, 0.9, 0.9, 5.2, steel, 0);
        m.add(side * 13, 12.6, 0.9, 0.9, 5.2, steel, 0);
        m.add(side * 13, -12.2, 2.8, 0.16, 0.9, purple, 5.75);
        m.add(side * 13, 12.2, 2.8, 0.16, 0.9, purple, 5.75);
      }
      m.add(0, -13, 26, 2.6, 0.55, purple, 5.2);
      m.add(0, 13, 26, 2.6, 0.55, yellow, 5.2);
      // Stairs rise from ground at z = ±24 inward onto N/S bridges at z = ±14 (0.49m step)
      hcWalkableRamp(m, 0, -24.5, -13.5, 5.4, 3.8, purple, yellow);
      hcWalkableRamp(m, 0, 24.5, 13.5, 5.4, 3.8, yellow, purple);

      // Central core pedestal & luminous energy cube
      m.add(0, 0, 10, 10, 1.0, steel, 0);
      m.add(0, 0, 7.2, 7.2, 0.26, yellow, 1.0);
      m.add(0, 0, 3.1, 3.1, 2.8, '#20263a', 1.26);
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 2.25, 2.25),
        new THREE.MeshStandardMaterial({
          color: 0x26364b,
          metalness: 0.72,
          roughness: 0.18,
          emissive: 0x1a4e82,
          emissiveIntensity: 0.9,
        })
      );
      core.position.set(0, 3.15, 0);
      mapGroup.add(core);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) m.neon(sx * 1.17, 3.15, sz * 1.17, 0.075, 2.36, 0.075, 0x71cfff);

      m.reserve(-27, -27, 6);
      m.reserve(27, 27, 6);
      m.reserve(-27, 27, 6);
      m.reserve(27, -27, 6);
      m.reserve(0, 0, 8);
    };
  }

  const hyp = MAPS.find((m) => m && m.name === 'Hypercore Arena');
  if (hyp) {
    hyp.build = function (m) {
      const dark = '#0b1b2c',
        steel = '#18374c',
        cyan = '#19c9e8',
        orange = '#ff8629',
        white = '#a6efff';
      m.add(0, 0, 70, 70, 0.45, dark, -0.45);
      m.add(0, -35, 72, 1.5, 14, dark);
      m.add(0, 35, 72, 1.5, 14, dark);
      m.add(-35, 0, 1.5, 70, 14, dark);
      m.add(35, 0, 1.5, 70, 14, dark);

      for (const s of [-1, 1]) {
        m.neon(0, 7.6, s * 34.1, 66, 0.14, 0.12, s > 0 ? 0xff8629 : 0x19c9e8);
        m.neon(s * 34.1, 7.6, 0, 0.12, 0.14, 66, s > 0 ? 0x19c9e8 : 0xff8629);
        m.part(unit, steel, 0, 13.0, s * 18, 68, 0.5, 0.5);
        m.part(unit, steel, s * 18, 13.0, 0, 0.5, 0.5, 68);
      }

      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const x = sx * 24,
            z = sz * 23,
            col = sx === sz ? cyan : orange;
          m.add(x, z, 11, 10, 3.2, steel);
          m.add(x, z, 9.2, 8.2, 0.2, col, 3.2);
          m.add(x - sx * 4.4, z, 1.0, 8.4, 5.8, col, 3.2);
          m.add(x, z - sz * 3.9, 8.4, 1.0, 5.8, dark, 3.2);
          hcWalkableRamp(m, x - sx * 8, z - sz * 8.4, z - sz * 3.0, 3.4, 3.5, col, white);
        }

      // Upper bridges at y = 6.2m with grounded support piers & walkable approach ramps
      m.add(0, -22, 45, 3, 0.6, cyan, 6.0);
      m.add(0, 22, 45, 3, 0.6, orange, 6.0);
      m.add(-22, 0, 3, 42, 0.6, orange, 6.0);
      m.add(22, 0, 3, 42, 0.6, cyan, 6.0);
      for (const s of [-1, 1]) {
        m.add(s * 22, -22, 1.0, 1.0, 6.0, steel, 0);
        m.add(s * 22, 22, 1.0, 1.0, 6.0, steel, 0);
      }
      m.add(0, -23.8, 45, 0.18, 1.0, white, 6.6);
      m.add(0, 23.8, 45, 0.18, 1.0, white, 6.6);
      m.add(-23.8, 0, 0.18, 42, 1.0, white, 6.6);
      m.add(23.8, 0, 0.18, 42, 1.0, white, 6.6);

      // Mid-height split decks (y=3.2m) + walkable ground ramps
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const col = sx === sz ? cyan : orange;
          m.add(sx * 11, sz * 11, 12, 4.2, 0.55, col, 3.2);
        }
      hcWalkableRampX(m, 0, -10.5, -4.5, 1.4, 3.6, cyan, white);
      hcWalkableRampX(m, 0, 10.5, 4.5, 1.4, 3.6, orange, white);
      hcWalkableRamp(m, 0, -32, -22.5, 6.3, 3.8, cyan, white);
      hcWalkableRamp(m, 0, 32, 22.5, 6.3, 3.8, orange, white);

      // Central reactor base and split cyan/orange energy core
      m.add(0, 0, 12, 12, 1.2, steel);
      m.add(0, 0, 8.8, 8.8, 0.22, dark, 1.2);
      m.add(0, 0, 3.4, 3.4, 3.2, '#132b3d', 1.42);
      const reactor = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.85, 0),
        new THREE.MeshStandardMaterial({
          color: 0x8bdff1,
          metalness: 0.65,
          roughness: 0.16,
          emissive: 0x176a90,
          emissiveIntensity: 1.15,
        })
      );
      reactor.position.set(0, 3.65, 0);
      mapGroup.add(reactor);
      window.HC_ASSEMBLY_ROTORS = (window.HC_ASSEMBLY_ROTORS || []).concat([{ obj: reactor, speed: 0.55 }]);
      const splitA = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.12, 0.18),
        new THREE.MeshBasicMaterial({ color: 0x20d9f4 })
      );
      splitA.position.set(0, 0, 0);
      reactor.add(splitA);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        m.neon(Math.cos(a) * 2.3, 3.3, Math.sin(a) * 2.3, 0.16, 1.2, 0.16, i % 2 ? 0xff8a24 : 0x20d9f4);
      }

      m.reserve(-27, -27, 6);
      m.reserve(27, 27, 6);
      m.reserve(-27, 27, 6);
      m.reserve(27, -27, 6);
      m.reserve(0, 0, 9);
    };
  }

  /* -------------------------------------------------------------------------
   * 6. LASER ARENA — FAITHFUL 3D RECONSTRUCTION OF ATTACHED REFERENCE
   * ------------------------------------------------------------------------- */
  const laserMap = mp(
    'Laser Arena',
    'A dark industrial cyberpunk laser hall with a glowing cyan central dais, dual 5-step staircases, sweeping side ramps up to a neon balcony, cyan/magenta portal doorways, and crisscrossing overhead laser beams.',
    {
      sky: '#0c101b',
      fog: '#121828',
      floor: '#1a2130',
      line: '#2a364c',
      style: 'grid',
      tile: 4,
      wall: '#131924',
      c: ['#1a2130', '#2b3547', '#25e6ff', '#ff35c8'],
      mood: 'indoor',
      hs: '#7898c8',
      hg: '#101521',
      sp: [0, 32, 20],
      wallH: 0,
    },
    function (m) {
      const W = 34,
        D = 26,
        H = 15.5;
      const wallCol = '#141a26',
        panelCol = '#1b2232',
        steel = '#263042',
        slate = '#2f3a4d',
        cyanHex = 0x25e6ff,
        violetHex = 0x7a5cff,
        magentaHex = 0xff35c8;

      window.HC_LASER_BEAMS = [];

      // Main floor + clean geometric floor inlays (matching reference cyan/violet rim & grid channels)
      m.add(0, 0, 2 * W + 2, 2 * D + 2, 0.4, '#18202e', -0.4);
      for (let x = -28; x <= 28; x += 7) {
        m.part(unit, '#232d40', x, 0.015, 0, 0.08, 0.02, 2 * D - 2);
      }
      for (let z = -20; z <= 20; z += 5) {
        m.part(unit, '#232d40', 0, 0.015, z, 2 * W - 2, 0.02, 0.08);
      }
      // Glowing cyan -> violet floor border & circuit lines (strict 180° rotational symmetry)
      for (const sz of [-1, 1]) {
        m.neon(0, 0.05, sz * 22.8, 62, 0.08, 0.14, cyanHex);
        m.neon(-14.5, 0.05, sz * 11.2, 28, 0.06, 0.09, violetHex);
        m.neon(14.5, 0.05, sz * 11.2, 28, 0.06, 0.09, violetHex);
      }
      m.neon(-13.8, 0.05, 0, 0.09, 0.06, 22, cyanHex);
      m.neon(13.8, 0.05, 0, 0.09, 0.06, 22, cyanHex);
      m.neon(-23, 0.05, 8.5, 17, 0.06, 0.09, cyanHex);
      m.neon(23, 0.05, -8.5, 17, 0.06, 0.09, cyanHex);

      // Perimeter enclosure walls
      m.add(0, -D, 2 * W + 2, 1.4, H, wallCol, 0);
      m.add(0, D, 2 * W + 2, 1.4, H, wallCol, 0);
      m.add(-W, 0, 1.4, 2 * D + 2, H, wallCol, 0);
      m.add(W, 0, 1.4, 2 * D + 2, H, wallCol, 0);

      // Wall pilasters + upper wall coffered panels + ceiling girders & white strip lights
      for (const x of [-25, -15, -5, 5, 15, 25]) {
        m.add(x, -D + 0.85, 0.9, 0.45, H, panelCol, 0);
        m.add(x, D - 0.85, 0.9, 0.45, H, panelCol, 0);
      }
      for (const z of [-18, -9, 0, 9, 18]) {
        m.add(-W + 0.85, z, 0.45, 0.9, H, panelCol, 0);
        m.add(W - 0.85, z, 0.45, 0.9, H, panelCol, 0);
      }
      // Coffered dark ceiling slabs + recessed grid trusses & overhead spot light strips (centered at z=0)
      m.add(0, 0, 2 * W + 2, 2 * D + 2, 0.6, '#0f141e', H - 0.6);
      for (const x of [-22, -11, 0, 11, 22]) {
        m.part(unit, '#1b2232', x, H - 0.95, 0, 0.75, 0.75, 2 * D);
        m.part(unit, 0xd8ecff, x, H - 1.35, 0, 0.24, 0.08, 28);
      }
      for (const z of [-15, -5, 5, 15]) {
        m.part(unit, '#1b2232', 0, H - 0.95, z, 2 * W, 0.75, 0.75);
      }

      // Elevated side observation windows (180° mirrored across X & Z)
      for (const sx of [-1, 1]) {
        const wx = sx * (W - 0.82),
          wzCenter = sx * -7.5;
        m.part(unit, '#090d14', wx, 7.6, wzCenter, 0.26, 3.2, 13.8);
        m.part(unit, steel, wx, 9.25, wzCenter, 0.4, 0.22, 14.2);
        m.part(unit, steel, wx, 5.95, wzCenter, 0.4, 0.22, 14.2);
        for (const dWz of [-4.5, 0, 4.5]) {
          m.part(unit, steel, wx, 7.6, wzCenter + dWz, 0.4, 3.2, 0.24);
        }
        m.neon(wx - sx * 0.14, 9.15, wzCenter, 0.08, 0.06, 13.2, 0x8db2d6);
      }

      // Central Raised Dais (x=-5.2..5.2, z=-5.2..5.2, height=1.65) + Cyan Under-Glow
      m.add(0, 0, 10.4, 10.4, 1.65, steel, 0);
      m.add(0, 0, 9.6, 9.6, 0.12, slate, 1.65);
      m.neon(0, 0.28, 5.26, 8.6, 0.12, 0.1, cyanHex);
      m.neon(0, 0.28, -5.26, 8.6, 0.12, 0.1, cyanHex);
      m.neon(0, 1.72, 5.2, 4.6, 0.08, 0.08, cyanHex);
      m.neon(0, 1.72, -5.2, 4.6, 0.08, 0.08, cyanHex);

      // Twin 5-step wide side staircases flanking Dais (0.33m per step <= 0.61m)
      m.stairs(-8.4, 0, 'x+', 7.6, 5, 0.33, 0.64, slate, 0);
      m.stairs(8.4, 0, 'x-', 7.6, 5, 0.33, 0.64, slate, 0);

      // Central cyan holographic emitter pedestal on Dais
      m.add(0, 0, 3.1, 3.1, 0.72, '#1d2635', 1.77);
      m.part(cylG, '#141d2b', 0, 2.55, 0, 1.15, 0.2, 1.15);
      m.part(torThin, cyanHex, 0, 2.68, 0, 0.95, 0.95, 0.95, Math.PI / 2);
      m.part(cylG, 0x8ef7ff, 0, 2.72, 0, 0.45, 0.08, 0.45);
      const beamCol = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 2.4, 24, 1, true),
        new THREE.MeshBasicMaterial({
          color: cyanHex,
          transparent: true,
          opacity: 0.16,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      beamCol.position.set(0, 3.88, 0);
      mapGroup.add(beamCol);

      // Symmetric low L-shaped slate cover bunkers flanking the central Dais (strict 180° rotational symmetry)
      for (const sx of [-1, 1]) {
        m.add(sx * 11.4, sx * 7.4, 7.0, 1.35, 1.18, slate, 0);
        m.add(sx * 14.2, sx * 5.2, 1.35, 5.2, 1.55, steel, 0);
        m.add(sx * 11.4, sx * 7.4, 6.6, 1.05, 0.09, '#465670', 1.18);

        m.add(sx * 11.4, -sx * 7.4, 7.0, 1.35, 1.18, slate, 0);
        m.add(sx * 14.2, -sx * 5.2, 1.35, 5.2, 1.55, steel, 0);
        m.add(sx * 11.4, -sx * 7.4, 6.6, 1.05, 0.09, '#465670', 1.18);
      }

      // Dual Symmetrical North & South Rear Balconies (z = -21 and z = +21, y = 4.6) + Ramps + Arched Portals
      for (const sz of [-1, 1]) {
        const bz = sz * 21,
          edgeZ = sz * 16.55,
          wallZ = sz * 25.1;
        m.add(0, bz, 66.5, 9.2, 0.65, steel, 3.95);
        for (const px of [-24, -12, -3.6, 3.6, 12, 24]) {
          m.add(px, sz * 16.8, 1.1, 1.1, 4.1, panelCol, 0);
        }
        m.neon(-8.0, 2.5, sz * 16.75, 6.4, 0.1, 0.1, cyanHex);
        m.neon(8.0, 2.5, sz * 16.75, 6.4, 0.1, 0.1, cyanHex);
        m.add(0, edgeZ, 42, 0.22, 0.95, '#3b485e', 4.6);
        m.add(0, edgeZ, 42, 0.26, 0.12, '#6d7f9c', 5.55);

        // Twin wide angled side ramps rising cleanly from z=sz*0.5 to z=sz*16.5
        for (const sx of [-1, 1]) {
          hcWalkableRamp(m, sx * 25.0, sz * 0.5, sz * 16.5, 4.6, 6.4, '#242e3f', '#586985');
        }

        // Rear Wall Neon Frames + Twin Arched Balcony Portals
        m.neon(0, 11.4, wallZ, 44, 0.16, 0.14, violetHex);
        m.neon(-22, 8.0, wallZ, 0.16, 6.8, 0.14, violetHex);
        m.neon(22, 8.0, wallZ, 0.16, 6.8, 0.14, violetHex);
        m.neon(0, 9.4, wallZ, 13.0, 0.14, 0.12, cyanHex);
        m.neon(-6.5, 7.0, wallZ, 0.14, 4.8, 0.12, cyanHex);
        m.neon(6.5, 7.0, wallZ, 0.14, 4.8, 0.12, cyanHex);
        m.neon(0, 4.66, wallZ, 13.0, 0.1, 0.12, cyanHex);

        for (const sx of [-1, 1]) {
          const dx = sx * 14.2;
          m.part(unit, '#090d16', dx, 6.6, wallZ + sz * 0.04, 3.2, 4.0, 0.16);
          const pCol = sx * sz > 0 ? cyanHex : violetHex;
          m.neon(dx - 1.7, 6.6, wallZ - sz * 0.05, 0.14, 4.1, 0.14, pCol);
          m.neon(dx + 1.7, 6.6, wallZ - sz * 0.05, 0.14, 4.1, 0.14, pCol);
          m.neon(dx, 8.65, wallZ - sz * 0.05, 3.55, 0.14, 0.14, pCol);
        }
      }

      // Lower West Cyan Portal (-X, +Z) & East Magenta Portal (+X, -Z) — 180° rotational mirror
      for (const sx of [-1, 1]) {
        const px = sx * (W - 0.72),
          pz = -sx * 8.0,
          col = sx < 0 ? cyanHex : magentaHex;
        m.part(unit, '#060910', px, 2.25, pz, 0.35, 4.5, 5.2);
        m.add(px, pz - 2.9, 1.3, 0.7, 4.9, steel, 0);
        m.add(px, pz + 2.9, 1.3, 0.7, 4.9, steel, 0);
        m.add(px, pz, 1.3, 6.4, 0.7, steel, 4.6);
        m.neon(px - sx * 0.25, 2.25, pz - 2.6, 0.12, 4.5, 0.14, col);
        m.neon(px - sx * 0.25, 2.25, pz + 2.6, 0.12, 4.5, 0.14, col);
        m.neon(px - sx * 0.25, 4.52, pz, 0.12, 0.16, 5.3, col);
        m.neon(px - sx * 0.55, 0.06, pz, 1.2, 0.08, 5.6, col);
      }

      // Signature Crisscrossing Symmetrical Laser Beams (registered with a/b/radius for tickLaserArenaHazards damage!)
      function addLaserBeamPair(a, b, hex, radius) {
        const addOne = (p0, p1) => {
          const va = new THREE.Vector3(p0[0], p0[1], p0[2]),
            vb = new THREE.Vector3(p1[0], p1[1], p1[2]);
          const d = vb.clone().sub(va),
            len = d.length();
          const beamMat = new THREE.MeshBasicMaterial({
            color: hex,
            transparent: true,
            opacity: 0.96,
          });
          const beam = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, len, 10, 1),
            beamMat
          );
          beam.position.copy(va).add(vb).multiplyScalar(0.5);
          beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
          mapGroup.add(beam);
          window.HC_LASER_BEAMS.push({
            a: va,
            b: vb,
            radius: radius || 0.11,
            mesh: beam,
            mat: beamMat,
            base: 0.96,
            phase: len * 0.3,
            lastHit: new WeakMap(),
          });
        };
        addOne(a, b);
        addOne([-a[0], a[1], -a[2]], [-b[0], b[1], -b[2]]);
      }

      // Symmetrical overhead laser web + dodgeable low/mid arena laser beams (deal 22 DMG on contact!)
      addLaserBeamPair([-33.2, 7.6, 5.5], [-26.5, 13.5, -2.0], magentaHex, 0.11);
      addLaserBeamPair([-22.0, 12.6, -4.5], [14.0, 4.6, 12.5], violetHex, 0.11);
      addLaserBeamPair([-18.5, 1.25, -4.2], [-18.5, 1.25, 4.2], magentaHex, 0.12);
      addLaserBeamPair([-10.2, 1.45, -13.2], [10.2, 1.45, -13.2], cyanHex, 0.12);
      addLaserBeamPair([-20.5, 2.25, 9.8], [-11.5, 2.25, 14.5], violetHex, 0.11);

      m.reserve(-27.5, 12.5, 5.5);
      m.reserve(27.5, -12.5, 5.5);
      m.reserve(-27.5, -12.5, 5.5);
      m.reserve(27.5, 12.5, 5.5);
    }
  );
  Object.assign(laserMap, {
    noGrade: true,
    noSeasonTint: true,
    noClutter: true,
    noOuterFill: true,
    noDetail: true,
    noEnvironment: true,
    noPostSigns: true,
    railEdges: true,
  });
  const li = MAPS.findIndex((m) => m && m.name === 'Laser Arena');
  if (li >= 0) MAPS[li] = laserMap;
  else MAPS.push(laserMap);

  /* -------------------------------------------------------------------------
   * 6B. POOL PARTY — SUNLIT RESORT ARENA (Bouncy Floats, Wet Decks, Spring Boards)
   * ------------------------------------------------------------------------- */
  const poolPartyMap = mp(
    'Pool Party',
    'A bright resort courtyard with a sunken turquoise pool, slippery wet deck tiles, bouncy inflatable floats, mirrored lifeguard towers, cabanas, and diving spring pads.',
    {
      sky: '#76ceff',
      fog: '#a8e2ff',
      floor: '#d8e7f2',
      line: '#9cc4dc',
      style: 'grid',
      tile: 3,
      wall: '#3490c9',
      c: ['#e4f1f8', '#22b8cf', '#ff8c42', '#ffd166'],
      mood: 'day',
      hs: '#ffffff',
      hg: '#70b7d8',
      sp: [18, 42, 20],
      wallH: 0,
    },
    function (m) {
      const W = 40,
        D = 28,
        H = 11;
      const deckWet = '#b8deee',
        deckDry = '#eef5f9',
        poolWall = '#227aa8',
        poolFloor = '#16608a',
        gold = '#ffb703',
        coral = '#ff5a5f',
        mint = '#2ec4b6',
        cabanaWood = '#9c6644';

      // Sunken pool basin floor (y = -1.1) + perimeter wet pool decks (slippery!)
      m.add(0, 0, 26, 16, 0.35, poolFloor, -1.45);
      {
        if (!window.HC_WATER_SHADER_MAT) {
          window.HC_WATER_SHADER_MAT = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uDeep: { value: new THREE.Color('#0c77b8') },
              uFoam: { value: new THREE.Color('#9ff6ff') },
            },
            vertexShader: `
              uniform float uTime;
              varying vec2 vUv;
              varying float vWave;
              void main() {
                vUv = uv;
                vec3 p = position;
                float w = sin(p.x * 1.4 + uTime * 2.4) * cos(p.z * 1.3 - uTime * 1.9) * 0.04;
                p.y += w;
                vWave = w;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
              }
            `,
            fragmentShader: `
              uniform float uTime;
              uniform vec3 uDeep;
              uniform vec3 uFoam;
              varying vec2 vUv;
              varying float vWave;
              void main() {
                float c1 = sin(vUv.x * 26.0 + uTime * 2.2) * cos(vUv.y * 18.0 - uTime * 1.7);
                float c2 = sin((vUv.x + vUv.y) * 22.0 - uTime * 2.8);
                float caustic = smoothstep(0.45, 0.98, 0.5 + 0.25 * (c1 + c2));
                vec3 col = mix(uDeep, uFoam, caustic * 0.48 + clamp(vWave * 8.0, 0.0, 0.25));
                gl_FragColor = vec4(col, 0.62);
              }
            `,
          });
        }
        const waterMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(25.4, 15.4, 24, 16),
          window.HC_WATER_SHADER_MAT
        );
        waterMesh.rotation.x = -Math.PI / 2;
        waterMesh.position.set(0, -0.28, 0);
        mapGroup.add(waterMesh);
      }

      // Pool basin side walls + walkable corner stairs (0.38m steps rising from -1.1 to +0.04)
      m.add(0, -8.3, 27, 0.7, 1.15, poolWall, -1.15);
      m.add(0, 8.3, 27, 0.7, 1.15, poolWall, -1.15);
      m.add(-13.35, 0, 0.7, 16, 1.15, poolWall, -1.15);
      m.add(13.35, 0, 0.7, 16, 1.15, poolWall, -1.15);
      for (const sx of [-1, 1]) {
        m.stairs(sx * 10.6, sx * 6.5, sx > 0 ? 'x-' : 'x+', 2.6, 3, 0.38, 0.68, '#d9f2fa', -1.12);
      }

      // Outer dry & wet slippery poolside apron
      m.add(0, -18, 2 * W, 20, 0.4, deckWet, -0.4, 1, { hcSurface: 'slippery' });
      m.add(0, 18, 2 * W, 20, 0.4, deckWet, -0.4, 1, { hcSurface: 'slippery' });
      m.add(-26.5, 0, 27, 16, 0.4, deckWet, -0.4, 1, { hcSurface: 'slippery' });
      m.add(26.5, 0, 27, 16, 0.4, deckWet, -0.4, 1, { hcSurface: 'slippery' });
      for (let x = -34; x <= 34; x += 6) m.part(unit, '#91c2da', x, 0.02, 0, 0.08, 0.02, 2 * D);

      // Mirrored center floating bridge + bouncy inflatable swim floats!
      m.add(0, 0, 5.2, 6.2, 0.45, gold, -0.35, 1, { hcSurface: 'bouncy' });
      m.part(torThin, 0xff5a5f, 0, 0.2, 0, 2.7, 2.7, 2.7, Math.PI / 2);
      for (const sx of [-1, 1]) {
        m.add(sx * 7.2, sx * 3.0, 3.6, 3.6, 0.42, coral, -0.45, 1, { hcSurface: 'bouncy' });
        m.part(torThin, 0xffd166, sx * 7.2, 0.08, sx * 3.0, 1.85, 1.85, 1.85, Math.PI / 2);
        m.add(sx * 20.5, -sx * 8.0, 3.8, 3.8, 0.65, mint, 0.0, 1, { hcSurface: 'bouncy' });
        m.part(torThin, 0x2ec4b6, sx * 20.5, 0.72, -sx * 8.0, 1.9, 1.9, 1.9, Math.PI / 2);
      }

      // Diving springboards at North & South pool edges (wired into G.jumpMats!)
      for (const sz of [-1, 1]) {
        const bx = -sz * 5.0,
          bz = sz * 9.8;
        m.add(bx, bz, 2.2, 4.2, 0.85, '#3b566e', 0);
        m.add(bx, bz - sz * 1.4, 1.8, 3.0, 0.16, gold, 0.9);
        m.part(cylG, '#23cfff', bx, 1.08, bz - sz * 2.2, 1.15, 0.14, 1.15);
        if (typeof G === 'object' && Array.isArray(G.jumpMats)) {
          G.jumpMats.push({
            staticMesh: true,
            pos: new THREE.Vector3(bx, 1.16, bz - sz * 2.2),
            normal: new THREE.Vector3(0, 1, 0),
            radius: 1.95,
            vy: 25,
            until: Infinity,
            lastLaunch: {},
          });
        }
      }

      // Mirrored Lifeguard Towers with walkable 0.42m stairs
      for (const sx of [-1, 1]) {
        const lx = sx * 25.5,
          lz = sx * 12.5;
        m.add(lx, lz, 4.6, 4.6, 0.5, '#ffffff', 3.2);
        for (const ox of [-1.8, 1.8])
          for (const oz of [-1.8, 1.8]) m.add(lx + ox, lz + oz, 0.45, 0.45, 3.2, cabanaWood, 0);
        m.add(lx, lz, 5.2, 5.2, 0.22, coral, 5.9);
        m.add(lx - sx * 1.9, lz, 0.25, 3.8, 0.9, '#ffffff', 3.7);
        m.stairs(lx + sx * 4.4, lz, sx > 0 ? 'x-' : 'x+', 2.8, 8, 0.42, 0.6, '#ffffff', 0);
        m.reserve(lx, lz, 5);
      }

      // Mirrored Poolside Cabanas, Sun Loungers, and Striped Umbrellas
      for (const sx of [-1, 1]) {
        const cx = sx * 31.5,
          cz = -sx * 16.5;
        m.add(cx, cz, 8.2, 6.2, 0.25, deckDry, 0);
        m.add(cx + sx * 3.6, cz, 0.55, 6.2, 3.2, '#ffffff', 0.25);
        m.add(cx, cz - sx * 2.7, 8.2, 0.55, 3.2, '#ffffff', 0.25);
        m.add(cx, cz, 8.6, 6.6, 0.3, sx < 0 ? '#23cfff' : '#ff8c42', 3.45);
        // Changing bench cover
        m.add(cx - sx * 1.8, cz + sx * 1.2, 2.6, 1.2, 1.05, cabanaWood, 0.25);

        // Umbrella tables flanking pool lanes
        const ux = sx * 16.5,
          uz = -sx * 15.0;
        m.add(ux, uz, 2.2, 2.2, 0.85, '#ffffff', 0);
        m.part(cylG, cabanaWood, ux, 1.6, uz, 0.12, 3.0, 0.12);
        m.cone(ux, 3.2, uz, 2.6, 0.9, sx < 0 ? coral : mint);
      }

      // Perimeter resort walls + clear corner safety glass trim
      m.add(0, -D, 2 * W + 2, 1.4, H, '#ffffff', 0);
      m.add(0, D, 2 * W + 2, 1.4, H, '#ffffff', 0);
      m.add(-W, 0, 1.4, 2 * D + 2, H, '#ffffff', 0);
      m.add(W, 0, 1.4, 2 * D + 2, H, '#ffffff', 0);
      for (let x = -30; x <= 30; x += 12) {
        m.neon(x, 4.2, -D + 0.78, 6.5, 0.16, 0.12, 0x2ec4b6);
        m.neon(x, 4.2, D - 0.78, 6.5, 0.16, 0.12, 0x2ec4b6);
      }
      for (let z = -18; z <= 18; z += 12) {
        m.neon(-W + 0.78, 4.2, z, 0.12, 0.16, 6.5, 0xff8c42);
        m.neon(W - 0.78, 4.2, z, 0.12, 0.16, 6.5, 0xff8c42);
      }
      m.reserve(-31, 0, 5.5);
      m.reserve(31, 0, 5.5);
    }
  );
  Object.assign(poolPartyMap, {
    noGrade: true,
    noSeasonTint: true,
    noClutter: true,
    noOuterFill: true,
    noDetail: true,
    noEnvironment: true,
    noPostSigns: true,
    railEdges: true,
  });
  const ppi = MAPS.findIndex((m) => m && m.name === 'Pool Party');
  if (ppi >= 0) MAPS[ppi] = poolPartyMap;
  else MAPS.push(poolPartyMap);

  const HC_MAP_SPAWN_CONFIGS = {
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
      bounds: { minX: -31.5, maxX: 31.5, minZ: -15.5, maxZ: 15.5 },
      team0: [
        { x: -27.5, z: 12.5 },
        { x: -17.5, z: 12.5 },
        { x: -27.5, z: -12.5 },
      ],
      team1: [
        { x: 27.5, z: -12.5 },
        { x: 17.5, z: -12.5 },
        { x: 27.5, z: 12.5 },
      ],
      extra: [
        { x: 0, z: -12.5 },
        { x: 0, z: 12.5 },
      ],
    },
    'Pool Party': {
      bounds: { minX: -36.5, maxX: 36.5, minZ: -25.0, maxZ: 25.0 },
      team0: [
        { x: -31.0, z: 4.5 },
        { x: -31.0, z: -4.5 },
        { x: -16.0, z: 20.0 },
      ],
      team1: [
        { x: 31.0, z: -4.5 },
        { x: 31.0, z: 4.5 },
        { x: 16.0, z: -20.0 },
      ],
      extra: [
        { x: -18.0, z: -20.0 },
        { x: 18.0, z: 20.0 },
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
      bounds: { minX: -41.5, maxX: 41.5, minZ: -38.0, maxZ: 38.0 },
      team0: [
        { x: -38.0, z: -5.0 },
        { x: -38.0, z: 5.0 },
        { x: -18.0, z: 0.0 },
      ],
      team1: [
        { x: 38.0, z: 5.0 },
        { x: 38.0, z: -5.0 },
        { x: 18.0, z: 0.0 },
      ],
      extra: [
        { x: 0.0, z: -28.0 },
        { x: 0.0, z: 28.0 },
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

  function hcWithinBounds(x, z, b) {
    if (!b) return Math.abs(x) <= SR && Math.abs(z) <= SR;
    return x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  }

  function hcSpawnClearance(x, z, bounds) {
    if (!hcWithinBounds(x, z, bounds)) return false;
    if (typeof collides === 'function' && collides(x, 0.05, z, 0.48, 1.78)) return false;
    if (typeof rayWorld === 'function') {
      const up = rayWorld(new THREE.Vector3(x, 0.9, z), new THREE.Vector3(0, 1, 0), 3.0);
      if (up < 2.2) return false;
    }
    return true;
  }

  function hcSpawnSightline(x, z) {
    if (typeof rayWorld !== 'function') return 10;
    const len = Math.hypot(x, z);
    const dir = len > 0.2 ? new THREE.Vector3(-x / len, 0, -z / len) : new THREE.Vector3(0, 0, -1);
    return rayWorld(new THREE.Vector3(x, 1.5, z), dir, 8.0);
  }

  function hcMakePortalShaderMat(hexA, hexB) {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColA: { value: new THREE.Color(hexA || 0x22e8ff) },
        uColB: { value: new THREE.Color(hexB || 0xb45cff) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColA;
        uniform vec3 uColB;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          float ang = atan(p.y, p.x);
          float swirl = 0.5 + 0.5 * sin(ang * 4.0 - r * 10.0 + uTime * 4.2);
          float ring = smoothstep(1.0, 0.72, r) * smoothstep(0.15, 0.85, swirl * 0.7 + (1.0 - r) * 0.5);
          vec3 col = mix(uColA, uColB, swirl);
          gl_FragColor = vec4(col, ring * 0.82);
        }
      `,
    });
  }

  window.HC_PORTAL_SHADERS = [];
  function hcSetupMapTraversalNodes(m) {
    window.HC_PORTAL_SHADERS = [];
    if (typeof G !== 'object' || !mapGroup) return;
    G.hcMapTeleports = [];
    G.hcMapLifts = [];
    G.hcZipLines = [];
    G.hcCustomSurfaces = [];
    if (!m || !m.name) return;

    const addTeleportPair = (ax, ay, az, bx, by, bz, hex) => {
      const makePad = (x, y, z) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(1.15, 0.08, 8, 28),
          new THREE.MeshBasicMaterial({ color: hex })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y + 0.12, z);
        mapGroup.add(ring);
        const sMat = hcMakePortalShaderMat(hex, 0xffffff);
        window.HC_PORTAL_SHADERS.push(sMat);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(1.08, 24), sMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(x, y + 0.14, z);
        mapGroup.add(disc);
      };
      makePad(ax, ay, az);
      makePad(bx, by, bz);
      G.hcMapTeleports.push(
        { x: ax, y: ay, z: az, tx: bx, ty: by, tz: bz, cdUntil: 0 },
        { x: bx, y: by, z: bz, tx: ax, ty: ay, tz: az, cdUntil: 0 }
      );
    };

    const addLift = (x, y, z, topY, hex) => {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.45, 0.16, 20),
        new THREE.MeshBasicMaterial({ color: hex })
      );
      base.position.set(x, y + 0.08, z);
      mapGroup.add(base);
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.95, Math.max(2, topY - y), 18, 1, true),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
      );
      col.position.set(x, y + (topY - y) * 0.5, z);
      mapGroup.add(col);
      G.hcMapLifts.push({ x, y, z, topY, r: 1.5 });
    };

    const addZip = (ax, ay, az, bx, by, bz) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(ax, ay, az),
        new THREE.Vector3(bx, by, bz),
      ]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd24d }));
      mapGroup.add(line);
      G.hcZipLines.push({ a: new THREE.Vector3(ax, ay, az), b: new THREE.Vector3(bx, by, bz) });
    };

    if (m.name === 'Laser Arena') {
      addTeleportPair(-34, 0, 8, 34, 0, -8, 0x25e6ff);
      addLift(-20, 0, -14, 5.2, 0x9b5cff);
      addLift(20, 0, 14, 5.2, 0xff4fd8);
      addZip(-24, 5.2, 16, 24, 5.2, -16);
    } else if (m.name === 'Overpass') {
      addTeleportPair(-31, 0.2, 22, 31, 0.2, -22, 0x35c9ff);
      addLift(-18, 0, 0, 5.2, 0x35c9ff);
      addLift(18, 0, 0, 5.2, 0xffaa3b);
      addZip(-26, 6.2, -14, 26, 6.2, 14);
    } else if (m.name === 'Pool Party') {
      addTeleportPair(-23, 0, -14, 23, 0, 14, 0x2ec4b6);
      addLift(-20, 0, 12, 4.4, 0xffb703);
      addLift(20, 0, -12, 4.4, 0x23cfff);
      addZip(-24, 4.8, 12, 24, 4.8, -12);
    } else if (m.name === 'Redline Arena') {
      addTeleportPair(-22, 0, -22, 22, 0, 22, 0xff5a45);
      addLift(-14, 0, 14, 4.5, 0xff5a45);
      addLift(14, 0, -14, 4.5, 0x35c9ff);
      addZip(-18, 4.8, -18, 18, 4.8, 18);
    }
  }

  if (typeof buildMap === 'function') {
    const hcExtPrevBuildMap = buildMap;
    buildMap = function (idx) {
      const res = hcExtPrevBuildMap.apply(this, arguments);
      try {
        const m = MAPS[idx];
        hcSetupMapTraversalNodes(m);
        const sc = m && HC_MAP_SPAWN_CONFIGS[m.name];
        if (sc && typeof NAV !== 'undefined' && NAV && NAV.valid) {
          for (let gz = 0; gz < NN; gz++) {
            for (let gx = 0; gx < NN; gx++) {
              const id = gx + gz * NN;
              if (!NAV.valid[id]) continue;
              const wx = gx - HALF + 0.5;
              const wz = gz - HALF + 0.5;
              if (!hcWithinBounds(wx, wz, sc.bounds)) NAV.valid[id] = 0;
            }
          }
          const t0 = sc.team0.find((p) => hcSpawnClearance(p.x, p.z, sc.bounds));
          const t1 = sc.team1.find((p) => hcSpawnClearance(p.x, p.z, sc.bounds));
          if (t0 && t1) {
            BASE = [
              { x: t0.x, z: t0.z },
              { x: t1.x, z: t1.z },
            ];
          }
        }
      } catch (e) {}
      return res;
    };
  }

  if (typeof pickSpawn === 'function') {
    const hcPrevPickSpawn = pickSpawn;
    pickSpawn = function (team, self) {
      const m = MAPS[G.mapIdx];
      const mapName = (m && m.name) || '';
      const sc = HC_MAP_SPAWN_CONFIGS[mapName];
      const enemy = (u) => u && u !== self && isAlive(u) && (G.am === 'ffa' ? true : u.team !== team);
      const ally = (u) => u && u !== self && isAlive(u) && G.am !== 'ffa' && u.team === team;

      const scorePoint = (x, z) => {
        let enemyGap = 80;
        let allyGap = 80;
        for (const u of UN) {
          if (!u || u === self || !isAlive(u) || Math.abs(u.pos.x) > 300) continue;
          const d = Math.hypot(u.pos.x - x, u.pos.z - z);
          if (enemy(u)) enemyGap = Math.min(enemyGap, d);
          else if (ally(u)) allyGap = Math.min(allyGap, d);
        }
        const los = hcSpawnSightline(x, z);
        const losBonus = los >= 3.2 ? Math.min(los, 8) * 0.45 : -25;
        return Math.min(enemyGap, 60) + Math.min(allyGap, 18) * 0.18 + losBonus + (Math.random() - 0.5) * 0.6;
      };

      if (sc) {
        const pool =
          G.am === 'ffa'
            ? [...sc.team0, ...sc.team1, ...(sc.extra || [])]
            : [...(Number(team) % 2 === 0 ? sc.team0 : sc.team1), ...(sc.extra || [])];
        let best = null;
        let bestScore = -Infinity;
        for (const pt of pool) {
          const jitter = pool.indexOf(pt) < 3 ? [{ dx: 0, dz: 0 }] : [{ dx: 0, dz: 0 }];
          for (const j of jitter) {
            const x = pt.x + j.dx;
            const z = pt.z + j.dz;
            if (!hcSpawnClearance(x, z, sc.bounds)) continue;
            const s = scorePoint(x, z);
            if (s > bestScore) {
              bestScore = s;
              best = { x, z };
            }
          }
        }
        if (best) return best;

        // Fallback across valid NAV cells strictly inside sc.bounds
        let navBest = null;
        let navScore = -Infinity;
        for (let id = 0; id < NAV.valid.length; id++) {
          if (!NAV.valid[id]) continue;
          const x = (id % NN) - HALF + 0.5;
          const z = ((id / NN) | 0) - HALF + 0.5;
          if (!hcSpawnClearance(x, z, sc.bounds)) continue;
          const s = scorePoint(x, z);
          if (s > navScore) {
            navScore = s;
            navBest = { x, z };
          }
        }
        if (navBest) return navBest;
      }

      const fallback = hcPrevPickSpawn(team, self);
      if (fallback && hcSpawnClearance(fallback.x, fallback.z, sc ? sc.bounds : null)) {
        return fallback;
      }
      if (typeof NAV !== 'undefined' && NAV && NAV.valid) {
        let navBest = null;
        let navScore = -Infinity;
        for (let id = 0; id < NAV.valid.length; id++) {
          if (!NAV.valid[id]) continue;
          const x = (id % NN) - HALF + 0.5;
          const z = ((id / NN) | 0) - HALF + 0.5;
          if (!hcSpawnClearance(x, z, sc ? sc.bounds : null)) continue;
          const s = scorePoint(x, z);
          if (s > navScore) {
            navScore = s;
            navBest = { x, z };
          }
        }
        if (navBest) return navBest;
      }
      return fallback || { x: 0, z: 0 };
    };
  }

  /* -------------------------------------------------------------------------
   * 6C. 2D MAP THUMBNAIL GENERATOR FOR #mapCards + PINNED FEATURED MAPS
   * ------------------------------------------------------------------------- */
  window.HC_MAP_THUMBS = window.HC_MAP_THUMBS || {};
  function hcColorToCss(col, fallback) {
    if (typeof col === 'number') return '#' + ('000000' + (col & 0xffffff).toString(16)).slice(-6);
    if (typeof col === 'string' && col) return col;
    return fallback || '#7a8a9c';
  }
  function hcBuildMapThumbnail(M, idx) {
    if (!M || typeof M.build !== 'function') return '';
    if (window.HC_MAP_THUMBS[M.name]) return window.HC_MAP_THUMBS[M.name];
    const arenaH = (typeof arenaHalf === 'function' ? arenaHalf(M) : MAP_SIZE[M.name] || 40) || 40;
    const shapes = [];
    const rails = [];
    const pads = [];
    const lasers = [];
    const savedSolids = solids;
    const savedMapGroup = mapGroup;
    const savedHalf = HALF;
    const savedGrade = GRADE_ON;
    const savedRails = G.hcGrindRails;
    const savedMats = G.jumpMats;
    const savedLasers = window.HC_LASER_BEAMS;
    const savedTargets = window.HC_TARGET_GRID_TARGETS;
    const savedTgPads = window.HC_TARGET_GRID_PADS;
    const savedSecret = window.HC_TARGET_GRID_SECRET;
    const savedDoor = window.HC_TARGET_GRID_SECRET_DOOR;
    const savedRotors = window.HC_ASSEMBLY_ROTORS;
    const savedLobbyExit = window.HC_TARGET_GRID_LOBBY_EXIT;
    const tmpGroup = new THREE.Group();
    try {
      solids = [];
      mapGroup = tmpGroup;
      HALF = arenaH;
      GRADE_ON = false;
      G.hcGrindRails = [];
      G.jumpMats = [];
      window.HC_LASER_BEAMS = [];
      window.HC_TARGET_GRID_TARGETS = [];
      window.HC_TARGET_GRID_PADS = [];
      window.HC_ASSEMBLY_ROTORS = [];
      const recBox = (x, z, w, d, h, col, y0) => {
        const yBase = y0 || 0;
        // Skip full-arena ceiling slabs so interior layouts remain visible
        if (yBase > 7 && w > arenaH * 1.4 && d > arenaH * 1.4) return;
        shapes.push({
          kind: 'box',
          x: Number(x) || 0,
          z: Number(z) || 0,
          w: Math.max(0.3, Math.abs(w) || 1),
          d: Math.max(0.3, Math.abs(d) || 1),
          y0: yBase,
          y1: yBase + (Number(h) || 1),
          color: hcColorToCss(col, M.c && M.c[0]),
        });
      };
      const mockApi = {
        add(x, z, w, d, h, color, y0, op, extra) {
          recBox(x, z, w, d, h, color, y0);
          return Object.assign({ minx: x - w / 2, maxx: x + w / 2, miny: y0 || 0, maxy: (y0 || 0) + h, minz: z - d / 2, maxz: z + d / 2 }, extra || {});
        },
        addS(x, z, w, d, h, color, y0) {
          recBox(x, z, w, d, h, color, y0);
          recBox(-x, -z, w, d, h, color, y0);
        },
        stairs(bx, bz, dir, w, n, sh, sl, color, y0) {
          const v = { 'x+': [1, 0], 'x-': [-1, 0], 'z+': [0, 1], 'z-': [0, -1] }[dir] || [1, 0];
          for (let k = 0; k < n; k++) {
            recBox(bx + v[0] * (k + 0.5) * sl, bz + v[1] * (k + 0.5) * sl, v[0] !== 0 ? sl : w, v[0] !== 0 ? w : sl, (k + 1) * sh, color, y0);
          }
        },
        stairsS(bx, bz, dir, w, n, sh, sl, color, y0) {
          mockApi.stairs(bx, bz, dir, w, n, sh, sl, color, y0);
          if (typeof OPP === 'object' && OPP[dir]) mockApi.stairs(-bx, -bz, OPP[dir], w, n, sh, sl, color, y0);
        },
        grindRail(x1, y1, z1, x2, y2, z2, color) {
          rails.push({ x1, z1, x2, z2, color: hcColorToCss(color, '#5ec8ff') });
          return null;
        },
        deco(x, y, z, w, h, d, color) {
          recBox(x, z, w, d, h, color, y - h / 2);
        },
        part(geo, col, x, y, z, sx, sy, sz) {
          const me = new THREE.Mesh(unit, new THREE.MeshBasicMaterial());
          me.position.set(x || 0, y || 0, z || 0);
          me.scale.set(sx || 1, sy || 1, sz || 1);
          if ((y || 0) < 16) {
            shapes.push({
              kind: geo === sphG || geo === cylG || geo === coneG ? 'circ' : 'box',
              x: Number(x) || 0,
              z: Number(z) || 0,
              w: Math.max(0.25, Math.abs(sx) || 1),
              d: Math.max(0.25, Math.abs(sz) || 1),
              y0: (y || 0) - Math.abs(sy || 1) / 2,
              y1: (y || 0) + Math.abs(sy || 1) / 2,
              color: hcColorToCss(col, M.c && M.c[1]),
            });
          }
          return me;
        },
        cyl(x, y, z, r, h, color) {
          shapes.push({ kind: 'circ', x, z, w: r * 2, d: r * 2, y0: y - h / 2, y1: y + h / 2, color: hcColorToCss(color, '#63c7ff') });
        },
        cone(x, y, z, r, h, color) {
          shapes.push({ kind: 'circ', x, z, w: r * 2, d: r * 2, y0: y - h / 2, y1: y + h / 2, color: hcColorToCss(color, '#477b43') });
        },
        sph(x, y, z, r, col) {
          if ((y || 0) > 15) return;
          shapes.push({ kind: 'circ', x, z, w: r * 2, d: r * 2, y0: y - r, y1: y + r, color: hcColorToCss(col, '#758b68') });
        },
        neon(x, y, z, w, h, d, hex) {
          shapes.push({ kind: 'box', x, z, w: Math.max(0.28, w), d: Math.max(0.28, d), y0: y - h / 2, y1: y + h / 2, color: hcColorToCss(hex, '#25e6ff'), neon: true });
        },
        tree(x, z) {
          mockApi.cone(x, 3.8, z, 2.2, 3.6, '#2f6b4f');
        },
        col() {},
        reserve() {},
      };
      if (typeof extendApi === 'function') extendApi(mockApi, M, idx || 0);
      // Preserve our lightweight shape-capturing wrappers over extendApi helpers that mutate live solids/mesh
      const origAdd = mockApi.add;
      mockApi.add = (x, z, w, d, h, color, y0, op, extra) => origAdd(x, z, w, d, h, color, y0, op, extra);
      M.build(mockApi);
      if (Array.isArray(G.jumpMats)) {
        for (const jm of G.jumpMats) {
          if (jm && jm.pos) pads.push({ x: jm.pos.x, z: jm.pos.z, r: jm.radius || 2.2 });
        }
      }
      if (Array.isArray(window.HC_LASER_BEAMS)) {
        for (const lb of window.HC_LASER_BEAMS) {
          if (lb && lb.a && lb.b) lasers.push({ ax: lb.a.x, az: lb.a.z, bx: lb.b.x, bz: lb.b.z, color: lb.mat && lb.mat.color ? '#' + lb.mat.color.getHexString() : '#25e6ff' });
        }
      }
    } catch (e) {
    } finally {
      solids = savedSolids;
      mapGroup = savedMapGroup;
      HALF = savedHalf;
      GRADE_ON = savedGrade;
      G.hcGrindRails = savedRails;
      G.jumpMats = savedMats;
      window.HC_LASER_BEAMS = savedLasers;
      window.HC_TARGET_GRID_TARGETS = savedTargets;
      window.HC_TARGET_GRID_PADS = savedTgPads;
      window.HC_TARGET_GRID_SECRET = savedSecret;
      window.HC_TARGET_GRID_SECRET_DOOR = savedDoor;
      window.HC_ASSEMBLY_ROTORS = savedRotors;
      window.HC_TARGET_GRID_LOBBY_EXIT = savedLobbyExit;
      tmpGroup.traverse((o) => {
        if (o.material && o.material.dispose && o.material.map) o.material.map.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
    }

    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 144;
    const ctx = cv.getContext('2d');
    if (!ctx) return '';

    const bgGrad = ctx.createLinearGradient(0, 0, 0, cv.height);
    bgGrad.addColorStop(0, hcColorToCss(M.sky, '#162030'));
    bgGrad.addColorStop(1, hcColorToCss(M.floor, '#1b2432'));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cv.width, cv.height);

    const viewR = Math.min(Math.max(arenaH, 26), 54);
    const scale = Math.min((cv.width - 20) / (2 * viewR), (cv.height - 14) / (2 * viewR));
    const px = (x) => cv.width * 0.5 + x * scale;
    const pz = (z) => cv.height * 0.5 + z * scale;

    // Subtle floor tiles inside arena footprint
    const aw = arenaH * 2 * scale;
    ctx.fillStyle = hcColorToCss(M.floor, '#1f2938');
    ctx.fillRect(px(-arenaH), pz(-arenaH), aw, aw);
    ctx.strokeStyle = hcColorToCss(M.line, '#2c3a4f');
    ctx.lineWidth = 0.7;
    const step = Math.max(4, M.tile || 6);
    for (let g = -arenaH; g <= arenaH; g += step) {
      ctx.beginPath();
      ctx.moveTo(px(g), pz(-arenaH));
      ctx.lineTo(px(g), pz(arenaH));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px(-arenaH), pz(g));
      ctx.lineTo(px(arenaH), pz(g));
      ctx.stroke();
    }

    shapes.sort((a, b) => a.y1 - b.y1);
    for (const s of shapes) {
      if (Math.abs(s.x) > viewR + 22 && Math.abs(s.z) > viewR + 22) continue;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.neon ? s.color : 'rgba(6,10,18,0.42)';
      ctx.lineWidth = s.neon ? 1 : 0.75;
      if (s.kind === 'circ') {
        const rx = Math.max(1.5, (s.w * 0.5) * scale),
          rz = Math.max(1.5, (s.d * 0.5) * scale);
        ctx.beginPath();
        ctx.ellipse(px(s.x), pz(s.z), rx, rz, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        const rw = Math.max(1.4, s.w * scale),
          rd = Math.max(1.4, s.d * scale);
        ctx.fillRect(px(s.x) - rw * 0.5, pz(s.z) - rd * 0.5, rw, rd);
        ctx.strokeRect(px(s.x) - rw * 0.5, pz(s.z) - rd * 0.5, rw, rd);
      }
    }

    // Grind rails
    ctx.lineCap = 'round';
    for (const rl of rails) {
      ctx.strokeStyle = rl.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px(rl.x1), pz(rl.z1));
      ctx.lineTo(px(rl.x2), pz(rl.z2));
      ctx.stroke();
    }

    // Spring / jump pads
    for (const jp of pads) {
      const rr = Math.max(3, jp.r * scale);
      ctx.fillStyle = '#08131f';
      ctx.beginPath();
      ctx.arc(px(jp.x), pz(jp.z), rr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38d9ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Laser beams
    for (const lb of lasers) {
      ctx.strokeStyle = lb.color;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(px(lb.ax), pz(lb.az));
      ctx.lineTo(px(lb.bx), pz(lb.bz));
      ctx.stroke();
    }

    // Team spawn accents
    const sc = HC_MAP_SPAWN_CONFIGS[M.name];
    if (sc) {
      for (const p of sc.team0 || []) {
        ctx.fillStyle = '#39c6ff';
        ctx.beginPath();
        ctx.arc(px(p.x), pz(p.z), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of sc.team1 || []) {
        ctx.fillStyle = '#ff6d45';
        ctx.beginPath();
        ctx.arc(px(p.x), pz(p.z), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const url = cv.toDataURL('image/png');
    window.HC_MAP_THUMBS[M.name] = url;
    return url;
  }

  // Pin Featured Maps + Inject 2D Thumbnail Previews on every #mapCards button
  if (typeof renderMenu === 'function') {
    const hcExtPrevRenderMenu = renderMenu;
    renderMenu = function () {
      const res = hcExtPrevRenderMenu.apply(this, arguments);
      const host = $('mapCards');
      if (!host) return res;
      const cards = Array.from(host.querySelectorAll('button[data-map]'));
      const pinnedNames = [
        'Laser Arena',
        'Pool Party',
        'Overpass',
        'Redline Arena',
        'Violet Voltage',
        'Hypercore Arena',
        'Target Grid',
        'Assembly Plant',
        'Blockworks Arena',
      ];
      for (const btn of cards) {
        if (btn.querySelector('.hc-map-thumb')) continue;
        const idx = Number(btn.dataset.map);
        const wrap = document.createElement('span');
        wrap.className = 'hc-map-thumb';
        if (idx === -1) {
          const grid = document.createElement('span');
          grid.className = 'hc-map-thumb-grid';
          for (const mn of ['Laser Arena', 'Pool Party', 'Overpass', 'Redline Arena']) {
            const mi = MAPS.findIndex((m) => m && m.name === mn);
            const url = mi >= 0 ? hcBuildMapThumbnail(MAPS[mi], mi) : '';
            const img = document.createElement('img');
            img.alt = '';
            img.loading = 'lazy';
            if (url) img.src = url;
            grid.appendChild(img);
          }
          wrap.appendChild(grid);
        } else if (MAPS[idx]) {
          const url = hcBuildMapThumbnail(MAPS[idx], idx);
          const img = document.createElement('img');
          img.alt = MAPS[idx].name + ' 2D layout';
          img.loading = 'lazy';
          if (url) img.src = url;
          wrap.appendChild(img);
        }
        btn.prepend(wrap);
      }

      const nameOf = (btn) => {
        const idx = Number(btn.dataset.map);
        return idx === -1 ? 'Random map' : (MAPS[idx] && MAPS[idx].name) || '';
      };
      const random = cards.find((b) => b.dataset.map === '-1');
      const byName = new Map(cards.map((b) => [nameOf(b), b]));
      const featured = pinnedNames.map((n) => byName.get(n)).filter(Boolean);
      if (!featured.length) return res;
      const featSet = new Set(featured);
      const rest = cards.filter((b) => b !== random && !featSet.has(b));
      const mkLabel = (t) => {
        const el = document.createElement('div');
        el.className = 'hcMapSectionLabel';
        el.textContent = t;
        return el;
      };
      host.replaceChildren();
      if (random) host.appendChild(random);
      host.appendChild(mkLabel('NEW & FEATURED MAPS · SELECT TO PLAY'));
      featured.forEach((b) => host.appendChild(b));
      if (rest.length) {
        host.appendChild(mkLabel('ALL OTHER MAPS'));
        rest.forEach((b) => host.appendChild(b));
      }
      return res;
    };
    try {
      renderMenu();
    } catch (e) {}
  }

  if (window.HC_MAP_REGISTRATION_STATUS) {
    window.HC_MAP_REGISTRATION_STATUS.laserArena = MAPS.some(
      (m) => m && m.name === 'Laser Arena' && !m.special
    );
    window.HC_MAP_REGISTRATION_STATUS.poolParty = MAPS.some(
      (m) => m && m.name === 'Pool Party' && !m.special
    );
    window.HC_MAP_REGISTRATION_STATUS.visibleMapNames =
      typeof visibleMaps === 'function' ? visibleMaps().map((x) => x.m.name) : [];
  }

  /* -------------------------------------------------------------------------
   * 7. BETTER ANIMATIONS — DISTANCE-DRIVEN STRIDE, LEAN, PITCH, RECOIL & VM SWAY
   * ------------------------------------------------------------------------- */
  function hcAnimateRigLocomotion(vis, speedXZ, velY, pitch, dt, opts) {
    if (!vis || !vis.legL || !vis.legR) return;
    const isMoving = speedXZ > 0.35;
    const targetAmp = isMoving ? clamp(speedXZ / 7.5, 0.18, 1.0) : 0;
    vis.hcStrideAmp = (vis.hcStrideAmp || 0) + (targetAmp - (vis.hcStrideAmp || 0)) * Math.min(1, dt * 13);
    vis.hcStridePhase = (vis.hcStridePhase || 0) + (isMoving ? speedXZ * dt * 1.48 : 0);
    vis.hcIdlePhase = (vis.hcIdlePhase || Math.random() * 6.28) + dt * 2.1;

    const amp = vis.hcStrideAmp;
    const swing = Math.sin(vis.hcStridePhase) * 0.72 * amp;
    const breath = (1 - amp) * Math.sin(vis.hcIdlePhase) * 0.032;

    if (typeof legAnim === 'function' && !(opts && opts.skipLegs)) {
      legAnim(vis, swing, -swing);
    }

    if (vis.torso && !(opts && opts.skipTorso)) {
      const leanBase = opts && Number.isFinite(opts.baseLean) ? opts.baseLean : 0;
      const runLean = -0.095 * amp;
      vis.torso.rotation.x = leanBase + runLean + breath * 0.45;
      vis.torso.rotation.y = Math.cos(vis.hcStridePhase) * 0.075 * amp;
    }

    if (vis.pr && vis.pr.head && !(vis.hcRefParts && vis.hcRefParts.length)) {
      vis.pr.head.rotation.x = clamp((pitch || 0) * 0.52, -0.4, 0.4);
    }

    // Decaying third-person firing recoil
    if (opts && opts.fired) {
      vis.hcTpRecoil = 1.0;
    }
    vis.hcTpRecoil = Math.max(0, (vis.hcTpRecoil || 0) - dt * 6.8);
    if (vis.hcTpRecoil > 0.001 && vis.gunG) {
      const rk = vis.hcTpRecoil;
      vis.gunG.position.z = -0.5 + rk * 0.085;
      vis.gunG.rotation.x += rk * 0.14;
      if (vis.armL && vis.armR) {
        vis.armL.rotation.x += rk * 0.12;
        vis.armR.rotation.x += rk * 0.14;
      }
    } else if (vis.gunG) {
      vis.gunG.position.z = -0.5;
    }

    // Subtle arm idle breathing when arms are down in lobby
    if (opts && opts.idleArms && vis.armL && vis.armR && !isMoving) {
      vis.armL.rotation.z = -0.04 - breath * 0.6;
      vis.armR.rotation.z = 0.04 + breath * 0.6;
    }
  }

  if (typeof updateSelf === 'function') {
    const hcAnimPrevUpdateSelf = updateSelf;
    updateSelf = function (dt) {
      hcAnimPrevUpdateSelf(dt);
      if (!selfVis || P.hp <= 0) return;
      const speedXZ = Math.hypot(P.vel.x, P.vel.z);
      const slide = clamp(selfVis.slidePose || 0, 0, 1);
      const crouch = clamp(selfVis.crouchPose || 0, 0, 1);
      const baseLean =
        -0.38 * slide -
        0.12 * crouch +
        (G.state === 'lobby' && G.lobbyEmote && G.lobbyEmote.id === 'bow' ? 0.48 : 0);
      hcAnimateRigLocomotion(selfVis, speedXZ, P.vel.y, P.pitch, dt, {
        skipLegs: slide > 0.05 || crouch > 0.05 || !!(G.state === 'lobby' && G.lobbyEmote),
        skipTorso: !!(G.state === 'lobby' && G.lobbyEmote),
        baseLean,
        idleArms: G.state === 'lobby' && !G.lobbyEmote,
      });
    };
  }

  if (typeof updateBot === 'function') {
    const hcAnimPrevUpdateBot = updateBot;
    updateBot = function (b, dt, live) {
      hcAnimPrevUpdateBot(b, dt, live);
      if (!b || !b.alive || b.dummy || !b.vis) return;
      const speedXZ = Math.hypot(b.vel.x, b.vel.z);
      hcAnimateRigLocomotion(b.vis, speedXZ, b.vel.y, b.pitch || 0, dt, {
        fired: !!b.fired,
      });
    };
  }

  if (typeof lobbyNpc === 'function') {
    const hcAnimPrevLobbyNpc = lobbyNpc;
    lobbyNpc = function () {
      hcAnimPrevLobbyNpc();
      const t = performance.now() * 0.001;
      for (let i = 0; i < ACT.length; i++) {
        const b = ACT[i];
        if (!b || !b.vis) continue;
        if (i < NPCS.length) {
          const breath = Math.sin(t * 2.1 + i * 0.9) * 0.025;
          if (b.vis.torso) b.vis.torso.rotation.y += breath * 0.35;
          if (NPCS[i].id === 'riley' && !(b.vis.userData && b.vis.userData.hcIsSjedits)) {
            hcApplySJEditsAvatar(b.vis);
          }
          if (NPCS[i].id === 'reallyflux' && !(b.vis.userData && b.vis.userData.hcIsReallyFlux)) {
            b.vis.userData = b.vis.userData || {};
            b.vis.userData.hcIsReallyFlux = true;
            if (typeof hcApplyDarkAvatar === 'function') hcApplyDarkAvatar(b.vis, true);
          }
        }
      }
    };
  }

  // Enhanced first-person viewmodel breath + look inertia + Target Grid secret portal trigger + Laser pulse
  let hcLookVelX = 0,
    hcLookVelY = 0;
  window.addEventListener(
    'mousemove',
    (e) => {
      if (!inMatch() || !locked || !Number.isFinite(e.movementX)) return;
      hcLookVelX = clamp(hcLookVelX + e.movementX * 0.00018, -0.075, 0.075);
      hcLookVelY = clamp(hcLookVelY + e.movementY * 0.00016, -0.06, 0.06);
    },
    { passive: true }
  );

  if (typeof render === 'function') {
    const hcExtPrevRender = render;
    render = function (dt) {
      const safeDt = Math.max(0, Math.min(0.06, Number(dt) || 0));

      // Check Target Grid secret portal walkthrough -> 'X' starts CritHits 1v1, '+' starts Boss Battle (BLOXWAFFLES)
      try {
        const curMap = MAPS[G.mapIdx];
        const door = window.HC_TARGET_GRID_SECRET_DOOR;
        if (
          G.practice &&
          G.state === 'live' &&
          curMap &&
          curMap.name === 'Target Grid' &&
          P &&
          P.hcTargetGridAccess &&
          door &&
          door.opened &&
          !door.triggered
        ) {
          if (Math.abs(P.pos.x) < 1.85 && P.pos.z >= 3.2 && P.pos.z <= 6.3 && P.pos.y < 3.2) {
            door.triggered = true;
            const sym =
              door.symbol ||
              (window.HC_TARGET_GRID_SECRET && window.HC_TARGET_GRID_SECRET.symbol) ||
              '+';
            if (sym === 'X') {
              if (window.HCMatchChat) {
                window.HCMatchChat.addLine(
                  'SYSTEM',
                  'Entering Secret 1v1: CRITHITS · CritHits Sanctum',
                  'system'
                );
              }
              const goCrit =
                typeof window.hcStartCritHits === 'function'
                  ? window.hcStartCritHits
                  : typeof startCritHits === 'function'
                    ? startCritHits
                    : null;
              if (goCrit) goCrit();
            } else {
              if (window.HCMatchChat) {
                window.HCMatchChat.addLine(
                  'SYSTEM',
                  'Entering Boss Battle: BLOXWAFFLES · Overlord Citadel',
                  'system'
                );
              }
              const goBoss =
                typeof window.hcStartBloxwaffles === 'function'
                  ? window.hcStartBloxwaffles
                  : typeof startBloxwaffles === 'function'
                    ? startBloxwaffles
                    : null;
              if (goBoss) goBoss();
            }
          }
        }
      } catch (e) {}

      // Animate Laser Arena neon beams + GLSL Water & Portal Shaders + 25-Movement Traversal
      if (window.HC_LASER_BEAMS && window.HC_LASER_BEAMS.length) {
        const tNow = G.t || performance.now() * 0.001;
        for (const l of window.HC_LASER_BEAMS) {
          if (l && l.mat) l.mat.opacity = 0.84 + 0.14 * Math.sin(tNow * 3.4 + l.phase);
        }
      }
      if (window.HC_WATER_SHADER_MAT && window.HC_WATER_SHADER_MAT.uniforms) {
        window.HC_WATER_SHADER_MAT.uniforms.uTime.value = (G && G.t) || performance.now() * 0.001;
      }
      if (Array.isArray(window.HC_PORTAL_SHADERS)) {
        const pt = (G && G.t) || performance.now() * 0.001;
        for (const ps of window.HC_PORTAL_SHADERS) {
          if (ps && ps.uniforms && ps.uniforms.uTime) ps.uniforms.uTime.value = pt;
        }
      }
      if (typeof window.hcTickAdvancedMovement === 'function') {
        window.hcTickAdvancedMovement(safeDt);
      }

      hcExtPrevRender(safeDt);

      // Viewmodel smooth breathing + mouse inertia sway
      if (vm && vm.visible && G.state === 'live' && P.hp > 0) {
        hcLookVelX *= Math.exp(-safeDt * 10);
        hcLookVelY *= Math.exp(-safeDt * 10);
        const idleBreathX = Math.sin(G.t * 1.85) * 0.0038;
        const idleBreathY = Math.cos(G.t * 3.7) * 0.0028;
        vm.position.x += idleBreathX - hcLookVelX * 0.35;
        vm.position.y += idleBreathY + hcLookVelY * 0.28;
        vm.rotation.y -= hcLookVelX * 0.7;
        vm.rotation.x -= hcLookVelY * 0.6;
        if (vmGun && vmGun.userData && vmGun.userData.portalCore) {
          vmGun.userData.portalCore.rotation.z += safeDt * 2.6;
          if (vmGun.userData.portalOrb) {
            const pScale = 1 + 0.14 * Math.sin(G.t * 6.0);
            vmGun.userData.portalOrb.scale.setScalar(pScale);
          }
        }
      }
    };
  }

  /* -------------------------------------------------------------------------
   * 8. UPPER-LEFT CHAT SYSTEM (#hcMatchChat) — LOBBY + MATCH, QUICK CHAT, COLLAPSE
   * ------------------------------------------------------------------------- */
  (function upgradeUpperLeftChat() {
    const root = document.getElementById('hcMatchChat');
    const log = document.getElementById('hcMatchChatLog');
    const input = document.getElementById('hcMatchChatInput');
    const composer = document.getElementById('hcMatchChatComposer');
    if (!root || !log || !input) return;

    // Replace earlier match-only chat wrapper cleanly with unified upper-left lobby+match chat
    let opened = false;
    let collapsed = false;
    const isLobbyOrMatch = () => {
      if (typeof G === 'undefined') return false;
      if (document.querySelector('.overlay:not(.hidden)')) return false;
      if (G.state === 'lobby') return true;
      const hud = document.getElementById('hud');
      return !!(hud && !hud.classList.contains('hidden')) || (typeof inMatch === 'function' && inMatch());
    };

    const syncVisibility = () => {
      const show = isLobbyOrMatch();
      root.style.display = show ? 'block' : 'none';
      const badge = document.getElementById('hcChatChannelBadge');
      if (badge) {
        badge.textContent = typeof G !== 'undefined' && G.state === 'lobby' ? 'LOBBY' : 'MATCH';
      }
    };

    const formatSenderKind = (name, kind) => {
      if (kind) return kind;
      const low = String(name || '').trim().toLowerCase();
      if (low === 'system' || low === 'server') return 'system';
      const me = String((typeof P !== 'undefined' && P && P.name) || 'You').toLowerCase();
      if (low === 'you' || low === me) return 'you';
      return 'bot';
    };

    function addLine(name, text, kind) {
      const row = document.createElement('div');
      row.className = 'hcMatchChatLine hcChat-' + formatSenderKind(name, kind);
      const b = document.createElement('b');
      b.textContent = String(name || 'Player') + ': ';
      const span = document.createElement('span');
      span.textContent = String(text || '');
      row.append(b, span);
      log.appendChild(row);
      while (log.children.length > 24) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }

    function open() {
      if (collapsed) toggleCollapse(false);
      opened = true;
      root.classList.add('open');
      if (composer) composer.style.display = 'flex';
      input.value = '';
      setTimeout(() => input.focus(), 0);
    }

    function close() {
      opened = false;
      root.classList.remove('open');
      if (composer) composer.style.display = 'none';
      input.blur();
    }

    function toggleCollapse(force) {
      collapsed = typeof force === 'boolean' ? force : !collapsed;
      root.classList.toggle('collapsed', collapsed);
      const btn = document.getElementById('hcChatCollapseBtn');
      if (btn) btn.textContent = collapsed ? '+' : '−';
      if (collapsed && opened) close();
    }

    function send() {
      const msg = String(input.value || '').trim();
      if (!msg) {
        close();
        return;
      }
      const api = window.HCOnlineRooms;
      let sentOnline = false;
      try {
        sentOnline = !!(api && api.room && api.sendChat && api.sendChat(msg));
      } catch (e) {}
      if (!sentOnline) {
        const myName = typeof P !== 'undefined' && P && P.name && P.name !== 'You' ? P.name : 'You';
        addLine(myName, msg, 'you');
        if (window.HCChatBotReply) window.HCChatBotReply(msg);
      }
      input.value = '';
      close();
    }

    // Quick-reply bot chatter
    window.HCChatBotReply = function (msg) {
      if (!window.HCMatchChat) return;
      const lower = String(msg || '').toLowerCase();
      const names = ['sjedits', 'CritHits', 'BloxWaffles', 'Vex', 'Nova'];
      const who = names[Math.floor(Math.random() * names.length)];
      let reply = 'gg gl hf!';
      if (/hi|hello|hey|yo/.test(lower)) reply = 'Hey! Ready for the next arena?';
      else if (/target|portal|boss|secret/.test(lower)) reply = 'Break 10 matching symbols (X, +, -, O) in Target Grid to reveal the boss portal!';
      else if (/laser|redline/.test(lower)) reply = 'Keep your eyes on the high ground ramps!';
      else if (Math.random() > 0.6) return;
      setTimeout(() => {
        if (window.HCMatchChat) window.HCMatchChat.addLine(who, reply, 'bot');
      }, 650 + Math.random() * 850);
    };

    // Build Quick Chat grid cleanly inside #hcMatchChat (Lobby + Match)
    const QC = [
      'Nice shot!',
      'Behind you!',
      'Need backup',
      'Going for the hill',
      'Hunt is on',
      'Good game',
      'Your move',
      'GG',
    ];
    let qcBar = document.getElementById('hcQuickChat');
    if (!qcBar) {
      qcBar = document.createElement('div');
      qcBar.id = 'hcQuickChat';
      qcBar.setAttribute('aria-label', 'Quick chat');
      const qcHead = document.createElement('div');
      qcHead.className = 'hcQcHead';
      qcHead.textContent = 'QUICK CHAT · PRESS 1-8 · G CLOSES';
      const qcGrid = document.createElement('div');
      qcGrid.className = 'hcQcGrid';
      QC.forEach((txt, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hcQcBtn';
        const k = document.createElement('kbd');
        k.textContent = String(idx + 1);
        b.appendChild(k);
        b.appendChild(document.createTextNode(txt));
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          sendQuick(idx);
        });
        qcGrid.appendChild(b);
      });
      qcBar.appendChild(qcHead);
      qcBar.appendChild(qcGrid);
      root.appendChild(qcBar);
    }

    let qcOpened = false;
    function setQuickOpen(v) {
      qcOpened = !!v;
      qcBar.classList.toggle('open', qcOpened);
    }
    function sendQuick(idx) {
      const msg = QC[idx];
      if (!msg) return;
      const api = window.HCOnlineRooms;
      let sentOnline = false;
      try {
        sentOnline = !!(api && api.room && api.sendChat && api.sendChat(msg));
      } catch (e) {}
      if (!sentOnline) {
        const myName = typeof P !== 'undefined' && P && P.name && P.name !== 'You' ? P.name : 'You';
        addLine(myName, msg, 'you');
        if (window.HCChatBotReply) window.HCChatBotReply(msg);
      }
      setQuickOpen(false);
    }

    // Wire header buttons
    const typeBtn = document.getElementById('hcChatTypeBtn');
    const quickBtn = document.getElementById('hcChatQuickBtn');
    const collapseBtn = document.getElementById('hcChatCollapseBtn');
    const sendBtn = document.getElementById('hcChatSendBtn');
    if (typeBtn) {
      typeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (opened) close();
        else {
          setQuickOpen(false);
          open();
        }
      };
    }
    if (quickBtn) {
      quickBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (collapsed) toggleCollapse(false);
        setQuickOpen(!qcOpened);
      };
    }
    if (collapseBtn) {
      collapseBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setQuickOpen(false);
        toggleCollapse();
      };
    }
    if (sendBtn) {
      sendBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        send();
      };
    }

    // Unified capture listener for Enter / G / 1-8 / Escape
    window.addEventListener(
      'keydown',
      function (e) {
        if (!isLobbyOrMatch()) return;

        const active = document.activeElement;
        const isTypingElsewhere =
          active && active !== input && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);

        if (opened) {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopImmediatePropagation();
            send();
            return;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopImmediatePropagation();
            close();
            return;
          }
          if (e.target === input || document.activeElement === input) {
            e.stopPropagation();
          }
          return;
        }

        if (qcOpened) {
          if (e.key === 'Escape' || e.code === 'KeyG') {
            e.preventDefault();
            e.stopImmediatePropagation();
            setQuickOpen(false);
            return;
          }
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= QC.length) {
            e.preventDefault();
            e.stopImmediatePropagation();
            sendQuick(num - 1);
            return;
          }
        }

        if (isTypingElsewhere) return;
        const openOverlay = document.querySelector('.overlay:not(.hidden)');
        if (openOverlay) return;

        if (e.code === 'KeyG' && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (collapsed) toggleCollapse(false);
          setQuickOpen(!qcOpened);
          return;
        }

        if (e.key === 'Enter' && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          setQuickOpen(false);
          open();
        }
      },
      true
    );

    window.HCMatchChat = {
      addLine,
      open,
      close,
      toggleCollapse,
      send,
      get opened() {
        return opened;
      },
    };

    // Welcome message
    if (!log.children.length) {
      addLine('SYSTEM', 'Chat ready in upper-left · Press Enter to type or G for quick chat.', 'system');
    }

    // Log map & match events into upper-left chat
    if (typeof startMatch === 'function') {
      const chatBaseStartMatch = startMatch;
      startMatch = function () {
        const res = chatBaseStartMatch.apply(this, arguments);
        try {
          const cur = MAPS[G.mapIdx];
          if (cur && window.HCMatchChat) {
            window.HCMatchChat.addLine(
              'SYSTEM',
              'Joined ' + cur.name + ' (' + String(cfg.mode || 'match').toUpperCase() + ').',
              'system'
            );
          }
        } catch (e) {}
        syncVisibility();
        return res;
      };
    }

    setInterval(syncVisibility, 250);
    syncVisibility();
  })();

  /* -------------------------------------------------------------------------
   * 9. DETERMINISTIC INSPECTION & URL QUERY PARAM ROUTING
   * ------------------------------------------------------------------------- */
  window.__hcInspect = function () {
    const cur = typeof MAPS !== 'undefined' && G ? MAPS[G.mapIdx] : null;
    const door = window.HC_TARGET_GRID_SECRET_DOOR || null;
    const sj =
      typeof ACT !== 'undefined' && Array.isArray(NPCS)
        ? ACT[NPCS.findIndex((n) => n && n.id === 'riley')]
        : null;
    return {
      state: typeof G !== 'undefined' ? G.state : null,
      mode: typeof G !== 'undefined' ? G.am || (cfg && cfg.mode) : null,
      mapName: cur ? cur.name : null,
      half: typeof HALF !== 'undefined' ? HALF : null,
      bossName: typeof G !== 'undefined' ? G.adminBossName || null : null,
      jumpMats: typeof G !== 'undefined' && Array.isArray(G.jumpMats) ? G.jumpMats.length : 0,
      grindRails: typeof G !== 'undefined' && Array.isArray(G.hcGrindRails) ? G.hcGrindRails.length : 0,
      laserBeams: Array.isArray(window.HC_LASER_BEAMS) ? window.HC_LASER_BEAMS.length : 0,
      doubleTrouble: typeof G !== 'undefined' ? !!G.doubleTrouble : false,
      slotsLen: typeof P !== 'undefined' && P && Array.isArray(P.slots) ? P.slots.length : 0,
      cur: typeof P !== 'undefined' && P ? P.cur : 0,
      offCur: typeof P !== 'undefined' && P ? P.offCur : null,
      vmOffVisible: typeof vmOff !== 'undefined' && vmOff ? !!vmOff.visible : false,
      sliding: typeof P !== 'undefined' && P ? !!P.sliding : false,
      hp: typeof P !== 'undefined' && P ? P.hp : null,
      playerPos:
        typeof P !== 'undefined' && P && P.pos
          ? { x: Number(P.pos.x.toFixed(2)), y: Number(P.pos.y.toFixed(2)), z: Number(P.pos.z.toFixed(2)) }
          : null,
      playerVel:
        typeof P !== 'undefined' && P && P.vel
          ? { x: Number(P.vel.x.toFixed(2)), y: Number(P.vel.y.toFixed(2)), z: Number(P.vel.z.toFixed(2)) }
          : null,
      targetDoor: door
        ? {
            opened: !!door.opened,
            triggered: !!door.triggered,
            doorVisible: !!((door.group || door.door) && (door.group || door.door).visible),
            maskVisible: !!(door.mask && door.mask.visible),
            symbol: door.symbol || null,
          }
        : null,
      sjeditsNpc:
        sj && sj.vis && sj.vis.pr
          ? {
              pos: sj.pos ? { x: sj.pos.x, y: sj.pos.y, z: sj.pos.z } : null,
              eyeLVisible: !!sj.vis.pr.eyeL.visible,
              eyeRVisible: !!sj.vis.pr.eyeR.visible,
              mouthVisible: !!sj.vis.pr.mouth.visible,
            }
          : null,
    };
  };

  /* -------------------------------------------------------------------------
   * 9. 25-SYSTEM MOVEMENT SUITE + WEB-SWING + TELEPORTS/LIFTS + #hcMoveDock
   * ------------------------------------------------------------------------- */
  let hcWebSwing = null;
  let hcSurfacePresetIdx = 0;
  let hcManualFootSide = 0;
  let hcTeleportCd = 0;
  const HC_SURFACE_MODES = ['auto', 'bouncy', 'slippery', 'sticky'];

  function hcClearWebSwing() {
    if (!hcWebSwing) return;
    if (hcWebSwing.line && hcWebSwing.line.parent) hcWebSwing.line.parent.remove(hcWebSwing.line);
    if (hcWebSwing.line && hcWebSwing.line.geometry) hcWebSwing.line.geometry.dispose();
    if (hcWebSwing.line && hcWebSwing.line.material) hcWebSwing.line.material.dispose();
    hcWebSwing = null;
  }

  function hcTriggerWebSwing() {
    if (typeof P === 'undefined' || P.hp <= 0) return false;
    if (hcWebSwing) {
      // Slingshot release off pendulum arc
      const fwX = -Math.sin(P.yaw), fwZ = -Math.cos(P.yaw);
      P.vel.x += fwX * 7.5;
      P.vel.z += fwZ * 7.5;
      P.vel.y = Math.max(P.vel.y + 5.5, 11.2);
      P.airDashes = P.maxAirDashes || 1;
      hcClearWebSwing();
      if (typeof hcAwardStyle === 'function') hcAwardStyle('WEB SLINGSHOT', 0.35);
      if (typeof showToast === 'function') showToast('WEB-SWING · SLINGSHOT LAUNCH');
      return true;
    }
    const fwX = -Math.sin(P.yaw), fwZ = -Math.cos(P.yaw);
    const origin = new THREE.Vector3(P.pos.x, P.pos.y + 1.5, P.pos.z);
    const rayDir = new THREE.Vector3(fwX * 0.72, 0.7, fwZ * 0.72).normalize();
    let anchor = null;
    if (typeof rayWorldSurface === 'function') {
      const hit = rayWorldSurface(origin, rayDir, 38);
      if (hit && hit.point && hit.point.y > P.pos.y + 3.2) anchor = hit.point.clone();
    }
    if (!anchor) {
      anchor = new THREE.Vector3(P.pos.x + fwX * 14, P.pos.y + 13.5, P.pos.z + fwZ * 14);
    }
    const geo = new THREE.BufferGeometry().setFromPoints([origin, anchor]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe6fbff }));
    line.frustumCulled = false;
    if (typeof scene !== 'undefined') scene.add(line);
    const ropeLen = Math.max(4.5, Math.min(20, origin.distanceTo(anchor) * 0.92));
    hcWebSwing = { anchor, line, ropeLen, t: 0 };
    P.onGround = false;
    P.vel.y = Math.max(P.vel.y, 4.5);
    if (typeof hcAwardStyle === 'function') hcAwardStyle('WEB SWING', 0.3);
    if (typeof showToast === 'function') showToast('WEB-SWING ATTACHED · click or Space to slingshot');
    return true;
  }

  function hcSpawnSurfacePad(kind) {
    if (typeof P === 'undefined' || !mapGroup || typeof G !== 'object') return;
    G.hcCustomSurfaces = G.hcCustomSurfaces || [];
    const col = kind === 'bouncy' ? 0x35ff8a : kind === 'slippery' ? 0x4de6ff : 0xffb838;
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.08, 24),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.72 })
    );
    disc.position.set(P.pos.x, P.pos.y + 0.04, P.pos.z);
    mapGroup.add(disc);
    G.hcCustomSurfaces.push({
      x: P.pos.x,
      y: P.pos.y,
      z: P.pos.z,
      r: 3.1,
      kind,
      until: (G.t || 0) + 18,
      mesh: disc,
    });
  }

  const HC_MOVEMENT_LIST = [
    { id: 'walljump', label: '1 · Wall Jump', key: 'Space' },
    { id: 'airdash', label: '2 · Air Dash', key: 'Shift' },
    { id: 'coyote', label: '3 · Coyote + Buffer', key: 'Space' },
    { id: 'pogo', label: '4 · Pogo Bounce', key: 'DownHit' },
    { id: 'precision', label: '5 · Precision Leap', key: 'Alt' },
    { id: 'manualfoot', label: '6 · Manual Foot L/R', key: '[/]' },
    { id: 'wallrun', label: '7 · Wall-Run', key: 'Air+W' },
    { id: 'slidehop', label: '8 · Slide-Hop', key: 'C+Space' },
    { id: 'diveslide', label: '9 · Dive-Slide', key: 'V' },
    { id: 'mantle', label: '10 · Mantle Vault', key: 'W+Ledge' },
    { id: 'railgrind', label: '11 · Rail Grind', key: 'Rail' },
    { id: 'slopesurf', label: '12 · Slope Surf', key: 'C' },
    { id: 'webswing', label: '13 · Web-Swing', key: 'X' },
    { id: 'grapple', label: '14 · Grapple Slingshot', key: 'F' },
    { id: 'wingsuit', label: '15 · Wingsuit', key: 'Air' },
    { id: 'parachute', label: '16 · Parachute', key: 'Air' },
    { id: 'capeglide', label: '17 · Cape Swoop', key: 'Pitch' },
    { id: 'jetpack', label: '18 · Jetpack', key: 'Hold Space' },
    { id: 'ziplaunch', label: '19 · Zip / Launch Pad', key: 'Pad' },
    { id: 'groundboost', label: '20 · Ground-Shot Boost', key: 'AimDn' },
    { id: 'surfacemod', label: '21 · Surface Mod', key: 'B/I/S' },
    { id: 'hover', label: '22 · Hover Mode', key: 'Float' },
    { id: 'dodgeroll', label: '23 · Dodge Roll', key: 'R-Roll' },
    { id: 'combatdash', label: '24 · Style + Combat Dash', key: '+32%' },
    { id: 'teleportlift', label: '25 · Teleport / Lift', key: 'Warp' },
  ];

  function hcRunMovementAction(id) {
    if (typeof P === 'undefined' || P.hp <= 0) return;
    const fwX = -Math.sin(P.yaw), fwZ = -Math.cos(P.yaw);
    const rtX = Math.cos(P.yaw), rtZ = -Math.sin(P.yaw);
    switch (id) {
      case 'walljump':
        P.vel.y = Math.max(P.vel.y, (JUMP || 9.2) * 1.15);
        P.vel.x += fwX * 6.5; P.vel.z += fwZ * 6.5; P.onGround = false; P.airDashes = P.maxAirDashes || 1;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('WALL JUMP', 0.3);
        break;
      case 'airdash':
        P.vel.x = fwX * 18.5; P.vel.z = fwZ * 18.5; P.vel.y = Math.max(P.vel.y, 4.2); P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('AIR DASH', 0.28);
        break;
      case 'coyote':
        P.jumpBufT = 0.2; P.coyoteT = 0.2; P.vel.y = Math.max(P.vel.y, (JUMP || 9.2) * 1.05); P.onGround = false;
        if (typeof showToast === 'function') showToast('COYOTE + JUMP BUFFER ACTIVE');
        break;
      case 'pogo':
        P.vel.y = Math.max(P.vel.y, 13.8); P.airDashes = P.maxAirDashes || 1; P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('POGO BOUNCE', 0.35);
        break;
      case 'precision':
        P.vel.y = (JUMP || 9.2) * 1.55; P.vel.x = fwX * 12.5; P.vel.z = fwZ * 12.5; P.precLockVel = { x: P.vel.x, z: P.vel.z }; P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('PRECISION LEAP', 0.3);
        break;
      case 'manualfoot':
        hcManualFootSide = hcManualFootSide <= 0 ? 1 : -1;
        P.vel.x += fwX * 6.8 + rtX * (hcManualFootSide * 2.6);
        P.vel.z += fwZ * 6.8 + rtZ * (hcManualFootSide * 2.6);
        P.vel.y = Math.max(P.vel.y, 4.2);
        if (typeof showToast === 'function') showToast(hcManualFootSide < 0 ? 'MANUAL FOOT · LEFT STEP' : 'MANUAL FOOT · RIGHT STEP');
        break;
      case 'wallrun':
        P.wallRunSide = 1; P.vel.x = fwX * 14.5; P.vel.z = fwZ * 14.5; P.vel.y = Math.max(P.vel.y, 3.2); P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('WALL-RUN SURGE', 0.3);
        break;
      case 'slidehop':
        P.sliding = false; P.vel.x = fwX * 15.2; P.vel.z = fwZ * 15.2; P.vel.y = Math.max(P.vel.y, (JUMP || 9.2) * 1.1); P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('SLIDE-HOP', 0.3);
        break;
      case 'diveslide':
        P.diving = true; P.vel.x = fwX * 14.2; P.vel.z = fwZ * 14.2; P.vel.y = P.onGround ? 5.2 : Math.min(P.vel.y, -9.5); P.onGround = false;
        if (typeof showToast === 'function') showToast('DIVE-TO-SLIDE · land to convert to super-slide');
        break;
      case 'mantle':
        P.pos.y += 1.45; P.pos.x += fwX * 0.7; P.pos.z += fwZ * 0.7; P.vel.y = Math.max(P.vel.y, 5.2);
        if (typeof hcAwardStyle === 'function') hcAwardStyle('PARKOUR MANTLE', 0.25);
        break;
      case 'railgrind':
        if (G.hcGrindRails && G.hcGrindRails.length) {
          const r = G.hcGrindRails[0];
          const mid = r.a.clone().add(r.b).multiplyScalar(0.5);
          P.pos.set(mid.x, mid.y + 0.15, mid.z); P.railRide = { rail: r, t: 0.5, dir: 1, sp: 16 };
        } else {
          P.vel.x = fwX * 16.5; P.vel.z = fwZ * 16.5;
        }
        if (typeof hcAwardStyle === 'function') hcAwardStyle('RAIL GRIND', 0.35);
        break;
      case 'slopesurf':
        P.sliding = true; P.slideT = 1.05; P.slideSpd = 15.5; P.slideDirX = fwX; P.slideDirZ = fwZ; P.groundSurface = 'slippery';
        if (typeof hcAwardStyle === 'function') hcAwardStyle('SLOPE SURF', 0.25);
        break;
      case 'webswing':
        hcTriggerWebSwing();
        break;
      case 'grapple':
        if (typeof useGrapplingHook === 'function') {
          const prevPitch = P.pitch;
          if (Math.abs(P.pitch) < 0.05) P.pitch = 0.28;
          useGrapplingHook({ grapplePower: 1.2 }, true);
          P.pitch = prevPitch;
        }
        break;
      case 'wingsuit':
        P.gliding = !P.gliding; P.gliderBoost = P.gliding; P.gliderBrake = false;
        if (P.gliding && P.onGround) { P.pos.y += 1.2; P.vel.y = 8.5; P.vel.x += fwX * 11; P.vel.z += fwZ * 11; P.onGround = false; }
        if (typeof showToast === 'function') showToast(P.gliding ? 'WINGSUIT DEPLOYED' : 'WINGSUIT STOWED');
        break;
      case 'parachute':
        P.gliding = !P.gliding; P.gliderBrake = P.gliding; P.gliderBoost = false;
        if (P.gliding && P.onGround) { P.pos.y += 1.2; P.vel.y = 6.5; P.onGround = false; }
        if (typeof showToast === 'function') showToast(P.gliding ? 'PARACHUTE BRAKE OPEN' : 'PARACHUTE RELEASED');
        break;
      case 'capeglide':
        P.gliding = true; P.gliderBoost = true; P.gliderBrake = false;
        if (P.onGround) { P.pos.y += 1.4; P.vel.y = 10.2; P.onGround = false; }
        P.vel.x += fwX * 14.5; P.vel.z += fwZ * 14.5;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('CAPE DIVE-SWOOP', 0.3);
        break;
      case 'jetpack':
        P.vel.y = Math.max(P.vel.y + 9.2, 12.2); P.onGround = false;
        if (typeof burst === 'function') burst(new THREE.Vector3(P.pos.x, P.pos.y + 0.15, P.pos.z), 'fire', 12, 3.2, 0.08, 0.28, 1);
        if (typeof hcAwardStyle === 'function') hcAwardStyle('JETPACK THRUST', 0.25);
        break;
      case 'ziplaunch':
        if (G.jumpMats && G.jumpMats.length) {
          const jm = G.jumpMats[0];
          P.pos.set(jm.pos.x, jm.pos.y + 0.4, jm.pos.z);
          P.vel.y = Number(jm.power || jm.vy || 26);
        } else {
          P.vel.y = 22; P.vel.x += fwX * 9; P.vel.z += fwZ * 9;
        }
        P.onGround = false;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('LAUNCH PAD', 0.35);
        break;
      case 'groundboost':
        P.vel.y = Math.max(P.vel.y, 14.5); P.vel.x += fwX * 6.5; P.vel.z += fwZ * 6.5; P.onGround = false;
        if (typeof burst === 'function') burst(new THREE.Vector3(P.pos.x, P.pos.y + 0.1, P.pos.z), 'fire', 14, 4, 0.1, 0.32, 1);
        if (typeof hcAwardStyle === 'function') hcAwardStyle('GROUND-SHOT BOOST', 0.4);
        break;
      case 'surfacemod': {
        hcSurfacePresetIdx = (hcSurfacePresetIdx + 1) % HC_SURFACE_MODES.length;
        const kind = HC_SURFACE_MODES[hcSurfacePresetIdx];
        P.groundSurface = kind === 'auto' ? null : kind;
        if (kind !== 'auto') hcSpawnSurfacePad(kind);
        if (typeof showToast === 'function') showToast('SURFACE MOD · ' + kind.toUpperCase());
        break;
      }
      case 'hover':
        P.hoverMode = !P.hoverMode;
        if (P.hoverMode && P.onGround) { P.pos.y += 1.6; P.vel.y = 2.0; P.onGround = false; }
        if (typeof showToast === 'function') showToast(P.hoverMode ? 'HOVER FLOAT ON' : 'HOVER FLOAT OFF');
        break;
      case 'dodgeroll':
        P.dodgeT = 0.26; P.dodgeDX = fwX; P.dodgeDZ = fwZ; P.dodgeCd = 0.35;
        if (typeof hcAwardStyle === 'function') hcAwardStyle('DODGE ROLL', 0.3);
        break;
      case 'combatdash':
        P.abDash = { t: 0.24, sp: 24, dx: fwX, dz: fwZ, hit: {}, dmg: 0 };
        if (typeof hcAwardStyle === 'function') hcAwardStyle('STYLE SURGE', 0.55);
        break;
      case 'teleportlift':
        if (G.hcMapTeleports && G.hcMapTeleports.length && hcTeleportCd <= 0) {
          const tp = G.hcMapTeleports[0];
          P.pos.set(tp.tx, tp.ty + 0.15, tp.tz);
          hcTeleportCd = 1.2;
          if (typeof hcAwardStyle === 'function') hcAwardStyle('MAP TELEPORT', 0.35);
        } else {
          P.vel.y = 16.5; P.onGround = false;
          if (typeof hcAwardStyle === 'function') hcAwardStyle('AIR LIFT', 0.3);
        }
        break;
    }
    hcRenderMoveDockState();
  }
  window.hcRunMovementAction = hcRunMovementAction;

  window.hcTickAdvancedMovement = function (dt) {
    if (hcTeleportCd > 0) hcTeleportCd = Math.max(0, hcTeleportCd - dt);
    if (typeof P === 'undefined' || P.hp <= 0) { hcClearWebSwing(); return; }

    // 1. Web-Swing pendulum physics
    if (hcWebSwing) {
      hcWebSwing.t += dt;
      const eye = new THREE.Vector3(P.pos.x, P.pos.y + 1.4, P.pos.z);
      const toAnchor = hcWebSwing.anchor.clone().sub(eye);
      const dist = toAnchor.length() || 1;
      const dir = toAnchor.divideScalar(dist);
      if (dist > hcWebSwing.ropeLen) {
        const pull = (dist - hcWebSwing.ropeLen) * 26;
        P.vel.addScaledVector(dir, pull * dt);
        const radVel = P.vel.dot(dir);
        if (radVel < 0) P.vel.addScaledVector(dir, -radVel * 0.92);
      }
      const fw = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw));
      P.vel.addScaledVector(fw, 14 * dt);
      P.onGround = false;
      const attr = hcWebSwing.line.geometry.attributes.position;
      attr.setXYZ(0, eye.x, eye.y, eye.z);
      attr.setXYZ(1, hcWebSwing.anchor.x, hcWebSwing.anchor.y, hcWebSwing.anchor.z);
      attr.needsUpdate = true;
      if (hcWebSwing.t > 2.6 || (typeof keys === 'object' && keys.Space && hcWebSwing.t > 0.16)) {
        hcTriggerWebSwing();
      }
    }

    // 2. Custom Surface Mod pads + underfoot surface effects
    if (G.hcCustomSurfaces && G.hcCustomSurfaces.length) {
      for (let i = G.hcCustomSurfaces.length - 1; i >= 0; i--) {
        const sf = G.hcCustomSurfaces[i];
        if ((G.t || 0) >= sf.until) {
          if (sf.mesh && sf.mesh.parent) sf.mesh.parent.remove(sf.mesh);
          G.hcCustomSurfaces.splice(i, 1);
          continue;
        }
        if (Math.hypot(P.pos.x - sf.x, P.pos.z - sf.z) <= sf.r && Math.abs(P.pos.y - sf.y) < 1.2) {
          P.groundSurface = sf.kind;
          if (sf.kind === 'bouncy' && P.vel.y <= 0.5 && P.onGround) {
            P.vel.y = 19.5;
            P.onGround = false;
            if (typeof hcAwardStyle === 'function') hcAwardStyle('BOUNCE PAD', 0.25);
          }
        }
      }
    }

    // 3. Map Teleporters & Vertical Air Lifts
    if (G.hcMapTeleports && G.hcMapTeleports.length && hcTeleportCd <= 0) {
      for (const tp of G.hcMapTeleports) {
        if (Math.hypot(P.pos.x - tp.x, P.pos.z - tp.z) < 1.35 && Math.abs(P.pos.y - tp.y) < 1.8) {
          P.pos.set(tp.tx, tp.ty + 0.15, tp.tz);
          hcTeleportCd = 1.4;
          if (typeof burst === 'function') burst(new THREE.Vector3(tp.tx, tp.ty + 0.9, tp.tz), 'cyan', 14, 4, 0.08, 0.35, 1);
          if (typeof hcAwardStyle === 'function') hcAwardStyle('PORTAL WARP', 0.35);
          if (typeof showToast === 'function') showToast('MAP TELEPORT WARP');
          break;
        }
      }
    }
    if (G.hcMapLifts && G.hcMapLifts.length) {
      for (const lf of G.hcMapLifts) {
        if (Math.hypot(P.pos.x - lf.x, P.pos.z - lf.z) < lf.r && P.pos.y >= lf.y - 0.5 && P.pos.y < lf.topY + 0.6) {
          P.vel.y = Math.max(P.vel.y, 11.5);
          P.onGround = false;
        }
      }
    }
    hcRenderMoveDockState();
  };

  function hcRenderMoveDockState() {
    const dock = document.getElementById('hcMoveDock');
    if (!dock) return;
    const isHidden = (id) => { const el = document.getElementById(id); return !el || el.classList.contains('hidden'); };
    const vis = typeof G === 'object'
      && (G.state === 'lobby' || G.state === 'live' || G.state === 'countdown')
      && !document.getElementById('hcLoadingScreen')
      && !document.getElementById('hcStarterModal')
      && isHidden('login') && isHidden('menu') && isHidden('pause') && isHidden('end')
      && isHidden('settings') && isHidden('hcOnlinePanel') && isHidden('rankDraft');
    dock.classList.toggle('hidden', !vis);
    const activeSet = {
      webswing: !!hcWebSwing,
      wingsuit: !!(P && P.gliding && P.gliderBoost),
      parachute: !!(P && P.gliding && P.gliderBrake),
      hover: !!(P && P.hoverMode),
      wallrun: !!(P && P.wallRunSide),
      slidehop: !!(P && P.sliding),
      diveslide: !!(P && P.diving),
      surfacemod: !!(P && P.groundSurface),
      combatdash: !!(P && (P.styleMult || 1) > 1.05),
    };
    dock.querySelectorAll('.md-btn').forEach((btn) => {
      btn.classList.toggle('on', !!activeSet[btn.dataset.mv]);
    });
  }

  (function initMovementDockUI() {
    const dock = document.getElementById('hcMoveDock');
    const grid = document.getElementById('hcMoveGrid');
    const toggle = document.getElementById('hcMoveDockToggle');
    if (!dock || !grid) return;
    grid.innerHTML = HC_MOVEMENT_LIST.map(
      (m) => `<button type="button" class="md-btn" data-mv="${m.id}" title="${m.key}">${m.label}<kbd>${m.key}</kbd></button>`
    ).join('');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-mv]');
      if (!btn) return;
      hcRunMovementAction(btn.dataset.mv);
    });
    if (toggle) {
      toggle.addEventListener('click', () => {
        const c = dock.classList.toggle('collapsed');
        toggle.textContent = c ? 'SHOW' : 'HIDE';
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.code === 'KeyX' && !e.repeat && (inMatch() || G.state === 'lobby')) hcRunMovementAction('webswing');
      if ((e.code === 'BracketLeft' || e.code === 'BracketRight') && !e.repeat) {
        hcManualFootSide = e.code === 'BracketLeft' ? -1 : 1;
        hcRunMovementAction('manualfoot');
      }
    });
    setInterval(hcRenderMoveDockState, 250);
    hcRenderMoveDockState();
  })();

  window.__hcTestChecks = function () {
    const out = {};
    // 1. Weapon specs + Revolver ring / Raygun MeshPhysicalMaterial check
    if (typeof GUN_BY_ID === 'object') {
      const sp = GUN_BY_ID.spear;
      const c4d = GUN_BY_ID.c4;
      const rv = GUN_BY_ID.revolver;
      const pg = GUN_BY_ID.portalgun;
      out.spear = sp
        ? {
            sw: sp.sw,
            hitRadius: sp.proj ? sp.proj.hitRadius : sp.hitRadius || null,
            dmg: sp.dmg,
            head: sp.head,
          }
        : null;
      out.c4Mag = c4d ? c4d.mag : null;
      out.revolverDmg = rv ? rv.dmg : null;
      out.portalGunExists = !!pg;
    }
    const gBuilder =
      typeof gunModelCore === 'function'
        ? gunModelCore
        : typeof gunModel === 'function'
          ? (d) => gunModel(d, 'default', { lo: true })
          : null;
    if (gBuilder && typeof GUN_BY_ID === 'object') {
      let physCount = 0;
      const rg = gBuilder(GUN_BY_ID.raygun, 'default', { lo: true });
      if (rg) rg.traverse((o) => { if (o.material && o.material.isMeshPhysicalMaterial) physCount++; });
      out.raygunPhysicalMats = physCount;
      let revTorusCount = 0;
      const revm = gBuilder(GUN_BY_ID.revolver, 'default', { lo: true });
      if (revm) revm.traverse((o) => { if (o.geometry && o.geometry.type === 'TorusGeometry') revTorusCount++; });
      out.revolverTorusCount = revTorusCount;
    }
    // 2. Check Laser Arena hazard damage + Teleports/Lifts + Built-in Overpass jump mats
    if (typeof tickLaserArenaHazards === 'function' && typeof P !== 'undefined') {
      window.__hcLaunchMap('Laser Arena', 'tdm', true);
      const hp0 = P.hp;
      P.prot = 0;
      P.pos.set(-18.5, 0.35, 0);
      tickLaserArenaHazards(0.016);
      out.laserDmgDealt = hp0 - P.hp;
      out.laserHasAB = (window.HC_LASER_BEAMS || []).every((b) => b && b.a && b.b);
      out.laserBeams = (window.HC_LASER_BEAMS || []).length;
      out.laserTeleports = (G.hcMapTeleports || []).length;
      out.laserLifts = (G.hcMapLifts || []).length;
    }
    // 3. Check Target Grid Match Lobby door sealing & X->CritHits route
    window.__hcLaunchMap('Target Grid', 'duel', true);
    out.targetGridMatchExitBlocked = solids.some(
      (b) => Math.abs((b.minz + b.maxz) / 2 - 24) < 0.25 && b.minx <= 0 && b.maxx >= 0 && b.miny === 0
    );
    window.__hcLaunchMap('Target Grid', 'practice', true);
    out.targetGridInitialDoor = window.__hcInspect().targetDoor;
    window.hcOpenTargetGridSecret('X');
    out.targetGridXUnlockedDoor = window.__hcInspect().targetDoor;
    // 4. Check Ground-Shot Boost with Rocket Launcher + Overpass jump mats + Pool Party water shader
    window.__hcLaunchMap('Pool Party', 'tdm', true);
    out.waterShaderActive = !!(window.HC_WATER_SHADER_MAT && window.HC_WATER_SHADER_MAT.isShaderMaterial);
    out.skyShaderActive = typeof HC_SKY_DOME !== 'undefined' && !!(HC_SKY_DOME && HC_SKY_DOME.material && HC_SKY_DOME.material.isShaderMaterial);
    window.__hcLaunchMap('Overpass', 'tdm', true);
    out.overpassJumpMats = (G.jumpMats || []).length;
    window.__hcEquipAndLive('rocket', 'portalgun', 'c4');
    if (typeof P !== 'undefined' && typeof shootPlayer === 'function') {
      P.pos.set(0, 1.8, 0);
      P.vel.set(0, 0, 0);
      P.pitch = -1.45;
      P.cd = 0;
      shootPlayer(P.slots[0]);
      out.groundShotBoostVy = Number((P.vel.y || 0).toFixed(2));
    }
    // 5. Check Persistent Duel Bot across rounds + Multi-Slot Weapon Switching
    if (typeof startMatch === 'function' && typeof startRound === 'function') {
      window.__hcLaunchMap('Laser Arena', 'duel', true);
      const r1Name = B.name;
      const r1Skin = G.duelBot ? G.duelBot.skinId : null;
      startRound();
      const r2Name = B.name;
      const r2Skin = G.duelBot ? G.duelBot.skinId : null;
      out.duelBotPersistent = !!r1Name && r1Name === r2Name && r1Skin === r2Skin;
      out.botMultiSlots = Array.isArray(B.slots) ? B.slots.length : 0;
      if (typeof botMaybeSwitchWeapon === 'function' && B.slots && B.slots.length >= 3) {
        B.switchCd = 0;
        B.slotIdx = 0;
        botMaybeSwitchWeapon(B, 1.8, true);
        out.botSwitchedClose = B.slotIdx === 2;
      }
    }
    // 6. Check 25 Movement Dock buttons + CritBossHUD + BloxWaffles seeded co-owner
    out.moveDockButtons = document.querySelectorAll('#hcMoveGrid .md-btn').length;
    out.critBossHudEl = !!document.getElementById('hcCritBossHud');
    out.critExplainStepEl = !!document.getElementById('hcCritExplainStep');
    out.blxCoOwnerSeeded = typeof ACCS === 'object' && !!(ACCS.users && ACCS.users.BloxWaffles && ACCS.users.BloxWaffles.role === 'co-owner');
    // 7. Check Double Trouble dual-arm state & Infinite Loadouts slot options
    if (typeof startMatch === 'function' && typeof cfg === 'object') {
      window.__hcLaunchMap('Laser Arena', 'doubletrouble', true);
      out.doubleTroubleCheck = {
        doubleTrouble: !!G.doubleTrouble,
        vmOffVisible: typeof vmOff !== 'undefined' && vmOff ? !!vmOff.visible : false,
        cur: P.cur,
        offCur: P.offCur,
        slotsLen: P.slots ? P.slots.length : 0,
      };
      if (typeof renderMenu === 'function') {
        cfg.mode = 'infiniteloadouts';
        renderMenu();
        const pickerCount = document.querySelectorAll('#menu .slot, #menu [data-pick], #menu select').length;
        out.infLoadoutControls = pickerCount;
      }
    }
    return out;
  };

  window.__hcFocusSJEdits = function () {
    if (typeof ACT === 'undefined' || !Array.isArray(NPCS) || typeof P === 'undefined') return false;
    const idx = NPCS.findIndex((n) => n && n.id === 'riley');
    const sj = idx >= 0 ? ACT[idx] : null;
    if (!sj || !sj.pos) return false;
    // Place camera just in front of sjedits (NPCs face -z relative to their yaw)
    const dirX = -Math.sin(sj.yaw || 0);
    const dirZ = -Math.cos(sj.yaw || 0);
    P.pos.set(sj.pos.x + dirX * 2.75, sj.pos.y || 0, sj.pos.z + dirZ * 2.75);
    P.yaw = Math.atan2(-(sj.pos.x - P.pos.x), -(sj.pos.z - P.pos.z));
    P.pitch = 0.04;
    if (typeof render === 'function') render(0.016);
    return true;
  };

  window.__hcSetCam = function (x, y, z, yaw, pitch) {
    if (typeof P === 'undefined' || !P || !P.pos) return false;
    P.pos.set(x, y, z);
    P.vel.set(0, 0, 0);
    if (yaw !== undefined) P.yaw = yaw;
    if (pitch !== undefined) P.pitch = pitch;
    if (typeof render === 'function') render(0.016);
    return true;
  };

  window.__hcLaunchMap = function (mapName, mode, skipIntro) {
    if (typeof MAPS === 'undefined' || typeof startMatch !== 'function') return null;
    const idx = MAPS.findIndex(
      (m) => m && m.name && m.name.toLowerCase() === String(mapName || '').trim().toLowerCase()
    );
    if (idx < 0) return null;
    if (mode && typeof cfg === 'object') cfg.mode = mode;
    cfg.forceMap = idx;
    startMatch();
    if (skipIntro && typeof G === 'object') {
      G.introT = 0;
      G.cd = 0;
      G.state = 'live';
      const box = document.getElementById('hcMatchIntro');
      if (box) box.style.display = 'none';
      const crit = document.getElementById('hcCritExplain');
      if (crit) crit.classList.add('hidden');
      const msg = document.getElementById('msg');
      if (msg) msg.classList.add('hidden');
      if (typeof showMsg === 'function') showMsg('', '');
    }
    if (typeof render === 'function') render(0.016);
    return window.__hcInspect ? window.__hcInspect() : true;
  };

  window.__hcAuditSpawns = function (mapNames) {
    if (typeof MAPS === 'undefined' || typeof startMatch !== 'function') return [];
    const list =
      Array.isArray(mapNames) && mapNames.length
        ? mapNames
        : [
            'Laser Arena',
            'Pool Party',
            'Target Grid',
            'Redline Arena',
            'Overpass',
            'Assembly Plant',
            'Blockworks Arena',
            'Violet Voltage',
            'Hypercore Arena',
            'Overlord Citadel',
            'CritHits Sanctum',
            'Acid Flats',
          ];
    const results = [];
    const savedMode = cfg.mode;
    for (const name of list) {
      for (const mode of ['tdm', 'duel']) {
        const idx = MAPS.findIndex((m) => m && m.name === name);
        if (idx < 0) continue;
        cfg.mode = mode;
        cfg.forceMap = idx;
        startMatch();
        G.introT = 0;
        G.cd = 0;
        G.state = 'live';
        const sc = HC_MAP_SPAWN_CONFIGS[name];
        const units = mode === 'duel' ? [P, B] : UN;
        let collisions = 0;
        let outOfBounds = 0;
        let blockedLos = 0;
        for (const u of units) {
          if (!u || !u.pos) continue;
          if (typeof collides === 'function' && collides(u.pos.x, 0.05, u.pos.z, 0.45, 1.75)) collisions++;
          if (sc && !hcWithinBounds(u.pos.x, u.pos.z, sc.bounds)) outOfBounds++;
        }
        const playerLos = hcSpawnSightline(P.pos.x, P.pos.z);
        if (playerLos < 2.8) blockedLos++;
        results.push({
          map: name,
          mode,
          playerPos: { x: Number(P.pos.x.toFixed(2)), z: Number(P.pos.z.toFixed(2)) },
          playerLos: Number(playerLos.toFixed(2)),
          unitCount: units.length,
          collisions,
          outOfBounds,
          blockedLos,
        });
      }
    }
    cfg.mode = savedMode;
    return results;
  };

  window.__hcEquipAndLive = function (priId, secId, utilId) {
    if (typeof cfg === 'object' && Array.isArray(cfg.loadout)) {
      if (priId) cfg.loadout[0] = priId;
      if (secId) cfg.loadout[1] = secId;
      if (utilId) cfg.loadout[3] = utilId;
    }
    if (typeof P !== 'undefined' && typeof makeSlots === 'function') {
      P.slots = makeSlots('tdm');
      P.cur = 0;
      if (typeof buildVM === 'function') buildVM(P.slots[0].def);
    }
    return P.slots ? P.slots.map((s) => s.id) : [];
  };

  (function applyInitialRoute() {
    try {
      const qs = new URLSearchParams(location.search);
      const qMode = qs.get('mode');
      const qMap = qs.get('map');
      const qAuto = qs.get('autostart');
      if (qMode && typeof cfg === 'object') cfg.mode = qMode;
      if (qMap && typeof MAPS !== 'undefined') {
        const idx = MAPS.findIndex(
          (m) => m && m.name && m.name.toLowerCase() === qMap.trim().toLowerCase()
        );
        if (idx >= 0) cfg.forceMap = idx;
      }
      if (qAuto === 'lobby') {
        if (typeof ACCS === 'object') {
          ACCS.skip = true;
          if (typeof saveAccs === 'function') saveAccs();
        }
        const lg = document.getElementById('login');
        if (lg) lg.classList.add('hidden');
        const ls = document.getElementById('hcLoadingScreen');
        if (ls) ls.remove();
        if (typeof enterLobby === 'function') enterLobby();
      } else if (qAuto === '1') {
        if (typeof ACCS === 'object') {
          ACCS.skip = true;
          if (typeof saveAccs === 'function') saveAccs();
        }
        const lg = document.getElementById('login');
        if (lg) lg.classList.add('hidden');
        const ls = document.getElementById('hcLoadingScreen');
        if (ls) ls.remove();
        if (typeof startMatch === 'function') startMatch();
      }
      if (typeof hcSyncBodyState === 'function') hcSyncBodyState();
    } catch (e) {
      console.warn('[HYPER CLASH] URL route apply error:', e);
    }
  })();
})();
