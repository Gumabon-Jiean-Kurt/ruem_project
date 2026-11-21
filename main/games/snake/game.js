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

startArcadeGame(snakeGame);
