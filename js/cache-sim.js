// ComputeXplain - Memory Cache Hierarchy Simulator

let svg;
let log;

// Latency Configuration (cycles)
const L1_LATENCY = 1;
const L2_LATENCY = 4;
const L3_LATENCY = 12;
const RAM_LATENCY = 100;

// Stats
let hitCount = 0;
let missCount = 0;
let totalRequests = 0;
let totalCycles = 0;

// Cache Structures (Direct Mapped)
// L1: 4 lines. Index = addr % 4. Tag = Math.floor(addr / 4)
let l1Cache = Array(4).fill(null).map(() => ({ valid: 0, tag: 0, value: 0 }));
// L2: 8 lines. Index = addr % 8. Tag = Math.floor(addr / 8)
let l2Cache = Array(8).fill(null).map(() => ({ valid: 0, tag: 0, value: 0 }));
// L3: 8 lines. Index = addr % 8. Tag = Math.floor(addr / 8)
let l3Cache = Array(8).fill(null).map(() => ({ valid: 0, tag: 0, value: 0 }));

// RAM Block: 128 bytes (addressed 0x00 to 0x7F)
let ramMem = Array(128).fill(0).map(() => Math.floor(Math.random() * 256));

export function initCacheSim(logger) {
  log = logger;
  svg = document.getElementById('cache-svg');
  if (!svg) return;

  setupUIEventListeners();
  renderCacheStructure();
}

function setupUIEventListeners() {
  const opRead = document.getElementById('btn-cache-op-read');
  const opWrite = document.getElementById('btn-cache-op-write');
  const valGroup = document.getElementById('cache-value-group');
  const executeBtn = document.getElementById('btn-cache-execute');
  const randomBtn = document.getElementById('btn-cache-random');

  let activeOp = 'read'; // 'read' or 'write'

  opRead.addEventListener('click', () => {
    activeOp = 'read';
    opRead.classList.add('active');
    opRead.style.borderColor = 'var(--accent-green)';
    opRead.style.color = 'var(--accent-green)';
    opWrite.classList.remove('active');
    opWrite.style.borderColor = 'var(--border-color)';
    opWrite.style.color = 'var(--text-primary)';
    valGroup.style.display = 'none';
  });

  opWrite.addEventListener('click', () => {
    activeOp = 'write';
    opWrite.classList.add('active');
    opWrite.style.borderColor = 'var(--accent-green)';
    opWrite.style.color = 'var(--accent-green)';
    opRead.classList.remove('active');
    opRead.style.borderColor = 'var(--border-color)';
    opRead.style.color = 'var(--text-primary)';
    valGroup.style.display = 'flex';
  });

  executeBtn.addEventListener('click', () => {
    const addrInput = document.getElementById('cache-address').value.trim();
    let addr = parseHex(addrInput);

    if (addr === null || addr < 0 || addr > 127) {
      log('[Cache Error] Invalid Address. Please input a Hex byte between 0x00 and 0x7F.', 'cache');
      return;
    }

    if (activeOp === 'read') {
      performReadTransaction(addr);
    } else {
      const valInput = document.getElementById('cache-value').value.trim();
      let val = parseHex(valInput);
      if (val === null || val < 0 || val > 255) {
        log('[Cache Error] Invalid Value. Please input a Hex byte between 0x00 and 0xFF.', 'cache');
        return;
      }
      performWriteTransaction(addr, val);
    }
  });

  randomBtn.addEventListener('click', () => {
    log('[Cache] Running random burst read pipeline (10 transactions)...', 'cache');
    let burstIndex = 0;
    
    function nextBurst() {
      if (burstIndex >= 10) return;
      // 70% chance of requesting a recently read block to demonstrate temporal locality!
      let addr;
      if (Math.random() < 0.7 && totalRequests > 0) {
        // reuse a localized block address (e.g. offset of +/- 2 of a recent address)
        addr = Math.max(0, Math.min(127, Math.floor(Math.random() * 8) * 8 + Math.floor(Math.random() * 3)));
      } else {
        addr = Math.floor(Math.random() * 128);
      }
      performReadTransaction(addr);
      burstIndex++;
      setTimeout(nextBurst, 500);
    }
    
    nextBurst();
  });
}

function parseHex(str) {
  if (str.toLowerCase().startsWith('0x')) {
    str = str.substring(2);
  }
  const parsed = parseInt(str, 16);
  return isNaN(parsed) ? null : parsed;
}

