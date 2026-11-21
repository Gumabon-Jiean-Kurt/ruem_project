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

function text(value, x, y, size = 18, color = '#fff', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

addEventListener('resize', resizeGameCanvas);
resizeGameCanvas();

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
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(sc, 0, 0, sc, ox, oy);
    if (!finished && activeGame.update) activeGame.update(dt);
    if (activeGame.draw) activeGame.draw();
    if (finished) {
      ctx.fillStyle = 'rgba(5, 5, 15, .78)';
      ctx.fillRect(0, 0, W, H);
      text('Game Over', W / 2, H / 2 - 18, 38, '#fff');
      text(`Final score: ${finalScore}  ·  Returning to arcade...`, W / 2, H / 2 + 28, 18, '#fbbf24');
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};
