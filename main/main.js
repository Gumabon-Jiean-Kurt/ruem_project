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
const PALETTE = Object.freeze({
  plum: '#38283F',
  cotton: '#F4D9EE',
  bubblegum: '#DCA6E9',
  red: '#E94E70',
  butter: '#FFD66E',
  vanilla: '#FFF5E9'
});
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const gameFrame = document.getElementById('gameFrame');
let sc = 1, ox = 0, oy = 0, dpr = 1;
const menuBackground = new Image();
menuBackground.src = 'assets/ruem-arcade.gif';

function isPortraitLayout() {
  return cv.height > cv.width;
}

function logicalHeight() {
  return cv.height / sc;
}

function mobileUnits(cssPixels) {
  return cssPixels * dpr / sc;
}

function mobileTapSize() {
  return Math.max(88, mobileUnits(44));
}

function mobileSafeInset(side) {
  const value = parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue(`--safe-area-${side}`)) || 0;
  return (value + 12) * dpr / sc;
}

function mobileTopInset() {
  return Math.max(28, mobileSafeInset('top'));
}

function mobileBottomInset() {
  return Math.max(24, mobileSafeInset('bottom'));
}

function resize() {
  dpr = window.devicePixelRatio || 1;
  const box = cv.getBoundingClientRect();                 // the size the CSS gave the canvas
  cv.width = Math.max(1, Math.floor(box.width * dpr));
  cv.height = Math.max(1, Math.floor(box.height * dpr));
  const portrait = cv.height > cv.width;
  sc = portrait ? cv.width / W : Math.min(cv.width / W, cv.height / H);
  ox = (cv.width - W * sc) / 2;
  oy = portrait ? 0 : (cv.height - H * sc) / 2;
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
  { id: 'runner', name: 'Sweet Runner' },
  { id: 'smash',  name: 'Badminton Smash' },
];
const HINTS = {
  catch: 'Drag to move, catch stars, and dodge bombs. 3 lives.',
  target: 'Tap or click targets for 30 seconds. Misses cost points.',
  runner: 'Use touch controls or arrows to dodge candy and collect boosts.',
  smash: 'Tap the court to move; tap HIT, SMASH, or DROP to return.'
};


// ---------- LOAD / SAVE FUNCTIONS ----------
let petCatalogOpen = false;

