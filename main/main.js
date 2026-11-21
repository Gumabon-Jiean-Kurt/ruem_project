/* ============================================================
   TABLE OF CONTENTS
   PART 1  Canvas setup + resizing
   PART 2  Save system (localStorage)
   PART 3  Input (keyboard, mouse, buttons)
   PART 4  Game pages (games/<game>/)
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
const gameFrame = document.getElementById('gameFrame');
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
  { id: 'catch',  name: 'Star Catcher' },
  { id: 'target', name: 'Target Rush' },
  { id: 'runner', name: 'Ruins Runner' },
  { id: 'smash',  name: 'Badminton Smash' },
];
const HINTS = {
  catch: 'Catch stars, dodge bombs. 3 lives. Mouse or arrows.',
  target: 'Click targets for 30 seconds. Misses cost points.',
  runner: 'Run! A/D or arrows = lane, W/Up/Space = jump, S/Down = slide. Grab coins and power-ups.',
  smash: 'Move with ←/→. Time Space to return; press S for a smash or F for a drop.'
};


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
      scores: { catch: 0, target: 0, runner: 0, smash: 0 },
      coins: 0,
      pet: { name: 'Ruem', hunger: 80, joy: 80, last: Date.now() }
    };
  }
  for (const g of GAMES) if (typeof S.players[name].scores[g.id] !== 'number') S.players[name].scores[g.id] = 0;   // old saves get the new game's slot
  if (S.players[name].pet && S.players[name].pet.name === 'Ruem') S.players[name].pet.name = 'Ruem';
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




//#region PART 5 - MULTIPLAYER (local hot-seat)
/* =========================================================
   PART 5 - MULTIPLAYER (local hot-seat)
   "Versus" mode: Player 1 plays, then Player 2 plays on the
   same computer, then scores are compared. Each profile has
   its own best scores + coins saved in the local save file.
   ========================================================= */
// ---------- TURN / RESULT STATE ----------
let turns = [], results = [], currentGame = null;
let activePlayer = null;


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
  setTimeout(() => {
    gameFrame.hidden = true;
    gameFrame.src = 'about:blank';
    cv.hidden = false;
    resize();
    scene = results.length < turns.length ? readyScene(turns[results.length]) : resultsScene();
  }, 900);
}

//#endregion


//#region PART 6 - SCENES (menu, ready screen, playing, results,
/* =========================================================
   PART 6 - SCENES (menu, ready screen, playing, results,
   leaderboard). `scene` is whichever one is active.
   ========================================================= */
// ---------- 'scene' = WHICHEVER SCREEN IS ACTIVE ----------
let scene;

function launchEmbeddedGame(who) {
  activePlayer = who;
  cv.hidden = true;
  gameFrame.hidden = false;
  gameFrame.src = 'games/' + currentGame + '/index.html';
}

addEventListener('message', e => {
  if (e.source !== gameFrame.contentWindow || !e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'arcade:quit') {
    gameFrame.hidden = true;
    gameFrame.src = 'about:blank';
    cv.hidden = false;
    resize();
    activePlayer = null;
    scene = menuScene();
    return;
  }
  if (e.data.type !== 'arcade:game-over' || activePlayer === null ||
      !Number.isFinite(e.data.score) || e.data.score < 0) return;

  const who = activePlayer;
  activePlayer = null;
  onFinish(who, Math.floor(e.data.score));
});


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
        const row = Math.floor(i / 3), rowStart = row * 3;
        const count = Math.min(3, GAMES.length - rowStart);
        const x = (W - (count * 220 + (count - 1) * 20)) / 2 + (i - rowStart) * 240;
        const y = 190 + row * 75;
        btn(x, y, 220, 58, g.name + '  (best ' + getPlayer(S.p1).scores[g.id] + ')', () => startGame(g.id), 16);
      });
      btn(150, 350, 150, 34, 'Leaderboard', () => { scene = leaderboardScene(); }, 14);
      btn(325, 350, 150, 34, 'Export save', exportSave, 14);
      btn(500, 350, 150, 34, 'Import save', () => document.getElementById('importFile').click(), 14);
      text('Saves stay on this computer (browser localStorage).', 300, 397, 13, '#889');
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
        launchEmbeddedGame(who);
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
  a.download = 'RuemArcade.json'; a.click(); URL.revokeObjectURL(a.href);
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
