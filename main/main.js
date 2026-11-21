/* ============================================================
   TABLE OF CONTENTS
   PART 1  Canvas setup + resizing
   PART 2  Save system (localStorage)
   PART 3  Input (keyboard, mouse, buttons)
   PART 4  The four mini-games (Snake, Star Catcher, Target Rush, Ruins Runner)
   PART 5  Turn logic / local multiplayer
   PART 6  Scenes (menu, ready, results, leaderboard, export/import)
   PART 7  Digital pet
   PART 8  Main loop
   Tip: every PART and every GAME is a foldable region in VS Code.
        Fold all: Ctrl+K Ctrl+0    Unfold all: Ctrl+K Ctrl+J
   ============================================================ */


//#region PART 1 - CANVAS SETUP + RESIZING
/* =========================================================
   PART 1 - CANVAS SETUP + RESIZING
   The game is drawn in a fixed "logical" 800x500 space.
   On every window resize we compute a scale + offset so the
   logical space always fits the window (letterboxed).
   ========================================================= */
const W = 800, H = 500;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let sc = 1, ox = 0, oy = 0, dpr = 1;
const menuBackground = new Image();
menuBackground.src = 'assets/arcade-menu.png';

function resize() {
  dpr = window.devicePixelRatio || 1;
  const box = cv.getBoundingClientRect();                 // the size the CSS gave the canvas
  cv.width = Math.max(1, Math.floor(box.width * dpr));
  cv.height = Math.max(1, Math.floor(box.height * dpr));
  sc = Math.min(cv.width / W, cv.height / H);
  ox = (cv.width - W * sc) / 2;
  oy = (cv.height - H * sc) / 2;
}
addEventListener('resize', resize);
resize();

//#endregion


//#region PART 2 - SAVE SYSTEM (local only)
/* =========================================================
   PART 2 - SAVE SYSTEM (local only)
   Everything lives in the browser's localStorage on this
   computer. Nothing is ever sent anywhere. Export/Import
   buttons let you copy the save as a .json file.
   ========================================================= */
// ---------- SAVE KEY + GAME LIST ----------
const KEY = 'miniArcadeSave_v1';
const GAMES = [
  { id: 'snake',  name: 'Snake' },
  { id: 'catch',  name: 'Star Catcher' },
  { id: 'target', name: 'Target Rush' },
  { id: 'runner', name: 'Ruins Runner' },
];


// ---------- LOAD / SAVE FUNCTIONS ----------
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.players) return d;
  } catch (e) {}
  return { players: {}, p1: null, p2: null, mode: 'solo' };
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }


// ---------- PLAYER PROFILES ----------
function getPlayer(name) {
  if (!S.players[name]) {
    S.players[name] = {
      scores: { snake: 0, catch: 0, target: 0, runner: 0 },
      coins: 0,
      pet: { name: 'Ruem', hunger: 80, joy: 80, last: Date.now() }
    };
  }
  for (const g of GAMES) if (typeof S.players[name].scores[g.id] !== 'number') S.players[name].scores[g.id] = 0;   // old saves get the new game's slot
  if (S.players[name].pet && S.players[name].pet.name === 'Blobby') S.players[name].pet.name = 'Ruem';
  return S.players[name];
}


// ---------- CREATE THE SAVE OBJECT 'S' ----------
const S = loadSave();
if (!S.p1) S.p1 = 'Player1';
if (!S.p2) S.p2 = 'Player2';
getPlayer(S.p1); save();

//#endregion


//#region PART 3 - INPUT
/* =========================================================
   PART 3 - INPUT
   Keyboard state, mouse position in logical coordinates, and
   an immediate-mode button system: every frame, scenes call
   btn(...) which both draws a button and registers its
   clickable area in `hits`.
   ========================================================= */
// ---------- KEYBOARD + MOUSE STATE ----------
const keys = {};
const mouse = { x: W / 2, y: H / 2, active: false };
let hits = [];

