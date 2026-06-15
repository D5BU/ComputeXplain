// ComputeXplain - Interactive Algorithm Visualizer Simulator

let log;
let canvas, ctx;

// State Variables
let activeAlgo = 'bubble-sort';
let isRunning = false;
let stepDelay = 300;
let timerId = null;

// Steps Execution Stack
let steps = [];
let currentStepIndex = 0;

// Algorithm Data Configurations
let sortArray = [];
let searchArray = [];
let searchTarget = 45;

// Graph (Grid) Parameters
const gridCols = 20;
const gridRows = 11;
let grid = [];
let graphStart = { row: 5, col: 3 };
let graphEnd = { row: 5, col: 16 };
let graphEditMode = 'wall'; // 'wall', 'start', 'end'
let isDrawingWalls = false;

// Pseudocode definitions
const pseudocodeData = {
  'bubble-sort': [
    "bubbleSort(A):",
    "  for i = 0 to A.length - 1:",
    "    for j = 0 to A.length - i - 2:",
    "      if A[j] > A[j+1]:",
    "        swap(A[j], A[j+1])",
    "  return A"
  ],
  'quick-sort': [
    "quickSort(A, low, high):",
    "  if low < high:",
    "    p = partition(A, low, high)",
    "    quickSort(A, low, p - 1)",
    "    quickSort(A, p + 1, high)",
    "partition(A, low, high):",
    "  pivot = A[high]",
    "  i = low - 1",
    "  for j = low to high - 1:",
    "    if A[j] < pivot:",
    "      i++, swap A[i], A[j]",
    "  swap A[i+1], A[high]",
    "  return i + 1"
  ],
  'merge-sort': [
    "mergeSort(A, l, r):",
    "  if l < r:",
    "    m = l + (r - l) / 2",
    "    mergeSort(A, l, m)",
    "    mergeSort(A, m + 1, r)",
    "    merge(A, l, m, r)",
    "merge(A, l, m, r):",
    "  copy subarrays L and R",
    "  merge L and R back into A"
  ],
  'dijkstra': [
    "dijkstra(G, start, end):",
    "  distances = [Infinity], Q = all nodes",
    "  dist[start] = 0",
    "  while Q is not empty:",
    "    u = node in Q with min dist",
    "    if u == end: break",
    "    for each neighbor v of u:",
    "      alt = dist[u] + cost(u, v)",
    "      if alt < dist[v]:",
    "        dist[v] = alt, parent[v] = u"
  ],
  'bfs': [
    "bfs(G, start, end):",
    "  Q = queue, visited = set",
    "  Q.enqueue(start), visited.add(start)",
    "  while Q is not empty:",
    "    u = Q.dequeue()",
    "    if u == end: break",
    "    for each neighbor v of u:",
    "      if v not in visited:",
    "        visited.add(v), parent[v] = u",
    "        Q.enqueue(v)"
  ],
  'dfs': [
    "dfs(G, start, end):",
    "  S = stack, visited = set",
    "  S.push(start)",
    "  while S is not empty:",
    "    u = S.pop()",
    "    if u == end: break",
    "    if u not in visited:",
    "      visited.add(u)",
    "      for each neighbor v of u:",
    "        if v not in visited:",
    "          parent[v] = u, S.push(v)"
  ],
  'binary-search': [
    "binarySearch(A, target):",
    "  low = 0, high = A.length - 1",
    "  while low <= high:",
    "    mid = low + (high - low) / 2",
    "    if A[mid] == target:",
    "      return mid",
    "    else if A[mid] < target:",
    "      low = mid + 1",
    "    else:",
    "      high = mid - 1",
    "  return -1"
  ]
};

export function initAlgoSim(logger) {
  log = logger;
  canvas = document.getElementById('algo-canvas');
  if (!canvas) return;
  
  ctx = canvas.getContext('2d');
  
  // Set up initial data state
  generateSortArray();
  generateSearchArray();
  resetGraph();
  
  // Setup interface bindings
  setupUIEventListeners();
  loadPseudocode();
  
  // Create steps for first time
  generateSteps();
  render();
}

// Data Initializers
function generateSortArray() {
  const sizeInput = document.getElementById('algo-array-size');
  const size = sizeInput ? parseInt(sizeInput.value) : 15;
  sortArray = [];
  for (let i = 0; i < size; i++) {
    // Random height values from 10 to 100
    sortArray.push(Math.floor(Math.random() * 85) + 15);
  }
}

function generateSearchArray() {
  searchArray = [];
  let currentVal = Math.floor(Math.random() * 8) + 3;
  for (let i = 0; i < 15; i++) {
    searchArray.push(currentVal);
    currentVal += Math.floor(Math.random() * 8) + 3;
  }
  
  // Make sure target exists or is near
  const targetInput = document.getElementById('algo-search-target');
  if (targetInput) {
    // Default search target to one of the array indices
    const randIdx = Math.floor(Math.random() * searchArray.length);
    searchTarget = searchArray[randIdx];
    targetInput.value = searchTarget;
  }
}

function resetGraph() {
  grid = [];
  for (let r = 0; r < gridRows; r++) {
    const row = [];
    for (let c = 0; c < gridCols; c++) {
      row.push({
        row: r,
        col: c,
        isWall: false,
        isStart: (r === graphStart.row && c === graphStart.col),
        isEnd: (r === graphEnd.row && c === graphEnd.col),
        isVisited: false,
        isPath: false,
        distance: Infinity,
        parent: null
      });
    }
    grid.push(row);
  }
}

