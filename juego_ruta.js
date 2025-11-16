/*****************************************
 * 🎮 RUTA INFINITA — salto y obstáculos
 *****************************************/

const canvas = document.getElementById("gameCanvas");
const ctx = canvas?.getContext("2d");
const scoreElement = document.getElementById("scoreValue");
const donateAfterCrash = document.getElementById("donateAfterCrash");
const retryBtn = document.getElementById("retryBtn");
const donateBtn = document.getElementById("donateBtn");
const combiImg = new Image();
let combiImgLoaded = false;
combiImg.onload = () => { combiImgLoaded = true; };
combiImg.src = "images/combi.png";

if (canvas && ctx && scoreElement && donateAfterCrash && retryBtn && donateBtn) {
  const groundY = 280;          // inicio del césped
  const roadTopY = groundY;     // parte superior de la carretera
  const roadHeight = 8;

  let gameState = "playing";
  let score = 0;
  let frameCount = 0;

  const combi = {
    x: 70,
    y: groundY - 120, // pegada al suelo según la caja lógica
    width: 120,
    height: 120,
    dy: 0,
    gravity: 0.52, // ~15% menos gravedad para saltos un poco más largos
    jumpPower: -12,
    isJumping: false,
  };

  let obstacles = [];
  const clouds = [];
  const speed = 2.8; // ~30% más lento
  let obstacleTimer = 0;

  // Nubes decorativas
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 100 + 20,
      width: Math.random() * 60 + 40,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  function spawnObstacle() {
    const types = ["rock", "cone", "barrier"];
    const type = types[Math.floor(Math.random() * types.length)];

    obstacles.push({
      x: canvas.width,
      y: roadTopY - 26,
      width: 26,
      height: 26,
      type,
    });
  }

  function triggerJump() {
    if (gameState !== "playing" || combi.isJumping) return;
    combi.dy = combi.jumpPower;
    combi.isJumping = true;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === " ") {
      e.preventDefault();
      triggerJump();
    }
  });

  // Tap en móvil o clic sobre el canvas
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    triggerJump();
  }, { passive: false });
  canvas.addEventListener("click", () => triggerJump());

  function collides(a, b) {
    return (
      a.x < b.x + b.width - 5 &&
      a.x + a.width - 5 > b.x &&
      a.y < b.y + b.height - 5 &&
      a.y + a.height - 5 > b.y
    );
  }

  function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87ceeb");
    gradient.addColorStop(0.7, "#b8e4f0");
    gradient.addColorStop(1, "#e0f4f9");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawClouds() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    clouds.forEach((cloud) => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.width * 0.4, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 5, cloud.width * 0.35, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
      ctx.fill();

      cloud.x -= cloud.speed;
      if (cloud.x < -cloud.width) {
        cloud.x = canvas.width + cloud.width;
        cloud.y = Math.random() * 100 + 20;
      }
    });
  }

  function drawGround() {
    // Césped
    ctx.fillStyle = "#4a9d5f";
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

    // Carretera
    ctx.fillStyle = "#555555";
    ctx.fillRect(0, roadTopY, canvas.width, roadHeight);

    // Líneas de carretera
    ctx.strokeStyle = "#FFD166";
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(0, roadTopY + roadHeight / 2);
    ctx.lineTo(canvas.width, roadTopY + roadHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawCombi() {
    // Ajuste extra para compensar padding del PNG y apoyar las ruedas en el asfalto
    const renderOffsetY = 32;
    const bounce = Math.sin(frameCount * 0.2) * 1.2;
    const drawY = combi.y + bounce + renderOffsetY;
    const shadowWidth = combi.width * 0.5;

    // Sombra sobre el asfalto
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.ellipse(combi.x + combi.width / 2, roadTopY + roadHeight, shadowWidth, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    if (combiImgLoaded) {
      ctx.drawImage(combiImg, combi.x, drawY, combi.width, combi.height);
      return;
    }

    // Fallback dibujado
    ctx.fillStyle = "#FFB703";
    ctx.fillRect(combi.x, drawY, combi.width, combi.height - 14);

    ctx.fillStyle = "#FB8500";
    ctx.beginPath();
    ctx.moveTo(combi.x + combi.width * 0.16, drawY);
    ctx.lineTo(combi.x + combi.width * 0.84, drawY);
    ctx.lineTo(combi.x + combi.width * 0.94, drawY + 20);
    ctx.lineTo(combi.x + combi.width * 0.06, drawY + 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(combi.x + combi.width * 0.2, drawY + 12, combi.width * 0.28, 16);
    ctx.fillRect(combi.x + combi.width * 0.55, drawY + 12, combi.width * 0.22, 16);

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(combi.x + combi.width * 0.2, drawY + combi.height - 10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(combi.x + combi.width * 0.75, drawY + combi.height - 10, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.arc(combi.x + combi.width * 0.2, drawY + combi.height - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(combi.x + combi.width * 0.75, drawY + combi.height - 10, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawObstacle(o) {
    const wobble = Math.sin(frameCount * 0.1 + o.x * 0.1) * 1;

    if (o.type === "rock") {
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.moveTo(o.x + o.width / 2, o.y + wobble);
      ctx.lineTo(o.x + o.width, o.y + o.height + wobble);
      ctx.lineTo(o.x, o.y + o.height + wobble);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#A0522D";
      ctx.beginPath();
      ctx.arc(o.x + o.width / 2, o.y + o.height / 2 + wobble, o.width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "cone") {
      ctx.fillStyle = "#FF6B35";
      ctx.beginPath();
      ctx.moveTo(o.x + o.width / 2, o.y + wobble);
      ctx.lineTo(o.x + o.width, o.y + o.height + wobble);
      ctx.lineTo(o.x, o.y + o.height + wobble);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.fillRect(o.x + 8, o.y + 15 + wobble, o.width - 16, 5);
    } else {
      ctx.fillStyle = "#FF1744";
      ctx.fillRect(o.x, o.y + wobble, o.width, o.height);

      ctx.fillStyle = "white";
      ctx.fillRect(o.x + 5, o.y + 10 + wobble, o.width - 10, 4);
      ctx.fillRect(o.x + 5, o.y + 20 + wobble, o.width - 10, 4);
    }
  }

  function gameLoop() {
    frameCount++;

    drawSky();
    drawClouds();
    drawGround();

    // Física de salto
    combi.dy += combi.gravity;
    combi.y += combi.dy;

    // Límite del suelo (pegado a la carretera)
    if (combi.y >= roadTopY - combi.height) {
      combi.y = roadTopY - combi.height;
      combi.dy = 0;
      combi.isJumping = false;
    }

    drawCombi();

    obstacles.forEach((o) => {
      o.x -= speed;
      drawObstacle(o);

      if (collides(combi, o) && gameState === "playing") {
        gameState = "crash";
        donateAfterCrash.style.display = "block";
      }
    });

    obstacles = obstacles.filter((o) => o.x + o.width > 0);

    if (gameState === "playing") {
      score = Math.floor(frameCount / 10);
      scoreElement.textContent = score;

      obstacleTimer++;
      if (obstacleTimer > (90 - Math.min(score / 10, 40)) * 1.12) { // 12% más separados
        spawnObstacle();
        obstacleTimer = 0;
      }

      requestAnimationFrame(gameLoop);
    }
  }

  retryBtn.addEventListener("click", () => {
    gameState = "playing";
    obstacles = [];
    score = 0;
    frameCount = 0;
    obstacleTimer = 0;
    donateAfterCrash.style.display = "none";
    combi.x = 70;
    combi.y = roadTopY - combi.height;
    combi.dy = 0;
    combi.isJumping = false;
    scoreElement.textContent = "0";
    gameLoop();
  });

  donateBtn.addEventListener("click", () => {
    alert("¡Gracias por tu apoyo! 💝");
  });

  gameLoop();
}
