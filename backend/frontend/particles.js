// =========================================================
// MAX AI OS v3.0
// Cinematic Particle & HUD Engine
// =========================================================

const particleCanvas = document.createElement('canvas');
particleCanvas.id = 'particle-canvas';
particleCanvas.style.position = 'fixed';
particleCanvas.style.top = '0';
particleCanvas.style.left = '0';
particleCanvas.style.width = '100%';
particleCanvas.style.height = '100%';
particleCanvas.style.pointerEvents = 'none';
particleCanvas.style.zIndex = '1';
document.body.appendChild(particleCanvas);

const pCtx = particleCanvas.getContext('2d');

let pWidth = window.innerWidth;
let pHeight = window.innerHeight;

particleCanvas.width = pWidth;
particleCanvas.height = pHeight;

// =========================================================
// PARTICLE CLASS
// =========================================================

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * pWidth;
    this.y = Math.random() * pHeight;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
    this.size = 1 + Math.random() * 2;
    this.alpha = 0.2 + Math.random() * 0.5;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -20) this.x = pWidth + 20;
    if (this.x > pWidth + 20) this.x = -20;
    if (this.y < -20) this.y = pHeight + 20;
    if (this.y > pHeight + 20) this.y = -20;
  }

  draw() {
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fillStyle = 'rgba(56,232,255,' + this.alpha + ')';
    pCtx.fill();
  }
}

// =========================================================
// CREATE PARTICLES
// =========================================================

const bgParticles = [];
const bgParticleCount = 140;

for (let i = 0; i < bgParticleCount; i++) {
  bgParticles.push(new Particle());
}

// =========================================================
// MOUSE PARALLAX
// =========================================================

let pMouseX = pWidth / 2;
let pMouseY = pHeight / 2;

window.addEventListener('mousemove', function (e) {
  pMouseX = e.clientX;
  pMouseY = e.clientY;
});

// =========================================================
// CONNECTIONS
// =========================================================

function drawConnections() {
  for (let i = 0; i < bgParticles.length; i++) {
    for (let j = i + 1; j < bgParticles.length; j++) {
      const dx = bgParticles[i].x - bgParticles[j].x;
      const dy = bgParticles[i].y - bgParticles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        const alpha = (1 - dist / 120) * 0.12;

        pCtx.beginPath();
        pCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
        pCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
        pCtx.strokeStyle = 'rgba(56,232,255,' + alpha + ')';
        pCtx.lineWidth = 1;
        pCtx.stroke();
      }
    }
  }
}

// =========================================================
// HUD CORNERS
// =========================================================

function drawHUD() {
  pCtx.strokeStyle = 'rgba(56,232,255,0.12)';
  pCtx.lineWidth = 2;

  const margin = 40;
  const size = 50;

  // Top Left
  pCtx.beginPath();
  pCtx.moveTo(margin + size, margin);
  pCtx.lineTo(margin, margin);
  pCtx.lineTo(margin, margin + size);
  pCtx.stroke();

  // Top Right
  pCtx.beginPath();
  pCtx.moveTo(pWidth - margin - size, margin);
  pCtx.lineTo(pWidth - margin, margin);
  pCtx.lineTo(pWidth - margin, margin + size);
  pCtx.stroke();

  // Bottom Left
  pCtx.beginPath();
  pCtx.moveTo(margin, pHeight - margin - size);
  pCtx.lineTo(margin, pHeight - margin);
  pCtx.lineTo(margin + size, pHeight - margin);
  pCtx.stroke();

  // Bottom Right
  pCtx.beginPath();
  pCtx.moveTo(pWidth - margin - size, pHeight - margin);
  pCtx.lineTo(pWidth - margin, pHeight - margin);
  pCtx.lineTo(pWidth - margin, pHeight - margin - size);
  pCtx.stroke();
}

// =========================================================
// SCAN LINE
// =========================================================

let scanY = 0;

function drawScanLine() {
  scanY += 0.6;

  if (scanY > pHeight) {
    scanY = 0;
  }

  const gradient = pCtx.createLinearGradient(0, scanY - 20, 0, scanY + 20);

  gradient.addColorStop(0, 'rgba(56,232,255,0)');
  gradient.addColorStop(0.5, 'rgba(56,232,255,0.08)');
  gradient.addColorStop(1, 'rgba(56,232,255,0)');

  pCtx.fillStyle = gradient;
  pCtx.fillRect(0, scanY - 20, pWidth, 40);
}

// =========================================================
// ANIMATION LOOP
// =========================================================

function animateParticles() {
  requestAnimationFrame(animateParticles);

  pCtx.clearRect(0, 0, pWidth, pHeight);

  for (let i = 0; i < bgParticles.length; i++) {
    const p = bgParticles[i];

    p.x += (pMouseX - pWidth / 2) * 0.00002;
    p.y += (pMouseY - pHeight / 2) * 0.00002;

    p.update();
    p.draw();
  }

  drawConnections();
  drawHUD();
  drawScanLine();
}

animateParticles();

// =========================================================
// RESIZE
// =========================================================

window.addEventListener('resize', function () {
  pWidth = window.innerWidth;
  pHeight = window.innerHeight;

  particleCanvas.width = pWidth;
  particleCanvas.height = pHeight;
});