const cursorDot = document.createElement('div');
const cursorRing = document.createElement('div');
cursorDot.className = 'cursor-dot';
cursorRing.className = 'cursor-ring';
document.body.append(cursorDot, cursorRing);
cursorDot.hidden = true;
cursorRing.hidden = true;
let cursorRingX = innerWidth / 2;
let cursorRingY = innerHeight / 2;
let cursorTargetX = cursorRingX;
let cursorTargetY = cursorRingY;
const buttonMotion = new Map();
let pressedButton = null;

function animateCursor() {
  cursorRingX += (cursorTargetX - cursorRingX) * .38;
  cursorRingY += (cursorTargetY - cursorRingY) * .38;
  cursorRing.style.left = cursorRingX + 'px';
  cursorRing.style.top = cursorRingY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();


// ---------- KEY PRESS LISTENERS ----------
addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
  if (scene.key) scene.key(e.key.toLowerCase());
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });


// ---------- MOUSE / CLICK LISTENERS ----------
function toLogical(e) {
  const r = cv.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * dpr - ox) / sc, y: ((e.clientY - r.top) * dpr - oy) / sc };
}
cv.addEventListener('pointermove', e => {
  const p = toLogical(e);
  mouse.x = p.x; mouse.y = p.y; mouse.active = true;
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
  cursorTargetX = e.clientX;
  cursorTargetY = e.clientY;
  const hovering = hits.some(h =>
    p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h
  );
  cursorDot.classList.toggle('is-hovering', hovering);
  cursorRing.classList.toggle('is-hovering', hovering);
});
cv.addEventListener('pointerenter', () => {
  cursorDot.hidden = false;
  cursorRing.hidden = false;
});
cv.addEventListener('pointerleave', () => {
  cursorDot.hidden = true;
  cursorRing.hidden = true;
  cursorDot.classList.remove('is-hovering', 'is-clicking');
  cursorRing.classList.remove('is-hovering', 'is-clicking');
});
cv.addEventListener('pointerdown', e => {
  const p = toLogical(e); mouse.x = p.x; mouse.y = p.y;
  cursorDot.classList.add('is-clicking');
  cursorRing.classList.add('is-clicking');
  for (let i = hits.length - 1; i >= 0; i--) {          // top-most button first
    const h = hits[i];
    if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) {
      pressedButton = h.key;
      h.fn();
      setTimeout(() => { pressedButton = null; }, 150);
      return;
    }
  }
  setTimeout(() => { pressedButton = null; }, 150);
  if (scene.click) scene.click(p.x, p.y);
});
addEventListener('pointerup', () => {
  cursorDot.classList.remove('is-clicking');
  cursorRing.classList.remove('is-clicking');
});


// ---------- BUTTON HELPER (draws a button + registers its click area) ----------
function btn(x, y, w, h, label, fn, size = 16) {
  const key = `${x}:${y}:${w}:${h}:${label}`;
  hits.push({ x, y, w, h, fn, key });
  const hover = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
  const pressing = pressedButton === key;
  let scale = buttonMotion.get(key) ?? 1;
  scale += ((hover ? 1.045 : 1) * (pressing ? .955 : 1) - scale) * .28;
  buttonMotion.set(key, scale);

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.translate(0, hover ? -2 + Math.sin(performance.now() / 140) * 1.25 : 0);
  ctx.shadowColor = hover ? 'rgba(168,85,247,.72)' : 'rgba(0,0,0,.38)';
  ctx.shadowBlur = hover ? 18 : 7;
  ctx.shadowOffsetY = hover ? 8 : 4;

  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, hover ? '#747fff' : '#505aca');
  gradient.addColorStop(1, hover ? '#5b21b6' : '#30398f');
  ctx.fillStyle = gradient;
  rr(x, y, w, h, 8); ctx.fill();

  ctx.shadowColor = 'rgba(255,255,255,.35)';
  ctx.shadowBlur = hover ? 8 : 0;
  ctx.strokeStyle = hover ? 'rgba(255,255,255,.48)' : 'rgba(255,255,255,.12)';
  ctx.lineWidth = 1;
  rr(x + .5, y + .5, w - 1, h - 1, 8); ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff'; ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

// ---------- DRAWING HELPERS (rounded rectangle, text) ----------
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function text(str, x, y, size = 18, color = '#fff', align = 'center') {
  ctx.fillStyle = color; ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y);
}

