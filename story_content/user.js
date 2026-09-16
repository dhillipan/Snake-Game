window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
var getKeyDown = player.getKeyDown;
var keydown = player.keydown;
var keyup = player.keyup;
window.Script1 = function()
{
  /* ==========================================================================
   SNAKE GAME IN AN iPHONE 17-STYLE FRAME — paste into:
   Execute JavaScript > When: Timeline Starts
   Scoped ids: #snStageWrap / #snStage / prefix "sn"

   v2 changes from the first version:
   - Removed the on-screen D-pad entirely — full screen is free for play.
   - Slower default speed, plus in-screen Speed −/+ controls.
   - A "Use arrow keys or swipe" hint lives at the bottom of the phone screen.
   - A name-entry screen appears before the first round starts.
   - Status-bar clock now shows the viewer's real local time, refreshed
     every 15 seconds.

   CONTROLS: arrow keys / WASD (desktop), or swipe directly on the phone
   screen (touch). There is no on-screen D-pad in this version.

   OPTIONAL STORYLINE TRACKING (safe to ignore if you don't need it):
     snScore      (Number)     — current/most-recent score, updates live
     snPlayed     (True/False) — becomes true the first time a round ends
     snBestScore  (Number)     — best score reached this session
     snPlayerName (Text)       — the name entered before the first round
   Create matching variables in Storyline's variable manager if you want to
   use them (Manage Project Variables). If you don't create them, the
   SetVar calls simply do nothing extra — the game still runs fine.
   ========================================================================== */
(function injectSnakeGame() {
  // ---------- 0. Remove any previous instance AND stop its animation loop / clock ----------
  if (window.__snRafId) { cancelAnimationFrame(window.__snRafId); window.__snRafId = null; }
  if (window.__snClockId) { clearInterval(window.__snClockId); window.__snClockId = null; }
  var prev = document.getElementById('snStageWrap'); if (prev) prev.remove();
  var prevStyle = document.getElementById('snStageStyle'); if (prevStyle) prevStyle.remove();

  // ---------- 1. CSS ----------
  var css = `
    #snStageWrap{position:fixed;top:0;left:0;z-index:999000;transform-origin:top left;}
    #snStage{width:1280px;height:720px;position:relative;overflow:hidden;
      background:radial-gradient(900px 500px at 50% 20%, #1c2b3a, #05080d 70%);
      font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
      display:flex;align-items:center;justify-content:center;}
    #snStage,#snStage *{box-sizing:border-box;}

    /* ---- phone frame (iPhone-17-style) ---- */
    #snStage .sn-phone{width:300px;height:632px;border-radius:56px;position:relative;
      background:linear-gradient(155deg,#e7e8ea 0%,#9a9da2 35%,#6f7276 55%,#c7c9cc 100%);
      padding:11px;box-shadow:0 40px 90px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.35);}
    #snStage .sn-phone::before{content:"";position:absolute;top:118px;left:-3px;width:3px;height:28px;border-radius:2px 0 0 2px;background:#5b5d60;}
    #snStage .sn-phone::after{content:"";position:absolute;top:160px;left:-3px;width:3px;height:52px;border-radius:2px 0 0 2px;background:#5b5d60;}
    #snStage .sn-power{position:absolute;top:150px;right:-3px;width:3px;height:70px;border-radius:0 2px 2px 0;background:#5b5d60;}
    #snStage .sn-screen{width:100%;height:100%;border-radius:46px;background:#0b1320;overflow:hidden;
      position:relative;display:flex;flex-direction:column;box-shadow:inset 0 0 0 2px rgba(0,0,0,.6);}
    #snStage .sn-island{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:104px;height:28px;
      background:#000;border-radius:18px;z-index:5;box-shadow:0 0 0 1px rgba(255,255,255,.06);}
    #snStage .sn-status{display:flex;justify-content:space-between;align-items:center;padding:16px 26px 0;
      color:#eef2f6;font-size:13px;font-weight:600;letter-spacing:.2px;}
    #snStage .sn-battery{width:22px;height:11px;border:1.4px solid #eef2f6;border-radius:3px;position:relative;display:inline-block;vertical-align:middle;}
    #snStage .sn-battery::after{content:"";position:absolute;top:2px;left:2px;bottom:2px;width:70%;background:#eef2f6;border-radius:1px;}
    #snStage .sn-battery::before{content:"";position:absolute;top:3px;right:-4px;width:2px;height:5px;background:#eef2f6;border-radius:0 1px 1px 0;}
    #snStage .sn-head{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 22px 0;color:#fff;}
    #snStage .sn-head h1{font-size:16px;font-weight:800;letter-spacing:.3px;}
    #snStage .sn-player{display:block;font-size:11px;font-weight:600;color:#7f97ae;margin-top:2px;}
    #snStage .sn-head .sn-score{font-size:13px;font-weight:700;color:#8CE6A8;background:rgba(140,230,168,.12);
      padding:4px 10px;border-radius:20px;white-space:nowrap;}
    #snStage .sn-gamewrap{flex:1;display:flex;align-items:center;justify-content:center;padding:10px 0;margin: 10px;position:relative;}
    #snStage canvas{image-rendering:pixelated;border-radius:10px;box-shadow:0 0 0 1px rgba(255,255,255,.08);touch-action:none;}

    /* ---- bottom info bar: keyboard hint + speed control (replaces the old D-pad) ---- */
    #snStage .sn-bottombar{padding:0 20px 22px;display:flex;flex-direction:column;align-items:center;gap:10px;}
    #snStage .sn-keys-info{font-size:11.5px;color:#7f97ae;text-align:center;letter-spacing:.2px;}
    #snStage .sn-keys-info b{color:#cfd8e3;font-weight:700;}
    #snStage .sn-speed-ctrl{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);
      border-radius:22px;padding:6px 8px;}
    #snStage .sn-speed-ctrl span.sn-speed-lbl{font-size:11px;font-weight:700;color:#cfd8e3;text-transform:uppercase;
      letter-spacing:.6px;padding:0 2px;}
    #snStage .sn-speed-ctrl button{width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,.12);
      color:#fff;font-size:15px;font-weight:700;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    #snStage .sn-speed-ctrl button:active{background:rgba(255,255,255,.28);}
    #snStage .sn-speed-ctrl button:disabled{opacity:.3;cursor:default;}
    #snStage .sn-speed-val{font-size:12px;font-weight:700;color:#8CE6A8;min-width:34px;text-align:center;}

    /* ---- start / game-over overlay ---- */
    #snStage .sn-overlay{position:absolute;inset:0;background:rgba(5,8,13,.92);display:none;flex-direction:column;
      align-items:center;justify-content:center;gap:10px;z-index:10;border-radius:20px;text-align:center;padding:0 30px;}
    #snStage .sn-overlay.show{display:flex;}
    #snStage .sn-overlay h2{color:#fff;font-size:20px;font-weight:800;}
    #snStage .sn-overlay p{color:#9fb0c2;font-size:13px;}
    #snStage .sn-overlay .sn-best{color:#8CE6A8;font-size:12.5px;font-weight:700;}
    #snStage .sn-name-input{width:100%;max-width:220px;margin-top:4px;border:1.5px solid rgba(255,255,255,.25);
      background:rgba(255,255,255,.08);color:#fff;font-family:inherit;font-size:14px;font-weight:600;
      border-radius:12px;padding:11px 14px;text-align:center;outline:none;}
    #snStage .sn-name-input::placeholder{color:#7f97ae;}
    #snStage .sn-name-input:focus{border-color:#8CE6A8;}
    #snStage .sn-overlay button.sn-go{margin-top:8px;border:none;border-radius:20px;background:#fff;color:#0b1320;
      font-weight:800;font-size:12.5px;text-transform:uppercase;letter-spacing:.4px;padding:11px 26px;cursor:pointer;}
    #snStage .sn-overlay button.sn-go:disabled{opacity:.4;cursor:default;}
  `;
  var styleTag = document.createElement('style');
  styleTag.id = 'snStageStyle'; styleTag.innerHTML = css; document.head.appendChild(styleTag);

  // ---------- 2. HTML ----------
  var html = `
    <div class="sn-phone">
      <div class="sn-power"></div>
      <div class="sn-screen">
        <div class="sn-island"></div>
        <div class="sn-status"><span id="snClockTime">9:41</span><span class="sn-battery"></span></div>
        <div class="sn-head">
          <div><h1>Snake</h1><span class="sn-player" id="snPlayerLabel"></span></div>
          <span class="sn-score" id="snScoreVal">Score 0</span>
        </div>
        <div class="sn-gamewrap">
          <canvas width="256" height="352" id="snCanvas"></canvas>
          <div class="sn-overlay show" id="snOverlay">
            <h2 id="snOverTitle">Snake</h2>
            <p id="snOverBody">Enter your name to begin.</p>
            <input type="text" id="snNameInput" class="sn-name-input" maxlength="14" placeholder="Your name">
            <div class="sn-best" id="snBestLine" style="display:none;"></div>
            <button class="sn-go" id="snRestart">Play</button>
          </div>
        </div>
        <div class="sn-bottombar">
          <div class="sn-keys-info">Use <b>&#8593; &#8595; &#8592; &#8594;</b> arrow keys, or swipe the screen, to move</div>
          <div class="sn-speed-ctrl">
            <span class="sn-speed-lbl">Speed</span>
            <button id="snSpeedDown" aria-label="Decrease speed">&minus;</button>
            <span class="sn-speed-val" id="snSpeedVal">2/5</span>
            <button id="snSpeedUp" aria-label="Increase speed">&plus;</button>
          </div>
        </div>
      </div>
    </div>
  `;

  var wrap = document.createElement('div'); wrap.id = 'snStageWrap';
  var stageEl = document.createElement('div'); stageEl.id = 'snStage'; stageEl.innerHTML = html;
  wrap.appendChild(stageEl); document.body.appendChild(wrap);

  // ---------- 3. Scale + position over the real Storyline stage ----------
  var STAGE_SELECTOR = '.acc-shadow-dom, #slide-stage, .slide-stage-container, #stage, .player-stage';
  function getStageEl() {
    var nodes = document.querySelectorAll(STAGE_SELECTOR), best = null, bestArea = 0;
    nodes.forEach(function (el) { var r = el.getBoundingClientRect(), a = r.width * r.height; if (a > bestArea) { bestArea = a; best = el; } });
    return best;
  }
  function positionStage() {
    var stage = getStageEl();
    var rect = stage ? stage.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var scale = Math.min(rect.width / 1280, rect.height / 720);
    wrap.style.left = (rect.left + (rect.width - 1280 * scale) / 2) + 'px';
    wrap.style.top = (rect.top + (rect.height - 720 * scale) / 2) + 'px';
    wrap.style.transform = 'scale(' + scale + ')';
  }
  positionStage();
  window.addEventListener('resize', positionStage);
  window.addEventListener('orientationchange', positionStage);
  setTimeout(positionStage, 300); setTimeout(positionStage, 1000);

  // ---------- 4. The game itself ----------
  var canvas = stageEl.querySelector('#snCanvas');
  var context = canvas.getContext('2d');
  var scoreEl = stageEl.querySelector('#snScoreVal');
  var playerLabel = stageEl.querySelector('#snPlayerLabel');
  var overlay = stageEl.querySelector('#snOverlay');
  var overTitle = stageEl.querySelector('#snOverTitle');
  var overBody = stageEl.querySelector('#snOverBody');
  var bestLine = stageEl.querySelector('#snBestLine');
  var restartBtn = stageEl.querySelector('#snRestart');
  var nameInput = stageEl.querySelector('#snNameInput');
  var speedDownBtn = stageEl.querySelector('#snSpeedDown');
  var speedUpBtn = stageEl.querySelector('#snSpeedUp');
  var speedValEl = stageEl.querySelector('#snSpeedVal');
  var clockEl = stageEl.querySelector('#snClockTime');

  // ---- live status-bar clock: shows the viewer's real local time ----
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function updateClock() {
    var now = new Date();
    var h = now.getHours() % 12;
    if (h === 0) h = 12;
    clockEl.textContent = h + ':' + pad2(now.getMinutes());
  }
  updateClock();
  window.__snClockId = setInterval(updateClock, 15000);

  var grid = 16;
  var colsX = canvas.width / grid;   // horizontal grid cells
  var rowsY = canvas.height / grid;  // vertical grid cells (taller than wide, for more play area)
  var count = 0;
  var running = false;
  var bestScore = 0;
  var playerName = '';
  var overlayMode = 'start'; // 'start' (first screen, asks for name) then 'gameover'

  // Speed: index into SPEED_FRAMES, which is frames-per-move (bigger = slower).
  // Default index 1 (frames=9) is noticeably slower than the original game's speed of 4.
  var SPEED_FRAMES = [12, 9, 6, 4, 3]; // slow -> fast
  var speedIndex = 1;

  var snake = { x: 5 * grid, y: 5 * grid, dx: grid, dy: 0, cells: [], maxCells: 4 };
  var apple = { x: 10 * grid, y: 10 * grid };

  function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min)) + min; }
  function placeApple() { apple.x = getRandomInt(0, colsX) * grid; apple.y = getRandomInt(0, rowsY) * grid; }
  function currentScore() { return snake.maxCells - 4; }

  function updateSpeedLabel() { speedValEl.textContent = (speedIndex + 1) + '/' + SPEED_FRAMES.length; }
  function applySpeedButtonStates() {
    speedDownBtn.disabled = speedIndex === 0;
    speedUpBtn.disabled = speedIndex === SPEED_FRAMES.length - 1;
  }
  updateSpeedLabel(); applySpeedButtonStates();

  speedDownBtn.addEventListener('click', function () {
    if (speedIndex > 0) { speedIndex--; updateSpeedLabel(); applySpeedButtonStates(); }
  });
  speedUpBtn.addEventListener('click', function () {
    if (speedIndex < SPEED_FRAMES.length - 1) { speedIndex++; updateSpeedLabel(); applySpeedButtonStates(); }
  });

  function setStorylineVars(scoreVal, played) {
    try {
      var player = window.GetPlayer ? window.GetPlayer() : null;
      if (!player) return;
      player.SetVar('snScore', scoreVal);
      if (played) player.SetVar('snPlayed', true);
      if (scoreVal > bestScore) { bestScore = scoreVal; player.SetVar('snBestScore', bestScore); }
    } catch (e) { /* running outside the Storyline player */ }
  }
  function setPlayerNameVar(name) {
    try {
      var player = window.GetPlayer ? window.GetPlayer() : null;
      if (player) player.SetVar('snPlayerName', name);
    } catch (e) {}
  }

  function resetSnake() {
    snake.x = 5 * grid; snake.y = 5 * grid;
    snake.cells = []; snake.maxCells = 4;
    snake.dx = grid; snake.dy = 0;
    placeApple();
    scoreEl.textContent = 'Score 0';
  }

  function endRound() {
    running = false;
    var score = currentScore();
    setStorylineVars(score, true);
    overlayMode = 'gameover';
    overTitle.textContent = 'Game Over';
    overBody.textContent = (playerName ? playerName + ' — ' : '') + 'Score: ' + score;
    nameInput.style.display = 'none';
    bestLine.style.display = 'block';
    bestLine.textContent = score >= bestScore ? 'New best: ' + bestScore : 'Best: ' + bestScore;
    restartBtn.textContent = 'Play Again';
    overlay.classList.add('show');
  }

  function loop() {
    window.__snRafId = requestAnimationFrame(loop);
    if (!running) return;
    var framesPerMove = SPEED_FRAMES[speedIndex];
    if (++count < framesPerMove) return;
    count = 0;

    context.clearRect(0, 0, canvas.width, canvas.height);

    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({ x: snake.x, y: snake.y });
    if (snake.cells.length > snake.maxCells) snake.cells.pop();

    context.fillStyle = '#E8542C';
    context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

    context.fillStyle = '#8CE6A8';
    var died = false;
    snake.cells.forEach(function (cell, index) {
      context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      if (cell.x === apple.x && cell.y === apple.y) {
        snake.maxCells++;
        placeApple();
        scoreEl.textContent = 'Score ' + currentScore();
        setStorylineVars(currentScore(), false);
      }

      for (var i = index + 1; i < snake.cells.length; i++) {
        if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) died = true;
      }
    });

    if (died) endRound();
  }

  // ---------- 5. Controls: keyboard + swipe only (no on-screen D-pad) ----------
  function setDir(dir) {
    if (!running) return;
    if (dir === 'left' && snake.dx === 0) { snake.dx = -grid; snake.dy = 0; }
    else if (dir === 'up' && snake.dy === 0) { snake.dy = -grid; snake.dx = 0; }
    else if (dir === 'right' && snake.dx === 0) { snake.dx = grid; snake.dy = 0; }
    else if (dir === 'down' && snake.dy === 0) { snake.dy = grid; snake.dx = 0; }
  }

  function keyHandler(e) {
    var map = { 37: 'left', 38: 'up', 39: 'right', 40: 'down', 65: 'left', 87: 'up', 68: 'right', 83: 'down' };
    if (map[e.which]) { setDir(map[e.which]); e.preventDefault(); }
  }
  if (window.__snKeyHandler) document.removeEventListener('keydown', window.__snKeyHandler);
  window.__snKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  var touchStart = null;
  canvas.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; touchStart = { x: t.clientX, y: t.clientY }; }, { passive: true });
  canvas.addEventListener('touchend', function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { touchStart = null; return; }
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
    else setDir(dy > 0 ? 'down' : 'up');
    touchStart = null;
  }, { passive: true });

  // ---------- 6. Start / restart flow ----------
  function updateGoButtonState() {
    if (overlayMode !== 'start') { restartBtn.disabled = false; return; }
    restartBtn.disabled = nameInput.value.trim().length === 0;
  }
  nameInput.addEventListener('input', updateGoButtonState);
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !restartBtn.disabled) restartBtn.click();
    e.stopPropagation(); // don't let Enter/typing leak into the snake's arrow-key handler
  });
  updateGoButtonState();

  restartBtn.addEventListener('click', function () {
    if (overlayMode === 'start') {
      var typed = nameInput.value.trim();
      playerName = typed.length ? typed.slice(0, 14) : 'Player';
      playerLabel.textContent = 'Playing as ' + playerName;
      setPlayerNameVar(playerName);
    }
    resetSnake();
    overlay.classList.remove('show');
    running = true;
  });

  // ---------- 7. Init ----------
  placeApple();
  loop(); // begins the (paused) animation frame chain; the round starts once a name is entered and "Play" is tapped
  nameInput.focus();
})();
}

};
