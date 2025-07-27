// Space Defender Game - Shop Version

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 640;

// Game state
let gameRunning = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('spaceDefenderHighScore')) || 0;
let lives = 3;
let level = 1;
let player, bullets, enemies, stars;
let keys = {};
let enemySpawnTimer = 0;
let enemySpawnInterval = 60;
let gameLoopId;

// Remove all shop and booster logic
// Only keep main game state and gameplay

// DOM Elements
const menu = document.getElementById('menu');
const instructionsScreen = document.getElementById('instructions');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const instructionsBtn = document.getElementById('instructionsBtn');
const backBtn = document.getElementById('backBtn');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const levelValue = document.getElementById('levelValue');
const highScoreSpan = document.getElementById('highScore');
const finalScore = document.getElementById('finalScore');

// Utility
function randomBetween(a, b) {
    return Math.random() * (b - a) + a;
}

// Entities
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 60;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.cooldown = 0;
    }
    draw() {
        ctx.save();
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    update() {
        if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['s']) this.y += this.speed;
        // Boundaries
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
        // Shooting
        if ((keys[' '] || keys['Space']) && this.cooldown === 0) {
            bullets.push(new Bullet(this.x, this.y - this.height / 2));
            this.cooldown = 15;
        }
        if (this.cooldown > 0) this.cooldown--;
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 8;
    }
    draw() {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.y -= this.speed;
    }
}

class Enemy {
    constructor() {
        this.width = 36;
        this.height = 36;
        this.x = randomBetween(this.width / 2, canvas.width - this.width / 2);
        this.y = -this.height;
        this.speed = randomBetween(2, 2 + level * 0.5);
        this.color = '#ff0066';
    }
    draw() {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.y += this.speed;
    }
}

class Star {
    constructor() {
        this.x = randomBetween(0, canvas.width);
        this.y = randomBetween(0, canvas.height);
        this.radius = randomBetween(0.5, 1.5);
        this.speed = randomBetween(0.5, 1.5);
    }
    draw() {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = randomBetween(0, canvas.width);
        }
    }
}

// Game Functions
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    player = new Player();
    bullets = [];
    enemies = [];
    stars = Array.from({ length: 60 }, () => new Star());
    enemySpawnTimer = 0;
    enemySpawnInterval = 60;
    updateUI();
}

function updateUI() {
    scoreValue.textContent = score;
    livesValue.textContent = lives;
    levelValue.textContent = level;
    highScoreSpan.textContent = highScore;
}

function showScreen(screen) {
    menu.classList.add('hidden');
    instructionsScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    if (screen === 'menu') menu.classList.remove('hidden');
    if (screen === 'instructions') instructionsScreen.classList.remove('hidden');
    if (screen === 'game') gameScreen.classList.remove('hidden');
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(gameLoopId);
    gameOverScreen.classList.remove('hidden');
    finalScore.textContent = score;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceDefenderHighScore', highScore);
        highScoreSpan.textContent = highScore;
    }
}

function nextLevel() {
    level++;
    enemySpawnInterval = Math.max(20, 60 - level * 3);
}

function loop() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    // Player
    player.update();
    player.draw();
    // Bullets
    bullets.forEach((b, i) => {
        b.update();
        b.draw();
        if (b.y < 0) bullets.splice(i, 1);
    });
    // Enemies
    enemies.forEach((e, i) => {
        e.update();
        e.draw();
        if (e.y > canvas.height + e.height) {
            enemies.splice(i, 1);
            lives--;
            updateUI();
            if (lives <= 0) gameOver();
        }
    });
    // Collisions
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (
                b.x > e.x - e.width / 2 &&
                b.x < e.x + e.width / 2 &&
                b.y > e.y - e.height / 2 &&
                b.y < e.y + e.height / 2
            ) {
                bullets.splice(bi, 1);
                enemies.splice(ei, 1);
                score += 10;
                if (score % 100 === 0) {
                    nextLevel();
                }
                updateUI();
            }
        });
    });
    // Enemy spawn
    enemySpawnTimer++;
    if (enemySpawnTimer >= enemySpawnInterval) {
        enemies.push(new Enemy());
        enemySpawnTimer = 0;
    }
    if (gameRunning) gameLoopId = requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('keydown', e => {
    keys[e.key] = true;
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

startBtn.onclick = () => {
    showScreen('game');
    gameOverScreen.classList.add('hidden');
    resetGame();
    gameRunning = true;
    loop();
};
instructionsBtn.onclick = () => {
    showScreen('instructions');
};
backBtn.onclick = () => {
    showScreen('menu');
};
restartBtn.onclick = () => {
    showScreen('game');
    gameOverScreen.classList.add('hidden');
    resetGame();
    gameRunning = true;
    loop();
};
menuBtn.onclick = () => {
    showScreen('menu');
    gameOverScreen.classList.add('hidden');
};

// Init
showScreen('menu');
highScoreSpan.textContent = highScore;
updateUI(); 