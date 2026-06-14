// ComputeXplain - Pixel & Screen Raster Simulator

let drawCanvas, drawCtx;
let microCanvas, microCtx;
let log;

let activeColor = '#ff3b30';
let colorDepth = 24; // 24, 8, 4, 1
let isDrawing = false;

// 32x32 Grid Buffer (each cell stores {r, g, b})
const gridSize = 32;
let grid = [];

// Screen scanline state
let scanlineY = 0;
let scanSpeedMode = 'fast'; // 'off', 'slow', 'fast'
let scanTimerId = null;

// Preset Pixel Art (Space Invader)
const presetInvader = [
  "....XX........XX....",
  ".....XX......XX.....",
  "....XXXXXXXXXXXX....",
  "...XXX..XXXX..XXX...",
  "..XXXXXXXXXXXXXX....",
  "..X.XXXXXXXXXXXX.X..",
  "..X.X........X.X.X..",
  ".....XX....XX......."
];

export function initPixelSim(logger) {
  log = logger;
  drawCanvas = document.getElementById('pixel-draw-canvas');
  microCanvas = document.getElementById('pixel-micro-canvas');
  if (!drawCanvas || !microCanvas) return;

  drawCtx = drawCanvas.getContext('2d');
  microCtx = microCanvas.getContext('2d');

  resetGrid();
  setupUIEventListeners();
  loadPresetHeart();
  renderDrawCanvas();
  renderMicroscope(16, 16); // center start

  // Start raster scan sweep loop
  startRasterScanLoop();
}

function resetGrid() {
  grid = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      row.push({ r: 0, g: 0, b: 0 }); // start black
    }
    grid.push(row);
  }
}

function setupUIEventListeners() {
  const clearBtn = document.getElementById('btn-pixel-clear');
  const presetBtn = document.getElementById('btn-pixel-preset');
  const depthSelect = document.getElementById('pixel-depth');
  const scanSelect = document.getElementById('pixel-scan-speed');
  const swatches = document.querySelectorAll('.pixel-color-swatch');

  clearBtn.addEventListener('click', () => {
    resetGrid();
    renderDrawCanvas();
    renderMicroscope(16, 16);
    log('[Display] Framebuffer cleared. Screen blank.', 'pixel');
  });

  presetBtn.addEventListener('click', () => {
    loadPresetInvader();
    renderDrawCanvas();
    renderMicroscope(16, 16);
  });

  depthSelect.addEventListener('change', (e) => {
    colorDepth = parseInt(e.target.value);
    log(`[Display] Color depth changed to: ${colorDepth}-bit. Quantizing pixels...`, 'pixel');
    renderDrawCanvas();
    renderMicroscope(16, 16);
  });

  scanSelect.addEventListener('change', (e) => {
    scanSpeedMode = e.target.value;
    log(`[Raster Scan] Refresh line mode adjusted: ${scanSpeedMode}`, 'pixel');
    startRasterScanLoop();
  });

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      swatches.forEach(s => s.style.border = 'none');
      swatch.style.border = '2px solid white';
      activeColor = swatch.getAttribute('data-color');
    });
  });

  // Draw interactions
  drawCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    drawPixelAtMouse(e);
  });

  drawCanvas.addEventListener('mousemove', (e) => {
    const coords = getCanvasCoords(e);
    if (isDrawing) {
      drawPixelAtMouse(e);
    }
    // Update microscope on hover
    renderMicroscope(coords.x, coords.y);
  });

  window.addEventListener('mouseup', () => {
    isDrawing = false;
  });
}

function getCanvasCoords(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX / (drawCanvas.width / gridSize));
  const y = Math.floor((e.clientY - rect.top) * scaleY / (drawCanvas.height / gridSize));
  return {
    x: Math.max(0, Math.min(gridSize - 1, x)),
    y: Math.max(0, Math.min(gridSize - 1, y))
  };
}

function drawPixelAtMouse(e) {
  const coords = getCanvasCoords(e);
  const rgb = hexToRgb(activeColor);
  grid[coords.y][coords.x] = rgb;
  renderDrawCanvas();
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Color Depth Quantization logic
function quantize(color) {
  if (colorDepth === 24) {
    return color; // TrueColor
  }
  
  if (colorDepth === 8) {
    // 8-bit color: 3 bits red (8 levels), 3 bits green (8 levels), 2 bits blue (4 levels)
    const r = Math.round(color.r / 255 * 7) * (255 / 7);
    const g = Math.round(color.g / 255 * 7) * (255 / 7);
    const b = Math.round(color.b / 255 * 3) * (255 / 3);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  }
  
  if (colorDepth === 4) {
    // 4-bit palette (16 retro colors)
    const palette = [
      {r:0,g:0,b:0}, {r:0,g:0,b:128}, {r:0,g:128,b:0}, {r:0,g:128,b:128},
      {r:128,g:0,b:0}, {r:128,g:0,b:128}, {r:128,g:128,b:0}, {r:192,g:192,b:192},
      {r:128,g:128,b:128}, {r:0,g:0,b:255}, {r:0,g:255,b:0}, {r:0,g:255,b:255},
      {r:255,g:0,b:0}, {r:255,g:0,b:255}, {r:255,g:255,b:0}, {r:255,g:255,b:255}
    ];
    let closest = palette[0];
    let minDist = Infinity;
    palette.forEach(c => {
      const dist = Math.pow(color.r - c.r, 2) + Math.pow(color.g - c.g, 2) + Math.pow(color.b - c.b, 2);
      if (dist < minDist) {
        minDist = dist;
        closest = c;
      }
    });
    return closest;
  }
  
  if (colorDepth === 1) {
    // 1-bit Monochrome: Black or White based on relative luminance (0.299R + 0.587G + 0.114B)
    const luminance = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
    const val = luminance > 127 ? 255 : 0;
    return { r: val, g: val, b: val };
  }
  
  return color;
}

// Render the 32x32 Grid
function renderDrawCanvas() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  const cellW = drawCanvas.width / gridSize;
  const cellH = drawCanvas.height / gridSize;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const orig = grid[y][x];
      const q = quantize(orig);
      drawCtx.fillStyle = `rgb(${q.r}, ${q.g}, ${q.b})`;
      drawCtx.fillRect(x * cellW, y * cellH, cellW - 0.5, cellH - 0.5);
    }
  }

  // Draw Scanline indicator if enabled
  if (scanSpeedMode !== 'off') {
    drawCtx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
    drawCtx.lineWidth = 1.5;
    drawCtx.beginPath();
    drawCtx.moveTo(0, scanlineY * cellH);
    drawCtx.lineTo(drawCanvas.width, scanlineY * cellH);
    drawCtx.stroke();
  }
}