//#endregion


//#region PART 4 - THE FOUR MINI-GAMES
/* =========================================================
   PART 4 - THE FOUR MINI-GAMES
   Each game is a factory: game(finish) returns an object with
   update(dt), draw(), and optionally key()/click().
   When the game ends it calls finish(score).
   ========================================================= */



//#region GAME 1 OF 4 - SNAKE
/* ############################################################
   ##  GAME 1 OF 4: SNAKE
   ##  Grid game. Eat food, avoid walls and your own tail.
   ############################################################ */
function snakeGame(finish) {
  const N = 20, C = 20, BX = 200, BY = 50;
  let body = [{ x: 10, y: 10 }], dir = { x: 1, y: 0 }, nd = dir, t = 0, score = 0, over = false;
  const rf = () => {
    let f; do { f = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
    while (body.some(b => b.x === f.x && b.y === f.y)); return f;
  };
  let food = rf();
  return {
    key(k) {
      const m = { arrowup: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1], arrowleft: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0] }[k];
      if (m && !(m[0] === -dir.x && m[1] === -dir.y)) nd = { x: m[0], y: m[1] };
    },
    update(dt) {
      if (over) return;
      t += dt;
      if (t < 0.11) return;
      t = 0; dir = nd;
      const h = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || body.some(b => b.x === h.x && b.y === h.y)) {
        over = true; finish(score); return;
      }
      body.unshift(h);
      if (h.x === food.x && h.y === food.y) { score += 10; food = rf(); } else body.pop();
    },
    draw() {
      ctx.fillStyle = '#10142a'; ctx.fillRect(BX, BY, N * C, N * C);
      ctx.fillStyle = '#ff5470'; ctx.fillRect(BX + food.x * C + 2, BY + food.y * C + 2, C - 4, C - 4);
      body.forEach((b, i) => { ctx.fillStyle = i ? '#4ade80' : '#a7f3d0'; ctx.fillRect(BX + b.x * C + 1, BY + b.y * C + 1, C - 2, C - 2); });
      text('Score: ' + score, 400, 25, 20);
      text('Arrows / WASD', 400, 470, 14, '#889');
    }
  };
}

//#endregion


//#region GAME 2 OF 4 - STAR CATCHER
/* ############################################################
   ##  GAME 2 OF 4: STAR CATCHER
   ##  Catch falling stars, dodge bombs. 3 lives.
   ############################################################ */
function catchGame(finish) {
  let px = 400, items = [], lives = 3, score = 0, spawn = 0, over = false;
  return {
    update(dt) {
      if (over) return;
      if (keys['arrowleft'] || keys['a']) { px -= 420 * dt; mouse.active = false; }
      else if (keys['arrowright'] || keys['d']) { px += 420 * dt; mouse.active = false; }
      else if (mouse.active) px += (mouse.x - px) * Math.min(1, dt * 12);
      px = Math.max(50, Math.min(W - 50, px));
      spawn -= dt;
      if (spawn <= 0) {
        spawn = Math.max(0.3, 0.9 - score / 500);
        items.push({ x: 30 + Math.random() * (W - 60), y: -10, bad: Math.random() < 0.2, v: 140 + score * 0.5 });
      }
      for (const it of items) it.y += it.v * dt;
      items = items.filter(it => {
        if (it.y > 455 && it.y < 490 && Math.abs(it.x - px) < 55) {
          if (it.bad) lives--; else score += 10;
          return false;
        }
        if (it.y > 520) { if (!it.bad) lives--; return false; }
        return true;
      });
      if (lives <= 0) { over = true; finish(score); }
    },
    draw() {
      ctx.fillStyle = '#e5e7eb'; rr(px - 50, 470, 100, 14, 6); ctx.fill();
      for (const it of items) text(it.bad ? '💣' : '⭐', it.x, it.y, 26);
      text('Score: ' + score + '   Lives: ' + '❤'.repeat(Math.max(0, lives)), 400, 25, 20);
    }
  };
}

//#endregion


