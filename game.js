const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Setup canvas size
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Load assets
const birdImg = new Image();
const pipeImg = new Image();
const pipeTopImg = new Image();
const backgroundImg = new Image();
const startImg = new Image();

birdImg.src = "character.png";
pipeImg.src = "pipe.png";
pipeTopImg.src = "pipe.png";
backgroundImg.src = "background.PNG";
startImg.src = "start_screen.png";

// Game state (ratios will scale with screen)
let scale = height / 720; // base scale from 720p
let bird = {
  x: width * 0.2,
  y: height / 2,
  width: 40 * scale,
  height: 40 * scale,
  gravity: 1000 * scale,
  lift: -300 * scale,
  velocity: 0
};

let pipes = [];
let pipeWidth = 80 * scale;
let pipeSpeed = 300 * scale;
let gap = height * 0.28;
let lastPipeTime = 0;
let score = 0;
let gameStarted = false;
let lastTime = null;
let flippedPipeImg = null;

// Flip top pipe image
pipeTopImg.onload = () => {
  const flipCanvas = document.createElement("canvas");
  flipCanvas.width = pipeTopImg.width;
  flipCanvas.height = pipeTopImg.height;
  const flipCtx = flipCanvas.getContext("2d");
  flipCtx.translate(0, pipeTopImg.height);
  flipCtx.scale(1, -1);
  flipCtx.drawImage(pipeTopImg, 0, 0);
  flippedPipeImg = new Image();
  flippedPipeImg.src = flipCanvas.toDataURL();
};

// Input handling
document.addEventListener("keydown", () => {
  if (!gameStarted) return gameStarted = true;
  bird.velocity = bird.lift;
});
canvas.addEventListener("mousedown", () => {
  if (!gameStarted) return gameStarted = true;
  bird.velocity = bird.lift;
});

// Add pipes
function addPipe() {
  const minHeight = height * 0.1;
  const maxHeight = height - gap - height * 0.2;
  const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

  pipes.push({
    x: width,
    topHeight,
    bottomY: topHeight + gap,
    width: pipeWidth,
    passed: false,
  });
}

// Reset everything
function resetGame() {
  scale = height / 720;
  bird = {
    x: width * 0.2,
    y: height / 2,
    width: 40 * scale,
    height: 40 * scale,
    gravity: 1000 * scale,
    lift: -300 * scale,
    velocity: 0
  };
  pipeWidth = 80 * scale;
  pipeSpeed = 300 * scale;
  gap = height * 0.28;
  pipes = [];
  score = 0;
  gameStarted = false;
  lastTime = null;
}

// Draw the bird with tilt
function drawBirdTilted() {
  const tilt = Math.max(Math.min(bird.velocity / 300 * 45, 45), -45); // Clamp tilt
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();
}

// Main game loop
function draw(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  if (!gameStarted) {
    ctx.drawImage(startImg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.font = `${Math.floor(height * 0.03)}px Arial`;
    ctx.fillText("Click or press a key to start", width / 2 - 150 * scale, height / 2 + 60 * scale);
    requestAnimationFrame(draw);
    return;
  }

  // Gravity and motion
  bird.velocity += bird.gravity * delta;
  bird.y += bird.velocity * delta;

  // Add pipes periodically
  if (timestamp - lastPipeTime > 1500) {
    addPipe();
    lastPipeTime = timestamp;
  }

  // Draw pipes
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed * delta;

    // Draw top pipe
    if (flippedPipeImg) {
      ctx.drawImage(
        flippedPipeImg,
        pipe.x,
        pipe.topHeight - flippedPipeImg.height * scale,
        pipe.width,
        flippedPipeImg.height * scale
      );
    }

    // Draw bottom pipe
    ctx.drawImage(
      pipeImg,
      pipe.x,
      pipe.bottomY,
      pipe.width,
      pipeImg.height * scale
    );

    // Collision
    if (
      bird.x < pipe.x + pipe.width &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
    ) {
      resetGame();
    }

    // Score
    if (!pipe.passed && pipe.x + pipe.width < bird.x) {
      pipe.passed = true;
      score++;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

  drawBirdTilted();

  // Score text
  ctx.fillStyle = "#fff";
  ctx.font = `${Math.floor(height * 0.04)}px Arial`;
  ctx.fillText("Score: " + score, 20 * scale, 40 * scale);

  // Bounds
  if (bird.y > height || bird.y < 0) {
    resetGame();
  }

  requestAnimationFrame(draw);
}

// Run loop
draw();

// Resize handler
window.addEventListener("resize", () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  resetGame();
});
