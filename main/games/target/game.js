// Game 3 of 4 - Target Rush
/*
  Click targets for 30 seconds. Misses cost points.
*/
function targetGame(finish) {
  const colors = window.RUEM_THEME;
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
      ctx.fillStyle = colors.red; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r, 0, 7); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = colors.vanilla; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.55, 0, 7); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = colors.bubblegum; ctx.beginPath(); ctx.arc(tg.x, tg.y, tg.r * 0.2, 0, 7); ctx.fill();
      ctx.fillStyle = colors.vanilla; rr(250, 8, 300, 36, 18); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
      text('Score: ' + score + '   Time: ' + Math.max(0, time).toFixed(1), 400, 26, 20, colors.plum);
    }
  };
}

startArcadeGame(targetGame);