//#region GAME 3 OF 4 - TARGET RUSH
/* ############################################################
   ##  GAME 3 OF 4: TARGET RUSH
   ##  Click targets for 30 seconds. Misses cost points.
   ############################################################ */
function targetGame(finish) {
  let time = 30, score = 0, over = false, tg;
  const make = () => {
    const r = Math.max(15, 40 - score / 20);
    tg = { x: 60 + Math.random() * (W - 120), y: 70 + Math.random() * (H - 200), r, life: 1.3 };
  };
  make();
  return {
    update(dt) {
      if (over) return;
      time -= dt; tg.life -= dt;
      if (tg.life <= 0) make();
      if (time <= 0) { over = true; finish(score); }
    },
    click(x, y) {
      if (over) return;
      if (Math.hypot(x - tg.x, y - tg.y) <= tg.r) { score += 10; make(); }
      else score = Math.max(0, score - 5);
    },
    draw() {
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.55, 0, 7); ctx.fill();
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.2, 0, 7); ctx.fill();
      text('Score: ' + score + '   Time: ' + Math.max(0, time).toFixed(1), 400, 25, 20);
    }
  };
}

//#endregion


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


// ---------- GAME REGISTRY (the menu and turn logic use these lists) ----------
const FACTORY = { snake: snakeGame, catch: catchGame, target: targetGame, runner: runnerGame };
const HINTS = {
  snake: 'Eat food, avoid walls and yourself. Arrows / WASD.',
  catch: 'Catch stars, dodge bombs. 3 lives. Mouse or arrows.',
  target: 'Click targets for 30 seconds. Misses cost points.',
  runner: 'Run! A/D or arrows = lane, W/Up/Space = jump, S/Down = slide. Grab coins and power-ups.'
};

//#endregion


//#region PART 5 - MULTIPLAYER (local hot-seat)
/* =========================================================
   PART 5 - MULTIPLAYER (local hot-seat)
   "Versus" mode: Player 1 plays, then Player 2 plays on the
   same computer, then scores are compared. Each profile has
   its own best scores + coins saved in the local save file.
   ========================================================= */
// ---------- TURN / RESULT STATE ----------
let turns = [], results = [], currentGame = null;


// ---------- START A GAME (solo or versus) ----------
function startGame(id) {
  currentGame = id;
  turns = S.mode === 'versus' ? [S.p1, S.p2] : [S.p1];
  results = [];
  nextTurn();
}
function nextTurn() {
  const who = turns[results.length];
  scene = readyScene(who);
}

// ---------- GAME OVER: SAVE SCORE, THEN NEXT PLAYER OR RESULTS ----------
function onFinish(who, score) {
  const pl = getPlayer(who);
  if (score > pl.scores[currentGame]) pl.scores[currentGame] = score;
  pl.coins += Math.floor(score / 10);
  results.push({ name: who, score });
  save();
  setTimeout(() => { scene = results.length < turns.length ? readyScene(turns[results.length]) : resultsScene(); }, 900);
}

//#endregion


//#region PART 6 - SCENES (menu, ready screen, playing, results,
/* =========================================================
   PART 6 - SCENES (menu, ready screen, playing, results,
   leaderboard). `scene` is whichever one is active.
   ========================================================= */
// ---------- 'scene' = WHICHEVER SCREEN IS ACTIVE ----------
let scene;


/* ############################################################
   ##  SCENE: MAIN MENU
   ##  Player names, mode switch, game buttons, leaderboard, export/import.
   ############################################################ */