function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && d.players) return d;
  } catch (e) {}
  return { players: {}, p1: null, p2: null, mode: 'solo' };
}
function save() {
  if (petCatalogOpen) return;
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}


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
function btn(x, y, w, h, label, fn, size = 16, variant = 'soft') {
  const key = `${x}:${y}:${w}:${h}:${label}`;
  hits.push({ x, y, w, h, fn, key });
  const hover = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
  const pressing = pressedButton === key;
  const styles = {
    soft: [PALETTE.vanilla, PALETTE.cotton, PALETTE.plum],
    primary: [PALETTE.vanilla, PALETTE.butter, PALETTE.plum],
    accent: [PALETTE.bubblegum, PALETTE.red, PALETTE.vanilla]
  };
  const [top, bottom, labelColor] = styles[variant] || styles.soft;
  let scale = buttonMotion.get(key) ?? 1;
  scale += ((hover ? 1.045 : 1) * (pressing ? .955 : 1) - scale) * .28;
  buttonMotion.set(key, scale);

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.translate(0, hover ? -2 + Math.sin(performance.now() / 140) * 1.25 : 0);
  ctx.shadowColor = hover ? 'rgba(233,78,112,.32)' : 'rgba(56,40,63,.22)';
  ctx.shadowBlur = hover ? 12 : 5;
  ctx.shadowOffsetY = hover ? 5 : 3;

  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  const radius = Math.min(h / 2, 18);
  rr(x, y, w, h, radius); ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = PALETTE.plum;
  ctx.lineWidth = 2;
  rr(x + 1, y + 1, w - 2, h - 2, radius); ctx.stroke();

  ctx.fillStyle = 'rgba(255,245,233,.55)';
  rr(x + 6, y + 3, w - 12, Math.max(3, h * .2), Math.min(7, h * .12)); ctx.fill();

  ctx.fillStyle = labelColor; ctx.font = `bold ${size}px sans-serif`;
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
function text(str, x, y, size = 18, color = PALETTE.plum, align = 'center') {
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
  petCatalogOpen = false;
  activePlayer = who;
  cv.hidden = true;
  gameFrame.hidden = false;
  gameFrame.src = 'games/' + currentGame + '/index.html';
}

function launchPetCatalog() {
  petCatalogOpen = true;
  activePlayer = null;
  cv.hidden = true;
  gameFrame.hidden = false;
  gameFrame.src = 'pet/index.html';
}

addEventListener('message', e => {
  if (e.source !== gameFrame.contentWindow || !e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'arcade:quit') {
    const wasPetCatalogOpen = petCatalogOpen;
    petCatalogOpen = false;
    if (wasPetCatalogOpen) Object.assign(S, loadSave());
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
function mobileMenuLayout() {
  const tapSize = mobileTapSize();
  const fontSize = Math.max(18, mobileUnits(16));
  const height = logicalHeight();
  const bannerHeight = Math.max(58, mobileUnits(42));
  let y = mobileTopInset() + bannerHeight + mobileUnits(10);
  const player1Y = y;
  y += tapSize + mobileUnits(12);
  const player2Y = S.mode === 'versus' ? y : null;
  if (player2Y !== null) y += tapSize + mobileUnits(12);
  const modeY = y;
  y += tapSize + mobileUnits(26);
  const gameHeadingY = y + 10;
  const gamesY = y + 38;
  const gameGap = mobileUnits(12);
  const secondGameY = gamesY + tapSize + gameGap;
  const gamesBottom = secondGameY + tapSize;
  const actionGap = mobileUnits(14);
  const actionRowsHeight = 2 * tapSize + actionGap;
  const candidatePetHeight = height >= 1350 ? Math.max(160, tapSize + mobileUnits(24)) : 0;
  const candidatePetY = gamesBottom + mobileUnits(22);
  const candidateActionsY = candidatePetY + candidatePetHeight + mobileUnits(22);
  const petHeight = candidateActionsY + actionRowsHeight <= height - mobileBottomInset()
    ? candidatePetHeight
    : 0;
  const petY = petHeight ? candidatePetY : 0;
  const desiredActionsY = petHeight ? candidateActionsY : gamesBottom + mobileUnits(22);
  const actionsY = Math.min(desiredActionsY, height - mobileBottomInset() - actionRowsHeight);
  return {
    tapSize, fontSize, bannerHeight, bannerY: mobileTopInset(), player1Y,
    player2Y, modeY, gameHeadingY, gamesY, secondGameY, petHeight, petY, actionsY, actionGap
  };
}

function drawArcadeBanner(x, y, width, height, fontSize) {
  ctx.save();
  ctx.shadowColor = 'rgba(56,40,63,.24)';
  ctx.shadowBlur = 12;
  const fill = ctx.createLinearGradient(x, y, x + width, y + height);
  fill.addColorStop(0, PALETTE.vanilla);
  fill.addColorStop(1, PALETTE.bubblegum);
  ctx.fillStyle = fill;
  rr(x, y, width, height, Math.min(20, height / 2));
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = PALETTE.plum;
  ctx.lineWidth = 2;
  rr(x + 1, y + 1, width - 2, height - 2, Math.min(19, height / 2));
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PALETTE.red;
  ctx.font = `${fontSize}px "Chewy", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("Ruem's Arcade", x + width / 2, y + height / 2);
}

function menuScene() {
  return {
    mobilePet: true,
    update() {},
    draw() {
      if (menuBackground.complete && menuBackground.naturalWidth > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const scale = Math.max(cv.width / menuBackground.naturalWidth, cv.height / menuBackground.naturalHeight);
        const width = menuBackground.naturalWidth * scale;
        const height = menuBackground.naturalHeight * scale;
        ctx.drawImage(menuBackground, (cv.width - width) / 2, (cv.height - height) / 2, width, height);
        ctx.restore();
      }
      if (isPortraitLayout()) {
        const layout = mobileMenuLayout();
        const { tapSize, fontSize, actionsY, actionGap } = layout;
        drawArcadeBanner(30, layout.bannerY, 740, layout.bannerHeight,
          Math.max(26, mobileUnits(24)));
        btn(30, layout.player1Y, 740, tapSize, 'Player 1: ' + S.p1, () => { setName('p1'); }, fontSize);
        if (layout.player2Y !== null) {
          btn(30, layout.player2Y, 740, tapSize, 'Player 2: ' + S.p2, () => { setName('p2'); }, fontSize);
        }
        btn(30, layout.modeY, 740, tapSize, S.mode === 'solo' ? 'Mode: Solo' : 'Mode: Versus', () => {
          S.mode = S.mode === 'solo' ? 'versus' : 'solo';
          save();
        }, fontSize);
        text('Choose a game', 400, layout.gameHeadingY,
          Math.max(22, mobileUnits(20)), PALETTE.plum);
        GAMES.forEach((g, i) => {
          const x = i % 2 === 0 ? 30 : 415;
          const y = i < 2 ? layout.gamesY : layout.secondGameY;
          btn(x, y, 355, tapSize, g.name, () => startGame(g.id), fontSize, 'primary');
        });
        const actionWidth = 355;
        btn(30, actionsY, actionWidth, tapSize, "Ruem's Closet", launchPetCatalog, fontSize, 'accent');
        btn(415, actionsY, actionWidth, tapSize, 'Leaderboard', () => { scene = leaderboardScene(); }, fontSize);
        btn(30, actionsY + tapSize + actionGap, actionWidth, tapSize, 'Export save', exportSave, fontSize);
        btn(415, actionsY + tapSize + actionGap, actionWidth, tapSize, 'Import save', () => {
          document.getElementById('importFile').click();
        }, fontSize);
        return;
      }
      drawArcadeBanner(250, 20, 300, 48, 28);
      btn(150, 100, 240, 36, 'Player 1: ' + S.p1, () => { setName('p1'); }, 15);
      if (S.mode === 'versus') btn(410, 100, 240, 36, 'Player 2: ' + S.p2, () => { setName('p2'); }, 15);
      btn(250, 145, 300, 32, S.mode === 'solo' ? 'Mode: Solo' : 'Mode: Versus (2P, same PC)', () => { S.mode = S.mode === 'solo' ? 'versus' : 'solo'; save(); }, 14);
      GAMES.forEach((g, i) => {
        const row = Math.floor(i / 2), column = i % 2;
        const x = 170 + column * 240;
        const y = 190 + row * 75;
        btn(x, y, 220, 58, g.name + '  (best ' + getPlayer(S.p1).scores[g.id] + ')', () => startGame(g.id), 16, 'primary');
      });
      btn(40, 350, 160, 34, "Ruem's Closet", launchPetCatalog, 14, 'accent');
      btn(220, 350, 160, 34, 'Leaderboard', () => { scene = leaderboardScene(); }, 14);
      btn(400, 350, 160, 34, 'Export save', exportSave, 14);
      btn(580, 350, 160, 34, 'Import save', () => document.getElementById('importFile').click(), 14);
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
      if (isPortraitLayout()) {
        const mid = logicalHeight() / 2;
        const size = Math.max(20, mobileUnits(18));
        const hints = {
          catch: 'Drag to move the catcher.',
          target: 'Tap targets to score.',
          runner: 'Tap LEFT, RIGHT, JUMP, or SLIDE.',
          smash: 'Tap to move; tap a shot.'
        };
        text(g.name, 400, mid - 112, Math.max(32, mobileUnits(30)), PALETTE.red);
        text(hints[currentGame], 400, mid - 38, size, PALETTE.plum);
        text('Get ready, ' + who + '!', 400, mid + 20, size + 4);
        btn(70, mid + 78, 660, mobileTapSize(), 'Start', () => {
          launchEmbeddedGame(who);
        }, Math.max(24, mobileUnits(20)), 'primary');
        return;
      }
      text(g.name, 400, 130, 40, PALETTE.red);
      text(HINTS[currentGame], 400, 190, 18, PALETTE.plum);
      text('Get ready, ' + who + '!', 400, 250, 26);
      btn(300, 300, 200, 50, 'Start', () => {
        launchEmbeddedGame(who);
      }, 20, 'primary');
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
      if (isPortraitLayout()) {
        const mid = logicalHeight() / 2;
        const size = Math.max(22, mobileUnits(18));
        text('Results - ' + GAMES.find(x => x.id === currentGame).name, 400, mid - 180,
          Math.max(28, mobileUnits(26)), PALETTE.red);
        results.forEach((r, i) => text(r.name + ': ' + r.score, 400, mid - 95 + i * 54, size));
        if (results.length === 2) {
          const [a, b] = results;
          text(a.score === b.score ? "It's a tie!" : (a.score > b.score ? a.name : b.name) + ' wins!',
            400, mid + 28, size + 2, PALETTE.red);
        }
        btn(30, mid + 90, 355, mobileTapSize(), 'Play again', () => startGame(currentGame),
          Math.max(20, mobileUnits(16)), 'primary');
        btn(415, mid + 90, 355, mobileTapSize(), 'Menu', () => { scene = menuScene(); },
          Math.max(20, mobileUnits(16)));
        return;
      }
      text('Results - ' + GAMES.find(x => x.id === currentGame).name, 400, 90, 32, PALETTE.red);
      results.forEach((r, i) => text(r.name + ': ' + r.score, 400, 160 + i * 40, 26));
      if (results.length === 2) {
        const [a, b] = results;
        text(a.score === b.score ? "It's a tie!" : (a.score > b.score ? a.name : b.name) + ' wins!', 400, 270, 30, PALETTE.red);
      }
      btn(240, 340, 150, 44, 'Play again', () => startGame(currentGame), 16, 'primary');
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
      if (isPortraitLayout()) {
        const size = Math.max(18, mobileUnits(14));
        text('Leaderboard', 400, 55, Math.max(26, mobileUnits(22)), PALETTE.red);
        text('Player', 40, 115, size, PALETTE.plum, 'left');
        GAMES.forEach((g, i) => text(g.name, 250 + i * 135, 115, Math.max(14, mobileUnits(12)), PALETTE.plum));
        Object.keys(S.players).slice(0, 10).forEach((n, r) => {
          const y = 160 + r * 42;
          text(n, 40, y, size, PALETTE.plum, 'left');
          GAMES.forEach((g, i) => text(String(S.players[n].scores[g.id] ?? 0), 250 + i * 135, y, size));
        });
        btn(70, logicalHeight() - mobileBottomInset() - mobileTapSize(), 660, mobileTapSize(), 'Back',
          () => { scene = menuScene(); }, Math.max(20, mobileUnits(16)));
        return;
      }
      text('Leaderboard (best scores)', 400, 40, 28, PALETTE.red);
      text('Player', 110, 85, 15, PALETTE.plum, 'left');
      GAMES.forEach((g, i) => text(g.name, 300 + i * 110, 85, 15, PALETTE.plum));
      Object.keys(S.players).slice(0, 10).forEach((n, r) => {
        text(n, 110, 115 + r * 26, 16, PALETTE.plum, 'left');
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
let petModelImage = null, petModelSignature = '', petModelReady = false;
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
function updatePetModel(p) {
  const equipped = p.wardrobe && p.wardrobe.equipped || {};
  const expression = p.joy < 25 ? 'sad' : p.joy > 85 ? 'excited' : 'happy';
  const signature = JSON.stringify(equipped) + ':' + expression;
  if (signature === petModelSignature) return;
  petModelSignature = signature;
  const image = new Image();
  image.onload = () => { petModelImage = image; petModelReady = true; };
  image.onerror = () => {
    petModelReady = false;
    console.error('Could not render Ruem’s pet model.');
  };
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.RuemPetModel.render(equipped, p.joy));
}

function drawPet() {
  const p = pet(), pl = getPlayer(S.p1), mood = (p.hunger + p.joy) / 2;
  updatePetModel(p);
  if (isPortraitLayout()) {
    if (scene.mobilePet) drawMobilePet(p, pl, mood);
    return;
  }
  const px = 680, py = 250 - Math.sin(petT * 3) * 3 - Math.sin(hop * Math.PI) * 18;
  ctx.save();
  ctx.shadowColor = 'rgba(220,166,233,.32)'; ctx.shadowBlur = 12;
  const panel = ctx.createLinearGradient(640, 170, 800, 330);
  panel.addColorStop(0, PALETTE.vanilla); panel.addColorStop(1, PALETTE.cotton);
  ctx.fillStyle = panel; rr(640, 170, 160, 160, 16); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = PALETTE.plum; ctx.lineWidth = 2;
  rr(641, 171, 158, 158, 16); ctx.stroke();
  ctx.restore();
  hits.push({ x: 646, y: 214, w: 68, h: 68, fn: () => { p.joy = Math.min(100, p.joy + 8); hop = 1; } });
  if (petModelReady) ctx.drawImage(petModelImage, px - 35, py - 38, 70, 76);
  else {
    ctx.save();
    ctx.font = '48px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = `hsla(${mood * 1.2},70%,60%,.7)`; ctx.shadowBlur = 15;
    ctx.fillText('🐶', px, py);
    ctx.restore();
  }
  text(p.name, 680, 188, 12, PALETTE.plum);
  bar(718, 202, p.hunger, PALETTE.red, 'Food'); bar(718, 228, p.joy, PALETTE.butter, 'Joy');
  btn(718, 258, 74, 22, 'Feed 5c', () => {
    if (pl.coins >= 5) { pl.coins -= 5; p.hunger = Math.min(100, p.hunger + 25); p.joy = Math.min(100, p.joy + 3); hop = 1; save(); }
  }, 12, 'primary');
  text('Coins: ' + pl.coins, 756, 300, 11, PALETTE.plum);
}

function drawMobilePet(p, pl, mood) {
  const layout = mobileMenuLayout();
  if (!layout.petHeight) return;
  const x = 30, y = layout.petY, panelHeight = layout.petHeight;
  ctx.save();
  ctx.shadowColor = 'rgba(220,166,233,.32)'; ctx.shadowBlur = 12;
  const panel = ctx.createLinearGradient(x, y, x + 740, y + panelHeight);
  panel.addColorStop(0, PALETTE.vanilla); panel.addColorStop(1, PALETTE.cotton);
  ctx.fillStyle = panel; rr(x, y, 740, panelHeight, 22); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = PALETTE.plum; ctx.lineWidth = 3;
  rr(x + 1.5, y + 1.5, 737, panelHeight - 3, 21); ctx.stroke();
  ctx.restore();

  hits.push({ x: x + 16, y: y + 8, w: 132, h: panelHeight - 16,
    fn: () => { p.joy = Math.min(100, p.joy + 8); hop = 1; } });
  const petSize = Math.min(132, panelHeight - 24);
  if (petModelReady) ctx.drawImage(petModelImage, x + 20, y + (panelHeight - petSize) / 2, petSize, petSize);
  else {
    ctx.save();
    ctx.font = `${Math.max(28, mobileUnits(48))}px "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = `hsla(${mood * 1.2},70%,60%,.7)`; ctx.shadowBlur = 15;
    ctx.fillText('🐶', x + 20 + petSize / 2, y + panelHeight / 2);
    ctx.restore();
  }

  const fontSize = Math.max(20, mobileUnits(14));
  text(p.name, x + 175, y + 28, fontSize, PALETTE.plum, 'left');
  const drawMobileBar = (top, value, color, label) => {
    text(`${label} ${Math.round(value)}%`, x + 175, top, fontSize - 4, PALETTE.plum, 'left');
    ctx.fillStyle = PALETTE.bubblegum;
    rr(x + 175, top + 8, 225, 12, 6); ctx.fill();
    ctx.fillStyle = color;
    rr(x + 175, top + 8, 225 * value / 100, 12, 6); ctx.fill();
  };
  drawMobileBar(y + 64, p.hunger, PALETTE.red, 'Food');
  drawMobileBar(y + 108, p.joy, PALETTE.butter, 'Joy');
  btn(x + 520, y + 24, 200, layout.tapSize, 'Feed 5c', () => {
    if (pl.coins >= 5) {
      pl.coins -= 5;
      p.hunger = Math.min(100, p.hunger + 25);
      p.joy = Math.min(100, p.joy + 3);
      hop = 1;
      save();
    }
  }, layout.fontSize, 'primary');
  text('Coins: ' + pl.coins, x + 620, y + panelHeight - 12, fontSize - 4, PALETTE.plum);
}

// ---------- PET: STAT BAR HELPER ----------
function bar(x, y, v, color, label) {
  ctx.fillStyle = PALETTE.bubblegum; ctx.fillRect(x, y, 74, 8);
  ctx.fillStyle = color; ctx.fillRect(x, y, 74 * v / 100, 8);
  text(label, x + 37, y + 14, 9, PALETTE.plum);
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