function performReadTransaction(addr) {
  totalRequests++;
  
  const addrHex = `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`;
  log(`[Cache Read] CPU requesting Address ${addrHex}...`, 'cache');

  // L1 Check
  const l1Idx = addr % 4;
  const l1Tag = Math.floor(addr / 4);
  const l1Line = l1Cache[l1Idx];

  renderCacheStructure('search-l1', addr);

  setTimeout(() => {
    if (l1Line.valid && l1Line.tag === l1Tag) {
      // L1 HIT
      hitCount++;
      totalCycles += L1_LATENCY;
      log(`[L1 HIT] Found in L1 Cache Line ${l1Idx}. Value: 0x${l1Line.value.toString(16).toUpperCase().padStart(2, '0')} (Latency: ${L1_LATENCY} cycle)`, 'cache');
      updateStatsUI();
      renderCacheStructure('hit-l1', addr);
      return;
    }

    // L1 MISS -> Check L2
    log(`[L1 MISS] Address ${addrHex} not in L1. Querying L2 Cache...`, 'cache');
    const l2Idx = addr % 8;
    const l2Tag = Math.floor(addr / 8);
    const l2Line = l2Cache[l2Idx];
    
    renderCacheStructure('search-l2', addr);

    setTimeout(() => {
      if (l2Line.valid && l2Line.tag === l2Tag) {
        // L2 HIT
        hitCount++;
        totalCycles += L2_LATENCY;
        log(`[L2 HIT] Found in L2 Cache Line ${l2Idx}. Value: 0x${l2Line.value.toString(16).toUpperCase().padStart(2, '0')} (Latency: ${L2_LATENCY} cycles)`, 'cache');
        
        // Eviction & Cache Line Fill (Copy up to L1)
        evictAndFillL1(l1Idx, l1Tag, l2Line.value);
        updateStatsUI();
        renderCacheStructure('hit-l2', addr);
        return;
      }

      // L2 MISS -> Check L3
      log(`[L2 MISS] Address ${addrHex} not in L2. Querying L3 Cache...`, 'cache');
      const l3Idx = addr % 8;
      const l3Tag = Math.floor(addr / 8);
      const l3Line = l3Cache[l3Idx];
      
      renderCacheStructure('search-l3', addr);

      setTimeout(() => {
        if (l3Line.valid && l3Line.tag === l3Tag) {
          // L3 HIT
          hitCount++;
          totalCycles += L3_LATENCY;
          log(`[L3 HIT] Found in L3 Cache Line ${l3Idx}. Value: 0x${l3Line.value.toString(16).toUpperCase().padStart(2, '0')} (Latency: ${L3_LATENCY} cycles)`, 'cache');
          
          // Copy up to L2 & L1
          evictAndFillL2(l2Idx, l2Tag, l3Line.value);
          evictAndFillL1(l1Idx, l1Tag, l3Line.value);
          updateStatsUI();
          renderCacheStructure('hit-l3', addr);
          return;
        }

        // L3 MISS -> Main Memory RAM (Slowest)
        missCount++;
        totalCycles += RAM_LATENCY;
        const ramVal = ramMem[addr];
        log(`[CACHE MISS ALL] Address ${addrHex} not in cache hierarchy! Loading from RAM... (Latency: ${RAM_LATENCY} cycles)`, 'cache');
        
        // Populate L3, L2, L1 cache lines (Direct Map replacement)
        evictAndFillL3(l3Idx, l3Tag, ramVal);
        evictAndFillL2(l2Idx, l2Tag, ramVal);
        evictAndFillL1(l1Idx, l1Tag, ramVal);
        
        updateStatsUI();
        renderCacheStructure('hit-ram', addr);
      }, 400);
    }, 400);
  }, 400);
}

function performWriteTransaction(addr, val) {
  const addrHex = `0x${addr.toString(16).toUpperCase().padStart(2, '0')}`;
  const valHex = `0x${val.toString(16).toUpperCase().padStart(2, '0')}`;
  log(`[Cache Write] Updating address ${addrHex} -> ${valHex}...`, 'cache');

  // Write-Through: Update Main Memory immediately
  ramMem[addr] = val;

  // Check cache locations and update matching lines to keep coherency
  const l1Idx = addr % 4;
  const l1Tag = Math.floor(addr / 4);
  if (l1Cache[l1Idx].valid && l1Cache[l1Idx].tag === l1Tag) {
    l1Cache[l1Idx].value = val;
    log(`[L1 Coherency] Updated L1 line ${l1Idx} with written value ${valHex}`, 'cache');
  }

  const l2Idx = addr % 8;
  const l2Tag = Math.floor(addr / 8);
  if (l2Cache[l2Idx].valid && l2Cache[l2Idx].tag === l2Tag) {
    l2Cache[l2Idx].value = val;
    log(`[L2 Coherency] Updated L2 line ${l2Idx} with written value ${valHex}`, 'cache');
  }

  const l3Idx = addr % 8;
  const l3Tag = Math.floor(addr / 8);
  if (l3Cache[l3Idx].valid && l3Cache[l3Idx].tag === l3Tag) {
    l3Cache[l3Idx].value = val;
    log(`[L3 Coherency] Updated L3 line ${l3Idx} with written value ${valHex}`, 'cache');
  }

  renderCacheStructure('write-through', addr);
}

