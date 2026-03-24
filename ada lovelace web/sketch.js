let bernoulli = [];
let targetHeights = [];
let magnitudes = [];
let currentBar = 0;
let progress = 0;
let animationSpeed = 0.035;
let paused = true;
let pulseMode = false;
let pulseTime = 0;
let particles = [];
let gears = [];

function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  if (k > n - k) k = n - k;
  let res = 1;
  for (let i = 0; i < k; i++) {
    res = res * (n - i) / (i + 1);
  }
  return res;
}

function calcularBernoulli(maxN) {
  let B = new Array(maxN + 1).fill(0);
  B[0] = 1;
  for (let m = 1; m <= maxN; m++) {
    let suma = 0;
    for (let k = 0; k < m; k++) {
      suma += binomial(m + 1, k) * B[k];
    }
    B[m] = -suma / (m + 1);
  }
  return B;
}

function createParticles(x, y, sign) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-1.5, 1.5),
      vy: sign > 0 ? random(-3, -1) : random(1, 3),
      life: 40,
      color: sign > 0 ? color(100, 255, 180) : color(255, 100, 80)
    });
  }
}

function drawGear(x, y, r, angle) {
  push();
  translate(x, y);
  rotate(angle);
  fill(40, 35, 30);
  stroke(255, 215, 0);
  strokeWeight(6);
  circle(0, 0, r * 2);
  fill(255, 215, 0);
  for (let i = 0; i < 12; i++) {
    rotate(TWO_PI / 12);
    rect(r * 0.7, -8, r * 0.6, 16);
  }
  pop();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont('Georgia');

  // UI p5.js
  let input = createInput('12');
  input.position(30, 30);
  input.size(80, 35);
  input.style('font-size', '18px');

  let btn = createButton('INICIAR ANIMACIÓN');
  btn.position(130, 30);
  btn.style('font-size', '18px');
  btn.style('padding', '10px 20px');
  btn.style('background', '#ffd700');
  btn.style('color', '#0f0a19');
  btn.mousePressed(() => {
    let n = parseInt(input.value());
    if (isNaN(n) || n < 0) n = 10;
    if (n > 18) n = 18;
    bernoulli = calcularBernoulli(n);
    prepareHeights();
    currentBar = 0;
    progress = 0;
    pulseMode = false;
    particles = [];
    paused = false;
  });

  let pauseBtn = createButton('⏸ PAUSA / REANUDAR');
  pauseBtn.position(320, 30);
  pauseBtn.mousePressed(() => paused = !paused);

  let resetBtn = createButton('↺ REINICIAR');
  resetBtn.position(520, 30);
  resetBtn.mousePressed(() => {
    currentBar = 0;
    progress = 0;
    pulseMode = false;
    particles = [];
  });

  // Engranajes de fondo
  gears = [
    {x: 120, y: 120, r: 45},
    {x: width - 140, y: 90, r: 35},
    {x: 300, y: height - 120, r: 28}
  ];
}

function prepareHeights() {
  magnitudes = bernoulli.map(b => {
    if (Math.abs(b) < 1e-8) return -10;
    return Math.log10(Math.abs(b));
  });
  let maxM = Math.max(...magnitudes.filter(m => m > -5));
  let minM = Math.min(...magnitudes.filter(m => m > -5));
  targetHeights = magnitudes.map(m => {
    if (m <= -5) return 30;
    let norm = (m - minM) / (maxM - minM + 0.1);
    return 80 + norm * (height * 0.55);
  });
}

function draw() {
  background(15, 10, 25);

  // Engranajes girando (steampunk)
  let angle = frameCount * 0.008;
  gears.forEach(g => {
    drawGear(g.x, g.y, g.r, angle + (g.x % 50));
  });

  // Título y cita
  fill(255, 215, 0);
  textSize(52);
  text("ADA LOVELACE", width / 2, 70);
  fill(200, 200, 200);
  textSize(18);
  text('"La Máquina Analítica teje patrones algebraicos\ncomo el telar de Jacquard teje flores y hojas."', 
       width / 2, 130);

  if (bernoulli.length === 0) {
    fill(255);
    textSize(24);
    text("Ingresa un número y presiona INICIAR", width/2, height/2);
    return;
  }

  let barW = (width - 200) / (bernoulli.length + 1);

  for (let i = 0; i < bernoulli.length; i++) {
    let x = 100 + i * barW;
    let b = bernoulli[i];
    let h = 0;

    if (i < currentBar) {
      h = pulseMode ? targetHeights[i] * (1 + 0.08 * sin(pulseTime + i)) : targetHeights[i];
    } else if (i === currentBar && !pulseMode) {
      h = targetHeights[i] * progress;
    } else if (pulseMode) {
      h = targetHeights[i] * (1 + 0.08 * sin(pulseTime + i));
    }

    let col = b > 0 ? color(100, 255, 180) : (b < 0 ? color(255, 100, 80) : color(180));
    fill(col);
    stroke(255, 215, 0);
    strokeWeight(4);
    rect(x, height - 180 - h, barW * 0.65, h);

    // Etiqueta B_n
    fill(255, 215, 0);
    textSize(22);
    text(`B${i}`, x + barW * 0.32, height - 200 - h);

    // Valor
    if (i <= currentBar || pulseMode) {
      fill(240, 220, 180);
      textSize(14);
      let valStr = Math.abs(b) > 1000 ? b.toExponential(2) : b.toFixed(4);
      text(valStr, x + barW * 0.32, height - 140);
    }

    // Partículas mientras crece
    if (i === currentBar && progress > 0.1 && progress < 0.9 && b !== 0) {
      if (frameCount % 6 === 0) createParticles(x + barW * 0.32, height - 180 - h, b > 0 ? 1 : -1);
    }
  }

  // Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vy += 0.08;
    let alpha = map(p.life, 0, 40, 0, 255);
    fill(red(p.color), green(p.color), blue(p.color), alpha);
    noStroke();
    circle(p.x, p.y, 7);
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Barra de progreso
  let prog = currentBar / (bernoulli.length - 1);
  fill(80);
  rect(80, height - 50, width - 160, 12);
  fill(255, 215, 0);
  rect(80, height - 50, (width - 160) * prog, 12);

  // Estado
  fill(255);
  textSize(18);
  let status = paused ? "PAUSADO" : pulseMode ? "MODO ARTE (pulso)" : "ANIMANDO";
  text(status, width / 2, height - 80);

  // Animación
  if (!paused && !pulseMode) {
    progress += animationSpeed;
    if (progress >= 1) {
      currentBar++;
      progress = 0;
      if (currentBar >= bernoulli.length) {
        pulseMode = true;
      }
    }
  }
  if (pulseMode) pulseTime += 0.08;

  // Instrucciones abajo
  fill(160);
  textSize(14);
  text("ESPACIO o clic = pausar | R = reiniciar | Cambia el número arriba", width/2, height - 20);
}

function keyPressed() {
  if (key === ' ') paused = !paused;
  if (key === 'r' || key === 'R') {
    currentBar = 0;
    progress = 0;
    pulseMode = false;
    particles = [];
  }
}

function mousePressed() {
  if (mouseY > 100) paused = !paused;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}