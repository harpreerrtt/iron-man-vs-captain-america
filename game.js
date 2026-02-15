const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const capHealthBar = document.getElementById("capHealth");
const ironHealthBar = document.getElementById("ironHealth");
const statusLabel = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

const gravity = 0.58;
const ground = canvas.height - 74;
const keys = {};

class Fighter {
  constructor(config) {
    Object.assign(this, config);
    this.vx = 0;
    this.vy = 0;
    this.health = 100;
    this.attackCooldown = 0;
    this.range = config.range || 100;
  }

  reset() {
    this.x = this.startX;
    this.y = ground - this.h;
    this.vx = 0;
    this.vy = 0;
    this.health = 100;
    this.attackCooldown = 0;
  }

  onGround() {
    return this.y >= ground - this.h;
  }

  jump() {
    if (this.onGround()) this.vy = -12.4;
  }

  move(dir) {
    this.vx = dir * this.speed;
  }

  update() {
    this.x += this.vx;
    this.vy += gravity;
    this.y += this.vy;

    if (this.y > ground - this.h) {
      this.y = ground - this.h;
      this.vy = 0;
    }

    this.x = Math.max(10, Math.min(canvas.width - this.w - 10, this.x));

    if (this.attackCooldown > 0) this.attackCooldown -= 1;
  }

  draw() {
    // body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // head
    ctx.fillStyle = "#f6d4b5";
    ctx.fillRect(this.x + 14, this.y - 22, this.w - 28, 24);

    // icon color
    ctx.fillStyle = this.secondary;
    ctx.fillRect(this.x + 18, this.y + 18, this.w - 36, 22);

    // name tag
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText(this.name, this.x + 8, this.y - 30);
  }
}

const captain = new Fighter({
  name: "Captain",
  startX: 120,
  x: 120,
  y: ground - 118,
  w: 68,
  h: 118,
  speed: 5,
  color: "#2f56ef",
  secondary: "#ffefef",
  range: 120
});

const ironMan = new Fighter({
  name: "Iron Man",
  startX: canvas.width - 180,
  x: canvas.width - 180,
  y: ground - 118,
  w: 68,
  h: 118,
  speed: 5,
  color: "#d62f2f",
  secondary: "#f5d45f",
  range: 160
});

const projectiles = [];
let gameOver = false;

function launchProjectile(owner, type) {
  const dir = owner === captain ? 1 : -1;
  const projectile = {
    owner,
    type,
    x: owner.x + owner.w / 2,
    y: owner.y + owner.h / 2,
    r: type === "shield" ? 14 : 8,
    speed: type === "shield" ? 10 : 12,
    damage: type === "shield" ? 12 : 10,
    color: type === "shield" ? "#a9c4ff" : "#ffcc52",
    vx: dir * (type === "shield" ? 10 : 12)
  };
  projectiles.push(projectile);
}

function inRange(attacker, defender, bonus = 0) {
  const dx = Math.abs(attacker.x + attacker.w / 2 - (defender.x + defender.w / 2));
  const dy = Math.abs(attacker.y - defender.y);
  return dx <= attacker.range + bonus && dy < 45;
}

function applyDamage(target, amount) {
  target.health = Math.max(0, target.health - amount);
  capHealthBar.style.width = `${captain.health}%`;
  ironHealthBar.style.width = `${ironMan.health}%`;

  if (target.health <= 0 && !gameOver) {
    gameOver = true;
    statusLabel.textContent = target === captain ? "Iron Man Wins!" : "Captain America Wins!";
  }
}

function punch(attacker, defender) {
  if (attacker.attackCooldown > 0 || gameOver) return;
  attacker.attackCooldown = 24;
  if (inRange(attacker, defender)) applyDamage(defender, 9);
}

function special(attacker) {
  if (attacker.attackCooldown > 0 || gameOver) return;
  attacker.attackCooldown = 34;
  if (attacker === captain) {
    launchProjectile(attacker, "shield");
  } else {
    launchProjectile(attacker, "fire");
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const p = projectiles[i];
    p.x += p.vx;

    const target = p.owner === captain ? ironMan : captain;
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;

    if (Math.hypot(p.x - tx, p.y - ty) < p.r + target.w / 2.6) {
      applyDamage(target, p.damage);
      projectiles.splice(i, 1);
      continue;
    }

    if (p.x < -30 || p.x > canvas.width + 30) {
      projectiles.splice(i, 1);
    }
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    if (p.type === "shield") {
      ctx.strokeStyle = "#ff2f2f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r - 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function handleControls() {
  if (!gameOver) {
    captain.move((keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0));
    ironMan.move((keys["ArrowRight"] ? 1 : 0) - (keys["ArrowLeft"] ? 1 : 0));
  } else {
    captain.move(0);
    ironMan.move(0);
  }
}

function drawGroundDetails() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let x = 0; x < canvas.width; x += 120) {
    ctx.fillRect(x + 12, ground + 10, 70, 4);
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  handleControls();
  captain.update();
  ironMan.update();
  updateProjectiles();

  drawGroundDetails();
  captain.draw();
  ironMan.draw();
  drawProjectiles();

  if (!gameOver && captain.health !== 100 && ironMan.health !== 100) {
    statusLabel.textContent = "Fight!";
  }

  requestAnimationFrame(loop);
}

function resetGame() {
  captain.reset();
  ironMan.reset();
  projectiles.length = 0;
  gameOver = false;
  capHealthBar.style.width = "100%";
  ironHealthBar.style.width = "100%";
  statusLabel.textContent = "Fight!";
}

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "w") captain.jump();
  if (e.key === "ArrowUp") ironMan.jump();
  if (e.key === "f") punch(captain, ironMan);
  if (e.key === "k") punch(ironMan, captain);
  if (e.key === "g") special(captain);
  if (e.key === "l") special(ironMan);
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

restartBtn.addEventListener("click", resetGame);

resetGame();
loop();