function evictAndFillL1(idx, tag, val) {
  const line = l1Cache[idx];
  if (line.valid) {
    log(`[L1 Evict] Cache collision on Line ${idx}. Evicting old Tag ${line.tag} (value 0x${line.value.toString(16).toUpperCase()})`, 'cache');
  }
  l1Cache[idx] = { valid: 1, tag, value: val };
}

function evictAndFillL2(idx, tag, val) {
  l2Cache[idx] = { valid: 1, tag, value: val };
}

function evictAndFillL3(idx, tag, val) {
  l3Cache[idx] = { valid: 1, tag, value: val };
}

function updateStatsUI() {
  document.getElementById('cache-stat-hits-misses').textContent = `${hitCount} / ${missCount}`;
  const rate = totalRequests > 0 ? Math.round((hitCount / totalRequests) * 100) : 0;
  document.getElementById('cache-stat-rate').textContent = `${rate}%`;
  
  const lat = totalRequests > 0 ? Math.round(totalCycles / totalRequests) : 0;
  document.getElementById('cache-stat-latency').textContent = `${lat} ns`;
}

// Render SVG structure
function renderCacheStructure(action = '', activeAddr = 0) {
  if (!svg) return;

  svg.innerHTML = '';

  const styleStr = `
    .cache-line-node { fill: #111422; stroke: var(--border-color); stroke-width: 1.5; }
    .cache-line-node.active { stroke: var(--accent-green); fill: rgba(74, 222, 128, 0.08); }
    .cache-text { font-family: 'Inter', sans-serif; font-size: 10px; fill: var(--text-primary); }
    .cache-text-label { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: bold; fill: var(--text-primary); }
    .pulse-glow-green { stroke: var(--accent-green); stroke-width: 3; fill: none; }
  `;

  const styleNode = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleNode.textContent = styleStr;
  svg.appendChild(styleNode);

  // Setup visual boxes
  // Top: CPU Core
  const cpuBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  cpuBoxRect.setAttribute('x', '270');
  cpuBoxRect.setAttribute('y', '15');
  cpuBoxRect.setAttribute('width', '160');
  cpuBoxRect.setAttribute('height', '36');
  cpuBoxRect.setAttribute('rx', '6');
  cpuBoxRect.setAttribute('fill', '#1a1d2e');
  cpuBoxRect.setAttribute('stroke', 'var(--accent-cyan)');
  svg.appendChild(cpuBoxRect);
  
  createSVGText(305, 37, 'CPU Core Register', 'var(--accent-cyan)', 'bold 10px Orbitron');

  // Cache lines layouts
  // L1 Box (Middle Top, w=200, h=100)
  createSVGText(40, 92, 'L1 Cache (Direct Map: addr % 4)', 'var(--text-secondary)', 'bold 10px Orbitron');
  for (let i = 0; i < 4; i++) {
    const y = 105 + i * 22;
    const isTargetLine = (action.includes('l1') && activeAddr % 4 === i);
    drawCacheLineRow(40, y, 220, 18, `L1[${i}]`, l1Cache[i], isTargetLine);
  }

  // L2 Box (Middle Bottom, w=220, h=180)
  createSVGText(40, 222, 'L2 Cache (Direct Map: addr % 8)', 'var(--text-secondary)', 'bold 10px Orbitron');
  for (let i = 0; i < 8; i++) {
    const y = 235 + i * 20;
    const isTargetLine = (action.includes('l2') && activeAddr % 8 === i);
    drawCacheLineRow(40, y, 220, 16, `L2[${i}]`, l2Cache[i], isTargetLine);
  }

  // L3 Box (Right Side, w=220, h=180)
  createSVGText(300, 222, 'L3 Shared Cache (addr % 8)', 'var(--text-secondary)', 'bold 10px Orbitron');
  for (let i = 0; i < 8; i++) {
    const y = 235 + i * 20;
    const isTargetLine = (action.includes('l3') && activeAddr % 8 === i);
    drawCacheLineRow(300, y, 220, 16, `L3[${i}]`, l3Cache[i], isTargetLine);
  }

  // Main Memory RAM Box (Far Right, w=120, h=300)
  createSVGText(560, 92, 'Main Memory RAM', 'var(--text-secondary)', 'bold 10px Orbitron');
  const ramRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  ramRect.setAttribute('x', '560');
  ramRect.setAttribute('y', '105');
  ramRect.setAttribute('width', '100');
  ramRect.setAttribute('height', '290');
  ramRect.setAttribute('rx', '4');
  ramRect.setAttribute('fill', '#05070c');
  ramRect.setAttribute('stroke', action === 'hit-ram' ? 'var(--accent-amber)' : 'rgba(255, 255, 255, 0.05)');
  svg.appendChild(ramRect);

  // Render a visual chunk of RAM around the activeAddr
  let startRamAddr = Math.max(0, activeAddr - 6);
  if (startRamAddr + 13 > 128) startRamAddr = 115;
  
  for (let i = 0; i < 13; i++) {
    const ramIndex = startRamAddr + i;
    const y = 122 + i * 21;
    const isTargetRam = (activeAddr === ramIndex);
    
    if (isTargetRam) {
      const targetRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      targetRect.setAttribute('x', '564');
      targetRect.setAttribute('y', (y - 12).toString());
      targetRect.setAttribute('width', '92');
      targetRect.setAttribute('height', '18');
      targetRect.setAttribute('fill', 'rgba(251, 159, 10, 0.15)');
      targetRect.setAttribute('stroke', 'var(--accent-amber)');
      targetRect.setAttribute('stroke-width', '1');
      svg.appendChild(targetRect);
    }
    
    createSVGText(570, y, `0x${ramIndex.toString(16).toUpperCase().padStart(2, '0')}:`, isTargetRam ? 'var(--accent-amber)' : 'var(--text-muted)', '9px JetBrains Mono');
    createSVGText(615, y, `0x${ramMem[ramIndex].toString(16).toUpperCase().padStart(2, '0')}`, isTargetRam ? '#f8fafc' : '#94a3b8', 'bold 10px JetBrains Mono');
  }

  // Visualizing cache routing lines
  drawSVGPath(`M 350,51 L 350,75`, 'bus-line'); // main down path
  
  if (action === 'search-l1') {
    drawSVGPath(`M 350,51 L 350,75 L 150,75 L 150,105`, 'pulse-glow-green');
  } else if (action === 'search-l2') {
    drawSVGPath(`M 350,51 L 350,75 L 150,75 L 150,230`, 'pulse-glow-green');
  } else if (action === 'search-l3') {
    drawSVGPath(`M 350,51 L 350,75 L 410,75 L 410,230`, 'pulse-glow-green');
  } else if (action === 'hit-ram') {
    drawSVGPath(`M 350,51 L 350,75 L 610,75 L 610,105`, 'pulse-glow-green');
  }
}

