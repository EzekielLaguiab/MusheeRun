// ============================================================
// ee RUN - Full Game Engine
// ============================================================

(function () {
  "use strict";

  // ============================================================
  // AUDIO ENGINE (Web Audio API — no external files needed)
  // ============================================================
  let audioCtx = null;
  let bgMusicStarted = false;
  let bgGainNode = null; // master gain for bg music — lets us mute instantly
  let bgActiveOscs = []; // track all live bg oscillators so we can hard-stop them

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Always try to resume in case browser suspended it
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function getBgGain() {
    const ctx2 = getAudioCtx();
    if (!bgGainNode) {
      bgGainNode = ctx2.createGain();
      bgGainNode.gain.setValueAtTime(1, ctx2.currentTime);
      bgGainNode.connect(ctx2.destination);
    }
    return bgGainNode;
  }

  // Generic helper — plays a sequence of oscillator notes (SFX, not bg music)
  function playTone(notes, type = "square", masterVol = 0.18) {
    const ctx2 = getAudioCtx();
    let t = ctx2.currentTime;
    for (const [freq, dur, vol = 1] of notes) {
      const osc = ctx2.createOscillator();
      const g = ctx2.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol * masterVol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(ctx2.destination);
      osc.start(t);
      osc.stop(t + dur + 0.01);
      t += dur;
    }
  }

  // ---- Sound: Jump ----
  function sfxJump() {
    const ctx2 = getAudioCtx();
    const osc = ctx2.createOscillator();
    const g = ctx2.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ctx2.currentTime);
    osc.frequency.exponentialRampToValueAtTime(640, ctx2.currentTime + 0.12);
    g.gain.setValueAtTime(0.22, ctx2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.18);
    osc.connect(g);
    g.connect(ctx2.destination);
    osc.start();
    osc.stop(ctx2.currentTime + 0.2);
  }

  // ---- Sound: Double Jump ----
  function sfxDoubleJump() {
    const ctx2 = getAudioCtx();
    const t = ctx2.currentTime;
    [
      [380, 0.07],
      [520, 0.07],
      [700, 0.1],
    ].forEach(([freq, dur], i) => {
      const osc = ctx2.createOscillator();
      const g = ctx2.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.07);
      g.gain.setValueAtTime(0.2, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + dur);
      osc.connect(g);
      g.connect(ctx2.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + dur + 0.01);
    });
  }

  // ---- Sound: Coin / Fruit collected ----
  function sfxCollectFruit() {
    playTone(
      [
        [523, 0.07],
        [659, 0.07],
        [784, 0.12],
      ],
      "triangle",
      0.22,
    );
  }

  // ---- Sound: Star collected ----
  function sfxCollectStar() {
    playTone(
      [
        [784, 0.06],
        [988, 0.06],
        [1175, 0.06],
        [1568, 0.14],
      ],
      "triangle",
      0.2,
    );
  }

  // ---- Sound: Heart / Health collected ----
  function sfxCollectHeart() {
    playTone(
      [
        [523, 0.08],
        [659, 0.08],
        [784, 0.08],
        [1047, 0.18],
      ],
      "sine",
      0.25,
    );
    // Extra warm overtone
    const ctx2 = getAudioCtx();
    const osc = ctx2.createOscillator();
    const g = ctx2.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1047, ctx2.currentTime + 0.04);
    g.gain.setValueAtTime(0.12, ctx2.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.5);
    osc.connect(g);
    g.connect(ctx2.destination);
    osc.start(ctx2.currentTime + 0.04);
    osc.stop(ctx2.currentTime + 0.55);
  }

  // ---- Sound: Power-up (golden / speed) ----
  function sfxPowerup() {
    playTone(
      [
        [392, 0.05],
        [494, 0.05],
        [587, 0.05],
        [698, 0.05],
        [880, 0.15],
      ],
      "square",
      0.15,
    );
  }

  // ---- Sound: Enemy hit / damage taken ----
  function sfxEnemyHit() {
    const ctx2 = getAudioCtx();
    const bufSize = ctx2.sampleRate * 0.18;
    const buf = ctx2.createBuffer(1, bufSize, ctx2.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx2.createBufferSource();
    const g = ctx2.createGain();
    const filter = ctx2.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(180, ctx2.currentTime);
    src.buffer = buf;
    g.gain.setValueAtTime(0.35, ctx2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.18);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx2.destination);
    src.start();

    // Low "oof" tone
    const osc = ctx2.createOscillator();
    const g2 = ctx2.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, ctx2.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx2.currentTime + 0.2);
    g2.gain.setValueAtTime(0.25, ctx2.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 0.22);
    osc.connect(g2);
    g2.connect(ctx2.destination);
    osc.start();
    osc.stop(ctx2.currentTime + 0.25);
  }

  // ---- Sound: Game Over ----
  function sfxGameOver() {
    playTone(
      [
        [523, 0.15],
        [494, 0.15],
        [440, 0.15],
        [392, 0.3],
      ],
      "sawtooth",
      0.2,
    );
  }

  // ---- Sound: Level Up ----
  function sfxLevelUp() {
    playTone(
      [
        [523, 0.08],
        [659, 0.08],
        [784, 0.08],
        [1047, 0.08],
        [1319, 0.18],
      ],
      "triangle",
      0.22,
    );
    // Extra sparkle layer
    const ctx2 = getAudioCtx();
    const t = ctx2.currentTime + 0.1;
    [
      [1568, 0.06],
      [1976, 0.12],
    ].forEach(([freq, dur], i) => {
      const osc = ctx2.createOscillator();
      const g = ctx2.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      g.gain.setValueAtTime(0.12, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + dur);
      osc.connect(g);
      g.connect(ctx2.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + dur + 0.01);
    });
  }

  // ---- Background Music ----
  // 8-bit style looping melody using oscillators + scheduler
  const BG_MELODY = [
    // [freq, duration_seconds]
    [523, 0.15],
    [587, 0.15],
    [659, 0.15],
    [784, 0.15],
    [880, 0.15],
    [784, 0.15],
    [698, 0.15],
    [659, 0.3],
    [523, 0.15],
    [494, 0.15],
    [523, 0.15],
    [587, 0.15],
    [659, 0.15],
    [587, 0.15],
    [523, 0.15],
    [494, 0.3],
    [440, 0.15],
    [494, 0.15],
    [523, 0.15],
    [587, 0.15],
    [659, 0.15],
    [784, 0.15],
    [880, 0.15],
    [1047, 0.3],
    [880, 0.15],
    [784, 0.15],
    [659, 0.15],
    [587, 0.15],
    [523, 0.15],
    [494, 0.15],
    [440, 0.15],
    [392, 0.3],
  ];

  const BG_BASS = [
    [131, 0.3],
    [147, 0.3],
    [165, 0.3],
    [175, 0.3],
    [131, 0.3],
    [147, 0.3],
    [165, 0.3],
    [175, 0.3],
    [110, 0.3],
    [123, 0.3],
    [131, 0.3],
    [147, 0.3],
    [98, 0.3],
    [110, 0.3],
    [123, 0.3],
    [131, 0.3],
  ];

  let bgSchedulerTimer = null;
  let bgMusicGen = 0; // incremented every start/stop; stale callbacks abort when gen mismatches

  // Hard-kill all tracked oscillators and tear down the gain node so pre-scheduled
  // (future-started) oscillators have no audio path to the destination.
  function _killBgOscs() {
    for (const osc of bgActiveOscs) {
      try {
        osc.stop();
      } catch (e) {}
      try {
        osc.disconnect();
      } catch (e) {}
    }
    bgActiveOscs = [];
    if (bgGainNode) {
      try {
        bgGainNode.gain.cancelScheduledValues(0);
      } catch (e) {}
      try {
        bgGainNode.gain.setValueAtTime(0, 0);
      } catch (e) {}
      try {
        bgGainNode.disconnect();
      } catch (e) {}
    }
    bgGainNode = null; // getBgGain() will create a fresh, connected node next time
  }

  function startBgMusic() {
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    bgMusicGen++;
    scheduleBgMusic(bgMusicGen);
  }

  function stopBgMusic() {
    bgMusicStarted = false;
    bgMusicGen++; // invalidates any in-flight setTimeout callback
    if (bgSchedulerTimer) {
      clearTimeout(bgSchedulerTimer);
      bgSchedulerTimer = null;
    }
    _killBgOscs();
  }

  function pauseBgMusic() {
    bgMusicGen++;
    if (bgSchedulerTimer) {
      clearTimeout(bgSchedulerTimer);
      bgSchedulerTimer = null;
    }
    _killBgOscs();
  }

  function resumeBgMusic() {
    if (!bgMusicStarted) return;
    bgMusicGen++;
    if (!bgSchedulerTimer) scheduleBgMusic(bgMusicGen);
  }

  function scheduleBgMusic(gen) {
    // Abort if this callback belongs to a superseded music session
    if (!bgMusicStarted || gen !== bgMusicGen) return;

    const ctx2 = getAudioCtx();
    if (ctx2.state === "suspended") ctx2.resume();
    const bgGain = getBgGain();

    const start = ctx2.currentTime + 0.02;
    const melodyDur = BG_MELODY.reduce((s, n) => s + n[1], 0);
    const bassDur = BG_BASS.reduce((s, n) => s + n[1], 0);
    const totalDur = Math.max(melodyDur, bassDur);

    // Melody (triangle wave, soft)
    let t = start;
    for (const [freq, dur] of BG_MELODY) {
      const osc = ctx2.createOscillator();
      const g = ctx2.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur - 0.02);
      osc.connect(g);
      g.connect(bgGain);
      osc.start(t);
      osc.stop(t + dur);
      bgActiveOscs.push(osc);
      osc.onended = () => {
        const idx = bgActiveOscs.indexOf(osc);
        if (idx > -1) bgActiveOscs.splice(idx, 1);
      };
      t += dur;
    }

    // Bass (sine wave, deeper)
    let tb = start;
    for (const [freq, dur] of BG_BASS) {
      const osc = ctx2.createOscillator();
      const g = ctx2.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, tb);
      g.gain.setValueAtTime(0.07, tb);
      g.gain.exponentialRampToValueAtTime(0.001, tb + dur - 0.05);
      osc.connect(g);
      g.connect(bgGain);
      osc.start(tb);
      osc.stop(tb + dur);
      bgActiveOscs.push(osc);
      osc.onended = () => {
        const idx = bgActiveOscs.indexOf(osc);
        if (idx > -1) bgActiveOscs.splice(idx, 1);
      };
      tb += dur;
    }

    // Schedule next loop only if still the active generation
    bgSchedulerTimer = setTimeout(
      () => {
        bgSchedulerTimer = null;
        if (bgMusicStarted && gen === bgMusicGen) scheduleBgMusic(gen);
      },
      (totalDur - 0.15) * 1000,
    );
  }

  // ---- DOM refs ----
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const startScreen = document.getElementById("startScreen");
  const gameScreen = document.getElementById("gameScreen");
  const pauseScreen = document.getElementById("pauseScreen");
  const gameOverScreen = document.getElementById("gameOverScreen");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const levelDisplay = document.getElementById("levelDisplay");
  const finalScore = document.getElementById("finalScore");
  const finalLevel = document.getElementById("finalLevel");
  const finalBest = document.getElementById("finalBest");
  const hiScoreVal = document.getElementById("hiScoreVal");
  const newRecordBadge = document.getElementById("newRecordBadge");
  const powerupNotif = document.getElementById("powerupNotif");
  const difficultyBadge = document.getElementById("difficultyBadge");
  const difficultySelect = document.getElementById("difficultySelect");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const menuBtn = document.getElementById("menuBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const pauseRestartBtn = document.getElementById("pauseRestartBtn");
  const pauseMenuBtn = document.getElementById("pauseMenuBtn");
  const hearts = [
    document.getElementById("h1"),
    document.getElementById("h2"),
    document.getElementById("h3"),
    document.getElementById("h4"),
    document.getElementById("h5"),
  ];

  // ---- Difficulty configuration ----
  let currentDifficulty = "medium"; // default
  const DIFFICULTY_CONFIG = {
    easy: {
      name: "Easy",
      maxHealth: 5,
      speedMultiplier: 0.85, // Not too slow, more playable
      obstacleIntervalMod: 10, // adds to interval (more time between obstacles)
      collectIntervalMod: 20, // reduces interval (more frequent collectibles)
      obstacleSpeedMod: -0.5, // slower obstacles
      obstacleSizeMod: 0.85, // 65% size - smaller obstacles
      className: "easy",
    },
    medium: {
      name: "Medium",
      maxHealth: 3,
      speedMultiplier: 1.0,
      obstacleIntervalMod: 0,
      collectIntervalMod: 0,
      obstacleSpeedMod: 0,
      obstacleSizeMod: 1.0, // normal size
      className: "medium",
    },
    hard: {
      name: "Hard",
      maxHealth: 2,
      speedMultiplier: 1.4,
      obstacleIntervalMod: -20, // reduces interval (more frequent obstacles)
      collectIntervalMod: 20, // adds to interval (less frequent collectibles)
      obstacleSpeedMod: 1.5, // faster obstacles
      obstacleSizeMod: 1.0, // normal size
      className: "hard",
    },
  };

  // ---- High score (per difficulty) ----
  function getHiScoreKey() {
    return `musheeRunHiScore_${currentDifficulty}`;
  }

  let hiScore = parseInt(localStorage.getItem(getHiScoreKey()) || "0");
  hiScoreVal.textContent = hiScore;

  // ---- Game state ----
  let W, H, GROUND;
  let raf = null;
  let gameRunning = false;
  let gamePaused = false;
  let gameOver = false;
  let score = 0;
  let level = 1;
  let health = 3;
  let frameCount = 0;
  let lastObstacleFrame = 0;
  let lastCollectFrame = 0;
  let bgTrees = [];
  let bgClouds = [];
  let particleList = [];
  let obstacles = [];
  let collectibles = [];
  let invincible = false;
  let invincibleTimer = 0;
  let speedBoost = false;
  let speedBoostTimer = 0;
  let hitCooldown = 0;
  let powerupNotifTimer = 0;

  // ---- World themes per level (10 levels) ----
  const THEMES = [
    {
      // Level 1 - Sunny Forest
      sky: ["#87CEEB", "#b8e4f9"],
      ground: "#5D4E37",
      grass: "#4CAF50",
      ground2: "#795548",
      treeTrunk: "#8B4513",
      treeLeaf: "#2e7d32",
      bgDeco: "🌳",
      name: "🌿 Forest",
    },
    {
      // Level 2 - Mushee Cave
      sky: ["#2c1a4e", "#1a0a2e"],
      ground: "#3d2b1f",
      grass: "#7B1FA2",
      ground2: "#1a1a1a",
      treeTrunk: "#4a148c",
      treeLeaf: "#ce93d8",
      bgDeco: "🍄",
      name: "🍄 Mushee Cave",
    },
    {
      // Level 3 - Glowing World
      sky: ["#001f3f", "#0a3d62"],
      ground: "#1a237e",
      grass: "#00bcd4",
      ground2: "#283593",
      treeTrunk: "#004d40",
      treeLeaf: "#00e5ff",
      bgDeco: "⭐",
      name: "✨ Glow World",
    },
    {
      // Level 4 - Candy Land
      sky: ["#fce4ec", "#f8bbd0"],
      ground: "#e91e63",
      grass: "#f48fb1",
      ground2: "#c2185b",
      treeTrunk: "#ad1457",
      treeLeaf: "#ff80ab",
      bgDeco: "🍬",
      name: "🍭 Candy Land",
    },
    {
      // Level 5 - Desert Dusk
      sky: ["#f97316", "#fbbf24"],
      ground: "#92400e",
      grass: "#d97706",
      ground2: "#78350f",
      treeTrunk: "#a16207",
      treeLeaf: "#fde68a",
      bgDeco: "🌵",
      name: "🏜️ Desert Dusk",
    },
    {
      // Level 6 - Arctic Tundra
      sky: ["#e0f2fe", "#bae6fd"],
      ground: "#1e3a5f",
      grass: "#e0f2fe",
      ground2: "#164e63",
      treeTrunk: "#93c5fd",
      treeLeaf: "#f0f9ff",
      bgDeco: "❄️",
      name: "❄️ Arctic Tundra",
    },
    {
      // Level 7 - Lava World
      sky: ["#1c0000", "#450a0a"],
      ground: "#7f1d1d",
      grass: "#ef4444",
      ground2: "#450a0a",
      treeTrunk: "#b91c1c",
      treeLeaf: "#fca5a5",
      bgDeco: "🔥",
      name: "🌋 Lava World",
    },
    {
      // Level 8 - Deep Ocean
      sky: ["#0c4a6e", "#083344"],
      ground: "#0a2540",
      grass: "#06b6d4",
      ground2: "#0e2235",
      treeTrunk: "#0891b2",
      treeLeaf: "#67e8f9",
      bgDeco: "🐠",
      name: "🌊 Deep Ocean",
    },
    {
      // Level 9 - Sky Kingdom
      sky: ["#fdf4ff", "#e9d5ff"],
      ground: "#6b21a8",
      grass: "#c084fc",
      ground2: "#581c87",
      treeTrunk: "#7e22ce",
      treeLeaf: "#f3e8ff",
      bgDeco: "☁️",
      name: "☁️ Sky Kingdom",
    },
    {
      // Level 10 - Cosmic Void
      sky: ["#0a0015", "#1a0030"],
      ground: "#0d0d0d",
      grass: "#7c3aed",
      ground2: "#050505",
      treeTrunk: "#4c1d95",
      treeLeaf: "#a78bfa",
      bgDeco: "🌌",
      name: "🌌 Cosmic Void",
    },
  ];

  // ---- Player ----
  const player = {
    x: 60,
    y: 0,
    w: 45,
    h: 45,
    vy: 0,
    jumps: 0,
    maxJumps: 2,
    onGround: false,
    frame: 0,
    frameTimer: 0,
    angle: 0,
    jumpAnim: 0,
  };

  // ---- Game speed (scales across 10 levels + difficulty modifier) ----
  function baseSpeed() {
    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    const baseValue = 4 + (level - 1) * 0.7 + (speedBoost ? 3 : 0);
    return baseValue * diffConfig.speedMultiplier;
  }

  // ---- Resize canvas ----
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    GROUND = H - 100;
    player.y = GROUND - player.h;
  }

  // ---- Show screen ----
  function showScreen(id) {
    [startScreen, gameScreen, pauseScreen, gameOverScreen].forEach((s) => {
      s.classList.remove("active");
      s.style.display = "none";
    });
    const el = document.getElementById(id);
    el.style.display = "flex";
    el.classList.add("active");
  }

  // ---- Init game ----
  function initGame() {
    resize();
    score = 0;
    level = 1;
    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    health = diffConfig.maxHealth;
    frameCount = 0;
    lastObstacleFrame = 0;
    lastCollectFrame = 0;
    bgTrees = [];
    bgClouds = [];
    obstacles = [];
    collectibles = [];
    particleList = [];
    invincible = false;
    invincibleTimer = 0;
    speedBoost = false;
    speedBoostTimer = 0;
    hitCooldown = 0;
    powerupNotifTimer = 0; // Bug fix: was missing, caused stale notif timer
    player.y = GROUND - player.h;
    player.vy = 0;
    player.jumps = 0;
    player.onGround = true;
    player.frame = 0;
    player.frameTimer = 0; // Bug fix: was missing
    player.angle = 0; // Bug fix: was missing
    player.jumpAnim = 0; // Bug fix: was missing
    updateHUD();
    updateHearts();
    hidePowerupNotif();
    showScreen("gameScreen");
    gameRunning = true;
    gamePaused = false;
    gameOver = false;
    stopBgMusic(); // stop & hard-kill any running music first
    bgMusicStarted = false; // then clear the flag before starting fresh
    startBgMusic();
    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  // ---- Main loop ----
  function loop() {
    if (!gameRunning) return;
    if (!gamePaused) update();
    draw();
    raf = requestAnimationFrame(loop);
  }

  // ---- UPDATE ----
  function update() {
    frameCount++;

    // Score
    score += 1;
    if (frameCount % 2 === 0) scoreDisplay.textContent = score;

    // Level up every 2000 pts, max level 10
    const newLevel = Math.min(Math.floor(score / 2000) + 1, 10);
    if (newLevel !== level) {
      level = newLevel;
      levelDisplay.textContent = level;
      bgTrees = [];
      bgClouds = []; // reset so new theme reseeds
      sfxLevelUp();
      showPowerupNotif(`${THEMES[level - 1].name} — Level ${level}!`);
    }

    // Background trees scroll handled in drawBackground

    // Player physics
    if (!player.onGround) {
      player.vy += 0.55; // gravity
      player.y += player.vy;
    }
    if (player.y >= GROUND - player.h) {
      player.y = GROUND - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumps = 0;
      player.jumpAnim = 0;
    }

    // Player run animation
    player.frameTimer++;
    if (player.frameTimer > 8) {
      player.frameTimer = 0;
      player.frame = (player.frame + 1) % 4;
    }

    // Hit cooldown
    if (hitCooldown > 0) hitCooldown--;

    // Invincible timer
    if (invincible) {
      invincibleTimer--;
      if (invincibleTimer <= 0) {
        invincible = false;
        showPowerupNotif("Invincibility ended!");
      }
    }

    // Speed boost timer
    if (speedBoost) {
      speedBoostTimer--;
      if (speedBoostTimer <= 0) {
        speedBoost = false;
        showPowerupNotif("Speed boost ended!");
      }
    }

    // Powerup notif timer
    if (powerupNotifTimer > 0) {
      powerupNotifTimer--;
      if (powerupNotifTimer === 0) hidePowerupNotif();
    }

    // Spawn obstacles (scales to level 10 + difficulty)
    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    const obstacleInterval = Math.max(
      80 - level * 5 + diffConfig.obstacleIntervalMod,
      30,
    );
    if (
      frameCount - lastObstacleFrame >
      obstacleInterval + Math.random() * 40
    ) {
      spawnObstacle();
      lastObstacleFrame = frameCount;
    }

    // Spawn collectibles (scales to level 10 + difficulty)
    const collectInterval = Math.max(
      60 - level * 3 + diffConfig.collectIntervalMod,
      25,
    );
    if (frameCount - lastCollectFrame > collectInterval + Math.random() * 30) {
      spawnCollectible();
      lastCollectFrame = frameCount;
    }

    // Move & check obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= baseSpeed() + o.speed;

      // Animation for different obstacle types
      if (o.flying) {
        // Flying obstacles have wave motion
        o.y = o.baseY + Math.sin(frameCount * 0.1 + o.phase) * 12;
      } else if (o.enemy) {
        // Ground enemies bob slightly but stay above ground
        o.y = GROUND - o.h + Math.sin(frameCount * 0.08 + o.phase) * 3;
      }

      if (o.x + o.w < 0) {
        obstacles.splice(i, 1);
        continue;
      }
      // Collision
      if (!invincible && hitCooldown === 0 && collidesAABB(player, o)) {
        takeDamage();
        spawnHitParticles(
          player.x + player.w / 2,
          player.y + player.h / 2,
          "#e74c3c",
        );
        obstacles.splice(i, 1);
      }
    }

    // Move & check collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      c.x -= baseSpeed();
      c.floatY += 0.08;
      c.y = c.baseY + Math.sin(c.floatY) * 10;
      if (c.x + c.w < 0) {
        collectibles.splice(i, 1);
        continue;
      }
      if (collidesAABB(player, c)) {
        collectItem(c);
        spawnHitParticles(c.x + c.w / 2, c.y + c.h / 2, c.color);
        collectibles.splice(i, 1);
      }
    }

    // Particles
    for (let i = particleList.length - 1; i >= 0; i--) {
      const p = particleList[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      if (p.life <= 0) particleList.splice(i, 1);
    }

    // Check game over
    if (health <= 0 && !gameOver) {
      endGame();
    }
  }

  // ---- Collision AABB ----
  function collidesAABB(a, b) {
    const margin = 8;
    return (
      a.x + margin < b.x + b.w - margin &&
      a.x + a.w - margin > b.x + margin &&
      a.y + margin < b.y + b.h - margin &&
      a.y + a.h - margin > b.y + margin
    );
  }

  // ---- Spawn obstacle ----
  function spawnObstacle() {
    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    const types = [
      // Ground obstacles
      {
        emoji: "🍄",
        color: "#8B0000",
        w: 52,
        h: 52,
        speed: 0.5,
        enemy: false,
        label: "poison",
        flying: false,
      },
      {
        emoji: "🪨",
        color: "#777",
        w: 58,
        h: 48,
        speed: 0.8,
        enemy: false,
        label: "rock",
        flying: false,
      },
      {
        emoji: "🌵",
        color: "#2e7d32",
        w: 42,
        h: 72,
        speed: 0.3,
        enemy: false,
        label: "cactus",
        flying: false,
      },
      {
        emoji: "🐛",
        color: "#b71c1c",
        w: 68,
        h: 52,
        speed: 1.5,
        enemy: true,
        label: "bug",
        flying: false,
      },
      {
        emoji: "🐌",
        color: "#e65100",
        w: 66,
        h: 50,
        speed: 0.6,
        enemy: true,
        label: "slug",
        flying: false,
      },
      // Flying obstacles - SMALLER size
      {
        emoji: "🦅",
        color: "#8B4513",
        w: 42,
        h: 42,
        speed: 1.2,
        enemy: true,
        label: "eagle",
        flying: true,
      },
      {
        emoji: "🦇",
        color: "#6a1b9a",
        w: 40,
        h: 40,
        speed: 1.4,
        enemy: true,
        label: "bat",
        flying: true,
      },
      {
        emoji: "🐝",
        color: "#ffd700",
        w: 38,
        h: 38,
        speed: 1.0,
        enemy: true,
        label: "bee",
        flying: true,
      },
      {
        emoji: "🦋",
        color: "#ff1744",
        w: 36,
        h: 36,
        speed: 0.8,
        enemy: true,
        label: "butterfly",
        flying: true,
      },
    ];
    const t = types[Math.floor(Math.random() * types.length)];

    // Apply size modifier based on difficulty
    const adjustedW = Math.round(t.w * diffConfig.obstacleSizeMod);
    const adjustedH = Math.round(t.h * diffConfig.obstacleSizeMod);

    // Determine Y position based on whether it's flying or ground
    let yPos;
    if (t.flying) {
      // Flying obstacles at LOWER heights (easier to see and dodge)
      const heights = [
        GROUND - adjustedH - 50, // Low flight - just above player jump
        GROUND - adjustedH - 85, // Mid flight
        GROUND - adjustedH - 120, // High flight
      ];
      yPos = heights[Math.floor(Math.random() * heights.length)];
    } else {
      // Ground obstacles
      yPos = GROUND - adjustedH;
    }

    obstacles.push({
      x: W + 20,
      y: yPos,
      baseY: yPos, // Store base Y for flying animation
      w: adjustedW,
      h: adjustedH,
      emoji: t.emoji,
      color: t.color,
      speed: t.speed + diffConfig.obstacleSpeedMod,
      enemy: t.enemy,
      label: t.label,
      flying: t.flying,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // ---- Spawn collectible ----
  function spawnCollectible() {
    const types = [
      { emoji: "💰", color: "#f1c40f", pts: 10, type: "coin" },
      { emoji: "⭐", color: "#f39c12", pts: 25, type: "star" },
      { emoji: "🍓", color: "#e74c3c", pts: 5, type: "berry" },
      { emoji: "🌟", color: "#FFD700", pts: 50, type: "bigstar", w: 36, h: 36 },
      // Power-ups
      { emoji: "🏅", color: "#FFD700", pts: 0, type: "golden" },
      { emoji: "🍃", color: "#4CAF50", pts: 0, type: "speedleaf" },
      { emoji: "💖", color: "#e91e63", pts: 0, type: "heart" },
    ];
    // Weighted: power-ups less frequent
    const weights = [30, 20, 25, 10, 5, 5, 8];
    let rand = Math.random() * weights.reduce((a, b) => a + b, 0);
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    const t = types[idx];
    const groundY = GROUND - 50;
    const airY = groundY - 60 - Math.random() * 60;
    const baseY = Math.random() < 0.5 ? groundY : airY;
    collectibles.push({
      x: W + 10,
      y: baseY,
      baseY: baseY,
      w: t.w || 30,
      h: t.h || 30,
      emoji: t.emoji,
      color: t.color,
      pts: t.pts,
      type: t.type,
      floatY: Math.random() * Math.PI * 2,
    });
  }

  // ---- Take damage ----
  function takeDamage() {
    if (health <= 0) return;
    health--;
    hitCooldown = 80;
    sfxEnemyHit();
    updateHearts();
    // Shake effect
    shakeCanvas();
  }

  function shakeCanvas() {
    let shakes = 0;
    canvas.style.position = "relative";
    const shake = setInterval(() => {
      canvas.style.left = (Math.random() - 0.5) * 10 + "px";
      canvas.style.top = (Math.random() - 0.5) * 10 + "px";
      shakes++;
      if (shakes > 8) {
        clearInterval(shake);
        canvas.style.left = "0px";
        canvas.style.top = "0px";
        canvas.style.position = "";
      }
    }, 30);
  }

  // ---- Collect item ----
  function collectItem(c) {
    if (c.pts > 0) {
      score += c.pts;
      // Star vs regular fruit/coin
      if (c.type === "star" || c.type === "bigstar") sfxCollectStar();
      else sfxCollectFruit();
    }
    switch (c.type) {
      case "golden":
        invincible = true;
        invincibleTimer = 300;
        sfxPowerup();
        showPowerupNotif("🏅 Golden Mushee! Invincible!");
        break;
      case "speedleaf":
        speedBoost = true;
        speedBoostTimer = 240;
        sfxPowerup();
        showPowerupNotif("🍃 Speed Boost!");
        break;
      case "heart":
        sfxCollectHeart();
        const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
        if (health < diffConfig.maxHealth) {
          health = Math.min(health + 1, diffConfig.maxHealth);
          updateHearts();
          showPowerupNotif("💖 +1 Heart!");
        } else {
          score += 20;
          showPowerupNotif("💖 Full health! +20 pts");
        }
        break;
    }
  }

  // ---- Spawn particles ----
  function spawnHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particleList.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        color,
        r: 4 + Math.random() * 4,
      });
    }
  }

  // ---- Update HUD ----
  function updateHUD() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;
  }

  // ---- Update hearts ----
  function updateHearts() {
    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    hearts.forEach((h, i) => {
      if (i < diffConfig.maxHealth) {
        // This heart slot is used for this difficulty
        h.style.display = "inline";
        if (i < health) {
          h.classList.remove("lost");
          h.classList.add("pulse");
          setTimeout(() => h.classList.remove("pulse"), 500);
        } else {
          h.classList.add("lost");
        }
      } else {
        // Hide extra hearts not used in this difficulty
        h.style.display = "none";
      }
    });
  }

  // ---- Powerup notification ----
  function showPowerupNotif(msg) {
    powerupNotif.textContent = msg;
    powerupNotif.classList.remove("hidden");
    powerupNotifTimer = 120;
  }
  function hidePowerupNotif() {
    powerupNotif.classList.add("hidden");
  }

  // ---- End game ----
  function endGame() {
    gameRunning = false;
    gameOver = true;
    cancelAnimationFrame(raf);
    stopBgMusic();
    sfxGameOver();

    const diffConfig = DIFFICULTY_CONFIG[currentDifficulty];
    const isNew = score > hiScore;
    if (isNew) {
      hiScore = score;
      localStorage.setItem(getHiScoreKey(), hiScore);
      hiScoreVal.textContent = hiScore;
    }

    finalScore.textContent = score;
    finalLevel.textContent = level;
    finalBest.textContent = hiScore;
    newRecordBadge.classList.toggle("hidden", !isNew);

    // Update difficulty badge
    difficultyBadge.textContent = diffConfig.name;
    difficultyBadge.className = "difficulty-badge " + diffConfig.className;

    setTimeout(() => showScreen("gameOverScreen"), 600);
  }

  // ============================================================
  // DRAW
  // ============================================================
  function draw() {
    const theme = THEMES[Math.min(level - 1, THEMES.length - 1)];
    ctx.clearRect(0, 0, W, H);

    drawBackground(theme);
    drawGround(theme);
    drawCollectibles();
    drawObstacles();
    drawPlayer(theme);
    drawParticles();
    drawInvincibleShield();

    // Score popup (big score gains)
  }

  // ---- Background ----
  function drawBackground(theme) {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, GROUND);

    // ---- CLOUDS ----
    // Seed clouds on first frame
    if (bgClouds.length === 0) {
      for (let x = 0; x < W + 400; x += 160 + Math.random() * 200) {
        bgClouds.push(makeCloud(x, true));
      }
    }

    // Move clouds (slower than trees — parallax feel)
    for (const c of bgClouds) {
      c.x -= baseSpeed() * c.speedMult;
      // Gentle vertical drift
      c.y += Math.sin(frameCount * 0.008 + c.phase) * 0.18;
    }

    // Spawn new clouds from right edge
    const rightmostCloud = bgClouds.reduce((m, c) => Math.max(m, c.x + c.w), 0);
    if (rightmostCloud < W + 80) {
      bgClouds.push(makeCloud(W + 60 + Math.random() * 200, false));
    }

    // Cull off-screen clouds
    for (let i = bgClouds.length - 1; i >= 0; i--) {
      if (bgClouds[i].x + bgClouds[i].w < 0) bgClouds.splice(i, 1);
    }

    // Draw far clouds first, then near
    for (const c of bgClouds) if (c.layer === 0) drawCloud(c, theme);
    for (const c of bgClouds) if (c.layer === 1) drawCloud(c, theme);

    // Seed initial trees to fill screen
    if (bgTrees.length === 0) {
      for (let x = 40; x < W + 200; x += 80 + Math.random() * 120) {
        bgTrees.push(makeBgTree(x));
      }
    }

    // Move trees
    const speed = baseSpeed() * 0.35;
    for (const t of bgTrees) t.x -= speed;

    // Spawn new trees off right edge when gap opens up
    const rightmost = bgTrees.reduce((m, t) => Math.max(m, t.x), 0);
    if (rightmost < W + 60) {
      bgTrees.push(makeBgTree(rightmost + 70 + Math.random() * 130));
    }

    // Remove off-screen trees
    for (let i = bgTrees.length - 1; i >= 0; i--) {
      if (bgTrees[i].x + bgTrees[i].size < 0) bgTrees.splice(i, 1);
    }

    // Draw back-layer (smaller, more transparent) first
    for (const t of bgTrees) {
      if (t.layer === 0) drawBgTree(t, theme);
    }
    // Then front layer
    for (const t of bgTrees) {
      if (t.layer === 1) drawBgTree(t, theme);
    }
  }

  // ---- Make a random cloud ----
  function makeCloud(x, initial) {
    const layer = Math.random() < 0.45 ? 0 : 1; // 0=far/small, 1=near/big
    const w = layer === 0 ? 90 + Math.random() * 80 : 140 + Math.random() * 120;
    const h = layer === 0 ? 32 + Math.random() * 22 : 44 + Math.random() * 30;
    // Vertical: upper 55% of sky
    const yMin = GROUND * 0.04;
    const yMax = GROUND * (layer === 0 ? 0.42 : 0.35);
    const y = initial
      ? yMin + Math.random() * (yMax - yMin)
      : yMin + Math.random() * (yMax - yMin);
    // Far clouds move slower
    const speedMult =
      layer === 0 ? 0.08 + Math.random() * 0.06 : 0.15 + Math.random() * 0.1;
    // Puff count: 3-6 bumps
    const puffs = 3 + Math.floor(Math.random() * 4);
    const phase = Math.random() * Math.PI * 2;
    return { x, y, w, h, layer, speedMult, puffs, phase };
  }

  // ---- Draw one cloud ----
  function drawCloud(c, theme) {
    const { x, y, w, h, layer, puffs, phase } = c;
    const alpha = layer === 0 ? 0.55 : 0.88;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Pick cloud color based on theme sky
    // Day themes: white/soft. Night/cave themes: tinted.
    const cloudColors = [
      { base: "#ffffff", shadow: "#d0e8f5", tint: "rgba(255,255,255,0.6)" }, // Forest
      { base: "#c9a0dc", shadow: "#7b4f9e", tint: "rgba(180,120,220,0.4)" }, // Cave
      { base: "#a0d8ef", shadow: "#3a7fd5", tint: "rgba(120,200,255,0.5)" }, // Glow
      { base: "#fff0f5", shadow: "#f9b4c8", tint: "rgba(255,210,230,0.5)" }, // Candy
    ];
    const cc = cloudColors[Math.min(level - 1, 3)];

    // Build puff positions along the cloud width
    const cx = x + w / 2;
    const cy = y;

    // Shadow blob underneath (gives depth)
    ctx.fillStyle = cc.shadow;
    ctx.globalAlpha = alpha * 0.28;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.55, w * 0.46, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Draw puffs from back to front using clip so they merge cleanly
    // Base flat bottom ellipse
    ctx.fillStyle = cc.base;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.18, w * 0.48, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Puff bumps along the top
    const puffStep = w / (puffs + 1);
    for (let i = 0; i < puffs; i++) {
      const px = x + puffStep * (i + 1);
      // Vary puff sizes: centre ones are tallest
      const centreness =
        1 - Math.abs((i - (puffs - 1) / 2) / ((puffs + 1) / 2));
      const pr =
        (h * 0.5 + centreness * h * 0.35) * (0.75 + Math.sin(phase + i) * 0.12);
      ctx.fillStyle = cc.base;
      ctx.beginPath();
      ctx.arc(px, cy, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gloss highlight on top-left of each puff
    for (let i = 0; i < puffs; i++) {
      const px = x + puffStep * (i + 1);
      const centreness =
        1 - Math.abs((i - (puffs - 1) / 2) / ((puffs + 1) / 2));
      const pr =
        (h * 0.5 + centreness * h * 0.35) * (0.75 + Math.sin(phase + i) * 0.12);
      const glossGrad = ctx.createRadialGradient(
        px - pr * 0.3,
        cy - pr * 0.3,
        pr * 0.05,
        px,
        cy,
        pr,
      );
      glossGrad.addColorStop(0, "rgba(255,255,255,0.62)");
      glossGrad.addColorStop(0.5, "rgba(255,255,255,0.15)");
      glossGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.arc(px, cy, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle inner shadow on lower part (gives volume)
    const shadowGrad = ctx.createLinearGradient(cx, cy, cx, cy + h * 0.6);
    shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
    shadowGrad.addColorStop(1, `rgba(0,0,0,${layer === 0 ? 0.06 : 0.09})`);
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.18, w * 0.48, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---- Make a random background tree ----
  function makeBgTree(x) {
    // Variety: 0=round, 1=tall-pine, 2=fat-bush, 3=palm, 4=double-puff
    const variety = Math.floor(Math.random() * 5);
    const layer = Math.random() < 0.45 ? 0 : 1; // 0=far back, 1=closer
    const size =
      layer === 0
        ? 55 + Math.random() * 45 // back: 55-100
        : 80 + Math.random() * 60; // front: 80-140
    return { x, size, variety, layer, seed: Math.random() * 100 };
  }

  // ---- Draw one background tree ----
  function drawBgTree(t, theme) {
    const { x, size, variety, layer, seed } = t;
    const baseY = GROUND - 8;
    const alpha = layer === 0 ? 0.45 : 0.75;

    ctx.save();
    ctx.globalAlpha = alpha;

    switch (variety) {
      case 0:
        drawRoundTree(x, baseY, size, theme);
        break;
      case 1:
        drawPineTree(x, baseY, size, theme);
        break;
      case 2:
        drawFatBush(x, baseY, size, theme);
        break;
      case 3:
        drawPalmTree(x, baseY, size, theme);
        break;
      case 4:
        drawDoublePuff(x, baseY, size, theme);
        break;
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Variety 0: Classic round tree
  function drawRoundTree(x, baseY, size, theme) {
    const trunkW = size * 0.13;
    const trunkH = size * 0.45;
    const canopyR = size * 0.38;
    const canopyY = baseY - trunkH - canopyR * 0.6;
    ctx.fillStyle = theme.treeTrunk;
    ctx.beginPath();
    ctx.roundRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH, 3);
    ctx.fill();
    ctx.fillStyle = theme.treeLeaf;
    ctx.beginPath();
    ctx.arc(x, canopyY, canopyR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha *= 0.7;
    ctx.beginPath();
    ctx.arc(
      x - size * 0.18,
      canopyY + size * 0.08,
      canopyR * 0.7,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      x + size * 0.18,
      canopyY + size * 0.1,
      canopyR * 0.65,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Variety 1: Tall pine / triangle tree
  function drawPineTree(x, baseY, size, theme) {
    const trunkW = size * 0.1;
    const trunkH = size * 0.4; // Taller trunk

    // Draw trunk
    ctx.fillStyle = theme.treeTrunk;
    ctx.beginPath();
    ctx.roundRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH, 2);
    ctx.fill();

    // Draw triangular leaves (pine shape) - starts from top of trunk
    ctx.fillStyle = theme.treeLeaf;
    // Three stacked triangles
    for (let i = 0; i < 3; i++) {
      const ty = baseY - trunkH - i * size * 0.25; // Start from trunk top
      const tw = size * (0.45 - i * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, ty - size * 0.3); // Top point
      ctx.lineTo(x - tw, ty); // Bottom left
      ctx.lineTo(x + tw, ty); // Bottom right
      ctx.closePath();
      ctx.fill();

      // Add darker outline for depth
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Variety 2: Fat squat bush
  function drawFatBush(x, baseY, size, theme) {
    ctx.fillStyle = theme.treeLeaf;
    const bushY = baseY - size * 0.28;
    ctx.beginPath();
    ctx.ellipse(x, bushY, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha *= 0.8;
    ctx.beginPath();
    ctx.ellipse(
      x - size * 0.25,
      bushY + size * 0.05,
      size * 0.35,
      size * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      x + size * 0.25,
      bushY + size * 0.05,
      size * 0.32,
      size * 0.22,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Variety 3: Palm tree
  function drawPalmTree(x, baseY, size, theme) {
    const lean = Math.sin(x * 0.05) * 0.18; // natural lean based on position
    ctx.fillStyle = theme.treeTrunk;
    // Curved trunk via bezier
    ctx.beginPath();
    ctx.moveTo(x - 4, baseY);
    ctx.quadraticCurveTo(
      x + size * 0.15 * lean,
      baseY - size * 0.5,
      x + size * lean * 0.3,
      baseY - size * 0.85,
    );
    ctx.quadraticCurveTo(
      x + size * 0.1 * lean + 4,
      baseY - size * 0.5,
      x + 4,
      baseY,
    );
    ctx.closePath();
    ctx.fill();
    // Fronds
    const topX = x + size * lean * 0.3;
    const topY = baseY - size * 0.85;
    ctx.strokeStyle = theme.treeLeaf;
    ctx.lineWidth = size * 0.07;
    ctx.lineCap = "round";
    const frondAngles = [-1.1, -0.5, 0.1, 0.7, 1.3, 1.9, -1.7];
    for (const a of frondAngles) {
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(a) * size * 0.35,
        topY + Math.sin(a) * size * 0.22,
        topX + Math.cos(a) * size * 0.52,
        topY + Math.sin(a) * size * 0.1 + size * 0.12,
      );
      ctx.stroke();
    }
  }

  // Variety 4: Double-puff (cloud tree)
  function drawDoublePuff(x, baseY, size, theme) {
    const trunkW = size * 0.11;
    const trunkH = size * 0.38;
    ctx.fillStyle = theme.treeTrunk;
    ctx.beginPath();
    ctx.roundRect(x - trunkW / 2, baseY - trunkH, trunkW, trunkH, 3);
    ctx.fill();
    ctx.fillStyle = theme.treeLeaf;
    const topY = baseY - trunkH - size * 0.18;
    // Left puff
    ctx.beginPath();
    ctx.arc(x - size * 0.22, topY, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right puff
    ctx.beginPath();
    ctx.arc(x + size * 0.22, topY - size * 0.04, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Center overlap
    ctx.beginPath();
    ctx.arc(x, topY - size * 0.06, size * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Ground ----
  function drawGround(theme) {
    // Main ground
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, GROUND, W, H - GROUND);

    // Grass strip
    ctx.fillStyle = theme.grass;
    ctx.fillRect(0, GROUND - 8, W, 16);

    // Ground detail
    ctx.fillStyle = theme.ground2;
    ctx.fillRect(0, GROUND + 22, W, 12);
  }

  // ---- Player ---- (DFO-style chibi food character)
  function drawPlayer(theme) {
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;
    const cx = px + pw / 2;
    const cy = py + ph / 2;

    const t = frameCount;

    ctx.save();
    ctx.translate(cx, cy);

    // Invincible rainbow glow
    if (invincible) {
      ctx.shadowColor = `hsl(${(t * 10) % 360}, 100%, 65%)`;
      ctx.shadowBlur = 26;
    }

    // Hit flash
    if (hitCooldown > 0 && Math.floor(hitCooldown / 6) % 2 === 0) {
      ctx.globalAlpha = 0.25;
    }

    // ---- Squash & stretch ----
    // Running: subtle side-to-side bob
    // Jumping: stretch up on ascent, squash on land
    let scaleX = 1,
      scaleY = 1;
    const bobY = player.onGround ? Math.sin(t * 0.35) * 2.5 : 0;

    if (player.onGround) {
      // Gentle squash bounce while running
      const bounce = Math.abs(Math.sin(t * 0.35));
      scaleX = 1 + bounce * 0.06;
      scaleY = 1 - bounce * 0.05;
    } else {
      // Stretch on jump, squash at peak
      const stretchAmt = Math.max(0, -player.vy / 18);
      const squashAmt = Math.max(0, player.vy / 22);
      scaleX = 1 - stretchAmt * 0.18 + squashAmt * 0.14;
      scaleY = 1 + stretchAmt * 0.22 - squashAmt * 0.12;
    }
    ctx.scale(scaleX, scaleY);
    ctx.translate(0, bobY);

    // ---- Cap level color (10 levels) ----
    const capColors = [
      "#e53935",
      "#7B1FA2",
      "#1565C0",
      "#e91e63",
      "#e65100",
      "#0277bd",
      "#b71c1c",
      "#006064",
      "#6a1b9a",
      "#37474f",
    ];
    const capColors2 = [
      "#b71c1c",
      "#4a148c",
      "#0d47a1",
      "#ad1457",
      "#bf360c",
      "#01579b",
      "#7f0000",
      "#004d40",
      "#4a148c",
      "#212121",
    ];
    const rimColors = [
      "#ef9a9a",
      "#ce93d8",
      "#90caf9",
      "#f48fb1",
      "#ffcc80",
      "#b3e5fc",
      "#ff8a80",
      "#80deea",
      "#e1bee7",
      "#b0bec5",
    ];
    const capC = capColors[Math.min(level - 1, 9)];
    const capC2 = capColors2[Math.min(level - 1, 9)];
    const rimC = rimColors[Math.min(level - 1, 9)];

    const R = pw * 0.52; // body radius — the main fat circle

    // ==============================
    // SHADOW
    // ==============================
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.48, R * 0.78 * scaleX, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ==============================
    // BODY — big round cream/white circle (DFO food style)
    // ==============================
    const bodyGrad = ctx.createRadialGradient(
      -R * 0.2,
      -R * 0.25,
      R * 0.05,
      0,
      0,
      R,
    );
    bodyGrad.addColorStop(0, "#fffdf5");
    bodyGrad.addColorStop(0.6, "#f5e6c8");
    bodyGrad.addColorStop(1, "#e8c898");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, R * 0.08, R, 0, Math.PI * 2);
    ctx.fill();

    // Body rim shadow (bottom)
    ctx.fillStyle = "rgba(140,90,30,0.13)";
    ctx.beginPath();
    ctx.ellipse(0, R * 0.62, R * 0.82, R * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body highlight (top-left gloss — DFO style sheen)
    const gloss = ctx.createRadialGradient(
      -R * 0.28,
      -R * 0.1,
      0,
      -R * 0.2,
      -R * 0.05,
      R * 0.42,
    );
    gloss.addColorStop(0, "rgba(255,255,255,0.72)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0.18)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(0, R * 0.08, R, 0, Math.PI * 2);
    ctx.fill();

    // ==============================
    // MUSHROOM CAP (sits on top of body, wide brim)
    // ==============================
    const capY = -R * 0.52; // top of body

    // Cap shadow under brim
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.ellipse(0, capY + R * 0.18, R * 0.88, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brim (wide flat ledge) — use a bezier dome shape
    ctx.fillStyle = capC2;
    ctx.beginPath();
    ctx.moveTo(-R * 0.92, capY + R * 0.12);
    ctx.quadraticCurveTo(-R * 0.85, capY + R * 0.22, 0, capY + R * 0.24);
    ctx.quadraticCurveTo(R * 0.85, capY + R * 0.22, R * 0.92, capY + R * 0.12);
    ctx.quadraticCurveTo(R * 0.75, capY + R * 0.36, 0, capY + R * 0.38);
    ctx.quadraticCurveTo(
      -R * 0.75,
      capY + R * 0.36,
      -R * 0.92,
      capY + R * 0.12,
    );
    ctx.closePath();
    ctx.fill();

    // Cap dome — main colour
    const capGrad = ctx.createRadialGradient(
      -R * 0.18,
      capY - R * 0.22,
      R * 0.04,
      0,
      capY,
      R * 0.75,
    );
    capGrad.addColorStop(0, rimC);
    capGrad.addColorStop(0.4, capC);
    capGrad.addColorStop(1, capC2);
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.moveTo(-R * 0.88, capY + R * 0.12);
    ctx.quadraticCurveTo(-R * 0.92, capY - R * 0.05, -R * 0.6, capY - R * 0.5);
    ctx.quadraticCurveTo(-R * 0.2, capY - R * 0.95, 0, capY - R * 0.98);
    ctx.quadraticCurveTo(R * 0.2, capY - R * 0.95, R * 0.6, capY - R * 0.5);
    ctx.quadraticCurveTo(R * 0.92, capY - R * 0.05, R * 0.88, capY + R * 0.12);
    ctx.quadraticCurveTo(R * 0.5, capY + R * 0.22, 0, capY + R * 0.24);
    ctx.quadraticCurveTo(-R * 0.5, capY + R * 0.22, -R * 0.88, capY + R * 0.12);
    ctx.closePath();
    ctx.fill();

    // Cap gloss streak (DFO sheen)
    const capGloss = ctx.createLinearGradient(
      -R * 0.3,
      capY - R * 0.9,
      -R * 0.05,
      capY - R * 0.2,
    );
    capGloss.addColorStop(0, "rgba(255,255,255,0.55)");
    capGloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = capGloss;
    ctx.beginPath();
    ctx.moveTo(-R * 0.5, capY - R * 0.55);
    ctx.quadraticCurveTo(-R * 0.55, capY - R * 0.2, -R * 0.22, capY - R * 0.1);
    ctx.quadraticCurveTo(
      -R * 0.08,
      capY - R * 0.25,
      -R * 0.12,
      capY - R * 0.72,
    );
    ctx.closePath();
    ctx.fill();

    // Spots on cap — wobble slightly
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const wob = Math.sin(t * 0.12) * 2;
    const spots = [
      { x: 0, y: capY - R * 0.58, r: R * 0.13 },
      { x: -R * 0.38, y: capY - R * 0.28, r: R * 0.1 },
      { x: R * 0.38, y: capY - R * 0.28, r: R * 0.1 },
      { x: -R * 0.58, y: capY - R * 0.0, r: R * 0.07 },
      { x: R * 0.58, y: capY - R * 0.0, r: R * 0.07 },
    ];
    for (const sp of spots) {
      ctx.beginPath();
      ctx.arc(sp.x + wob * 0.3, sp.y + wob * 0.2, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Spot inner depth
    ctx.fillStyle = "rgba(220,200,255,0.35)";
    for (const sp of spots) {
      ctx.beginPath();
      ctx.arc(
        sp.x - sp.r * 0.25,
        sp.y - sp.r * 0.25,
        sp.r * 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // ==============================
    // FACE — huge DFO chibi eyes
    // ==============================
    const faceY = R * 0.02;
    const eyeX = R * 0.27;

    // Determine eye state
    const isRunning = player.onGround;
    const blinkInterval = 180;
    const isBlinking = t % blinkInterval > blinkInterval - 8;

    // Eye whites (large ovals — classic chibi food)
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(
      -eyeX,
      faceY,
      R * 0.22,
      isBlinking ? R * 0.04 : R * 0.26,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      eyeX,
      faceY,
      R * 0.22,
      isBlinking ? R * 0.04 : R * 0.26,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    if (!isBlinking) {
      // Iris (dark)
      const pupilShift = isRunning ? Math.sin(t * 0.18) * 1.5 : 1.5;
      ctx.fillStyle = "#1a0a00";
      ctx.beginPath();
      ctx.ellipse(
        -eyeX + pupilShift * 0.4,
        faceY + 2,
        R * 0.13,
        R * 0.17,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        eyeX + pupilShift * 0.4,
        faceY + 2,
        R * 0.13,
        R * 0.17,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      // Eye shine — two dots (DFO style)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-eyeX - R * 0.05, faceY - R * 0.08, R * 0.065, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-eyeX + R * 0.06, faceY - R * 0.03, R * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX - R * 0.05, faceY - R * 0.08, R * 0.065, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX + R * 0.06, faceY - R * 0.03, R * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy cheeks
    ctx.fillStyle = "rgba(255,140,140,0.28)";
    ctx.beginPath();
    ctx.ellipse(
      -eyeX - R * 0.08,
      faceY + R * 0.22,
      R * 0.2,
      R * 0.1,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      eyeX + R * 0.08,
      faceY + R * 0.22,
      R * 0.2,
      R * 0.1,
      0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Mouth — happy running / surprised jumping
    ctx.strokeStyle = "#5a2d0c";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    if (!player.onGround) {
      // Surprised O mouth
      ctx.fillStyle = "#5a2d0c";
      ctx.beginPath();
      ctx.ellipse(0, faceY + R * 0.32, R * 0.1, R * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Happy curve
      ctx.beginPath();
      ctx.arc(0, faceY + R * 0.18, R * 0.18, 0.15, Math.PI - 0.15);
      ctx.stroke();
      // tiny tongue on every 4th step
      if (player.frame === 2) {
        ctx.fillStyle = "#e57373";
        ctx.beginPath();
        ctx.ellipse(0, faceY + R * 0.36, R * 0.08, R * 0.06, 0, 0, Math.PI);
        ctx.fill();
      }
    }

    // ==============================
    // ARMS — stubby little DFO arms that swing
    // ==============================
    const armSwing = player.onGround
      ? Math.sin(t * 0.35) * 22
      : player.vy < 0
        ? -35
        : 20;
    ctx.fillStyle = "#f0d8a8";
    ctx.strokeStyle = "#c8a870";
    ctx.lineWidth = 1.2;

    // Left arm
    ctx.save();
    ctx.translate(-R * 0.82, R * 0.1);
    ctx.rotate((armSwing * Math.PI) / 180);
    ctx.beginPath();
    ctx.ellipse(0, R * 0.22, R * 0.12, R * 0.22, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Hand
    ctx.fillStyle = "#f5e6c8";
    ctx.beginPath();
    ctx.arc(R * 0.04, R * 0.42, R * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right arm
    ctx.save();
    ctx.translate(R * 0.82, R * 0.1);
    ctx.rotate((-armSwing * Math.PI) / 180);
    ctx.beginPath();
    ctx.ellipse(0, R * 0.22, R * 0.12, R * 0.22, -0.15, 0, Math.PI * 2);
    ctx.fillStyle = "#f0d8a8";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f5e6c8";
    ctx.beginPath();
    ctx.arc(-R * 0.04, R * 0.42, R * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ==============================
    // LEGS — stubby DFO waddle cycle
    // ==============================
    const legCycle = t * 0.38;
    const legSwingL = Math.sin(legCycle) * (player.onGround ? 28 : 15);
    const legSwingR = -Math.sin(legCycle) * (player.onGround ? 28 : 15);
    const legBaseY = R * 0.82;

    ctx.fillStyle = "#e8c898";
    ctx.strokeStyle = "#c8a870";
    ctx.lineWidth = 1;

    // Left leg
    ctx.save();
    ctx.translate(-R * 0.3, legBaseY);
    ctx.rotate((legSwingL * Math.PI) / 180);
    // Upper leg
    ctx.beginPath();
    ctx.ellipse(0, R * 0.14, R * 0.13, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Foot (little rounded boot)
    ctx.fillStyle = "#a0785a";
    ctx.beginPath();
    ctx.ellipse(R * 0.04, R * 0.34, R * 0.14, R * 0.1, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right leg
    ctx.save();
    ctx.translate(R * 0.3, legBaseY);
    ctx.rotate((legSwingR * Math.PI) / 180);
    ctx.fillStyle = "#e8c898";
    ctx.beginPath();
    ctx.ellipse(0, R * 0.14, R * 0.13, R * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a0785a";
    ctx.beginPath();
    ctx.ellipse(R * 0.04, R * 0.34, R * 0.14, R * 0.1, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ==============================
    // SPEED LINES when boost active
    // ==============================
    if (speedBoost) {
      ctx.strokeStyle = `rgba(255,220,80,${0.5 + Math.sin(t * 0.3) * 0.3})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const ly = -R * 0.3 + i * R * 0.28;
        const llen = R * (0.5 + Math.random() * 0.4);
        ctx.beginPath();
        ctx.moveTo(-R * 0.9, ly);
        ctx.lineTo(-R * 0.9 - llen, ly);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ---- Draw obstacles ----
  function drawObstacles() {
    for (const o of obstacles) {
      ctx.save();

      // Ground shadow (lighter for flying obstacles)
      if (o.flying) {
        // Flying obstacles have faint shadow on ground
        const shadowAlpha = 0.1 + ((GROUND - o.y) / 800) * 0.1; // Fainter when higher
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, GROUND - 2, o.w * 0.4, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Ground obstacles have normal shadow
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.ellipse(o.x + o.w / 2, GROUND - 2, o.w * 0.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (o.flying) {
        // ---- FLYING OBSTACLES: emoji only with glow/outline for visibility ----
        const cx = o.x + o.w / 2;
        const cy = o.y + o.h / 2;
        const wobble = Math.sin(frameCount * 0.15 + o.phase) * 0.15;

        ctx.translate(cx, cy);
        ctx.rotate(wobble);

        // Draw emoji with strong outline/glow for visibility
        ctx.font = `${o.w * 1.1}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Outline/glow effect - draw emoji multiple times with offset
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.5;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const offsetX = Math.cos(angle) * 3;
          const offsetY = Math.sin(angle) * 3;
          ctx.fillText(o.emoji, offsetX, offsetY);
        }

        // Main emoji
        ctx.globalAlpha = 1;
        ctx.fillText(o.emoji, 0, 0);
      } else if (o.enemy) {
        // ---- GROUND ENEMY: drawn as full canvas character ----
        // No rotation for ground enemies — keeps them fully visible above ground
        if (o.label === "bug") {
          drawEnemyBug(ctx, o.x + o.w / 2, o.y + o.h / 2, o.w, o.h, frameCount);
        } else {
          drawEnemySlug(ctx, o.x + o.w / 2, o.y + o.h / 2, o.w, o.h, frameCount);
        }
      } else {
        // ---- STATIC OBSTACLES: canvas-drawn ----
        if (o.label === "poison") {
          drawPoisonMushroom(ctx, o.x, o.y, o.w, o.h);
        } else if (o.label === "rock") {
          drawRock(ctx, o.x, o.y, o.w, o.h);
        } else if (o.label === "cactus") {
          drawCactus(ctx, o.x, o.y, o.w, o.h);
        }
      }

      ctx.restore();
    }
  }

  // ---- Poison Mushroom ----
  function drawPoisonMushroom(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Stalk
    ctx.fillStyle = "#d4c5a9";
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.2, y + h * 0.5, w * 0.4, h * 0.52, 4);
    ctx.fill();
    // Dark spots on stalk
    ctx.fillStyle = "#bbb";
    ctx.beginPath();
    ctx.arc(cx - 4, y + h * 0.65, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, y + h * 0.75, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cap - purple/dark
    ctx.fillStyle = "#7B1FA2";
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.45, w * 0.5, h * 0.46, 0, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.45, w * 0.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Skull spots
    ctx.fillStyle = "#e1bee7";
    const spots = [
      { x: 0, y: -h * 0.2, r: 6 },
      { x: -w * 0.2, y: -h * 0.1, r: 4.5 },
      { x: w * 0.2, y: -h * 0.1, r: 4.5 },
    ];
    for (const sp of spots) {
      ctx.beginPath();
      ctx.arc(cx + sp.x, y + h * 0.45 + sp.y, sp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Angry eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - w * 0.14, y + h * 0.56, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.14, y + h * 0.56, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c00";
    ctx.beginPath();
    ctx.arc(cx - w * 0.14, y + h * 0.57, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.14, y + h * 0.57, 3, 0, Math.PI * 2);
    ctx.fill();
    // Angry brows
    ctx.strokeStyle = "#4a0072";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, y + h * 0.51);
    ctx.lineTo(cx - w * 0.06, y + h * 0.54);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.06, y + h * 0.54);
    ctx.lineTo(cx + w * 0.22, y + h * 0.51);
    ctx.stroke();
    // Label
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${w * 0.28}px Nunito, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☠", cx, y + h * 0.78);
  }

  // ---- Rock ----
  function drawRock(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    // Rock body
    const rg = ctx.createRadialGradient(
      cx - w * 0.1,
      cy - h * 0.1,
      2,
      cx,
      cy,
      w * 0.6,
    );
    rg.addColorStop(0, "#aaa");
    rg.addColorStop(1, "#555");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h);
    ctx.lineTo(x, y + h * 0.6);
    ctx.lineTo(x + w * 0.1, y + h * 0.2);
    ctx.lineTo(x + w * 0.4, y);
    ctx.lineTo(x + w * 0.75, y + h * 0.1);
    ctx.lineTo(x + w, y + h * 0.5);
    ctx.lineTo(x + w * 0.85, y + h);
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      cx - w * 0.12,
      cy - h * 0.15,
      w * 0.22,
      h * 0.15,
      -0.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Crack lines
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, y + h * 0.2);
    ctx.lineTo(cx - w * 0.1, y + h * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.1, y + h * 0.3);
    ctx.lineTo(cx + w * 0.25, y + h * 0.6);
    ctx.stroke();
  }

  // ---- Cactus ----
  function drawCactus(ctx, x, y, w, h) {
    const cx = x + w / 2;
    ctx.fillStyle = "#388E3C";
    // Main trunk
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.25, y + h * 0.3, w * 0.5, h * 0.72, 6);
    ctx.fill();
    // Left arm
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.7, y + h * 0.38, w * 0.45, h * 0.22, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - w * 0.7, y + h * 0.2, w * 0.22, h * 0.32, 5);
    ctx.fill();
    // Right arm
    ctx.beginPath();
    ctx.roundRect(cx + w * 0.25, y + h * 0.42, w * 0.45, h * 0.22, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx + w * 0.49, y + h * 0.24, w * 0.22, h * 0.32, 5);
    ctx.fill();
    // Spines
    ctx.strokeStyle = "#a5d6a7";
    ctx.lineWidth = 1.5;
    const spinePos = [
      [cx - w * 0.28, y + h * 0.45],
      [cx - w * 0.28, y + h * 0.6],
      [cx - w * 0.28, y + h * 0.75],
      [cx + w * 0.28, y + h * 0.45],
      [cx + w * 0.28, y + h * 0.6],
      [cx + w * 0.28, y + h * 0.75],
    ];
    for (const [sx, sy] of spinePos) {
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.stroke();
    }
    // Face
    ctx.fillStyle = "#1B5E20";
    ctx.beginPath();
    ctx.arc(cx - 5, y + h * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, y + h * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1B5E20";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.58, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // ---- Enemy: Bug ----
  function drawEnemyBug(ctx, cx, cy, w, h, frame) {
    const t = frame * 0.15;
    // Body
    const bg = ctx.createRadialGradient(
      cx - w * 0.1,
      cy - h * 0.1,
      1,
      cx,
      cy,
      w * 0.5,
    );
    bg.addColorStop(0, "#ef5350");
    bg.addColorStop(1, "#b71c1c");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.45, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shell split line
    ctx.strokeStyle = "#7f0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.35);
    ctx.lineTo(cx, cy + h * 0.35);
    ctx.stroke();
    // Spots
    ctx.fillStyle = "#7f0000";
    ctx.beginPath();
    ctx.arc(cx - w * 0.15, cy - h * 0.1, w * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.15, cy - h * 0.1, w * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, cy + h * 0.1, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.12, cy + h * 0.1, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Head
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.42, w * 0.28, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes (angry red)
    ctx.fillStyle = "#ff1744";
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, cy - h * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.12, cy - h * 0.45, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - w * 0.1, cy - h * 0.47, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.14, cy - h * 0.47, 2, 0, Math.PI * 2);
    ctx.fill();
    // Antennae
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.55);
    ctx.lineTo(cx - w * 0.22, cy - h * 0.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.1, cy - h * 0.55);
    ctx.lineTo(cx + w * 0.22, cy - h * 0.78);
    ctx.stroke();
    ctx.fillStyle = "#ff1744";
    ctx.beginPath();
    ctx.arc(cx - w * 0.22, cy - h * 0.78, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + w * 0.22, cy - h * 0.78, 3, 0, Math.PI * 2);
    ctx.fill();
    // Animated legs
    ctx.strokeStyle = "#212121";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const legSwing = Math.sin(t + i * 1.2) * 0.4;
      const lx = cx - w * 0.42;
      const ly = cy - h * 0.1 + i * h * 0.15;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(-legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-w * 0.28, h * 0.12);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(cx + w * 0.42, ly);
      ctx.rotate(legSwing);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.28, h * 0.12);
      ctx.stroke();
      ctx.restore();
    }
    // Warning glow
    ctx.strokeStyle = "rgba(255,50,50,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.55, h * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- Enemy: Slug ----
  function drawEnemySlug(ctx, cx, cy, w, h, frame) {
    const t = frame * 0.1;
    const bodyWave = Math.sin(t) * 3;
    // Trail / slime
    ctx.fillStyle = "rgba(100,200,50,0.25)";
    ctx.beginPath();
    ctx.ellipse(
      cx + w * 0.1,
      cy + h * 0.3,
      w * 0.6,
      h * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Body
    const sg = ctx.createLinearGradient(cx - w * 0.45, cy, cx + w * 0.45, cy);
    sg.addColorStop(0, "#FF8F00");
    sg.addColorStop(0.5, "#FFB300");
    sg.addColorStop(1, "#E65100");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(
      cx + bodyWave,
      cy + h * 0.05,
      w * 0.48,
      h * 0.32,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Belly
    ctx.fillStyle = "rgba(255,220,150,0.7)";
    ctx.beginPath();
    ctx.ellipse(
      cx + bodyWave,
      cy + h * 0.15,
      w * 0.36,
      h * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Shell on back
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.ellipse(
      cx + bodyWave - w * 0.05,
      cy - h * 0.12,
      w * 0.28,
      h * 0.28,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Shell spiral
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(
      cx + bodyWave - w * 0.05,
      cy - h * 0.12,
      w * 0.15,
      0,
      Math.PI * 1.5,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      cx + bodyWave - w * 0.05,
      cy - h * 0.12,
      w * 0.08,
      0.2,
      Math.PI * 1.3,
    );
    ctx.stroke();
    // Head
    ctx.fillStyle = "#FF8F00";
    ctx.beginPath();
    ctx.ellipse(
      cx - w * 0.38 + bodyWave,
      cy - h * 0.02,
      w * 0.22,
      h * 0.24,
      -0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Eyes on stalks
    const eyeWave = Math.sin(t * 1.3) * 3;
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 2;
    // Left stalk
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.45 + bodyWave, cy - h * 0.15);
    ctx.lineTo(cx - w * 0.48 + bodyWave, cy - h * 0.4 + eyeWave);
    ctx.stroke();
    // Right stalk
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.32 + bodyWave, cy - h * 0.18);
    ctx.lineTo(cx - w * 0.3 + bodyWave, cy - h * 0.42 + eyeWave);
    ctx.stroke();
    // Eye balls
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      cx - w * 0.48 + bodyWave,
      cy - h * 0.4 + eyeWave,
      5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      cx - w * 0.3 + bodyWave,
      cy - h * 0.42 + eyeWave,
      5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#212121";
    ctx.beginPath();
    ctx.arc(
      cx - w * 0.47 + bodyWave,
      cy - h * 0.41 + eyeWave,
      2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      cx - w * 0.29 + bodyWave,
      cy - h * 0.43 + eyeWave,
      2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Smile (smug)
    ctx.strokeStyle = "#e65100";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx - w * 0.38 + bodyWave, cy + h * 0.05, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Warning glow
    ctx.strokeStyle = "rgba(255,140,0,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx + bodyWave, cy, w * 0.58, h * 0.44, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ---- Draw collectibles ----
  function drawCollectibles() {
    for (const c of collectibles) {
      ctx.save();
      ctx.font = `${c.w * 0.95}px serif`;
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      // Glow for power-ups
      if (["golden", "speedleaf", "heart"].includes(c.type)) {
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 16 + Math.sin(frameCount * 0.1) * 8;
      }
      // Scale pulse for stars
      if (c.type === "star" || c.type === "bigstar") {
        const s = 1 + Math.sin(frameCount * 0.12 + c.floatY) * 0.12;
        ctx.translate(c.x + c.w / 2, c.y + c.h);
        ctx.scale(s, s);
        ctx.fillText(c.emoji, 0, 0);
      } else {
        ctx.fillText(c.emoji, c.x + c.w / 2, c.y + c.h);
      }
      ctx.restore();
    }
  }

  // ---- Draw particles ----
  function drawParticles() {
    for (const p of particleList) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---- Invincible shield ----
  function drawInvincibleShield() {
    if (!invincible) return;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const r = player.w * 0.75;
    const hue = (frameCount * 8) % 360;
    ctx.save();
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, 0.9)`;
    ctx.lineWidth = 3;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.sin(frameCount * 0.2) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ============================================================
  // INPUT
  // ============================================================
  function jump() {
    if (!gameRunning || gamePaused || gameOver) return;
    if (player.jumps < player.maxJumps) {
      player.vy = -12.5;
      player.onGround = false;
      if (player.jumps === 0) sfxJump();
      else sfxDoubleJump();
      player.jumps++;
      player.jumpAnim = 0;
      spawnHitParticles(
        player.x + player.w / 2,
        player.y + player.h,
        "#27ae60",
      );
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
    if (e.code === "Escape" || e.code === "KeyP") {
      togglePause();
    }
  });

  let lastTouchTime = 0;

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      lastTouchTime = Date.now();
      jump();
    },
    { passive: false },
  );

  canvas.addEventListener("click", () => {
    // Ignore click if it was triggered by a touch (within 500ms)
    if (Date.now() - lastTouchTime < 500) return;
    jump();
  });

  // ---- Pause ----
  function togglePause() {
    if (!gameRunning || gameOver) return;
    if (gamePaused) {
      gamePaused = false;
      pauseScreen.style.display = "none";
      pauseScreen.classList.remove("active");
      resumeBgMusic();
    } else {
      gamePaused = true;
      pauseScreen.style.display = "flex";
      pauseScreen.classList.add("active");
      pauseBgMusic();
    }
  }

  pauseBtn.addEventListener("click", togglePause);
  resumeBtn.addEventListener("click", togglePause);

  // Pause screen restart button
  pauseRestartBtn.addEventListener("click", () => {
    gamePaused = false;
    pauseScreen.classList.remove("active");
    pauseScreen.style.display = "none";
    resumeBgMusic();
    initGame();
  });

  // Pause screen menu button
  pauseMenuBtn.addEventListener("click", () => {
    gamePaused = false;
    gameRunning = false;
    pauseScreen.classList.remove("active");
    pauseScreen.style.display = "none";
    stopBgMusic();
    showScreen("startScreen");
    hiScore = parseInt(localStorage.getItem(getHiScoreKey()) || "0");
    hiScoreVal.textContent = hiScore;
  });

  // ---- Buttons ----

  // Difficulty dropdown - update high score when changed
  difficultySelect.addEventListener("change", (e) => {
    currentDifficulty = e.target.value;
    hiScore = parseInt(localStorage.getItem(getHiScoreKey()) || "0");
    hiScoreVal.textContent = hiScore;
  });

  // Start button - get difficulty from dropdown and start game
  startBtn.addEventListener("click", () => {
    currentDifficulty = difficultySelect.value;
    hiScore = parseInt(localStorage.getItem(getHiScoreKey()) || "0");
    hiScoreVal.textContent = hiScore;
    initGame();
  });

  restartBtn.addEventListener("click", () => {
    initGame();
  });

  menuBtn.addEventListener("click", () => {
    stopBgMusic();
    showScreen("startScreen");
    hiScore = parseInt(localStorage.getItem(getHiScoreKey()) || "0");
    hiScoreVal.textContent = hiScore;
  });

  // ---- Resize ----
  window.addEventListener("resize", () => {
    resize();
    if (!gameRunning) return;
    player.y = Math.min(player.y, GROUND - player.h);
  });

  // ---- Polyfill roundRect for older browsers ----
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.beginPath();
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  // ---- Start ----
  resize();
  showScreen("startScreen");
})();
