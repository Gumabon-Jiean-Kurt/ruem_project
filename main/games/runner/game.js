//#region GAME 4 OF 4 - RUINS RUNNER
/* ############################################################
   ##  GAME 4 OF 4: RUINS RUNNER
   ##  Endless 3-lane runner (pseudo-3D) with coins and power-ups.
   ##  Controls: A/D or Left/Right = change lane
   ##            W/Up/Space = jump,  S/Down = slide
   ##            or click: sides = lane, top = jump, bottom = slide
   ############################################################ */
function runnerGame(finish) {

  // ---------- SETTINGS (tweak these to change the feel) ----------
  const LANE_W = 150;     // pixels between lane centres at the player
  const HY = 140;         // y of the horizon line
  const GY = 440;         // y of the ground at the player's feet
  const F = 14;           // perspective strength (higher = flatter view)
  const SPAWN_Z = 95;     // how far ahead things appear
  const ROW_GAP = 16;     // distance between rows of obstacles / coins
  const GRAV = 1500, JUMP_V = 480;
  const POWER = {         // power-up types: icon, colour, seconds active
    magnet: { icon: '🧲', color: '#ef4444', secs: 8 },
    shield: { icon: '🛡️', color: '#38bdf8', secs: 12 },
    x2:     { icon: '×2', color: '#a855f7', secs: 10 }
  };


  // ---------- STATE ----------
  // p.lx = smooth lane position, p.lane = target lane (-1, 0, 1), p.h = height off ground
  const p = { lx: 0, lane: 0, h: 0, vy: 0, slide: 0, queueSlide: false, run: 0 };
  const fx = { magnet: 0, shield: 0, x2: 0 };      // seconds left for each power-up
  let ents = [];                                    // obstacles, coins, power-ups (wz = world position)
  let dist = 0, t = 0, speed = 16, nextRow = 40;
  let pts = 0, coins = 0, over = false, flash = 0;
  const score = () => Math.floor(pts);


  // ---------- SPAWNING: what appears on the track ----------
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function coinLine(lane, wz) {
    for (let i = 0; i < 5; i++) ents.push({ type: 'coin', lane, wz: wz + i * 2.4 });
  }

  function spawnRow(wz) {
    const r = Math.random(), lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
    if (r < 0.42 && wz > 70) {                      // obstacle row (first few rows stay easy)
      const two = speed > 22 && Math.random() < 0.5;
      ents.push({ type: pick(['low', 'high', 'wall']), lane: lanes[0], wz });
      if (two) ents.push({ type: pick(['low', 'high', 'wall']), lane: lanes[1], wz });
      else if (Math.random() < 0.6) coinLine(lanes[1], wz);
    } else if (r < 0.82) coinLine(lanes[0], wz);    // coin line
    else if (r < 0.88) ents.push({ type: pick(Object.keys(POWER)), lane: lanes[0], wz });   // power-up
  }


  // ---------- PLAYER ACTIONS ----------
  const jump  = () => { if (p.h === 0 && p.vy === 0) { p.vy = JUMP_V; p.slide = 0; p.queueSlide = false; } };
  const slide = () => { if (p.h > 0) { p.vy = Math.min(p.vy, -900); p.queueSlide = true; } else p.slide = 0.6; };
  const left  = () => { p.lane = Math.max(-1, p.lane - 1); };
  const right = () => { p.lane = Math.min(1, p.lane + 1); };


  // ---------- UPDATE: runs every frame ----------
  function update(dt) {
    if (over) return;
    t += dt;
    speed = 16 + Math.min(14, t * 0.3);             // gets faster, capped
    const mult = fx.x2 > 0 ? 2 : 1;                 // x2 power-up doubles points
    dist += speed * dt;
    pts += speed * dt / 10 * mult;
    p.run += dt * speed * 0.35;

    p.lx += (p.lane - p.lx) * Math.min(1, dt * 16); // smooth lane change
    if (p.h > 0 || p.vy > 0) {                      // jump physics
      p.vy -= GRAV * dt; p.h += p.vy * dt;
      if (p.h <= 0) { p.h = 0; p.vy = 0; if (p.queueSlide) { p.slide = 0.6; p.queueSlide = false; } }
    }
    if (p.slide > 0) p.slide -= dt;
    for (const k in fx) fx[k] = Math.max(0, fx[k] - dt);
    flash = Math.max(0, flash - dt);

    while (nextRow - dist <= SPAWN_Z) { spawnRow(nextRow); nextRow += ROW_GAP; }

    for (const e of ents) {
      const z = e.wz - dist;                        // distance ahead of the player
      if (e.type === 'coin' && fx.magnet > 0 && z < 26 && z > -1) e.lane += (p.lx - e.lane) * Math.min(1, dt * 7);
      if (z > 1 || z < -1.4) continue;              // only things at the player's position matter
      const dx = Math.abs(p.lx - e.lane);
      if (e.type === 'coin') {
        if (dx < 0.65) { e.dead = true; coins++; pts += 5 * mult; }
      } else if (POWER[e.type]) {
        if (dx < 0.65) { e.dead = true; fx[e.type] = POWER[e.type].secs; flash = 0.25; }
      } else if (dx < 0.5) {                        // obstacle in my lane
        const hit = e.type === 'wall'                       // wall: must change lane
                 || (e.type === 'low'  && p.h < 34)         // low barrier: must jump
                 || (e.type === 'high' && p.slide <= 0);    // overhead beam: must slide
        if (hit) {
          if (fx.shield > 0) { fx.shield = 0; e.dead = true; flash = 0.5; }   // shield absorbs one hit
          else { over = true; finish(score()); return; }
        }
      }
    }
    ents = ents.filter(e => !e.dead && e.wz - dist > -3);
  }


  // ---------- DRAWING HELPERS (fake 3D) ----------
  // proj(z): 1 at the player, shrinking toward 0 at the horizon. Everything scales by it.
  const proj = z => F / (F + z);
  const gy = f => HY + (GY - HY) * f;               // ground y at scale f
  const half = f => 1.6 * LANE_W * f;               // half road width at scale f
  const fade = f => Math.max(0, Math.min(1, (f - 0.125) / 0.09));   // fog: far things fade in

  function drawWorld() {
    const sky = ctx.createLinearGradient(0, 0, 0, HY);
    sky.addColorStop(0, '#1b1035'); sky.addColorStop(1, '#e07b39');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HY + 1);
    ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(620, HY - 14, 30, 0, 7); ctx.fill();   // sun
    ctx.fillStyle = '#2a1840';                                                                   // mountains
    for (let i = 0; i < 7; i++) {
      const bx = i * 140 - 20, bh = 40 + ((i * 37) % 50);
      ctx.beginPath(); ctx.moveTo(bx, HY); ctx.lineTo(bx + 70, HY - bh); ctx.lineTo(bx + 140, HY); ctx.fill();
    }
    ctx.fillStyle = '#2f5d34'; ctx.fillRect(0, HY, W, H - HY);                                   // grass

    const fNear = 1.2;                                                                           // road
    ctx.fillStyle = '#7a6a55';
    ctx.beginPath(); ctx.moveTo(400, HY); ctx.lineTo(400 + half(fNear), gy(fNear)); ctx.lineTo(400 - half(fNear), gy(fNear)); ctx.fill();

    const bandOff = dist % 20;                                                                   // moving road bands = speed feel
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    for (let k = 0; k < 12; k++) {
      const z0 = Math.max(-2.5, k * 20 - bandOff), z1 = k * 20 - bandOff + 10;
      if (z1 <= -2.5) continue;
      const f0 = proj(z0), f1 = proj(z1);
      ctx.beginPath(); ctx.moveTo(400 - half(f0), gy(f0)); ctx.lineTo(400 + half(f0), gy(f0));
      ctx.lineTo(400 + half(f1), gy(f1)); ctx.lineTo(400 - half(f1), gy(f1)); ctx.fill();
    }

    ctx.strokeStyle = '#c9b58a'; ctx.lineWidth = 4;                                              // road edges
    ctx.beginPath(); ctx.moveTo(400, HY); ctx.lineTo(400 + half(fNear), gy(fNear));
    ctx.moveTo(400, HY); ctx.lineTo(400 - half(fNear), gy(fNear)); ctx.stroke();

    const off = dist % 8;                                                                        // lane dashes
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let k = -1; k < 14; k++) {
      const z0 = Math.max(-2.5, k * 8 - off), z1 = k * 8 - off + 3.5;
      if (z1 <= -2.5) continue;
      const f0 = proj(z0), f1 = proj(z1);
      for (const l of [-0.5, 0.5]) {
        const x0 = 400 + l * LANE_W * f0, x1 = 400 + l * LANE_W * f1, w0 = 2.5 * f0, w1 = 2.5 * f1;
        ctx.beginPath(); ctx.moveTo(x0 - w0, gy(f0)); ctx.lineTo(x0 + w0, gy(f0));
        ctx.lineTo(x1 + w1, gy(f1)); ctx.lineTo(x1 - w1, gy(f1)); ctx.fill();
      }
    }

    const off2 = dist % 14;                                                                      // stone pillars at the sides
    for (let k = 8; k >= -1; k--) {
      const z = k * 14 - off2; if (z < -2.5) continue;
      const f = proj(z);
      ctx.globalAlpha = fade(f);
      for (const side of [-1, 1]) {
        const x = 400 + side * 2.4 * LANE_W * f, y = gy(f);
        ctx.fillStyle = '#8c7a62'; ctx.fillRect(x - 12 * f, y - 110 * f, 24 * f, 110 * f);
        ctx.fillStyle = '#a89478'; ctx.fillRect(x - 17 * f, y - 120 * f, 34 * f, 12 * f);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawEnt(e, z) {                          // one obstacle / coin / power-up
    const f = proj(z), x = 400 + e.lane * LANE_W * f, y = gy(f);
    ctx.globalAlpha = fade(f);
    if (e.type === 'low') {                         // low barrier: jump over
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 60 * f, y - 34 * f, 120 * f, 34 * f);
      ctx.fillStyle = '#d6a65a'; ctx.fillRect(x - 60 * f, y - 34 * f, 120 * f, 9 * f);
    } else if (e.type === 'high') {                 // overhead beam: slide under
      ctx.fillStyle = '#5b4b7a'; ctx.fillRect(x - 60 * f, y - 90 * f, 10 * f, 90 * f); ctx.fillRect(x + 50 * f, y - 90 * f, 10 * f, 90 * f);
      ctx.fillStyle = '#8b6bb5'; ctx.fillRect(x - 64 * f, y - 90 * f, 128 * f, 40 * f);
      ctx.fillStyle = '#c4a8ea'; ctx.fillRect(x - 64 * f, y - 90 * f, 128 * f, 8 * f);
    } else if (e.type === 'wall') {                 // tall wall: change lane
      ctx.fillStyle = '#7a2e2e'; ctx.fillRect(x - 66 * f, y - 120 * f, 132 * f, 120 * f);
      ctx.fillStyle = '#a64444'; ctx.fillRect(x - 66 * f, y - 120 * f, 132 * f, 12 * f);
      ctx.strokeStyle = '#4a1a1a'; ctx.lineWidth = Math.max(1, 2 * f);
      ctx.beginPath();
      for (let i = 1; i < 4; i++) { ctx.moveTo(x - 66 * f, y - 30 * i * f); ctx.lineTo(x + 66 * f, y - 30 * i * f); }
      ctx.stroke();
    } else if (e.type === 'coin') {                 // spinning coin
      const w = Math.max(1.5 * f, 11 * f * Math.abs(Math.cos(t * 6 + e.wz)));
      ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = Math.max(1, 2 * f);
      ctx.beginPath(); ctx.ellipse(x, y - 30 * f, w, 11 * f, 0, 0, 7); ctx.fill(); ctx.stroke();
    } else {                                        // power-up bubble
      const pw = POWER[e.type], yb = y - (46 + Math.sin(t * 4 + e.wz) * 5) * f;
      ctx.fillStyle = pw.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, 3 * f);
      ctx.beginPath(); ctx.arc(x, yb, 20 * f, 0, 7); ctx.fill(); ctx.stroke();
      text(pw.icon, x, yb, 22 * f);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const px = 400 + p.lx * LANE_W, feet = GY - p.h;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';             // shadow stays on the ground
    ctx.beginPath(); ctx.ellipse(px, GY + 3, Math.max(8, 24 - p.h * 0.2), 6, 0, 0, 7); ctx.fill();
    if (fx.magnet > 0) {                            // magnet ring
      ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, feet - 36, 44 + Math.sin(t * 10) * 4, 0, 7); ctx.stroke();
    }
    const sw = Math.sin(p.run * 6), air = p.h > 0;
    if (p.slide > 0) {                              // sliding pose
      ctx.fillStyle = '#38bdf8'; rr(px - 28, feet - 24, 56, 22, 9); ctx.fill();
      ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(px + 26, feet - 18, 9, 0, 7); ctx.fill();
    } else {                                        // running / jumping pose
      ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - 6, feet - 26); ctx.lineTo(px - 6 + (air ? -6 : sw * 10), feet - (air ? 10 : 0));
      ctx.moveTo(px + 6, feet - 26); ctx.lineTo(px + 6 + (air ? 6 : -sw * 10), feet - (air ? 14 : 0));
      ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#38bdf8'; rr(px - 13, feet - 58, 26, 36, 9); ctx.fill();
      ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(px, feet - 68, 11, 0, 7); ctx.fill();
    }
    if (fx.shield > 0) {                            // shield bubble
      ctx.strokeStyle = 'rgba(56,189,248,0.9)'; ctx.fillStyle = 'rgba(56,189,248,0.18)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, feet - 36, 46, 0, 7); ctx.fill(); ctx.stroke();
    }
  }


  // ---------- DRAW: runs every frame ----------
  function draw() {
    drawWorld();
    const vis = ents.filter(e => !e.dead).map(e => ({ e, z: e.wz - dist })).sort((a, b) => b.z - a.z);
    for (const v of vis) if (v.z >= 0) drawEnt(v.e, v.z);     // things ahead of the player
    drawPlayer();
    for (const v of vis) if (v.z < 0) drawEnt(v.e, v.z);      // things just passed

    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (flash * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }

    text('Score: ' + score(), 400, 25, 22);                    // HUD
    text('🪙 ' + coins, 400, 52, 18, '#fbbf24');
    let row = 0;
    for (const k in fx) if (fx[k] > 0) { text(POWER[k].icon + ' ' + Math.ceil(fx[k]) + 's', 790, 30 + row * 26, 18, '#fff', 'right'); row++; }
    text('← → lane     ↑ jump     ↓ slide', 400, 478, 14, 'rgba(255,255,255,0.6)');

    if (over) {
      ctx.fillStyle = 'rgba(120,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
      text('CRASHED!', 400, 220, 52, '#fff');
      text('Score: ' + score() + '   Coins: ' + coins, 400, 275, 26);
    }
  }


  // ---------- WHAT THE REST OF THE ARCADE CALLS ----------
  return {
    update, draw,
    key(k) {
      if (over) return;
      if (k === 'arrowleft' || k === 'a') left();
      else if (k === 'arrowright' || k === 'd') right();
      else if (k === 'arrowup' || k === 'w' || k === ' ') jump();
      else if (k === 'arrowdown' || k === 's') slide();
    },
    click(x, y) {
      if (over) return;
      if (x < 270) left(); else if (x > 530) right(); else if (y < 300) jump(); else slide();
    }
  };
}


//#endregion

startArcadeGame(runnerGame);