// UI Setup
function setupUIEventListeners() {
  const algoSelect = document.getElementById('algo-select');
  const arraySizeInput = document.getElementById('algo-array-size');
  const shuffleBtn = document.getElementById('btn-algo-shuffle');
  const speedInput = document.getElementById('algo-speed');
  const stepBtn = document.getElementById('btn-algo-step');
  const runBtn = document.getElementById('btn-algo-run');
  const resetBtn = document.getElementById('btn-algo-reset');
  
  // Graph controls
  const wallModeBtn = document.getElementById('btn-graph-mode-wall');
  const startModeBtn = document.getElementById('btn-graph-mode-start');
  const endModeBtn = document.getElementById('btn-graph-mode-end');
  const clearWallsBtn = document.getElementById('btn-graph-clear');
  
  // Search controls
  const targetInput = document.getElementById('algo-search-target');
  const searchResetBtn = document.getElementById('btn-search-reset');

  algoSelect.addEventListener('change', (e) => {
    activeAlgo = e.target.value;
    log(`[Algorithm] Switched active visualizer to: ${algoSelect.options[algoSelect.selectedIndex].text}`, 'algo');
    
    // Toggle active input panel configurations
    document.querySelectorAll('.algo-input-group').forEach(panel => panel.style.display = 'none');
    if (isSortingAlgo()) {
      document.getElementById('group-sorting-inputs').style.display = 'flex';
    } else if (isGraphAlgo()) {
      document.getElementById('group-graph-inputs').style.display = 'flex';
    } else if (isSearchingAlgo()) {
      document.getElementById('group-search-inputs').style.display = 'flex';
    }
    
    loadPseudocode();
    resetSimulation();
  });

  arraySizeInput.addEventListener('input', (e) => {
    document.getElementById('lbl-algo-size').textContent = e.target.value;
    generateSortArray();
    resetSimulation();
  });

  shuffleBtn.addEventListener('click', () => {
    generateSortArray();
    log('[Algorithm] Generated new randomized sorting array.', 'algo');
    resetSimulation();
  });

  speedInput.addEventListener('input', (e) => {
    stepDelay = parseInt(e.target.value);
    document.getElementById('lbl-algo-speed').textContent = stepDelay;
    if (isRunning) {
      pauseSimulation();
      playSimulation();
    }
  });

  stepBtn.addEventListener('click', () => {
    if (isRunning) pauseSimulation();
    stepForward();
  });

  runBtn.addEventListener('click', () => {
    if (isRunning) {
      pauseSimulation();
    } else {
      playSimulation();
    }
  });

  resetBtn.addEventListener('click', () => {
    resetSimulation();
    log('[Algorithm] Visualization progress reset to step 0.', 'algo');
  });

  // Graph events
  wallModeBtn.addEventListener('click', () => {
    graphEditMode = 'wall';
    setActiveGraphBtn(wallModeBtn);
  });
  startModeBtn.addEventListener('click', () => {
    graphEditMode = 'start';
    setActiveGraphBtn(startModeBtn);
  });
  endModeBtn.addEventListener('click', () => {
    graphEditMode = 'end';
    setActiveGraphBtn(endModeBtn);
  });
  clearWallsBtn.addEventListener('click', () => {
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        grid[r][c].isWall = false;
      }
    }
    log('[Algorithm] Removed all structural walls from the pathfinder grid.', 'algo');
    resetSimulation();
  });

  function setActiveGraphBtn(activeBtn) {
    [wallModeBtn, startModeBtn, endModeBtn].forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  // Search target event
  targetInput.addEventListener('change', (e) => {
    searchTarget = parseInt(e.target.value) || 45;
    resetSimulation();
  });
  searchResetBtn.addEventListener('click', () => {
    generateSearchArray();
    log('[Algorithm] Generated new sorted search array.', 'algo');
    resetSimulation();
  });

  // Interactive Graph Canvas interactions
  canvas.addEventListener('mousedown', (e) => {
    if (!isGraphAlgo()) return;
    const coords = getCellCoordsAtMouse(e);
    if (!coords) return;
    
    const node = grid[coords.row][coords.col];
    if (graphEditMode === 'wall') {
      if (!node.isStart && !node.isEnd) {
        isDrawingWalls = true;
        node.isWall = !node.isWall;
        resetSimulation();
      }
    } else if (graphEditMode === 'start') {
      if (!node.isWall && !node.isEnd) {
        grid[graphStart.row][graphStart.col].isStart = false;
        graphStart = coords;
        node.isStart = true;
        resetSimulation();
      }
    } else if (graphEditMode === 'end') {
      if (!node.isWall && !node.isStart) {
        grid[graphEnd.row][graphEnd.col].isEnd = false;
        graphEnd = coords;
        node.isEnd = true;
        resetSimulation();
      }
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isGraphAlgo() || !isDrawingWalls || graphEditMode !== 'wall') return;
    const coords = getCellCoordsAtMouse(e);
    if (!coords) return;
    
    const node = grid[coords.row][coords.col];
    if (!node.isStart && !node.isEnd && !node.isWall) {
      node.isWall = true;
      resetSimulation();
    }
  });

  window.addEventListener('mouseup', () => {
    isDrawingWalls = false;
  });
}

function getCellCoordsAtMouse(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const clientX = (e.clientX - rect.left) * scaleX;
  const clientY = (e.clientY - rect.top) * scaleY;
  
  const paddingX = 15;
  const paddingY = 15;
  const cellW = (canvas.width - paddingX * 2) / gridCols;
  const cellH = (canvas.height - paddingY * 2) / gridRows;
  
  const col = Math.floor((clientX - paddingX) / cellW);
  const row = Math.floor((clientY - paddingY) / cellH);
  
  if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
    return { row, col };
  }
  return null;
}

// Helper Categories
function isSortingAlgo() {
  return ['bubble-sort', 'quick-sort', 'merge-sort'].includes(activeAlgo);
}

