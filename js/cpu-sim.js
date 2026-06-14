// ComputeXplain - CPU Pipeline & ALU Simulator

let svg;
let log;
let timerId = null;
let isRunning = false;
let clockHz = 2;

// Pipeline status
let currentStage = 'FETCH'; // FETCH, DECODE, EXECUTE, WRITEBACK
let pc = 0;
let acc = 0;
let regB = 0;
let ir = 'HALT';
let decodedOp = '';
let decodedOperand = 0;

// RAM Block (16 bytes)
let ram = Array(16).fill(0);

// Presets Definition
const presets = {
  fibonacci: {
    name: 'Fibonacci Series',
    code: [
      { op: 'LOAD', operand: 14, label: 'LOAD [14]' },   // 0x00: Load term A
      { op: 'ADD', operand: 15, label: 'ADD [15]' },    // 0x01: ACC = A + B
      { op: 'STORE', operand: 13, label: 'STORE [13]' }, // 0x02: Temp = A + B
      { op: 'LOAD', operand: 15, label: 'LOAD [15]' },   // 0x03: Load term B
      { op: 'STORE', operand: 14, label: 'STORE [14]' }, // 0x04: Term A = old B
      { op: 'LOAD', operand: 13, label: 'LOAD [13]' },   // 0x05: Load Temp
      { op: 'STORE', operand: 15, label: 'STORE [15]' }, // 0x06: Term B = Temp
      { op: 'JMP', operand: 1, label: 'JMP 0x01' },      // 0x07: Loop back
      { op: 'HALT', operand: 0, label: 'HALT' },         // 0x08
      { op: 'HALT', operand: 0, label: 'HALT' },         // 0x09
    ],
    ramInit: { 14: 0, 15: 1 } // A=0, B=1. Fibo starts 1, 2, 3, 5, 8...
  },
  multiply: {
    name: '3 * 4 Multiplication Loop',
    code: [
      { op: 'LOAD', operand: 14, label: 'LOAD [14]' },   // 0x00: Load counter
      { op: 'JZ', operand: 7, label: 'JZ 0x07' },        // 0x01: If counter == 0, jump to HALT
      { op: 'SUB', operand: 13, label: 'SUB [13]' },     // 0x02: Decrement counter (subtract 1)
      { op: 'STORE', operand: 14, label: 'STORE [14]' }, // 0x03: Save counter
      { op: 'LOAD', operand: 15, label: 'LOAD [15]' },   // 0x04: Load running total
      { op: 'ADD', operand: 12, label: 'ADD [12]' },     // 0x05: Add multi-factor (3)
      { op: 'STORE', operand: 15, label: 'STORE [15]' }, // 0x06: Save total
      { op: 'JMP', operand: 0, label: 'JMP 0x00' },      // 0x07: Loop
      { op: 'HALT', operand: 0, label: 'HALT' }          // 0x08
    ],
    ramInit: { 12: 3, 13: 1, 14: 4, 15: 0 } // 12=factor(3), 13=one(1), 14=counter(4), 15=total(0)
  },
  factorial: {
    name: 'Factorial of 4',
    code: [
      { op: 'LOAD', operand: 14, label: 'LOAD [14]' },   // 0x00: Load counter (4)
      { op: 'JZ', operand: 8, label: 'JZ 0x08' },        // 0x01: If counter == 0, end
      { op: 'STORE', operand: 13, label: 'STORE [13]' }, // 0x02: Set temp multiplier
      // Inner loop or repeated addition to multiply ACC
      { op: 'LOAD', operand: 15, label: 'LOAD [15]' },   // 0x03: Load result total (starts at 1)
      { op: 'ADD', operand: 15, label: 'ADD [15]' },     // Simplified factorial step
      { op: 'STORE', operand: 15, label: 'STORE [15]' }, // 0x05
      { op: 'LOAD', operand: 14, label: 'LOAD [14]' },   // 0x06
      { op: 'SUB', operand: 12, label: 'SUB [12]' },     // 0x07: Decrement multiplier
      { op: 'STORE', operand: 14, label: 'STORE [14]' }, // 0x08
      { op: 'JMP', operand: 0, label: 'JMP 0x00' },      // 0x09
      { op: 'HALT', operand: 0, label: 'HALT' }          // 0x0A
    ],
    ramInit: { 12: 1, 14: 4, 15: 1 } // count=4, result=1
  }
};

