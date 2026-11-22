function badmintonGame(finish) {
  const colors = window.RUEM_THEME;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  let playerX = 0, opponentX = 0;
  let playerPoints = 0, opponentPoints = 0, returns = 0;
  let timeLeft = 60, serveWait = 1, swing = 0, messageTime = 0;
  let flight = null, over = false, message = 'Move into position and return the serve!';
  let lastShot = 'Ready';

  function startFlight(fromZ, toZ, fromX, toX, duration, apex, direction, type) {
    flight = { fromZ, toZ, fromX, toX, duration, apex, direction, type, elapsed: 0, z: fromZ, x: fromX, height: 35, progress: 0 };
  }

  function serve() {
    const fromX = randomBetween(-.65, .65);
    startFlight(.04, .96, fromX, clamp(playerX + randomBetween(-.55, .55), -.9, .9), 2.15, 125, 'in', 'serve');
    opponentX = fromX;
    message = 'The shuttle is coming in!';
    messageTime = 1.2;
  }

  function endGame() {
    if (over) return;
    over = true;
    finish(playerPoints * 10 + returns);
  }

  function awardPoint(side) {
    flight = null;
    serveWait = .85;
    if (side === 'player') {
      playerPoints++;
      message = 'Point! Nice shot.';
      if (playerPoints >= 7) { endGame(); return; }
    } else {
      opponentPoints++;
      message = 'Point to your opponent. Get ready to return!';
      if (opponentPoints >= 7) { endGame(); return; }
    }
    messageTime = 1.5;
  }

  function takeShot(type) {
    if (over) return;
    if (!flight || flight.direction !== 'in') {
      message = 'Wait for the shuttle to come back.';
      messageTime = .8;
      return;
    }
    if (flight.progress < .74 || flight.progress > .99) {
      message = flight.progress < .74 ? 'Wait... get ready!' : 'Too late! Move sooner next time.';
      messageTime = .8;
      return;
    }
    if (Math.abs(playerX - flight.x) > .58) {
      message = 'Move left or right to reach the shuttle!';
      messageTime = .9;
      return;
    }

    const targetX = clamp(-playerX * .65 + randomBetween(-.25, .25), -.82, .82);
    const highContact = flight.height > 100;
    const duration = type === 'smash' ? (highContact ? .62 : .9) : type === 'drop' ? 1.3 : 1.05;
    const apex = type === 'smash' ? 12 : type === 'drop' ? 20 : 62;
    startFlight(flight.z, .04, flight.x, targetX, duration, apex, 'out', type);
    opponentX = targetX;
    returns++;
    swing = 1;
    lastShot = type === 'smash' && !highContact ? 'Smash' : type === 'drop' ? 'Drop' : type === 'smash' ? 'Smash!' : 'Return';
    message = type === 'smash' && !highContact ? 'Low smash!' : `${lastShot} shot!`;
    messageTime = .9;
  }

  function key(k) {
    if (k === ' ' || k === 'enter' || k === 'arrowup') takeShot('clear');
    else if (k === 's') takeShot('smash');
    else if (k === 'f' || k === 'arrowdown') takeShot('drop');
  }

  function click(x, y) {
    if (y >= 438) {
      if (x >= 215 && x <= 333) takeShot('clear');
      else if (x >= 341 && x <= 459) takeShot('smash');
      else if (x >= 467 && x <= 585) takeShot('drop');
      return;
    }
    playerX = clamp((x - 400) / 230, -.95, .95);
    if (flight && flight.direction === 'in' && flight.progress >= .74) takeShot('clear');
  }

  function update(dt) {
    if (over) return;
    timeLeft = Math.max(0, timeLeft - dt);
    if (timeLeft <= 0) { endGame(); return; }

    if (keys.arrowleft || keys.a) playerX -= 1.25 * dt;
    if (keys.arrowright || keys.d) playerX += 1.25 * dt;
    playerX = clamp(playerX, -.95, .95);
    swing = Math.max(0, swing - dt * 3.2);
    messageTime = Math.max(0, messageTime - dt);

    if (!flight) {
      serveWait -= dt;
      if (serveWait <= 0) serve();
      return;
    }

    flight.elapsed = Math.min(flight.duration, flight.elapsed + dt);
    flight.progress = flight.elapsed / flight.duration;
    flight.z = flight.fromZ + (flight.toZ - flight.fromZ) * flight.progress;
    flight.x = flight.fromX + (flight.toX - flight.fromX) * flight.progress;
    flight.height = 35 + Math.sin(flight.progress * Math.PI) * flight.apex;
    if (flight.progress < 1) return;

    if (flight.direction === 'in') {
      awardPoint('opponent');
      return;
    }

    const returnChance = flight.type === 'smash' ? (flight.apex < 20 ? .48 : .7) :
      flight.type === 'drop' ? .38 : .78;
    if (Math.random() > returnChance) {
      awardPoint('player');
      return;
    }

    const fromX = flight.toX;
    startFlight(.04, .96, fromX, clamp(playerX + randomBetween(-.7, .7), -.95, .95), 1.9, 118, 'in', 'return');
    opponentX = fromX;
    message = 'Returned! Move and hit it back.';
    messageTime = 1.1;
  }

  function courtX(lane, z) {
    return 400 + lane * (65 + 245 * z);
  }

  function courtY(z) {
    return 160 + 340 * z;
  }

  function drawCourt() {
    const sky = ctx.createLinearGradient(0, 0, 0, 270);
    sky.addColorStop(0, colors.cotton);
    sky.addColorStop(1, colors.vanilla);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = colors.plum;
    ctx.fillRect(0, 105, W, 82);
    for (let i = 0; i < 32; i++) {
      const x = i * 27 + 6;
      const height = 12 + (i % 4) * 5;
      ctx.fillStyle = i % 2 ? colors.bubblegum : colors.cotton;
      ctx.fillRect(x, 184 - height, 17, height);
    }
    for (const x of [105, 250, 550, 695]) {
      const glow = ctx.createRadialGradient(x, 55, 2, x, 55, 70);
      glow.addColorStop(0, 'rgba(255,214,110,.48)');
      glow.addColorStop(1, 'rgba(255,214,110,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 70, 0, 140, 140);
    }

    const floor = ctx.createLinearGradient(0, 160, 0, H);
    floor.addColorStop(0, colors.vanilla);
    floor.addColorStop(1, colors.cotton);
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.moveTo(courtX(-1, 0), courtY(0));
    ctx.lineTo(courtX(-1, 1), H);
    ctx.lineTo(courtX(1, 1), H);
    ctx.lineTo(courtX(1, 0), courtY(0));
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(courtX(-1, 0), courtY(0)); ctx.lineTo(courtX(-1, 1), H);
    ctx.moveTo(courtX(1, 0), courtY(0)); ctx.lineTo(courtX(1, 1), H);
    ctx.moveTo(courtX(0, 0), courtY(0)); ctx.lineTo(courtX(0, 1), H);
    for (const z of [.2, .72, 1]) {
      ctx.moveTo(courtX(-1, z), courtY(z));
      ctx.lineTo(courtX(1, z), courtY(z));
    }
    ctx.stroke();

    const netY = courtY(.43), netL = courtX(-1, .43), netR = courtX(1, .43);
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(netL, netY - 38); ctx.lineTo(netL, netY + 5);
    ctx.moveTo(netR, netY - 38); ctx.lineTo(netR, netY + 5);
    ctx.moveTo(netL, netY - 34); ctx.lineTo(netR, netY - 34);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(56,40,63,.58)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 15; i++) {
      const x = netL + (netR - netL) * i / 15;
      ctx.beginPath(); ctx.moveTo(x, netY - 32); ctx.lineTo(x, netY + 3); ctx.stroke();
    }
    for (let y = netY - 25; y < netY; y += 7) {
      ctx.beginPath(); ctx.moveTo(netL, y); ctx.lineTo(netR, y); ctx.stroke();
    }
  }

  function drawOpponent() {
    const x = 400 + opponentX * 62, y = 178;
    ctx.fillStyle = 'rgba(56,40,63,.2)';
    ctx.beginPath(); ctx.ellipse(x, y + 22, 23, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 7); ctx.lineTo(x - 9, y + 22);
    ctx.moveTo(x + 6, y + 7); ctx.lineTo(x + 10, y + 22);
    ctx.moveTo(x, y - 2); ctx.lineTo(x - 11, y + 9);
    ctx.moveTo(x, y - 2); ctx.lineTo(x + 11, y + 7);
    ctx.stroke();
    ctx.fillStyle = colors.bubblegum;
    rr(x - 11, y - 14, 22, 25, 7); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = colors.vanilla;
    ctx.beginPath(); ctx.arc(x, y - 21, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x + 18, y + 3, 9, 14, -.45, 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function drawShuttle() {
    if (!flight) return;
    const x = courtX(flight.x, flight.z);
    const y = courtY(flight.z) - flight.height;
    const size = 3 + flight.z * 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flight.direction === 'in' ? .65 : -.65);
    ctx.fillStyle = colors.vanilla;
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.8);
    ctx.lineTo(-size, size);
    ctx.lineTo(size, size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.butter;
    ctx.beginPath(); ctx.arc(0, size, size * .5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawRacket() {
    const x = 510 + playerX * 150;
    const y = 418 + swing * 18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.58 + swing * 1.35);
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, -42, 23, 34, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,233,.76)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * 7, -70); ctx.lineTo(i * 7, -14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, -42 + i * 9); ctx.lineTo(20, -42 + i * 9); ctx.stroke();
    }
    ctx.strokeStyle = colors.red;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(16, 43); ctx.stroke();
    ctx.fillStyle = colors.bubblegum;
    rr(6, 25, 24, 50, 10); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function actionButton(x, label, key, active) {
    const width = 118, y = 445, height = 38;
    ctx.fillStyle = active ? colors.butter : colors.vanilla;
    ctx.strokeStyle = colors.plum;
    ctx.lineWidth = 2;
    rr(x, y, width, height, height / 2); ctx.fill(); ctx.stroke();
    text(label, x + width / 2, y + 14, 14, colors.plum);
    text(key, x + width / 2, y + 29, 10, colors.plum);
  }

  function draw() {
    drawCourt();
    drawOpponent();
    drawShuttle();
    drawRacket();
    const canHit = flight && flight.direction === 'in' &&
      flight.progress >= .74 && flight.progress <= .99 &&
      Math.abs(playerX - flight.x) <= .58;

    ctx.fillStyle = colors.vanilla;
    rr(260, 12, 280, 46, 20); ctx.fill();
    ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
    text(`YOU  ${playerPoints}     RIVAL  ${opponentPoints}`, 400, 35, 21, colors.plum);
    text(`${Math.ceil(timeLeft)}s`, 750, 30, 18, colors.plum, 'right');
    text('FIRST TO 7 POINTS', 400, 75, 12, colors.plum);

    if (messageTime > 0) {
      ctx.fillStyle = colors.bubblegum;
      rr(215, 365, 370, 34, 17); ctx.fill();
      ctx.strokeStyle = colors.plum; ctx.lineWidth = 2; ctx.stroke();
      text(message, 400, 382, 15, colors.plum);
    } else if (canHit) {
      text('HIT NOW', 400, 345, 16, colors.red);
    } else if (flight && flight.direction === 'in' && flight.progress >= .42) {
      text('GET READY', 400, 345, 15, colors.plum);
    }

    text('← / → MOVE    SPACE HIT    S SMASH    F DROP', 400, 430, 13, colors.plum);
    actionButton(215, 'HIT', 'SPACE', canHit);
    actionButton(341, 'SMASH', 'S', canHit);
    actionButton(467, 'DROP', 'F', canHit);
  }

  return { update, draw, key, click };
}

startArcadeGame(badmintonGame);