function isGraphAlgo() {
  return ['dijkstra', 'bfs', 'dfs'].includes(activeAlgo);
}

function isSearchingAlgo() {
  return ['binary-search'].includes(activeAlgo);
}

// Pseudocode Loader
function loadPseudocode() {
  const container = document.getElementById('algo-pseudocode-viewer');
  if (!container) return;
  
  container.innerHTML = '';
  const lines = pseudocodeData[activeAlgo] || [];
  
  lines.forEach((lineText, idx) => {
    const lineDiv = document.createElement('div');
    lineDiv.className = 'pseudocode-line';
    lineDiv.id = `code-line-${idx}`;
    lineDiv.textContent = lineText;
    container.appendChild(lineDiv);
  });
}

function highlightPseudocodeLine(lineIndex) {
  document.querySelectorAll('.pseudocode-line').forEach(line => {
    line.classList.remove('highlight');
  });
  
  if (lineIndex !== undefined && lineIndex >= 0) {
    const el = document.getElementById(`code-line-${lineIndex}`);
    if (el) {
      el.classList.add('highlight');
      // Scroll into view if needed inside container
      const container = document.getElementById('algo-pseudocode-viewer');
      if (container) {
        const topPos = el.offsetTop - container.offsetTop;
        container.scrollTop = topPos - 30; // buffer
      }
    }
  }
}

// Simulation Control Core
function resetSimulation() {
  pauseSimulation();
  currentStepIndex = 0;
  
  // Flushes dynamic properties depending on mode
  if (isGraphAlgo()) {
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        grid[r][c].isVisited = false;
        grid[r][c].isPath = false;
        grid[r][c].distance = Infinity;
        grid[r][c].parent = null;
      }
    }
  }
  
  generateSteps();
  render();
  
  // Set default initial labels
  document.getElementById('algo-step-description').textContent = "Visualizer ready. Click Step or Run to begin.";
  highlightPseudocodeLine(-1);
}

function playSimulation() {
  const runBtn = document.getElementById('btn-algo-run');
  const playIcon = document.getElementById('algo-play-icon');
  const playText = document.getElementById('algo-play-text');
  
  isRunning = true;
  if (runBtn) runBtn.classList.add('active');
  if (playIcon) {
    playIcon.className = 'fa-solid fa-pause';
  }
  if (playText) playText.textContent = 'Pause';
  
  log(`[Algorithm] Started auto-play cycle. delay: ${stepDelay}ms`, 'algo');
  
  timerId = setInterval(() => {
    if (currentStepIndex >= steps.length - 1) {
      pauseSimulation();
      log('[Algorithm] Execution simulation sequence complete.', 'algo');
      return;
    }
    stepForward();
  }, stepDelay);
}

function pauseSimulation() {
  const runBtn = document.getElementById('btn-algo-run');
  const playIcon = document.getElementById('algo-play-icon');
  const playText = document.getElementById('algo-play-text');
  
  isRunning = false;
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (runBtn) runBtn.classList.remove('active');
  if (playIcon) {
    playIcon.className = 'fa-solid fa-play';
  }
  if (playText) playText.textContent = 'Run';
}

function stepForward() {
  if (currentStepIndex < steps.length - 1) {
    currentStepIndex++;
    applyStep(steps[currentStepIndex]);
    render();
  }
}

// Step Application
function applyStep(step) {
  // Description Updates
  document.getElementById('algo-step-description').textContent = step.desc;
  
  // Pseudocode Line Highlighting
  highlightPseudocodeLine(step.line);
  
  // Apply visual property values
  if (isSortingAlgo()) {
    sortArray = [...step.arrayState];
    // State indicators are drawn on canvas from step info
  } else if (isGraphAlgo()) {
    // Deep copy grid states
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cellState = step.gridState[r][c];
        grid[r][c].isVisited = cellState.isVisited;
        grid[r][c].isPath = cellState.isPath;
      }
    }
  } else if (isSearchingAlgo()) {
    // Highlighting values handled inside render
  }
}

// STEPS GENERATORS
function generateSteps() {
  steps = [];
  
  // Step 0: Initial state
  if (isSortingAlgo()) {
    steps.push({
      line: 0,
      desc: "Initial randomized array sequence loaded.",
      arrayState: [...sortArray],
      compares: [],
      swaps: [],
      pivots: [],
      sortedIndices: []
    });
    
    if (activeAlgo === 'bubble-sort') {
      generateBubbleSortSteps();
    } else if (activeAlgo === 'quick-sort') {
      generateQuickSortSteps();
    } else if (activeAlgo === 'merge-sort') {
      generateMergeSortSteps();
    }
  } else if (isGraphAlgo()) {
    const gridSnapshot = saveGridSnapshot();
    steps.push({
      line: 0,
      desc: "Interactive grid layout initialized.",
      gridState: gridSnapshot,
      activeCell: null
    });
    
    if (activeAlgo === 'dijkstra') {
      generateDijkstraSteps();
    } else if (activeAlgo === 'bfs') {
      generateBfsSteps();
    } else if (activeAlgo === 'dfs') {
      generateDfsSteps();
    }
  } else if (isSearchingAlgo()) {
    steps.push({
      line: 0,
      desc: "Sorted array created. Looking for target value.",
      low: 0,
      high: searchArray.length - 1,
      mid: -1,
      found: false
    });
    generateBinarySearchSteps();
  }
}

function saveGridSnapshot() {
  const snapshot = [];
  for (let r = 0; r < gridRows; r++) {
    const row = [];
    for (let c = 0; c < gridCols; c++) {
      row.push({
        isVisited: grid[r][c].isVisited,
        isPath: grid[r][c].isPath
      });
    }
    snapshot.push(row);
  }
  return snapshot;
}