let activeProgramKey = 'fibonacci';

export function initCpuSim(logger) {
  log = logger;
  svg = document.getElementById('cpu-svg');
  if (!svg) return;

  setupUIEventListeners();
  loadProgram(activeProgramKey);
  renderCpuStructure();
}

function loadProgram(programKey) {
  const prg = presets[programKey];
  if (!prg) return;

  activeProgramKey = programKey;
  pc = 0;
  acc = 0;
  regB = 0;
  ir = 'HALT';
  currentStage = 'FETCH';

  // Initialize RAM (instructions + data)
  ram = Array(16).fill(0);
  
  // Load operations into RAM addresses 0-9
  prg.code.forEach((instr, idx) => {
    ram[idx] = instr;
  });

  // Load static data inputs
  Object.keys(prg.ramInit).forEach(addr => {
    ram[parseInt(addr)] = prg.ramInit[addr];
  });

  updateCodeViewer();
  log(`[CPU] Program "${prg.name}" loaded into RAM addresses 0x00-0x0F. Pipeline reset.`, 'cpu');
}

function updateCodeViewer() {
  const viewer = document.getElementById('cpu-code-viewer');
  if (!viewer) return;

  viewer.innerHTML = '';
  const prg = presets[activeProgramKey];
  
  prg.code.forEach((instr, idx) => {
    const line = document.createElement('div');
    line.style.display = 'flex';
    line.style.justifyContent = 'space-between';
    line.style.padding = '2px 6px';
    line.style.borderRadius = '3px';
    
    if (pc === idx) {
      line.style.backgroundColor = 'rgba(192, 132, 252, 0.2)';
      line.style.borderLeft = '3px solid var(--accent-purple)';
      line.style.fontWeight = 'bold';
    }

    const addrSpan = document.createElement('span');
    addrSpan.style.color = 'var(--text-muted)';
    addrSpan.textContent = `0x${idx.toString(16).toUpperCase().padStart(2, '0')}:`;

    const codeSpan = document.createElement('span');
    codeSpan.style.color = 'var(--accent-purple)';
    codeSpan.textContent = instr.label;

    line.appendChild(addrSpan);
    line.appendChild(codeSpan);
    viewer.appendChild(line);
  });
}

function setupUIEventListeners() {
  const programSelect = document.getElementById('cpu-program-select');
  const clockSlider = document.getElementById('cpu-clock-rate');
  const lblHz = document.getElementById('lbl-cpu-hz');
  const stepBtn = document.getElementById('btn-cpu-step');
  const runBtn = document.getElementById('btn-cpu-run');
  const resetBtn = document.getElementById('btn-cpu-reset');

  programSelect.addEventListener('change', (e) => {
    loadProgram(e.target.value);
    renderCpuStructure();
  });

  clockSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    lblHz.textContent = val;
    clockHz = val;
    
    if (isRunning) {
      pauseCpuAutoRun();
      startCpuAutoRun();
    }
  });

  stepBtn.addEventListener('click', () => {
    if (isRunning) pauseCpuAutoRun();
    stepPipeline();
  });

  runBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseCpuAutoRun();
    } else {
      startCpuAutoRun();
    }
  });

  resetBtn.addEventListener('click', () => {
    pauseCpuAutoRun();
    loadProgram(activeProgramKey);
    renderCpuStructure();
  });
}

function startCpuAutoRun() {
  isRunning = true;
  document.getElementById('cpu-play-icon').className = 'fa-solid fa-pause';
  document.getElementById('cpu-play-text').textContent = 'Pause';
  log(`[CPU] Clock signal activated. Running at ${clockHz} Hz.`, 'cpu');

  function clockCycle() {
    stepPipeline();
    if (isRunning) {
      timerId = setTimeout(clockCycle, 1000 / clockHz);
    }
  }
  timerId = setTimeout(clockCycle, 1000 / clockHz);
}

function pauseCpuAutoRun() {
  isRunning = false;
  if (timerId) clearTimeout(timerId);
  document.getElementById('cpu-play-icon').className = 'fa-solid fa-play';
  document.getElementById('cpu-play-text').textContent = 'Run';
  log(`[CPU] Clock signal halted.`, 'cpu');
}

