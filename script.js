const { body } = document;
const gameContainer = document.getElementById('game-container');
const scoreboard = document.getElementById('scoreboard');
const scoreValues = document.getElementById('score-values');
const instructions = document.getElementById('instructions');

let width = 320;
let height = 420;
const minCanvasWidth = 220;
const minCanvasHeight = 120;
const maxCanvasWidth = 420;
const maxCanvasHeight = 420;

let canvas, context;
let canvasPosition = 0;

let paddleHeight = 8;
let paddleWidth = 56;
let paddleDiff = 28;
let paddleBottomX, paddleTopX;
let playerMoved = false;

let ballX, ballY;
const ballRadius = 6;

let speedY, speedX, trajectoryX, computerSpeed;

let playerScore = 0;
let computerScore = 0;
const winningScore = 7;
let isGameOver = false;
let isPaused = false;
let animationFrameId = null;

let overlayEl = null;
let countdownTimeout = null;

function updateCanvasSize() {
  if (window.innerWidth < 600) {
    width = Math.max(minCanvasWidth, Math.min(window.innerWidth * 0.99, maxCanvasWidth));
    height = Math.max(minCanvasHeight, Math.min(window.innerHeight * 0.55, maxCanvasHeight));
  } else {
    width = Math.min(maxCanvasWidth, 0.6 * window.innerWidth);
    height = Math.min(maxCanvasHeight, 0.7 * window.innerHeight);
    if (width < minCanvasWidth) width = minCanvasWidth;
    if (height < minCanvasHeight) height = minCanvasHeight;
  }
  canvasPosition = (window.innerWidth - width) / 2;
}

function createCanvas() {
  updateCanvasSize();
  if (!canvas) {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    canvas.tabIndex = 1;
    gameContainer.appendChild(canvas);
  }
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  renderCanvas();
}

function setInitialSpeeds() {
  if (window.matchMedia('(max-width: 600px)').matches) {
    speedY = -2.1;
    speedX = 1.3;
    computerSpeed = 2.2;
  } else {
    speedY = -1.7;
    speedX = 1.5;
    computerSpeed = 1.7;
  }
}

function resetPositions() {
  paddleWidth = width < 260 ? 36 : 56;
  paddleDiff = paddleWidth / 2;
  paddleBottomX = width / 2 - paddleWidth / 2;
  paddleTopX = width / 2 - paddleWidth / 2;
  ballX = width / 2;
  ballY = height / 2;
  setInitialSpeeds();
  playerMoved = false;
}

function ballMove() {
  ballY += -speedY;
  ballX += speedX;
  if (ballX < ballRadius) {
    ballX = ballRadius;
    speedX = -speedX;
  }
  if (ballX > width - ballRadius) {
    ballX = width - ballRadius;
    speedX = -speedX;
  }
}

function ballBoundaries() {
  if (ballY > height - paddleDiff - paddleHeight) {
    if (ballX > paddleBottomX && ballX < paddleBottomX + paddleWidth) {
      if (playerMoved) {
        speedY -= 0.5;
        if (speedY < -7) speedY = -7;
        computerSpeed = Math.abs(speedY) + 1.5;
      }
      speedY = -speedY;
      trajectoryX = ballX - (paddleBottomX + paddleWidth / 2);
      speedX = trajectoryX * 0.16;
    } else if (ballY > height - ballRadius) {
      ballReset();
      computerScore++;
      updateScoreboard();
      if (computerScore < winningScore) showCountdown();
    }
  }
  if (ballY < paddleDiff + paddleHeight) {
    if (ballX > paddleTopX && ballX < paddleTopX + paddleWidth) {
      if (playerMoved) {
        speedY += 0.5;
        if (speedY > 7) speedY = 7;
      }
      speedY = -speedY;
      trajectoryX = ballX - (paddleTopX + paddleWidth / 2);
      speedX = trajectoryX * 0.16;
    } else if (ballY < ballRadius) {
      ballReset();
      playerScore++;
      updateScoreboard();
      if (playerScore < winningScore) showCountdown();
    }
  }
}

function computerAI() {
  let target = ballX + (Math.random() - 0.5) * 16;
  if (paddleTopX + paddleWidth / 2 < target - 10) {
    paddleTopX += computerSpeed;
  } else if (paddleTopX + paddleWidth / 2 > target + 10) {
    paddleTopX -= computerSpeed;
  }
  if (paddleTopX < 0) paddleTopX = 0;
  if (paddleTopX > width - paddleWidth) paddleTopX = width - paddleWidth;
}