function drawCacheLineRow(x, y, w, h, label, lineVal, active) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', w.toString());
  rect.setAttribute('height', h.toString());
  rect.setAttribute('rx', '3');
  rect.setAttribute('class', active ? 'cache-line-node active' : 'cache-line-node');
  svg.appendChild(rect);

  // Print Label, V, Tag, Data
  const textY = y + h - 5;
  createSVGText(x + 5, textY, label, active ? 'var(--accent-green)' : 'var(--text-muted)', '8px Orbitron');
  createSVGText(x + 50, textY, `V: ${lineVal.valid}`, lineVal.valid ? 'var(--accent-green)' : 'var(--text-muted)', 'bold 9px Inter');
  createSVGText(x + 95, textY, `Tag: 0x${lineVal.tag.toString(16).toUpperCase()}`, 'var(--text-secondary)', '9px JetBrains Mono');
  createSVGText(x + 160, textY, `Val: 0x${lineVal.value.toString(16).toUpperCase().padStart(2, '0')}`, lineVal.valid ? '#f8fafc' : 'var(--text-muted)', 'bold 9px JetBrains Mono');
}

function drawSVGPath(d, className) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', className);
  svg.appendChild(path);
}

function createSVGText(x, y, text, color, font) {
  const textNode = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  textNode.setAttribute('x', x.toString());
  textNode.setAttribute('y', y.toString());
  textNode.setAttribute('fill', color);
  textNode.style.font = font;
  textNode.textContent = text;
  svg.appendChild(textNode);
}
