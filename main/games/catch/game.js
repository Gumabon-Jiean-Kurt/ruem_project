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

startArcadeGame(catchGame);