function renderCanvas() {
  context.clearRect(0, 0, width, height);

  let grad = context.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, "#232526");
  grad.addColorStop(1, "#00ffe7");
  context.fillStyle = grad;
  context.fillRect(0, 0, width, height);

  let glow = context.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, width / 1.2);
  glow.addColorStop(0, "rgba(255,255,255,0.08)");
  glow.addColorStop(1, "rgba(0,255,231,0.01)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.beginPath();
  context.setLineDash([6, 8]);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.lineWidth = 2;
  context.shadowColor = "#00ffe7";
  context.shadowBlur = 6;
  context.strokeStyle = '#00ffe7';
  context.stroke();
  context.setLineDash([]);
  context.restore();

  context.save();
  context.shadowColor = "#ffea00";
  context.shadowBlur = 10;
  context.fillStyle = '#fff';
  context.fillRect(paddleBottomX, height - 14, paddleWidth, paddleHeight);
  context.shadowColor = "#00ffe7";
  context.fillRect(paddleTopX, 6, paddleWidth, paddleHeight);
  context.restore();

  context.save();
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 0, 2 * Math.PI, false);
  context.shadowColor = "#ffea00";
  context.shadowBlur = 10;
  context.fillStyle = "#fff";
  context.fill();
  context.restore();
}

function updateScoreboard() {
  if (scoreValues) {
    scoreValues.textContent = `${playerScore} : ${computerScore}`;
  }
}

function showOverlay(html, noButton) {
  hideOverlay();
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.innerHTML = html;
  overlayEl.style.fontSize = '0.95rem';
  if (!noButton) {
    const btn = document.createElement('button');
    btn.textContent = 'Start Game';
    btn.onclick = () => { hideOverlay(); startGame(); };
    overlayEl.appendChild(btn);
  }
  body.appendChild(overlayEl);
}

function hideOverlay() {
  if (overlayEl && body.contains(overlayEl)) {
    body.removeChild(overlayEl);
    overlayEl = null;
  }
}

function showCountdown(cb) {
  hideOverlay();
  let count = 3;
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.style.fontSize = '1.2rem';
  const msg = document.createElement('div');
  msg.className = 'big';
  overlayEl.appendChild(msg);
  body.appendChild(overlayEl);

  function next() {
    msg.textContent = count > 0 ? count : 'GO!';
    if (count > 0) {
      count--;
      countdownTimeout = setTimeout(next, 500);
    } else {
      setTimeout(() => {
        hideOverlay();
        if (cb) cb();
      }, 500);
    }
  }
  next();
}

function showStartOverlay() {
  showOverlay(`
    <h1>Classic Pong</h1>
    <p>First to <b>${winningScore}</b> wins.<br>
    Move paddle: <b>Mouse</b>, <b>Arrow keys</b>, or <b>Touch</b>.<br>
    <br>Press <b>Space</b> or tap <b>Start</b>!</p>
  `);
  function startListener(e) {
    if (
      (e.type === 'keydown' && (e.key === ' ' || e.key === 'Enter')) ||
      e.type === 'mousedown' ||
      e.type === 'touchstart'
    ) {
      hideOverlay();
      startGame();
      window.removeEventListener('keydown', startListener);
      window.removeEventListener('mousedown', startListener);
      window.removeEventListener('touchstart', startListener);
    }
  }
  window.addEventListener('keydown', startListener);
  window.addEventListener('mousedown', startListener);
  window.addEventListener('touchstart', startListener);
}

function showPauseOverlay() {
  showOverlay(`
    <h1>Paused</h1>
    <p>Press <b>Space</b> or tap <b>Resume</b></p>
  `, true);
  function resumeListener(e) {
    if (
      (e.type === 'keydown' && (e.key === ' ' || e.key === 'Enter')) ||
      e.type === 'mousedown' ||
      e.type === 'touchstart'
    ) {
      hideOverlay();
      isPaused = false;
      animate();
      window.removeEventListener('keydown', resumeListener);
      window.removeEventListener('mousedown', resumeListener);
      window.removeEventListener('touchstart', resumeListener);
    }
  }
  window.addEventListener('keydown', resumeListener);
  window.addEventListener('mousedown', resumeListener);
  window.addEventListener('touchstart', resumeListener);
}

function showGameOverOverlay(winner) {
  showOverlay(`
    <h1>${winner} Wins!</h1>
    <p>Final Score: ${playerScore} : ${computerScore}</p>
    <p>Press <b>Enter</b> or tap <b>Play Again</b>!</p>
  `);
}

