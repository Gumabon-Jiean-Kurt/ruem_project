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

startArcadeGame(targetGame);
