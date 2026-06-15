// ComputeXplain - Core Application Controller

// Import simulators
import { initNetworkSim } from './network-sim.js';
import { initCpuSim } from './cpu-sim.js';
import { initPixelSim } from './pixel-sim.js';
import { initCacheSim } from './cache-sim.js';
import { initAlgoSim } from './algo-sim.js';

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupSystemClock();
  setupConsole();
  
  // Initialize each simulator module
  initNetworkSim(logToConsole);
  initCpuSim(logToConsole);
  initPixelSim(logToConsole);
  initCacheSim(logToConsole);
  initAlgoSim(logToConsole);
  
  logToConsole('All simulator subsystems online. Ready for diagnostic commands.', 'sys');
});

// Tab navigation controller
function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const currentTitle = document.getElementById('current-tab-title');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      // Update sidebar nav items state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Switch simulator tab contents
      tabContents.forEach(tab => {
        if (tab.id === `tab-${targetTab}`) {
          tab.style.display = 'block';
        } else {
          tab.style.display = 'none';
        }
      });
      
      // Update header title based on active tab
      const tabNames = {
        dashboard: 'System Dashboard',
        network: 'Internet Packet Routing Simulator',
        cpu: 'CPU Pipeline & ALU Simulator',
        pixel: 'Pixel Grid & CRT Raster Microscope',
        cache: 'Memory Cache Hierarchy Simulator',
        algo: 'Interactive Algorithm Visualizer'
      };
      currentTitle.textContent = tabNames[targetTab] || 'ComputeXplain';
      
      logToConsole(`Switched active subsystem viewport to: ${tabNames[targetTab]}`, 'sys');
    });
  });
  
  // Also link dashboard cards to sidebar tabs
  const welcomeCards = document.querySelectorAll('.welcome-card');
  welcomeCards.forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-target');
      const targetNav = document.getElementById(`nav-${target}`);
      if (targetNav) targetNav.click();
    });
  });
}

// System clock tick simulation
function setupSystemClock() {
  const clockEl = document.getElementById('system-time');
  
  function updateTime() {
    const now = new Date();
    const hrs = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    const secs = String(now.getUTCSeconds()).padStart(2, '0');
    const ms = String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}:${secs}.${ms} UT`;
  }
  
  setInterval(updateTime, 30);
}

// Global logger system
let logsList = [];
const maxLogs = 50;

function setupConsole() {
  const clearBtn = document.getElementById('btn-clear-logs');
  const consoleBody = document.getElementById('console-logs-list');
  
  clearBtn.addEventListener('click', () => {
    consoleBody.innerHTML = '';
    logsList = [];
    logToConsole('System console logs cleared.', 'sys');
  });
}

export function logToConsole(message, type = 'sys') {
  const consoleBody = document.getElementById('console-logs-list');
  if (!consoleBody) return;
  
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `[${hrs}:${mins}:${secs}]`;
  
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  
  const tsSpan = document.createElement('span');
  tsSpan.className = 'timestamp';
  tsSpan.textContent = timestamp;
  
  const textNode = document.createTextNode(` ${message}`);
  
  line.appendChild(tsSpan);
  line.appendChild(textNode);
  consoleBody.appendChild(line);
  
  // Keep scrolling down
  consoleBody.scrollTop = consoleBody.scrollHeight;
  
  // Limit max logs to maintain performance
  logsList.push(line);
  if (logsList.length > maxLogs) {
    const oldest = logsList.shift();
    if (oldest && oldest.parentNode) {
      oldest.parentNode.removeChild(oldest);
    }
  }
}