function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  setInitialSpeeds();
  playerMoved = false;
}

function animate() {
  renderCanvas();
  if (!isPaused) {
    ballMove();
    ballBoundaries();
    computerAI();
    if (playerScore === winningScore || computerScore === winningScore) {
      isGameOver = true;
      showGameOverOverlay(playerScore === winningScore ? 'Player' : 'Computer');
      return;
    }
  }
  if (!isGameOver && !isPaused) {
    animationFrameId = window.requestAnimationFrame(animate);
  }
}

function setupControls() {
  canvas.onmousemove = (e) => {
    if (isGameOver || isPaused) return;
    playerMoved = true;
    let mouseX = e.clientX - canvas.getBoundingClientRect().left;
    paddleBottomX = mouseX - paddleWidth / 2;
    if (paddleBottomX < 0) paddleBottomX = 0;
    if (paddleBottomX > width - paddleWidth) paddleBottomX = width - paddleWidth;
    canvas.style.cursor = 'none';
  };

  let leftPressed = false, rightPressed = false;
  document.onkeydown = (e) => {
    if (isGameOver && (e.key === 'Enter' || e.key === ' ')) {
      hideOverlay();
      startGame();
      return;
    }
    if (!isGameOver && !isPaused) {
      if (e.key === 'ArrowLeft') leftPressed = true;
      if (e.key === 'ArrowRight') rightPressed = true;
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        isPaused = true;
        showPauseOverlay();
      }
    }
  };
  document.onkeyup = (e) => {
    if (e.key === 'ArrowLeft') leftPressed = false;
    if (e.key === 'ArrowRight') rightPressed = false;
  };

  function keyboardMove() {
    if (isGameOver || isPaused) return;
    if (leftPressed) {
      paddleBottomX -= 8;
      playerMoved = true;
    }
    if (rightPressed) {
      paddleBottomX += 8;
      playerMoved = true;
    }
    if (paddleBottomX < 0) paddleBottomX = 0;
    if (paddleBottomX > width - paddleWidth) paddleBottomX = width - paddleWidth;
    requestAnimationFrame(keyboardMove);
  }
  keyboardMove();

  canvas.ontouchstart = (e) => {
    if (isGameOver || isPaused) return;
    if (e.touches.length > 0) {
      let touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
      paddleBottomX = touchX - paddleWidth / 2;
      if (paddleBottomX < 0) paddleBottomX = 0;
      if (paddleBottomX > width - paddleWidth) paddleBottomX = width - paddleWidth;
      playerMoved = true;
    }
  };
  canvas.ontouchmove = (e) => {
    if (isGameOver || isPaused) return;
    if (e.touches.length > 0) {
      let touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
      paddleBottomX = touchX - paddleWidth / 2;
      if (paddleBottomX < 0) paddleBottomX = 0;
      if (paddleBottomX > width - paddleWidth) paddleBottomX = width - paddleWidth;
      playerMoved = true;
    }
  };

  // Start game
  function startGame() {
    isGameOver = false;
    isPaused = false;
    playerScore = 0;
    computerScore = 0;
    updateScoreboard();
    createCanvas();
    resetPositions();
    setupControls();
    showCountdown(() => {
      animate();
    });
  }

  // Responsive resize
  window.addEventListener('resize', () => {
    updateCanvasSize();
    if (canvas) {
      createCanvas();
      resetPositions();
    }
  });

  // On load
  window.onload = () => {
    showStartOverlay();
  };
  canvas.ontouchmove = (e) => {
    if (isGameOver || isPaused) return;
    if (e.touches.length > 0) {
      let touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
      paddleBottomX = touchX - paddleWidth / 2;
      if (paddleBottomX < 0) paddleBottomX = 0;
      if (paddleBottomX > width - paddleWidth) paddleBottomX = width - paddleWidth;
      playerMoved = true;
    }
  };
}

// Start game
function startGame() {
  isGameOver = false;
  isPaused = false;
  playerScore = 0;
  computerScore = 0;
  updateScoreboard();
  createCanvas();
  resetPositions();
  setupControls();
  showCountdown(() => {
    animate();
  });
}

// Responsive resize
window.addEventListener('resize', () => {
  updateCanvasSize();
  if (canvas) {
    createCanvas();
    resetPositions();
  }
});

// On load
window.onload = () => {
  showStartOverlay();
};