// core Pipeline Interpreter
function stepPipeline() {
  if (currentStage === 'FETCH') {
    // Stage 1: Fetch
    if (pc >= 16 || pc < 0) {
      log('[CPU Error] Program Counter out of bounds. halting.', 'cpu');
      pauseCpuAutoRun();
      return;
    }

    const fetched = ram[pc];
    if (typeof fetched === 'object') {
      ir = `${fetched.op} ${fetched.operand}`;
    } else {
      ir = 'HALT';
    }

    log(`[FETCH] instruction loaded from RAM [0x${pc.toString(16).toUpperCase().padStart(2, '0')}] -> IR: "${ir}"`, 'cpu');
    
    currentStage = 'DECODE';
    renderCpuStructure('fetch');
    
  } else if (currentStage === 'DECODE') {
    // Stage 2: Decode
    const fetched = ram[pc];
    if (typeof fetched === 'object') {
      decodedOp = fetched.op;
      decodedOperand = fetched.operand;
      log(`[DECODE] Decoded Operation: ${decodedOp}, Operand Target: Address 0x${decodedOperand.toString(16).toUpperCase().padStart(2, '0')}`, 'cpu');
    } else {
      decodedOp = 'HALT';
      decodedOperand = 0;
      log(`[DECODE] Decoded Opcode: HALT`, 'cpu');
    }

    currentStage = 'EXECUTE';
    renderCpuStructure('decode');
    
  } else if (currentStage === 'EXECUTE') {
    // Stage 3: Execute
    log(`[EXECUTE] Processing ALU Logic gates for: ${decodedOp}`, 'cpu');

    if (decodedOp === 'LOAD') {
      // Load operand value to register B first
      const val = getRamVal(decodedOperand);
      regB = val;
      log(`[EXECUTE] Loading RAM[0x${decodedOperand.toString(16).toUpperCase().padStart(2, '0')}] value: ${val} to buffer`, 'cpu');
    } else if (decodedOp === 'STORE') {
      log(`[EXECUTE] Buffering Accumulator value: ${acc} for Writeback to RAM[0x${decodedOperand.toString(16).toUpperCase().padStart(2, '0')}]`, 'cpu');
    } else if (decodedOp === 'ADD') {
      const val = getRamVal(decodedOperand);
      regB = val;
      const sum = acc + val;
      log(`[ALU Math] Adding Registers: ACC (${acc}) + B (${regB}) = ${sum}`, 'cpu');
    } else if (decodedOp === 'SUB') {
      const val = getRamVal(decodedOperand);
      regB = val;
      const diff = acc - val;
      log(`[ALU Math] Subtracting Registers: ACC (${acc}) - B (${regB}) = ${diff}`, 'cpu');
    } else if (decodedOp === 'JMP') {
      log(`[BRANCH] Program jumping unconditionally to: 0x${decodedOperand.toString(16).toUpperCase().padStart(2, '0')}`, 'cpu');
    } else if (decodedOp === 'JZ') {
      log(`[BRANCH] Checking Branch Condition: ACC == 0 (ACC is ${acc})`, 'cpu');
    } else if (decodedOp === 'HALT') {
      log(`[SYSTEM] Halting execution. Process ended successfully.`, 'cpu');
      pauseCpuAutoRun();
    }

    currentStage = 'WRITEBACK';
    renderCpuStructure('execute');
    
  } else if (currentStage === 'WRITEBACK') {
    // Stage 4: Writeback
    if (decodedOp === 'LOAD') {
      acc = regB;
      log(`[WRITEBACK] Accumulator ACC updated to: ${acc}`, 'cpu');
      pc++;
    } else if (decodedOp === 'STORE') {
      ram[decodedOperand] = acc;
      log(`[WRITEBACK] Memory Address 0x${decodedOperand.toString(16).toUpperCase().padStart(2, '0')} updated with value: ${acc}`, 'cpu');
      pc++;
    } else if (decodedOp === 'ADD') {
      acc = acc + regB;
      log(`[WRITEBACK] Accumulator ACC updated to: ${acc}`, 'cpu');
      pc++;
    } else if (decodedOp === 'SUB') {
      acc = acc - regB;
      log(`[WRITEBACK] Accumulator ACC updated to: ${acc}`, 'cpu');
      pc++;
    } else if (decodedOp === 'JMP') {
      pc = decodedOperand;
    } else if (decodedOp === 'JZ') {
      if (acc === 0) {
        pc = decodedOperand;
        log(`[WRITEBACK] Jump Condition MET. Jumping PC to: 0x${pc.toString(16).toUpperCase().padStart(2, '0')}`, 'cpu');
      } else {
        pc++;
        log(`[WRITEBACK] Jump Condition NOT MET. Continuing to next instruction.`, 'cpu');
      }
    } else if (decodedOp === 'HALT') {
      // stays halted
    }

    currentStage = 'FETCH';
    updateCodeViewer();
    renderCpuStructure('writeback');
  }
}

