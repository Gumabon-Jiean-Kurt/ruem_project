window.RUEM_THEME = Object.freeze({
  plum: '#38283F',
  cotton: '#F4D9EE',
  bubblegum: '#DCA6E9',
  red: '#E94E70',
  butter: '#FFD66E',
  vanilla: '#FFF5E9'
});

const W = 800, H = 500;
const cv = document.getElementById('gameCanvas');
const ctx = cv.getContext('2d');
const keys = Object.create(null);
const mouse = { x: W / 2, y: H / 2, active: false };
let sc = 1, ox = 0, oy = 0, dpr = 1;

function resizeGameCanvas() {
  dpr = window.devicePixelRatio || 1;
  const bounds = cv.getBoundingClientRect();
  cv.width = Math.max(1, Math.floor(bounds.width * dpr));
  cv.height = Math.max(1, Math.floor(bounds.height * dpr));
  sc = Math.min(cv.width / W, cv.height / H);
  ox = (cv.width - W * sc) / 2;
  oy = (cv.height - H * sc) / 2;
}

function toLogical(e) {
  const bounds = cv.getBoundingClientRect();
  return {
    x: ((e.clientX - bounds.left) * dpr - ox) / sc,
    y: ((e.clientY - bounds.top) * dpr - oy) / sc
  };
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(value, x, y, size = 18, color = window.RUEM_THEME.plum, align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

addEventListener('resize', resizeGameCanvas);
resizeGameCanvas();

const cursorDot = document.createElement('div');
const cursorRing = document.createElement('div');
cursorDot.className = 'cursor-dot';
cursorRing.className = 'cursor-ring';
cursorDot.hidden = true;
cursorRing.hidden = true;
document.body.append(cursorDot, cursorRing);

let cursorRingX = innerWidth / 2;
let cursorRingY = innerHeight / 2;
let cursorTargetX = cursorRingX;
let cursorTargetY = cursorRingY;

function animateCursor() {
  cursorRingX += (cursorTargetX - cursorRingX) * .38;
  cursorRingY += (cursorTargetY - cursorRingY) * .38;
  cursorRing.style.left = cursorRingX + 'px';
  cursorRing.style.top = cursorRingY + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  cursorDot.hidden = false;
  cursorRing.hidden = false;
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
  cursorTargetX = e.clientX;
  cursorTargetY = e.clientY;

  const target = e.target instanceof Element ? e.target : null;
  const hovering = target === cv || Boolean(target && target.closest('button'));
  cursorDot.classList.toggle('is-hovering', hovering);
  cursorRing.classList.toggle('is-hovering', hovering);
});

document.documentElement.addEventListener('pointerleave', () => {
  cursorDot.hidden = true;
  cursorRing.hidden = true;
  cursorDot.classList.remove('is-hovering', 'is-clicking');
  cursorRing.classList.remove('is-hovering', 'is-clicking');
});

addEventListener('pointerdown', () => {
  cursorDot.classList.add('is-clicking');
  cursorRing.classList.add('is-clicking');
});
addEventListener('pointerup', () => {
  cursorDot.classList.remove('is-clicking');
  cursorRing.classList.remove('is-clicking');
});
addEventListener('pointercancel', () => {
  cursorDot.classList.remove('is-clicking');
  cursorRing.classList.remove('is-clicking');
});

addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
  if (activeGame && activeGame.key) activeGame.key(key);
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const key in keys) keys[key] = false; });

cv.addEventListener('pointermove', e => {
  const point = toLogical(e);
  mouse.x = point.x;
  mouse.y = point.y;
  mouse.active = true;
});
cv.addEventListener('pointerdown', e => {
  const point = toLogical(e);
  mouse.x = point.x;
  mouse.y = point.y;
  if (activeGame && activeGame.click) activeGame.click(point.x, point.y);
});

document.getElementById('quitButton').addEventListener('click', () => {
  window.parent.postMessage({ type: 'arcade:quit' }, '*');
});

let activeGame = null;
const quitButton = document.getElementById('quitButton');
window.startArcadeGame = function (createGame) {
  let finished = false;
  let finalScore = 0;
  activeGame = createGame(score => {
    if (finished) return;
    finished = true;
    finalScore = Math.max(0, Math.floor(Number(score) || 0));
    quitButton.hidden = true;
    window.parent.postMessage({ type: 'arcade:game-over', score: finalScore }, '*');
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000));
    last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(sc, 0, 0, sc, ox, oy);
    if (!finished && activeGame.update) activeGame.update(dt);
    if (activeGame.draw) activeGame.draw();
    if (finished) {
      ctx.fillStyle = 'rgba(244, 217, 238, .84)';
      ctx.fillRect(0, 0, W, H);
      rr(215, 190, 370, 110, 22);
      ctx.fillStyle = window.RUEM_THEME.vanilla;
      ctx.fill();
      ctx.strokeStyle = window.RUEM_THEME.plum;
      ctx.lineWidth = 3;
      ctx.stroke();
      text('Game Over', W / 2, H / 2 - 18, 38, window.RUEM_THEME.plum);
      text(`Final score: ${finalScore}  ·  Returning to arcade...`, W / 2, H / 2 + 28, 18, window.RUEM_THEME.red);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