// Render the Subpixel Microscope Zoom
function renderMicroscope(targetX, targetY) {
  microCtx.fillStyle = '#05070c';
  microCtx.fillRect(0, 0, microCanvas.width, microCanvas.height);

  // We show a 5x5 grid centered on targetX, targetY
  const zoomRadius = 2;
  const microCellW = microCanvas.width / 5;
  const microCellH = microCanvas.height / 5;

  for (let dy = -zoomRadius; dy <= zoomRadius; dy++) {
    for (let dx = -zoomRadius; dx <= zoomRadius; dx++) {
      const gx = targetX + dx;
      const gy = targetY + dy;
      
      const drawX = (dx + zoomRadius) * microCellW;
      const drawY = (dy + zoomRadius) * microCellH;

      // Draw bounding grid borders
      microCtx.strokeStyle = '#1e293b';
      microCtx.lineWidth = 1;
      microCtx.strokeRect(drawX, drawY, microCellW, microCellH);

      // Check if coordinates exist inside our grid
      if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
        const orig = grid[gy][gx];
        const q = quantize(orig);

        // Highlight center selected pixel with a glowing border
        if (dx === 0 && dy === 0) {
          microCtx.strokeStyle = '#00f2fe';
          microCtx.lineWidth = 2.5;
          microCtx.strokeRect(drawX + 1, drawY + 1, microCellW - 2, microCellH - 2);
        }

        // Draw subpixels Red, Green, Blue side-by-side
        const subW = microCellW / 3;
        
        // Red subpixel
        microCtx.fillStyle = `rgb(${q.r}, 0, 0)`;
        microCtx.fillRect(drawX + 1, drawY + 2, subW - 2, microCellH - 4);
        
        // Green subpixel
        microCtx.fillStyle = `rgb(0, ${q.g}, 0)`;
        microCtx.fillRect(drawX + subW + 1, drawY + 2, subW - 2, microCellH - 4);
        
        // Blue subpixel
        microCtx.fillStyle = `rgb(0, 0, ${q.b})`;
        microCtx.fillRect(drawX + subW * 2 + 1, drawY + 2, subW - 2, microCellH - 4);
      }
    }
  }

  // Label text at the top showing coordinate info
  microCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  microCtx.font = '9px JetBrains Mono';
  microCtx.fillText(`Zoom coordinate: X:${targetX} Y:${targetY}`, 8, 14);
}

function startRasterScanLoop() {
  if (scanTimerId) clearInterval(scanTimerId);
  if (scanSpeedMode === 'off') {
    renderDrawCanvas();
    return;
  }

  const interval = (scanSpeedMode === 'slow') ? 200 : 30;

  scanTimerId = setInterval(() => {
    scanlineY = (scanlineY + 1) % gridSize;
    renderDrawCanvas();
    
    // Auto-update microscope tracing the scanline
    renderMicroscope(16, scanlineY);
  }, interval);
}

// Preset graphics loaders
function loadPresetHeart() {
  resetGrid();
  // Draw a standard red pixel heart
  const heart = [
    "....XX.XX....",
    "...XXXXXXX...",
    "...XXXXXXX...",
    "....XXXXX....",
    ".....XXX.....",
    "......X......"
  ];
  
  const startX = 10;
  const startY = 12;

  heart.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === 'X') {
        grid[startY + dy][startX + dx] = { r: 255, g: 59, b: 48 }; // Red
      }
    }
  });
}

function loadPresetInvader() {
  resetGrid();
  log('[Display] Loading 8-bit retro icon preset.', 'pixel');
  
  const startX = 6;
  const startY = 11;
  const colors = [
    { r: 0, g: 242, b: 254 }, // Cyan
    { r: 192, g: 132, b: 252 }, // Purple
    { r: 74, g: 222, b: 128 }  // Green
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];

  presetInvader.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] === 'X') {
        grid[startY + dy][startX + dx] = color;
      }
    }
  });
}