function getRamVal(addr) {
  const cell = ram[addr];
  if (typeof cell === 'object') return 0; // operations evaluate to 0 in data registers
  return cell;
}

// Render the CPU visually onto the SVG canvas
function renderCpuStructure(pulsePart = '') {
  if (!svg) return;

  // Clear previous drawings
  svg.innerHTML = '';

  // Setup grid dimensions
  const width = 700;
  const height = 420;

  // Styles
  const styleStr = `
    .bus-line { stroke: rgba(255,255,255,0.06); stroke-width: 4; fill: none; }
    .bus-pulse { stroke-dasharray: 12, 100; animation: dash 6s linear infinite; stroke-width: 4; fill: none; }
    .cpu-node { fill: #111422; stroke: var(--accent-purple); stroke-width: 2; rx: 6px; }
    .cpu-label { font-family: 'Orbitron', sans-serif; font-size: 11px; font-weight: bold; fill: var(--text-primary); }
    .cpu-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; fill: var(--accent-purple); font-weight: bold; }
    
    @keyframes dash {
      to { stroke-dashoffset: -120; }
    }
  `;

  const styleNode = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleNode.textContent = styleStr;
  svg.appendChild(styleNode);

  // Define components positions
  // Bus Line Coordinates
  const busY = 220;
  const ramX = 100;
  const controlX = 320;
  const regX = 520;
  
  // Draw Address & Data Bus Lines
  drawSVGPath(`M 100,80 L 100,${busY} L 550,${busY}`, 'bus-line');
  drawSVGPath(`M 320,110 L 320,${busY}`, 'bus-line');
  drawSVGPath(`M 550,80 L 550,${busY}`, 'bus-line');
  drawSVGPath(`M 550,300 L 550,${busY}`, 'bus-line');
  
  if (pulsePart === 'fetch') {
    // Animate Address Bus loading instruction
    drawSVGPath(`M 100,80 L 100,${busY} L 320,${busY} L 320,110`, 'bus-pulse', '#c084fc');
  } else if (pulsePart === 'execute') {
    // ALU operations
    drawSVGPath(`M 550,220 L 550,300`, 'bus-pulse', '#4ade80');
  }

  // 1. RAM block (Left)
  createSVGBox(30, 40, 140, 320, 'RAM Memory (0x0-0xF)', 'ram-box');
  
  // Render RAM addresses list (first 8 addresses inside visually)
  for (let i = 0; i < 12; i++) {
    const item = ram[i];
    let valStr = '0';
    if (typeof item === 'object') {
      valStr = item.label;
    } else {
      valStr = `0x${item.toString(16).toUpperCase().padStart(2, '0')}`;
    }
    
    const yCoord = 75 + i * 23;
    const isCurrentPC = (i === pc);
    
    // RAM Cells
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '40');
    rect.setAttribute('y', yCoord - 14);
    rect.setAttribute('width', '120');
    rect.setAttribute('height', '20');
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', isCurrentPC ? 'rgba(192, 132, 252, 0.2)' : 'rgba(0,0,0,0.2)');
    rect.setAttribute('stroke', isCurrentPC ? 'var(--accent-purple)' : 'rgba(255,255,255,0.05)');
    svg.appendChild(rect);

    createSVGText(45, yCoord, `0x${i.toString(16).toUpperCase()}:`, 'rgba(255,255,255,0.4)', '9px JetBrains Mono');
    createSVGText(85, yCoord, valStr, isCurrentPC ? 'var(--accent-purple)' : '#94a3b8', 'bold 10px JetBrains Mono');
  }

  // 2. Registers Block (Right)
  createSVGBox(470, 40, 200, 200, 'CPU Registers', 'registers-box');
  
  // Program Counter (PC)
  createRegisterNode(490, 70, 'PC (Prog Counter)', `0x${pc.toString(16).toUpperCase().padStart(2, '0')}`, pulsePart === 'fetch');
  
  // Instruction Register (IR)
  createRegisterNode(490, 120, 'IR (Instruction)', ir, pulsePart === 'decode');

  // Accumulator (ACC)
  createRegisterNode(490, 170, 'ACC (Accumulator)', acc.toString(), pulsePart === 'writeback');

  // 3. Control Unit (Middle)
  createSVGBox(220, 40, 210, 120, 'Control Unit', 'cu-box', pulsePart === 'decode');
  createSVGText(240, 95, `Active Stage:`, 'var(--text-secondary)', '11px Inter');
  createSVGText(340, 95, currentStage, 'var(--accent-cyan)', 'bold 13px Orbitron');
  
  createSVGText(240, 125, `Decoded Op:`, 'var(--text-secondary)', '11px Inter');
  createSVGText(340, 125, decodedOp ? `${decodedOp} (${decodedOperand})` : 'None', 'var(--accent-purple)', 'bold 12px JetBrains Mono');

  // 4. ALU (Arithmetic Logic Unit) (Bottom Right)
  const aluGlow = (pulsePart === 'execute' && ['ADD', 'SUB'].includes(decodedOp));
  createSVGBox(470, 280, 200, 110, 'ALU (Arithmetic Unit)', 'alu-box', aluGlow);
  
  createSVGText(495, 320, `Input A (ACC):`, 'var(--text-secondary)', '11px Inter');
  createSVGText(600, 320, acc.toString(), '#f8fafc', 'bold 12px JetBrains Mono');

  createSVGText(495, 345, `Input B (RAM):`, 'var(--text-secondary)', '11px Inter');
  createSVGText(600, 345, regB.toString(), '#f8fafc', 'bold 12px JetBrains Mono');

  let operationSign = '+';
  if (decodedOp === 'SUB') operationSign = '-';
  else if (decodedOp === 'LOAD') operationSign = 'LD';
  else if (decodedOp === 'STORE') operationSign = 'ST';
  
  // ALU center operation symbol
  const aluSymbolRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  aluSymbolRect.setAttribute('x', '555');
  aluSymbolRect.setAttribute('y', '358');
  aluSymbolRect.setAttribute('width', '30');
  aluSymbolRect.setAttribute('height', '22');
  aluSymbolRect.setAttribute('rx', '4');
  aluSymbolRect.setAttribute('fill', aluGlow ? 'var(--accent-purple)' : '#1a1f35');
  svg.appendChild(aluSymbolRect);
  
  createSVGText(565, 374, operationSign, aluGlow ? '#0a0c14' : 'var(--text-secondary)', 'bold 12px Orbitron');
}