// Bubble Sort Steps
function generateBubbleSortSteps() {
  let A = [...sortArray];
  let n = A.length;
  let sortedSet = new Set();
  
  for (let i = 0; i < n; i++) {
    steps.push({
      line: 1,
      desc: `Outer loop iteration i = ${i}. Lock-set count: ${sortedSet.size}.`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [],
      sortedIndices: Array.from(sortedSet)
    });
    
    for (let j = 0; j < n - i - 1; j++) {
      // Comparison step
      steps.push({
        line: 2,
        desc: `Inner loop. Comparing indices j=${j} (val: ${A[j]}) and j+1=${j+1} (val: ${A[j+1]}).`,
        arrayState: [...A],
        compares: [j, j + 1],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      
      steps.push({
        line: 3,
        desc: `Evaluating conditional comparison: ${A[j]} > ${A[j+1]}?`,
        arrayState: [...A],
        compares: [j, j + 1],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });

      if (A[j] > A[j+1]) {
        // Swap values
        let temp = A[j];
        A[j] = A[j+1];
        A[j+1] = temp;
        
        steps.push({
          line: 4,
          desc: `Swapping values: A[${j}] and A[${j+1}] because ${temp} > ${A[j]}`,
          arrayState: [...A],
          compares: [],
          swaps: [j, j + 1],
          pivots: [],
          sortedIndices: Array.from(sortedSet)
        });
      }
    }
    
    // Last element of subsegment is sorted
    sortedSet.add(n - i - 1);
    steps.push({
      line: 1,
      desc: `Locked index ${n - i - 1} as sorted.`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [],
      sortedIndices: Array.from(sortedSet)
    });
  }
  
  steps.push({
    line: 5,
    desc: "Array sorting completed successfully.",
    arrayState: [...A],
    compares: [],
    swaps: [],
    pivots: [],
    sortedIndices: Array.from({length: n}, (_, k) => k)
  });
}

// Quick Sort Steps
function generateQuickSortSteps() {
  let A = [...sortArray];
  let sortedSet = new Set();
  
  function quickSortHelper(low, high) {
    if (low < high) {
      steps.push({
        line: 1,
        desc: `Checking sub-boundary condition: low=${low} < high=${high}. Recursive sorting required.`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });

      // partition
      let pIdx = partition(low, high);
      
      // recurse
      quickSortHelper(low, pIdx - 1);
      quickSortHelper(pIdx + 1, high);
    } else if (low >= 0 && low < A.length) {
      sortedSet.add(low);
    }
  }

  function partition(low, high) {
    let pivot = A[high];
    steps.push({
      line: 6,
      desc: `Choosing pivot element value from A[high=${high}]: pivot = ${pivot}`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [high],
      sortedIndices: Array.from(sortedSet)
    });

    let i = low - 1;
    steps.push({
      line: 7,
      desc: `Setting structural partition boundary index i = ${i}.`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [high],
      sortedIndices: Array.from(sortedSet)
    });

    for (let j = low; j < high; j++) {
      steps.push({
        line: 8,
        desc: `Comparing element A[j=${j}] (${A[j]}) with pivot (${pivot}).`,
        arrayState: [...A],
        compares: [j, high],
        swaps: [],
        pivots: [high],
        sortedIndices: Array.from(sortedSet)
      });
      
      steps.push({
        line: 9,
        desc: `Check if A[${j}] (${A[j]}) < pivot (${pivot})?`,
        arrayState: [...A],
        compares: [j, high],
        swaps: [],
        pivots: [high],
        sortedIndices: Array.from(sortedSet)
      });

      if (A[j] < pivot) {
        i++;
        let temp = A[i];
        A[i] = A[j];
        A[j] = temp;
        
        steps.push({
          line: 10,
          desc: `Boundary incremented i=${i}. Swapping A[i=${i}] (${temp}) with A[j=${j}] (${A[j]})`,
          arrayState: [...A],
          compares: [],
          swaps: [i, j],
          pivots: [high],
          sortedIndices: Array.from(sortedSet)
        });
      }
    }

    // swap with pivot
    let temp = A[i + 1];
    A[i + 1] = A[high];
    A[high] = temp;
    
    steps.push({
      line: 11,
      desc: `Placing pivot to correct index location: Swapping A[i+1=${i+1}] (${temp}) with pivot A[high=${high}] (${A[i+1]})`,
      arrayState: [...A],
      compares: [],
      swaps: [i + 1, high],
      pivots: [i + 1],
      sortedIndices: Array.from(sortedSet)
    });
    
    sortedSet.add(i + 1);
    
    steps.push({
      line: 12,
      desc: `Partition finalized. Return pivot index p = ${i + 1}.`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [i + 1],
      sortedIndices: Array.from(sortedSet)
    });

    return i + 1;
  }

  quickSortHelper(0, A.length - 1);
  
  steps.push({
    line: 0,
    desc: "Quick Sort completes. Full array elements locked.",
    arrayState: [...A],
    compares: [],
    swaps: [],
    pivots: [],
    sortedIndices: Array.from({length: A.length}, (_, k) => k)
  });
}

// Merge Sort Steps
function generateMergeSortSteps() {
  let A = [...sortArray];
  let sortedSet = new Set();
  
  function mergeSortHelper(l, r) {
    if (l < r) {
      steps.push({
        line: 1,
        desc: `Check recursion bound: left=${l} < right=${r}. Split needed.`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });

      let m = Math.floor(l + (r - l) / 2);
      steps.push({
        line: 2,
        desc: `Calculated middle index: mid = l + (r-l)/2 = ${m}.`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [m],
        sortedIndices: Array.from(sortedSet)
      });

      // Split LHS
      steps.push({
        line: 3,
        desc: `Recursing MergeSort left branch: [${l} to ${m}].`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      mergeSortHelper(l, m);

      // Split RHS
      steps.push({
        line: 4,
        desc: `Recursing MergeSort right branch: [${m+1} to ${r}].`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      mergeSortHelper(m + 1, r);

      // Merge
      steps.push({
        line: 5,
        desc: `Merging sorted segments: [${l} to ${m}] and [${m+1} to ${r}].`,
        arrayState: [...A],
        compares: [],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      merge(l, m, r);
    }
  }

  function merge(l, m, r) {
    // Copy L and R subarrays
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = [];
    let R = [];
    for (let x = 0; x < n1; x++) L.push(A[l + x]);
    for (let y = 0; y < n2; y++) R.push(A[m + 1 + y]);

    steps.push({
      line: 7,
      desc: `Subarray values copied to memory: L=[${L.join(', ')}], R=[${R.join(', ')}]`,
      arrayState: [...A],
      compares: [],
      swaps: [],
      pivots: [],
      sortedIndices: Array.from(sortedSet)
    });

    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
      steps.push({
        line: 8,
        desc: `Comparing LHS element ${L[i]} at i=${i} against RHS element ${R[j]} at j=${j}`,
        arrayState: [...A],
        compares: [l + i, m + 1 + j],
        swaps: [],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });

      if (L[i] <= R[j]) {
        A[k] = L[i];
        steps.push({
          line: 8,
          desc: `LHS element ${L[i]} is smaller. Writing to A[${k}].`,
          arrayState: [...A],
          compares: [],
          swaps: [k],
          pivots: [],
          sortedIndices: Array.from(sortedSet)
        });
        i++;
      } else {
        A[k] = R[j];
        steps.push({
          line: 8,
          desc: `RHS element ${R[j]} is smaller. Writing to A[${k}].`,
          arrayState: [...A],
          compares: [],
          swaps: [k],
          pivots: [],
          sortedIndices: Array.from(sortedSet)
        });
        j++;
      }
      k++;
    }

    // copy remaining
    while (i < n1) {
      A[k] = L[i];
      steps.push({
        line: 8,
        desc: `Flushing remaining LHS element ${L[i]} to position A[${k}].`,
        arrayState: [...A],
        compares: [],
        swaps: [k],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      i++;
      k++;
    }
    while (j < n2) {
      A[k] = R[j];
      steps.push({
        line: 8,
        desc: `Flushing remaining RHS element ${R[j]} to position A[${k}].`,
        arrayState: [...A],
        compares: [],
        swaps: [k],
        pivots: [],
        sortedIndices: Array.from(sortedSet)
      });
      j++;
      k++;
    }
    
    // Add indices to sorted list if this was the top-level merge
    if (l === 0 && r === A.length - 1) {
      for (let s = l; s <= r; s++) sortedSet.add(s);
    }
  }

  mergeSortHelper(0, A.length - 1);
  
  steps.push({
    line: 0,
    desc: "Merge Sort logic resolves completely.",
    arrayState: [...A],
    compares: [],
    swaps: [],
    pivots: [],
    sortedIndices: Array.from({length: A.length}, (_, k) => k)
  });
}

// Pathfinder Helpers
function getNeighbors(node, gridState) {
  const neighbors = [];
  const { row, col } = node;
  
  // 4-directional search
  const dirs = [
    { r: -1, c: 0 }, // Up
    { r: 0, c: 1 },  // Right
    { r: 1, c: 0 },  // Down
    { r: 0, c: -1 }  // Left
  ];
  
  for (const d of dirs) {
    const nr = row + d.r;
    const nc = col + d.c;
    if (nr >= 0 && nr < gridRows && nc >= 0 && nc < gridCols) {
      // Find matching cell
      const neighbor = gridState.find(n => n.row === nr && n.col === nc);
      if (neighbor && !neighbor.isWall) {
        neighbors.push(neighbor);
      }
    }
  }
  return neighbors;
}

function buildPathSteps(endNode, gridState, lineNum) {
  let curr = endNode;
  const pathNodes = [];
  while (curr.parent) {
    pathNodes.push(curr);
    curr = curr.parent;
  }
  pathNodes.push(curr); // include start
  pathNodes.reverse();
  
  // Add path highlight incrementally
  const displayGrid = [];
  for (let r = 0; r < gridRows; r++) {
    const row = [];
    for (let c = 0; c < gridCols; c++) {
      const match = gridState.find(n => n.row === r && n.col === c);
      row.push({
        isVisited: match.isVisited,
        isPath: match.isPath
      });
    }
    displayGrid.push(row);
  }
  
  for (let i = 0; i < pathNodes.length; i++) {
    const node = pathNodes[i];
    
    // Update local state copy
    displayGrid[node.row][node.col].isPath = true;
    
    // Push path drawing step
    const stepGrid = displayGrid.map(row => row.map(cell => ({ ...cell })));
    steps.push({
      line: lineNum,
      desc: `Traced shortest path node: (${node.row}, ${node.col})`,
      gridState: stepGrid,
      activeCell: { row: node.row, col: node.col }
    });
  }
}

// Dijkstra Pathfinder Steps
function generateDijkstraSteps() {
  // Flatten grid copy to work on
  const graphNodes = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      graphNodes.push({
        row: r,
        col: c,
        isWall: cell.isWall,
        isStart: cell.isStart,
        isEnd: cell.isEnd,
        isVisited: false,
        isPath: false,
        distance: cell.isStart ? 0 : Infinity,
        parent: null
      });
    }
  }

  steps.push({
    line: 1,
    desc: "Dijkstra init: Set start node distance to 0, others to Infinity.",
    gridState: grid.map(r => r.map(c => ({ isVisited: false, isPath: false }))),
    activeCell: graphStart
  });

  const unvisited = [...graphNodes];

  while (unvisited.length > 0) {
    // Sort to extract min distance
    unvisited.sort((a, b) => a.distance - b.distance);
    const u = unvisited[0];
    
    if (u.distance === Infinity) {
      steps.push({
        line: 3,
        desc: "Dijkstra: Remaining nodes are unreachable. Paths ended.",
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: null
      });
      break;
    }

    // Visited flag
    u.isVisited = true;
    
    // Step showing active node pop
    steps.push({
      line: 4,
      desc: `Extract node with min distance: cell (${u.row}, ${u.col}) at distance ${u.distance}`,
      gridState: savePathfinderStateSnapshot(graphNodes),
      activeCell: { row: u.row, col: u.col }
    });

    if (u.isEnd) {
      steps.push({
        line: 5,
        desc: "Dijkstra: Destination node reached! Initiating shortest path assembly.",
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: { row: u.row, col: u.col }
      });
      buildPathSteps(u, graphNodes, 5);
      return;
    }

    // Remove u
    unvisited.shift();

    const neighbors = getNeighbors(u, graphNodes);
    for (const v of neighbors) {
      if (v.isVisited) continue;
      
      const alt = u.distance + 1; // uniform cost weight = 1
      
      steps.push({
        line: 7,
        desc: `Evaluating neighbor node (${v.row}, ${v.col}). alt_dist = dist[u] + 1 = ${alt}`,
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: { row: v.row, col: v.col }
      });

      if (alt < v.distance) {
        v.distance = alt;
        v.parent = u;
        
        steps.push({
          line: 8,
          desc: `Relaxation successful: set distance of (${v.row}, ${v.col}) to ${alt}, parent = (${u.row}, ${u.col})`,
          gridState: savePathfinderStateSnapshot(graphNodes),
          activeCell: { row: v.row, col: v.col }
        });
      }
    }
  }

  log('[Algorithm] Dijkstra completed. No path connection could be found.', 'algo');
}

// BFS Pathfinder Steps
function generateBfsSteps() {
  const graphNodes = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      graphNodes.push({
        row: r,
        col: c,
        isWall: cell.isWall,
        isStart: cell.isStart,
        isEnd: cell.isEnd,
        isVisited: false,
        isPath: false,
        parent: null
      });
    }
  }

  const startNode = graphNodes.find(n => n.row === graphStart.row && n.col === graphStart.col);
  
  const queue = [startNode];
  startNode.isVisited = true;

  steps.push({
    line: 1,
    desc: `Queue initialized. Enqueued start node (${startNode.row}, ${startNode.col}).`,
    gridState: savePathfinderStateSnapshot(graphNodes),
    activeCell: graphStart
  });

  while (queue.length > 0) {
    const u = queue.shift();
    
    steps.push({
      line: 4,
      desc: `Dequeued active search node: (${u.row}, ${u.col})`,
      gridState: savePathfinderStateSnapshot(graphNodes),
      activeCell: { row: u.row, col: u.col }
    });

    if (u.isEnd) {
      steps.push({
        line: 5,
        desc: "BFS: Destination reached! Tracing shortest route.",
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: { row: u.row, col: u.col }
      });
      buildPathSteps(u, graphNodes, 5);
      return;
    }

    const neighbors = getNeighbors(u, graphNodes);
    for (const v of neighbors) {
      if (!v.isVisited) {
        v.isVisited = true;
        v.parent = u;
        queue.push(v);
        
        steps.push({
          line: 8,
          desc: `Unvisited neighbor (${v.row}, ${v.col}) discovered. Set parent to (${u.row}, ${u.col})`,
          gridState: savePathfinderStateSnapshot(graphNodes),
          activeCell: { row: v.row, col: v.col }
        });
      }
    }
  }

  log('[Algorithm] BFS completed. Target is unreachable.', 'algo');
}

// DFS Pathfinder Steps
function generateDfsSteps() {
  const graphNodes = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = grid[r][c];
      graphNodes.push({
        row: r,
        col: c,
        isWall: cell.isWall,
        isStart: cell.isStart,
        isEnd: cell.isEnd,
        isVisited: false,
        isPath: false,
        parent: null
      });
    }
  }

  const startNode = graphNodes.find(n => n.row === graphStart.row && n.col === graphStart.col);
  
  const stack = [startNode];

  steps.push({
    line: 1,
    desc: `Stack initialized. Pushed start node (${startNode.row}, ${startNode.col}).`,
    gridState: savePathfinderStateSnapshot(graphNodes),
    activeCell: graphStart
  });

  const visitedSet = new Set();

  while (stack.length > 0) {
    const u = stack.pop();
    
    steps.push({
      line: 4,
      desc: `Popped active cell from Stack: (${u.row}, ${u.col})`,
      gridState: savePathfinderStateSnapshot(graphNodes),
      activeCell: { row: u.row, col: u.col }
    });

    if (u.isEnd) {
      steps.push({
        line: 5,
        desc: "DFS: Target reached! Assembling depth path.",
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: { row: u.row, col: u.col }
      });
      buildPathSteps(u, graphNodes, 5);
      return;
    }

    const uKey = `${u.row},${u.col}`;
    if (!visitedSet.has(uKey)) {
      visitedSet.add(uKey);
      u.isVisited = true;
      
      steps.push({
        line: 7,
        desc: `Marked cell (${u.row}, ${u.col}) as visited.`,
        gridState: savePathfinderStateSnapshot(graphNodes),
        activeCell: { row: u.row, col: u.col }
      });

      // Get neighbors and push to stack
      const neighbors = getNeighbors(u, graphNodes);
      // For DFS path representation, order of neighbors impacts direction
      for (const v of neighbors) {
        const vKey = `${v.row},${v.col}`;
        if (!visitedSet.has(vKey)) {
          v.parent = u;
          stack.push(v);
          
          steps.push({
            line: 11,
            desc: `Push neighbor (${v.row}, ${v.col}) to stack, parent = (${u.row}, ${u.col}).`,
            gridState: savePathfinderStateSnapshot(graphNodes),
            activeCell: { row: v.row, col: v.col }
          });
        }
      }
    }
  }

  log('[Algorithm] DFS completed. End node unreachable.', 'algo');
}

function savePathfinderStateSnapshot(nodes) {
  const snapshot = [];
  for (let r = 0; r < gridRows; r++) {
    const row = [];
    for (let c = 0; c < gridCols; c++) {
      const match = nodes.find(n => n.row === r && n.col === c);
      row.push({
        isVisited: match ? match.isVisited : false,
        isPath: match ? match.isPath : false
      });
    }
    snapshot.push(row);
  }
  return snapshot;
}

// Binary Search Steps
function generateBinarySearchSteps() {
  let low = 0;
  let high = searchArray.length - 1;
  let mid = -1;
  let found = false;

  while (low <= high) {
    steps.push({
      line: 2,
      desc: `Evaluating bound condition: low (${low}) <= high (${high}). Search continues.`,
      low: low,
      high: high,
      mid: mid,
      found: found
    });

    mid = Math.floor(low + (high - low) / 2);
    
    steps.push({
      line: 3,
      desc: `Calculated middle pointer: mid = low + (high-low)/2 = ${mid} (value: ${searchArray[mid]}).`,
      low: low,
      high: high,
      mid: mid,
      found: found
    });

    steps.push({
      line: 4,
      desc: `Comparing mid element A[${mid}] (${searchArray[mid]}) with target (${searchTarget})`,
      low: low,
      high: high,
      mid: mid,
      found: found
    });

    if (searchArray[mid] === searchTarget) {
      found = true;
      steps.push({
        line: 5,
        desc: `Match found! A[mid=${mid}] equals target (${searchTarget}). Returning index ${mid}.`,
        low: low,
        high: high,
        mid: mid,
        found: found
      });
      break;
    } else if (searchArray[mid] < searchTarget) {
      let oldLow = low;
      low = mid + 1;
      steps.push({
        line: 7,
        desc: `A[mid=${mid}] (${searchArray[mid]}) < target (${searchTarget}). Shifts low boundary: low = mid + 1 = ${low}`,
        low: low,
        high: high,
        mid: mid,
        found: found
      });
    } else {
      let oldHigh = high;
      high = mid - 1;
      steps.push({
        line: 9,
        desc: `A[mid=${mid}] (${searchArray[mid]}) > target (${searchTarget}). Shifts high boundary: high = mid - 1 = ${high}`,
        low: low,
        high: high,
        mid: mid,
        found: found
      });
    }
  }

  if (!found) {
    steps.push({
      line: 10,
      desc: `Search range collapsed. Low (${low}) > High (${high}). Target value ${searchTarget} not present.`,
      low: low,
      high: high,
      mid: -1,
      found: false
    });
  }
}

// CANVAS RENDER LOGIC
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (isSortingAlgo()) {
    renderSorting();
  } else if (isGraphAlgo()) {
    renderGraph();
  } else if (isSearchingAlgo()) {
    renderSearching();
  }
}

function renderSorting() {
  const currentStep = steps[currentStepIndex];
  if (!currentStep) return;

  const array = sortArray;
  const n = array.length;
  
  const paddingX = 25;
  const paddingY = 30;
  const chartW = canvas.width - paddingX * 2;
  const chartH = canvas.height - paddingY * 2;
  
  const barW = chartW / n;
  
  // Find max value to normalize height
  const maxVal = 100;

  for (let i = 0; i < n; i++) {
    const val = array[i];
    const barH = (val / maxVal) * chartH;
    
    const x = paddingX + i * barW;
    const y = canvas.height - paddingY - barH;
    
    // Choose bar colors based on status in step
    let fillColor = 'rgba(192, 132, 252, 0.4)'; // Default purple opacity
    let strokeColor = 'rgba(192, 132, 252, 0.8)';
    let isHighlighted = false;

    if (currentStep.compares.includes(i)) {
      fillColor = 'rgba(0, 242, 254, 0.5)'; // Active cyan
      strokeColor = '#00f2fe';
      isHighlighted = true;
    } else if (currentStep.swaps.includes(i)) {
      fillColor = 'rgba(248, 113, 113, 0.5)'; // Swapping red
      strokeColor = '#f87171';
      isHighlighted = true;
    } else if (currentStep.pivots.includes(i)) {
      fillColor = 'rgba(251, 191, 36, 0.5)'; // Pivot amber
      strokeColor = '#fbbf24';
      isHighlighted = true;
    } else if (currentStep.sortedIndices.includes(i)) {
      fillColor = 'rgba(74, 222, 128, 0.3)'; // Sorted green
      strokeColor = '#4ade80';
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
    
    // Draw rounded-ish rectangles
    ctx.beginPath();
    ctx.rect(x + 3, y, barW - 6, barH);
    ctx.fill();
    ctx.stroke();

    // Draw active glow if highlighted
    if (isHighlighted) {
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // Draw value labels above bars
    ctx.fillStyle = isHighlighted ? strokeColor : 'rgba(248, 250, 252, 0.8)';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barW / 2, y - 8);
  }
}

function renderGraph() {
  const currentStep = steps[currentStepIndex];
  if (!currentStep) return;

  const paddingX = 15;
  const paddingY = 15;
  const gridW = canvas.width - paddingX * 2;
  const gridH = canvas.height - paddingY * 2;
  
  const cellW = gridW / gridCols;
  const cellH = gridH / gridRows;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const node = grid[r][c];
      const stepCell = currentStep.gridState ? currentStep.gridState[r][c] : null;
      
      const x = paddingX + c * cellW;
      const y = paddingY + r * cellH;
      
      // Determine color
      let fillColor = '#121624'; // Empty cell color
      let strokeColor = 'rgba(255, 255, 255, 0.05)';
      let textChar = '';
      let textColor = 'rgba(255, 255, 255, 0.2)';
      let isGlow = false;

      if (node.isWall) {
        fillColor = '#334155'; // Wall
        strokeColor = '#475569';
      } else if (node.isStart) {
        fillColor = 'rgba(74, 222, 128, 0.2)'; // Start Green
        strokeColor = '#4ade80';
        textChar = '▶'; // Play icon
        textColor = '#4ade80';
        isGlow = true;
      } else if (node.isEnd) {
        fillColor = 'rgba(248, 113, 113, 0.2)'; // Target Red
        strokeColor = '#f87171';
        textChar = '⚑'; // Flag
        textColor = '#f87171';
        isGlow = true;
      } else if (stepCell && stepCell.isPath) {
        fillColor = 'rgba(251, 191, 36, 0.3)'; // Shortest Path Amber
        strokeColor = '#fbbf24';
        isGlow = true;
      } else if (stepCell && stepCell.isVisited) {
        fillColor = 'rgba(0, 242, 254, 0.15)'; // Visited Cyan
        strokeColor = 'rgba(0, 242, 254, 0.4)';
      }

      // Check if this is the active cell currently processing
      if (currentStep.activeCell && currentStep.activeCell.row === r && currentStep.activeCell.col === c) {
        fillColor = 'rgba(192, 132, 252, 0.3)'; // Active Purple
        strokeColor = '#c084fc';
        isGlow = true;
      }

      // Render cell
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isGlow ? 2.5 : 1;
      
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cellW - 4, cellH - 4, 4);
      ctx.fill();
      ctx.stroke();

      if (isGlow) {
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Render symbols for start/end
      if (textChar) {
        ctx.fillStyle = textColor;
        ctx.font = '14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textChar, x + cellW / 2, y + cellH / 2);
      }
    }
  }
}

function renderSearching() {
  const currentStep = steps[currentStepIndex];
  if (!currentStep) return;

  const n = searchArray.length;
  const paddingX = 40;
  const cellW = (canvas.width - paddingX * 2) / n;
  const cellH = 60;
  
  const y = (canvas.height - cellH) / 2 - 20;

  for (let i = 0; i < n; i++) {
    const val = searchArray[i];
    const x = paddingX + i * cellW;
    
    // Check if index inside search boundary range
    let inRange = (i >= currentStep.low && i <= currentStep.high);
    let isMid = (i === currentStep.mid);
    let isFound = (isMid && currentStep.found);
    
    let fillColor = '#121624';
    let strokeColor = 'rgba(255, 255, 255, 0.08)';
    let textColor = 'rgba(255, 255, 255, 0.2)';
    let isGlow = false;

    if (inRange) {
      fillColor = 'rgba(192, 132, 252, 0.08)';
      strokeColor = 'rgba(192, 132, 252, 0.3)';
      textColor = '#f8fafc';
    }
    
    if (isMid) {
      fillColor = 'rgba(0, 242, 254, 0.2)';
      strokeColor = '#00f2fe';
      textColor = '#00f2fe';
      isGlow = true;
    }
    
    if (isFound) {
      fillColor = 'rgba(74, 222, 128, 0.2)';
      strokeColor = '#4ade80';
      textColor = '#4ade80';
      isGlow = true;
    }

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isGlow ? 2.5 : 1;
    
    ctx.beginPath();
    ctx.roundRect(x + 4, y, cellW - 8, cellH, 6);
    ctx.fill();
    ctx.stroke();

    if (isGlow) {
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }

    // Render numbers
    ctx.fillStyle = textColor;
    ctx.font = '14px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, x + cellW / 2, y + cellH / 2);

    // Render index numbers above
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`[${i}]`, x + cellW / 2, y - 10);
  }

  // Draw Pointer Arrows and Labels beneath cells
  ctx.font = '11px JetBrains Mono';
  ctx.textAlign = 'center';

  // Draw Low pointer
  if (currentStep.low >= 0 && currentStep.low < n) {
    const lx = paddingX + currentStep.low * cellW + cellW / 2;
    ctx.fillStyle = 'rgba(192, 132, 252, 0.8)';
    ctx.fillText('▲', lx, y + cellH + 15);
    ctx.fillText('L', lx, y + cellH + 28);
  }

  // Draw High pointer
  if (currentStep.high >= 0 && currentStep.high < n) {
    const hx = paddingX + currentStep.high * cellW + cellW / 2;
    ctx.fillStyle = 'rgba(248, 113, 113, 0.8)';
    ctx.fillText('▲', hx, y + cellH + 15);
    ctx.fillText('H', hx, y + cellH + 28);
  }

  // Draw Mid pointer
  if (currentStep.mid >= 0 && currentStep.mid < n) {
    const mx = paddingX + currentStep.mid * cellW + cellW / 2;
    ctx.fillStyle = '#00f2fe';
    ctx.fillText('▲', mx, y + cellH + 15);
    ctx.fillText('MID', mx, y + cellH + 40);
  }
  
  // Render search target text info at top corner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText(`Search Target: ${searchTarget}`, paddingX, y - 25);
}
