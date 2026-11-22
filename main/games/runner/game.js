//#region GAME 4 OF 4 - SWEET RUNNER
/* ############################################################
   ##  GAME 4 OF 4: SWEET RUNNER
   ##  Endless 3-lane runner with candy hazards and power-ups.
   ##  Controls: A/D or Left/Right = change lane
   ##            W/Up/Space = jump,  S/Down = slide
   ##            or click: sides = lane, top = jump, bottom = slide
   ############################################################ */
function runnerGame(finish) {
  const colors = {
    plum: window.RUEM_THEME.plum,
    red: window.RUEM_THEME.red,
    butter: window.RUEM_THEME.butter,
    vanilla: window.RUEM_THEME.vanilla,
    blue: '#84C8E8',
    blueLight: '#B6E3F3',
    beige: '#E9D1B3'
  };
  const touchMode = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
  const touchControls = () => {
    const height = Math.max(88, 48 * dpr / sc);
    const width = 170, gap = 14;
    return { x: (800 - 4 * width - 3 * gap) / 2, y: 500 - height - 6, width, height, gap };
  };
  let equipped = {}, joy = 80;
  try {
    const saved = JSON.parse(localStorage.getItem('miniArcadeSave_v1') || 'null');
    const playerName = typeof saved?.p1 === 'string' && saved.p1 ? saved.p1 : 'Player1';
    const pet = saved?.players?.[playerName]?.pet;
    equipped = pet?.wardrobe?.equipped || {};
    if (Number.isFinite(pet?.joy)) joy = pet.joy;
  } catch (error) {
    console.error('Could not load Ruem’s outfit for Sweet Runner.', error);
  }
  const ruemImage = new Image();
  let ruemReady = false;
  if (window.RuemPetModel && typeof window.RuemPetModel.render === 'function') {
    ruemImage.onload = () => { ruemReady = true; };
    ruemImage.onerror = () => console.error('Could not load Ruem’s Sweet Runner model.');
    ruemImage.src = 'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(window.RuemPetModel.render(equipped, joy));
  } else {
    console.error('Ruem’s pet model is not available in Sweet Runner.');
  }
  // ---------- SETTINGS (tweak these to change the feel) ----------
  const LANE_W = 150;     // pixels between lane centres at the player
  const HY = 140;         // y of the horizon line
  const GY = 440;         // y of the ground at the player's feet
  const F = 14;           // perspective strength (higher = flatter view)
  const SPAWN_Z = 95;     // how far ahead things appear
  const ROW_GAP = 16;     // distance between rows of obstacles / coins
  const GRAV = 1500, BASE_JUMP_V = 480;
  const POWER = {         // power-up types: icon, colour, seconds active
    magnet: { icon: '🧲', color: colors.blue, secs: 8 },
    shield: { icon: '🛡️', color: colors.blueLight, secs: 12 },
    x2:     { icon: '×2', color: colors.butter, secs: 10 },
    speed:  { icon: '⚡', color: colors.butter, secs: 7 },
    jump:   { icon: '⭐', color: colors.red, secs: 9 }
  };


  // ---------- STATE ----------
  // p.lx = smooth lane position, p.lane = target lane (-1, 0, 1), p.h = height off ground
  const p = { lx: 0, lane: 0, h: 0, vy: 0, slide: 0, queueSlide: false, run: 0 };
  const fx = { magnet: 0, shield: 0, x2: 0, speed: 0, jump: 0 }; // seconds left for each power-up
  let ents = [];                                    // obstacles, coins, power-ups (wz = world position)
  let dist = 0, t = 0, speed = 16, nextRow = 40;
  let pts = 0, coins = 0, over = false, flash = 0;
  const score = () => Math.floor(pts);


  // ---------- SPAWNING: what appears on the track ----------
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function coinLine(lane, wz) {
    for (let i = 0; i < 5; i++) ents.push({ type: 'coin', lane, wz: wz + i * 2.4 });
  }

  function candyObstacle(lane, wz) {
    const candy = pick(['lollipop', 'candycane', 'candywall']);
    const obstacle = candy === 'lollipop' ? 'low' : candy === 'candycane' ? 'high' : 'wall';
    ents.push({ type: 'candy', candy, obstacle, lane, wz });
  }

  function spawnRow(wz) {
    const r = Math.random(), lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
    if (r < 0.42 && wz > 70) {                      // obstacle row (first few rows stay easy)
      const two = speed > 22 && Math.random() < 0.5;
      candyObstacle(lanes[0], wz);
      if (two) candyObstacle(lanes[1], wz);
      else if (Math.random() < 0.6) coinLine(lanes[1], wz);
    } else if (r < 0.82) coinLine(lanes[0], wz);    // coin line
    else if (r < 0.92) ents.push({ type: pick(Object.keys(POWER)), lane: lanes[0], wz }); // power-up
  }


  // ---------- PLAYER ACTIONS ----------
  const jump  = () => { if (p.h === 0 && p.vy === 0) { p.vy = BASE_JUMP_V * (fx.jump > 0 ? 1.5 : 1); p.slide = 0; p.queueSlide = false; } };
  const slide = () => { if (p.h > 0) { p.vy = Math.min(p.vy, -900); p.queueSlide = true; } else p.slide = 0.6; };
  const left  = () => { p.lane = Math.max(-1, p.lane - 1); };
  const right = () => { p.lane = Math.min(1, p.lane + 1); };


  // ---------- UPDATE: runs every frame ----------
  function update(dt) {
    if (over) return;
    t += dt;
    speed = (16 + 1.8 * Math.sqrt(t)) * (fx.speed > 0 ? 1.35 : 1);
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
      } else if (e.type === 'candy' && dx < 0.5) {
        const hit = e.obstacle === 'wall'
                 || (e.obstacle === 'low' && p.h < 34)
                 || (e.obstacle === 'high' && p.slide <= 0);
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
  const half = f => 1.6 * LANE_W * f;
  const fade = f => Math.max(0, Math.min(1, (f - 0.125) / 0.09));   // fog: far things fade in

  function drawWorld() {
    const fNear = 1.2;
    ctx.save();
    ctx.globalAlpha = .84;
    ctx.fillStyle = colors.beige;
    ctx.beginPath();
    ctx.moveTo(400, HY);
    ctx.lineTo(400 + half(fNear), gy(fNear));
    ctx.lineTo(400 - half(fNear), gy(fNear));
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(400, HY);
    ctx.lineTo(400 + half(fNear), gy(fNear));
    ctx.lineTo(400 - half(fNear), gy(fNear));
    ctx.closePath();
    ctx.clip();

    const plaidOffset = dist % 14;
    for (let k = -1; k < 18; k++) {
      const z0 = Math.max(-2.5, k * 14 - plaidOffset), z1 = k * 14 - plaidOffset + 5;
      if (z1 <= -2.5) continue;
      const f0 = proj(z0), f1 = proj(z1);
      ctx.fillStyle = k % 2 ? 'rgba(233,78,112,.3)' : 'rgba(132,200,232,.4)';
      ctx.beginPath();
      ctx.moveTo(400 - half(f0), gy(f0)); ctx.lineTo(400 + half(f0), gy(f0));
      ctx.lineTo(400 + half(f1), gy(f1)); ctx.lineTo(400 - half(f1), gy(f1));
      ctx.fill();
    }

    for (let i = -3; i <= 3; i++) {
      const l = i * .25, x = 400 + l * half(fNear), stripeWidth = 2 + fNear * 2;
      ctx.fillStyle = i % 2 ? 'rgba(233,78,112,.48)' : 'rgba(132,200,232,.58)';
      ctx.beginPath();
      ctx.moveTo(398.5, HY); ctx.lineTo(401.5, HY);
      ctx.lineTo(x + stripeWidth, gy(fNear)); ctx.lineTo(x - stripeWidth, gy(fNear));
      ctx.closePath(); ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(400, HY); ctx.lineTo(400 + half(fNear), gy(fNear));
    ctx.moveTo(400, HY); ctx.lineTo(400 - half(fNear), gy(fNear));
    ctx.stroke();

    const laneOffset = dist % 8;
    ctx.fillStyle = 'rgba(255,245,233,.86)';
    for (let k = -1; k < 14; k++) {
      const z0 = Math.max(-2.5, k * 8 - laneOffset), z1 = k * 8 - laneOffset + 3.5;
      if (z1 <= -2.5) continue;
      const f0 = proj(z0), f1 = proj(z1);
      for (const lane of [-.5, .5]) {
        const x0 = 400 + lane * LANE_W * f0, x1 = 400 + lane * LANE_W * f1;
        const w0 = 2.5 * f0, w1 = 2.5 * f1;
        ctx.beginPath();
        ctx.moveTo(x0 - w0, gy(f0)); ctx.lineTo(x0 + w0, gy(f0));
        ctx.lineTo(x1 + w1, gy(f1)); ctx.lineTo(x1 - w1, gy(f1));
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawWrappedCandy(x, y, scale, color) {
    const bodyWidth = 40 * scale, bodyHeight = 24 * scale, twist = 13 * scale;
    ctx.fillStyle = colors.blueLight;
    ctx.beginPath();
    ctx.moveTo(x - bodyWidth / 2, y - bodyHeight / 2);
    ctx.lineTo(x - bodyWidth / 2 - twist, y - bodyHeight / 2 - 7 * scale);
    ctx.lineTo(x - bodyWidth / 2 - twist, y + bodyHeight / 2 + 7 * scale);
    ctx.lineTo(x - bodyWidth / 2, y + bodyHeight / 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(1, 2 * scale); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + bodyWidth / 2, y - bodyHeight / 2);
    ctx.lineTo(x + bodyWidth / 2 + twist, y - bodyHeight / 2 - 7 * scale);
    ctx.lineTo(x + bodyWidth / 2 + twist, y + bodyHeight / 2 + 7 * scale);
    ctx.lineTo(x + bodyWidth / 2, y + bodyHeight / 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.stroke();

    ctx.fillStyle = color;
    rr(x - bodyWidth / 2, y - bodyHeight / 2, bodyWidth, bodyHeight, bodyHeight / 2); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(1, 2 * scale); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,233,.82)'; ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.beginPath(); ctx.moveTo(x - 10 * scale, y - 4 * scale); ctx.lineTo(x + 10 * scale, y - 4 * scale); ctx.stroke();
  }

  function drawEnt(e, z) {                          // one obstacle / coin / power-up
    const f = proj(z), x = 400 + e.lane * LANE_W * f, y = gy(f);
    ctx.globalAlpha = fade(f);
    if (e.type === 'candy') {
      if (e.candy === 'lollipop') {
        ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(2, 8 * f);
        ctx.beginPath(); ctx.moveTo(x, y - 14 * f); ctx.lineTo(x, y + 4 * f); ctx.stroke();
        ctx.strokeStyle = colors.vanilla; ctx.lineWidth = Math.max(1, 4 * f);
        ctx.beginPath(); ctx.moveTo(x, y - 14 * f); ctx.lineTo(x, y + 4 * f); ctx.stroke();
        const cy = y - 28 * f, radius = 16 * f;
        ctx.fillStyle = colors.red; ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(1, 2 * f);
        ctx.beginPath(); ctx.arc(x, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = colors.vanilla; ctx.lineWidth = Math.max(1, 4 * f);
        ctx.beginPath(); ctx.arc(x, cy, radius * .62, -.4, Math.PI * 1.45); ctx.stroke();
        ctx.fillStyle = colors.butter; ctx.beginPath(); ctx.arc(x, cy, 3 * f, 0, Math.PI * 2); ctx.fill();
      } else if (e.candy === 'candycane') {
        const left = x - 58 * f, right = x + 58 * f, top = y - 88 * f;
        ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(5, 18 * f); ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(left, y); ctx.lineTo(left, top + 16 * f); ctx.quadraticCurveTo(left, top, x - 38 * f, top);
        ctx.lineTo(x + 38 * f, top); ctx.quadraticCurveTo(right, top, right, top + 16 * f); ctx.lineTo(right, y);
        ctx.stroke();
        ctx.strokeStyle = colors.vanilla; ctx.lineWidth = Math.max(3, 12 * f);
        ctx.beginPath();
        ctx.moveTo(left, y); ctx.lineTo(left, top + 16 * f); ctx.quadraticCurveTo(left, top, x - 38 * f, top);
        ctx.lineTo(x + 38 * f, top); ctx.quadraticCurveTo(right, top, right, top + 16 * f); ctx.lineTo(right, y);
        ctx.stroke();
        ctx.save();
        ctx.strokeStyle = colors.red; ctx.lineWidth = Math.max(2, 6 * f);
        for (let i = -3; i <= 3; i++) {
          const sx = x + i * 18 * f;
          ctx.beginPath(); ctx.moveTo(sx - 5 * f, top - 4 * f); ctx.lineTo(sx + 5 * f, top + 4 * f); ctx.stroke();
        }
        ctx.restore();
        ctx.lineCap = 'butt';
      } else {
        drawWrappedCandy(x - 28 * f, y - 24 * f, 1.2 * f, colors.red);
        drawWrappedCandy(x + 28 * f, y - 31 * f, 1.2 * f, colors.blue);
        drawWrappedCandy(x, y - 65 * f, 1.15 * f, colors.butter);
      }
    } else if (e.type === 'coin') {                 // spinning coin
      const w = Math.max(1.5 * f, 11 * f * Math.abs(Math.cos(t * 6 + e.wz)));
      ctx.fillStyle = colors.butter; ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(1, 2 * f);
      ctx.beginPath(); ctx.ellipse(x, y - 30 * f, w, 11 * f, 0, 0, 7); ctx.fill(); ctx.stroke();
    } else {                                        // power-up bubble
      const pw = POWER[e.type], yb = y - (46 + Math.sin(t * 4 + e.wz) * 5) * f;
      ctx.fillStyle = pw.color; ctx.strokeStyle = colors.plum; ctx.lineWidth = Math.max(1, 3 * f);
      ctx.beginPath(); ctx.arc(x, yb, 20 * f, 0, 7); ctx.fill(); ctx.stroke();
      text(pw.icon, x, yb, 22 * f);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    const px = 400 + p.lx * LANE_W, feet = GY - p.h;
    ctx.fillStyle = 'rgba(56,40,63,0.22)';           // shadow stays on the ground
    ctx.beginPath(); ctx.ellipse(px, GY + 3, Math.max(8, 24 - p.h * 0.2), 6, 0, 0, 7); ctx.fill();
    const stride = Math.sin(p.run * 6), sliding = p.slide > 0;
    ctx.save();
    ctx.translate(px, feet - 44 - (sliding ? 0 : Math.abs(stride) * 3));
    ctx.rotate(sliding ? 0.62 : stride * 0.035);
    ctx.scale(sliding ? 1.08 : 1, sliding ? 0.82 : 1);
    if (ruemReady) ctx.drawImage(ruemImage, -50, -50, 100, 100);
    else text('🐾', 0, 0, 42, colors.plum);
    ctx.restore();
    if (fx.magnet > 0) {                            // magnet ring
      ctx.strokeStyle = 'rgba(132,200,232,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, feet - 36, 44 + Math.sin(t * 10) * 4, 0, 7); ctx.stroke();
    }
    if (fx.shield > 0) {                            // shield bubble
      ctx.strokeStyle = 'rgba(132,200,232,0.9)'; ctx.fillStyle = 'rgba(132,200,232,0.28)'; ctx.lineWidth = 3;
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

    if (flash > 0) { ctx.fillStyle = 'rgba(255,245,233,' + (flash * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }

    ctx.fillStyle = colors.vanilla; rr(300, 6, 200, 58, 18); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
    text('Score: ' + score(), 400, 25, 22, colors.plum);       // HUD
    text('🪙 ' + coins, 400, 50, 18, colors.plum);
    let row = 0;
    for (const k in fx) if (fx[k] > 0) { text(POWER[k].icon + ' ' + Math.ceil(fx[k]) + 's', 790, 30 + row * 26, 18, colors.plum, 'right'); row++; }
    if (touchMode) {
      const controls = touchControls();
      const labels = [['◀', 'LEFT'], ['↑', 'JUMP'], ['↓', 'SLIDE'], ['▶', 'RIGHT']];
      labels.forEach(([icon, label], index) => {
        const x = controls.x + index * (controls.width + controls.gap);
        ctx.fillStyle = colors.vanilla;
        rr(x, controls.y, controls.width, controls.height, controls.height / 2); ctx.fill();
        ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
        text(icon, x + controls.width / 2, controls.y + controls.height * .38,
          Math.max(20, 20 * dpr / sc), colors.plum);
        text(label, x + controls.width / 2, controls.y + controls.height * .73,
          Math.max(14, 12 * dpr / sc), colors.plum);
      });
    } else {
      ctx.fillStyle = colors.vanilla; rr(245, 458, 310, 34, 17); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
      text('← → lane     ↑ jump     ↓ slide', 400, 475, 14, colors.plum);
    }

    if (over) {
      ctx.fillStyle = 'rgba(244,217,238,0.76)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.vanilla; rr(250, 190, 300, 120, 22); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 3; ctx.stroke();
      text('CRASHED!', 400, 225, 42, colors.red);
      text('Score: ' + score() + '   Coins: ' + coins, 400, 270, 22, colors.plum);
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
      if (touchMode) {
        const controls = touchControls();
        if (y >= controls.y && x >= controls.x && x <= controls.x + 4 * controls.width + 3 * controls.gap) {
          const index = Math.min(3, Math.floor((x - controls.x) / (controls.width + controls.gap)));
          if (index === 0) left();
          else if (index === 1) jump();
          else if (index === 2) slide();
          else right();
          return;
        }
      }
      if (x < 270) left(); else if (x > 530) right(); else if (y < 300) jump(); else slide();
    }
  };
}


//#endregion

startArcadeGame(runnerGame);