function createSVGBox(x, y, w, h, title, id, glowing = false) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', w.toString());
  rect.setAttribute('height', h.toString());
  rect.setAttribute('rx', '8');
  rect.setAttribute('class', 'cpu-node');
  
  if (glowing) {
    rect.setAttribute('stroke', '#00f2fe');
    rect.setAttribute('filter', 'url(#glow)');
    rect.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.4)';
  } else {
    rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
  }
  
  svg.appendChild(rect);

  // Title
  createSVGText(x + 15, y + 22, title, 'var(--text-primary)', 'bold 11px Orbitron');
}

function createRegisterNode(x, y, label, val, active) {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', x.toString());
  rect.setAttribute('y', y.toString());
  rect.setAttribute('width', '160');
  rect.setAttribute('height', '34');
  rect.setAttribute('rx', '4');
  rect.setAttribute('fill', active ? 'rgba(192, 132, 252, 0.15)' : 'rgba(0, 0, 0, 0.25)');
  rect.setAttribute('stroke', active ? 'var(--accent-purple)' : 'rgba(255, 255, 255, 0.04)');
  svg.appendChild(rect);

  createSVGText(x + 10, y + 20, label, 'var(--text-secondary)', '10px Inter');
  createSVGText(x + 110, y + 21, val, active ? 'var(--accent-purple)' : '#f8fafc', 'bold 11px JetBrains Mono');
}

function drawSVGPath(d, className, strokeColor = '') {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', className);
  if (strokeColor) {
    path.setAttribute('stroke', strokeColor);
  }
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