function menuScene() {
  return {
    update() {},
    draw() {
      if (menuBackground.complete && menuBackground.naturalWidth > 0) {
        const scale = Math.max(W / menuBackground.naturalWidth, H / menuBackground.naturalHeight);
        const width = menuBackground.naturalWidth * scale;
        const height = menuBackground.naturalHeight * scale;
        ctx.drawImage(menuBackground, (W - width) / 2, (H - height) / 2, width, height);
      }
      btn(150, 100, 240, 36, 'Player 1: ' + S.p1, () => { setName('p1'); }, 15);
      if (S.mode === 'versus') btn(410, 100, 240, 36, 'Player 2: ' + S.p2, () => { setName('p2'); }, 15);
      btn(250, 145, 300, 32, S.mode === 'solo' ? 'Mode: Solo' : 'Mode: Versus (2P, same PC)', () => { S.mode = S.mode === 'solo' ? 'versus' : 'solo'; save(); }, 14);
      GAMES.forEach((g, i) => {
        const x = i % 2 ? 410 : 150, y = 200 + Math.floor(i / 2) * 75;
        btn(x, y, 240, 62, g.name + '  (best ' + getPlayer(S.p1).scores[g.id] + ')', () => startGame(g.id), 16);
      });
      btn(150, 355, 150, 34, 'Leaderboard', () => { scene = leaderboardScene(); }, 14);
      btn(325, 355, 150, 34, 'Export save', exportSave, 14);
      btn(500, 355, 150, 34, 'Import save', () => document.getElementById('importFile').click(), 14);
      text('Saves stay on this computer (browser localStorage).', 300, 405, 13, '#889');
    }
  };
}


// ---------- HELPER: CHANGE A PLAYER NAME ----------
function setName(slot) {
  const n = (prompt('Enter a player name (new or existing):', S[slot]) || '').trim().slice(0, 12);
  if (n) { S[slot] = n; getPlayer(n); save(); }
}


/* ############################################################
   ##  SCENE: READY SCREEN
   ##  Shows the game name and hint, Start button begins the game.
   ############################################################ */
function readyScene(who) {
  return {
    update() {}, draw() {
      const g = GAMES.find(x => x.id === currentGame);
      text(g.name, 400, 130, 40, '#fbbf24');
      text(HINTS[currentGame], 400, 190, 18);
      text('Get ready, ' + who + '!', 400, 250, 26);
      btn(300, 300, 200, 50, 'Start', () => {
        const game = FACTORY[currentGame](s => onFinish(who, s));
        scene = {
          update: dt => game.update(dt), draw: () => { game.draw(); btn(10, 10, 70, 28, 'Quit', () => { scene = menuScene(); }, 13); },
          key: k => game.key && game.key(k), click: (x, y) => game.click && game.click(x, y)
        };
      }, 20);
    }
  };
}


/* ############################################################
   ##  SCENE: RESULTS
   ##  Shows scores (and the winner in versus mode).
   ############################################################ */
function resultsScene() {
  return {
    update() {}, draw() {
      text('Results - ' + GAMES.find(x => x.id === currentGame).name, 400, 90, 32, '#fbbf24');
      results.forEach((r, i) => text(r.name + ': ' + r.score, 400, 160 + i * 40, 26));
      if (results.length === 2) {
        const [a, b] = results;
        text(a.score === b.score ? "It's a tie!" : (a.score > b.score ? a.name : b.name) + ' wins!', 400, 270, 30, '#4ade80');
      }
      btn(240, 340, 150, 44, 'Play again', () => startGame(currentGame), 16);
      btn(410, 340, 150, 44, 'Menu', () => { scene = menuScene(); }, 16);
    }
  };
}


/* ############################################################
   ##  SCENE: LEADERBOARD
   ##  Best scores of every saved player.
   ############################################################ */
function leaderboardScene() {
  return {
    update() {}, draw() {
      text('Leaderboard (best scores)', 400, 40, 28, '#fbbf24');
      text('Player', 110, 85, 15, '#aab', 'left');
      GAMES.forEach((g, i) => text(g.name, 300 + i * 110, 85, 15, '#aab'));
      Object.keys(S.players).slice(0, 10).forEach((n, r) => {
        text(n, 110, 115 + r * 26, 16, '#fff', 'left');
        GAMES.forEach((g, i) => text(String(S.players[n].scores[g.id] ?? 0), 300 + i * 110, 115 + r * 26, 16));
      });
      btn(10, 10, 70, 28, 'Back', () => { scene = menuScene(); }, 13);
    }
  };
}


/* ############################################################
   ##  EXPORT / IMPORT SAVE FILE
   ##  Copy the save to a .json file, or load one back in.
   ############################################################ */
function exportSave() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
  a.download = 'mini-arcade-save.json'; a.click(); URL.revokeObjectURL(a.href);
}
document.getElementById('importFile').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d.players) throw 0;
      Object.assign(S.players, d.players); save(); alert('Save imported!');
    } catch (err) { alert('That file is not a valid save.'); }
  };
  rd.readAsText(f); e.target.value = '';
});

//#endregion


//#region PART 7 - DIGITAL PET
/* =========================================================
   PART 7 - DIGITAL PET
   Belongs to Player 1's profile. Hunger and joy slowly drop
   in real time (and a little while the game was closed).
   Click the pet to cheer it up, press Feed (5 coins) to feed.
   Coins are earned from game scores.
   ========================================================= */
// ---------- PET STATE ----------
let petT = 0, hop = 0, saveT = 0;
const pet = () => getPlayer(S.p1).pet;


// ---------- PET: CATCH UP ON TIME PASSED WHILE THE GAME WAS CLOSED ----------
(function offlineDecay() {            // apply time passed since last visit (max 1 hour)
  const p = pet(), el = Math.min((Date.now() - p.last) / 1000, 3600);
  p.hunger = Math.max(0, p.hunger - el * 0.05); p.joy = Math.max(0, p.joy - el * 0.03);
})();


// ---------- PET: DRAIN HUNGER AND JOY EVERY FRAME ----------
function tickPet(dt) {
  const p = pet();
  p.hunger = Math.max(0, p.hunger - dt * 0.4);
  p.joy = Math.max(0, p.joy - dt * 0.25);
  p.last = Date.now(); petT += dt; hop = Math.max(0, hop - dt * 3);
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
}


// ---------- PET: DRAW THE PET + FEED BUTTON ----------
function drawPet() {
  const p = pet(), pl = getPlayer(S.p1), mood = (p.hunger + p.joy) / 2;
  const px = 680, py = 462 - Math.sin(petT * 3) * 3 - Math.sin(hop * Math.PI) * 18;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(640, 410, 160, 90, 10); ctx.fill();
  hits.push({ x: 646, y: 428, w: 68, h: 68, fn: () => { p.joy = Math.min(100, p.joy + 8); hop = 1; } });  // click pet
  ctx.fillStyle = `hsl(${mood * 1.2}, 70%, 60%)`;
  ctx.beginPath(); ctx.ellipse(px, py, 28, 24, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(px - 9, py - 5, 3.5, 0, 7); ctx.arc(px + 9, py - 5, 3.5, 0, 7); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath();
  const s = (mood - 50) / 50 * 8;   // happy = smile, sad = frown
  ctx.moveTo(px - 8, py + 8); ctx.quadraticCurveTo(px, py + 8 + s, px + 8, py + 8); ctx.stroke();
  text(p.name, 680, 420, 12, '#fff');
  bar(718, 424, p.hunger, '#f97316', 'Food'); bar(718, 442, p.joy, '#38bdf8', 'Joy');
  btn(718, 462, 74, 22, 'Feed 5c', () => {
    if (pl.coins >= 5) { pl.coins -= 5; p.hunger = Math.min(100, p.hunger + 25); p.joy = Math.min(100, p.joy + 3); hop = 1; save(); }
  }, 12);
  text('Coins: ' + pl.coins, 756, 492, 11, '#fbbf24');
}

// ---------- PET: STAT BAR HELPER ----------
function bar(x, y, v, color, label) {
  ctx.fillStyle = '#333'; ctx.fillRect(x, y, 74, 8);
  ctx.fillStyle = color; ctx.fillRect(x, y, 74 * v / 100, 8);
  text(label, x + 37, y + 14, 9, '#ccc');
}

//#endregion


//#region PART 8 - MAIN LOOP
/* =========================================================
   PART 8 - MAIN LOOP
   Clear -> update -> draw scene -> draw pet on top.
   ========================================================= */
// ---------- START ON THE MENU, THEN RUN THE LOOP ----------
scene = menuScene();
let last = performance.now();

// ---------- ONE FRAME: clear, update, draw, repeat ----------
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);       // letterbox bars
  ctx.setTransform(sc, 0, 0, sc, ox, oy);
  hits = [];
  scene.update(dt); tickPet(dt);
  scene.draw();
  drawPet();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
//#endregion
