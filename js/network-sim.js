// ComputeXplain - Network Packet Routing Simulator

let canvas, ctx;
let log;
let nodes = [];
let links = [];
let packets = [];
let animationFrameId = null;

let dropRate = 0.1;
let transmissionSpeed = 2; // pixel speed per frame
let reassemblyBuffer = [];
let originalMessage = "";
let totalPacketsCount = 0;
let isTransmitting = false;

// Nodes Definition
class Node {
  constructor(id, label, ip, x, y, type) {
    this.id = id;
    this.label = label;
    this.ip = ip;
    this.x = x;
    this.y = y;
    this.type = type; // 'client', 'dns', 'router', 'server'
    this.pulse = 0;
  }

  draw() {
    // Pulse animation for active nodes
    if (this.pulse > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, 22 + this.pulse * 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${this.getColorRGB()}, ${0.4 - this.pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      this.pulse += 0.02;
      if (this.pulse > 1) this.pulse = 0;
    }

    // Node body
    ctx.beginPath();
    ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#11131c';
    ctx.strokeStyle = this.getColor();
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.getColor();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // Text labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(this.label, this.x, this.y - 24);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(this.ip, this.x, this.y + 28);
    
    // Draw tiny inner icon based on type
    ctx.fillStyle = this.getColor();
    ctx.font = '10px "Font Awesome 6 Free"';
    ctx.fontWeight = '900';
    let icon = '\uf109'; // desktop
    if (this.type === 'router') icon = '\uf0e8'; // sitemap/nodes
    if (this.type === 'dns') icon = '\uf501'; // server / database
    if (this.type === 'server') icon = '\uf233'; // server
    ctx.fillText(icon, this.x, this.y + 3);
  }

  getColor() {
    if (this.type === 'client') return '#00f2fe'; // cyan
    if (this.type === 'dns') return '#fbbf24'; // amber
    if (this.type === 'server') return '#4ade80'; // green
    return '#c084fc'; // purple for routers
  }

  getColorRGB() {
    if (this.type === 'client') return '0, 242, 254';
    if (this.type === 'dns') return '251, 191, 36';
    if (this.type === 'server') return '74, 222, 128';
    return '192, 132, 252';
  }
}

class Link {
  constructor(nodeA, nodeB) {
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.active = true;
    this.load = 0; // 0 to 1 for congestion line effects
  }

  draw() {
    ctx.beginPath();
    ctx.moveTo(this.nodeA.x, this.nodeA.y);
    ctx.lineTo(this.nodeB.x, this.nodeB.y);
    ctx.strokeStyle = this.active ? 'rgba(255, 255, 255, 0.12)' : 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = this.active ? (2 + this.load * 2) : 1;
    if (!this.active) {
      ctx.setLineDash([4, 4]); // dashed link to show offline/congested
    }
    ctx.stroke();
    ctx.setLineDash([]); // reset
  }
}

class Packet {
  constructor(payload, seq, total, path, purpose = 'data') {
    this.payload = payload;
    this.seq = seq;
    this.total = total;
    this.path = path; // Array of node IDs
    this.currentPathIndex = 0;
    this.purpose = purpose; // 'dns-req', 'dns-res', 'data', 'ack'
    
    const startNode = nodes.find(n => n.id === path[0]);
    this.x = startNode.x;
    this.y = startNode.y;
    this.progress = 0; // 0 to 1 between nodes
    this.status = 'transit'; // 'transit', 'dropped', 'arrived'
  }

  update() {
    if (this.status !== 'transit') return;

    const fromNode = nodes.find(n => n.id === this.path[this.currentPathIndex]);
    const toNode = nodes.find(n => n.id === this.path[this.currentPathIndex + 1]);

    if (!toNode) {
      this.status = 'arrived';
      return;
    }

    // Move packet along link
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const speed = transmissionSpeed / dist;
    this.progress += speed;

    if (this.progress >= 1) {
      // Check link congestion / drop probability
      const link = links.find(l => 
        (l.nodeA.id === fromNode.id && l.nodeB.id === toNode.id) ||
        (l.nodeA.id === toNode.id && l.nodeB.id === fromNode.id)
      );

      if (link && !link.active && this.purpose === 'data') {
        // Drop packet on broken link
        this.status = 'dropped';
        log(`[TCP Error] Packet ${this.seq}/${this.total} dropped: Route segment congested.`, 'net');
        return;
      }

      // Random chance of drop if drop rate > 0
      if (this.purpose === 'data' && Math.random() < dropRate) {
        this.status = 'dropped';
        log(`[TCP Error] Packet ${this.seq}/${this.total} dropped: Packet loss on hop.`, 'net');
        return;
      }

      this.currentPathIndex++;
      this.progress = 0;
      this.x = toNode.x;
      this.y = toNode.y;

      const currentNode = nodes.find(n => n.id === this.path[this.currentPathIndex]);
      if (currentNode) currentNode.pulse = 0.1;
    } else {
      this.x = fromNode.x + dx * this.progress;
      this.y = fromNode.y + dy * this.progress;
    }
  }

  draw() {
    if (this.status !== 'transit') return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.getColor();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.getColor();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Small label for TCP sequence number
    if (this.purpose === 'data') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(this.seq, this.x, this.y - 8);
    }
  }

  getColor() {
    if (this.purpose === 'dns-req') return '#fbbf24'; // amber
    if (this.purpose === 'dns-res') return '#fbbf24';
    if (this.purpose === 'ack') return '#c084fc'; // purple
    return '#00f2fe'; // cyan data packets
  }
}

// Pathfinding helper (BFS/Dijkstra for simple hop count)
function findPath(startId, endId) {
  let queue = [[startId]];
  let visited = new Set([startId]);

  while (queue.length > 0) {
    let path = queue.shift();
    let node = path[path.length - 1];

    if (node === endId) return path;

    // Find neighbors with active links
    let neighbors = [];
    links.forEach(link => {
      if (link.nodeA.id === node && !visited.has(link.nodeB.id)) {
        neighbors.push(link.nodeB.id);
      } else if (link.nodeB.id === node && !visited.has(link.nodeA.id)) {
        neighbors.push(link.nodeA.id);
      }
    });

    for (let neighbor of neighbors) {
      visited.add(neighbor);
      queue.push([...path, neighbor]);
    }
  }
  return null; // unreachable
}

// Main initialize function called from main.js
export function initNetworkSim(logger) {
  log = logger;
  canvas = document.getElementById('net-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  setupNetworkGraph();
  setupUIEventListeners();
  
  // Start canvas tick loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  tick();
}

function setupNetworkGraph() {
  nodes = [];
  links = [];
  packets = [];
  reassemblyBuffer = [];

  // Coordinates optimized for a 650x420 canvas
  const client = new Node('C', 'My PC', '192.168.1.52', 80, 210, 'client');
  const gateway = new Node('G', 'Home Router', '192.168.1.1', 190, 210, 'router');
  const dns = new Node('DNS', 'DNS server', '8.8.8.8', 190, 80, 'dns');
  
  const r1 = new Node('R1', 'ISP Core A', '10.0.1.1', 320, 140, 'router');
  const r2 = new Node('R2', 'ISP Core B', '10.0.1.2', 320, 280, 'router');
  const r3 = new Node('R3', 'Web Edge Router', '172.16.4.2', 460, 210, 'router');
  
  const server = new Node('S', 'google.com', '142.250.64.46', 570, 210, 'server');

  nodes.push(client, gateway, dns, r1, r2, r3, server);

  // Define Links
  links.push(new Link(client, gateway));
  links.push(new Link(gateway, dns));
  links.push(new Link(gateway, r1));
  links.push(new Link(gateway, r2));
  links.push(new Link(r1, r3));
  links.push(new Link(r2, r3));
  links.push(new Link(r3, server));
}

function setupUIEventListeners() {
  const transmitBtn = document.getElementById('btn-net-transmit');
  const congestionBtn = document.getElementById('btn-net-fail-link');
  const dropSlider = document.getElementById('net-drop-rate');
  const lblDrop = document.getElementById('lbl-net-drop');
  const speedSelect = document.getElementById('net-speed');

  dropSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    lblDrop.textContent = val;
    dropRate = val / 100;
  });

  speedSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'slow') transmissionSpeed = 0.8;
    else if (val === 'normal') transmissionSpeed = 2;
    else transmissionSpeed = 4.5;
    log(`Transmission speed adjusted to: ${val}`, 'net');
  });

  transmitBtn.addEventListener('click', () => {
    if (isTransmitting) {
      log('Transmission already in progress. Please wait for assembly.', 'net');
      return;
    }
    const destUrl = document.getElementById('net-dest-url').value.trim() || 'google.com';
    const payload = document.getElementById('net-payload').value.trim() || 'HELLO';
    
    startTransmissionPipeline(destUrl, payload);
  });

  congestionBtn.addEventListener('click', () => {
    // Randomly toggle one of the ISP links offline to show dynamic path routing
    const ispLinks = links.filter(l => 
      (l.nodeA.id === 'G' && l.nodeB.id === 'R1') ||
      (l.nodeA.id === 'G' && l.nodeB.id === 'R2') ||
      (l.nodeA.id === 'R1' && l.nodeB.id === 'R3') ||
      (l.nodeA.id === 'R2' && l.nodeB.id === 'R3')
    );
    
    const targetLink = ispLinks[Math.floor(Math.random() * ispLinks.length)];
    targetLink.active = !targetLink.active;
    
    if (targetLink.active) {
      log(`[Link Restored] Connection between ${targetLink.nodeA.label} and ${targetLink.nodeB.label} back online.`, 'net');
      congestionBtn.style.color = 'var(--accent-red)';
      congestionBtn.style.borderColor = 'rgba(248, 113, 113, 0.2)';
    } else {
      log(`[Congestion Alert] Connection between ${targetLink.nodeA.label} and ${targetLink.nodeB.label} severed! Packets will auto-route.`, 'net');
      congestionBtn.style.color = '#38bdf8'; // highlight
      congestionBtn.style.borderColor = 'rgba(56, 189, 248, 0.3)';
    }
  });
}

function startTransmissionPipeline(url, message) {
  isTransmitting = true;
  originalMessage = message;
  reassemblyBuffer = Array(Math.ceil(message.length / 3)).fill(null);
  totalPacketsCount = reassemblyBuffer.length;
  
  log(`[Client] Initiating transmission of "${message}" to ${url}`, 'net');
  
  // Step 1: DNS Lookup request
  log(`[DNS] Querying local DNS for IP mapping of "${url}"...`, 'net');
  const dnsPath = ['C', 'G', 'DNS'];
  const dnsReq = new Packet('', 0, 0, dnsPath, 'dns-req');
  packets.push(dnsReq);

  // We set a listener for dns arrival
  const checkDNSArrival = setInterval(() => {
    if (dnsReq.status === 'arrived') {
      clearInterval(checkDNSArrival);
      log(`[DNS] Mapping found! "${url}" resolves to target server IP: 142.250.64.46`, 'net');
      
      // Update target server label in visualizer
      const serverNode = nodes.find(n => n.id === 'S');
      if (serverNode) serverNode.label = url;

      // Send DNS Response back to Client
      const dnsResPath = ['DNS', 'G', 'C'];
      const dnsRes = new Packet('', 0, 0, dnsResPath, 'dns-res');
      packets.push(dnsRes);

      const checkDNSResArrival = setInterval(() => {
        if (dnsRes.status === 'arrived') {
          clearInterval(checkDNSResArrival);
          log(`[TCP] Handshake complete. Segmenting payload into ${totalPacketsCount} packets of 3-character segments...`, 'net');
          
          // Split message and send packets
          transmitDataPackets(message);
        }
      }, 100);
    }
  }, 100);
}

function transmitDataPackets(message) {
  const segments = [];
  for (let i = 0; i < message.length; i += 3) {
    segments.push(message.substring(i, i + 3));
  }

  segments.forEach((seg, idx) => {
    sendPacketWithRetransmit(seg, idx + 1, segments.length);
  });
}

function sendPacketWithRetransmit(payload, seq, total) {
  // Find shortest valid path
  const path = findPath('C', 'S');
  
  if (!path) {
    log(`[TCP Error] Cannot route packet ${seq}. No valid paths available between gateway and server.`, 'net');
    isTransmitting = false;
    return;
  }

  log(`[IP] Packet ${seq}/${total} ("${payload}") dispatched via path: ${path.join(' -> ')}`, 'net');
  const pkt = new Packet(payload, seq, total, path, 'data');
  packets.push(pkt);

  const tracker = setInterval(() => {
    if (pkt.status === 'arrived') {
      clearInterval(tracker);
      
      // Process packet arrival at server
      if (!reassemblyBuffer[seq - 1]) {
        reassemblyBuffer[seq - 1] = payload;
        log(`[Server] Packet ${seq}/${total} received successfully. Buffer: [${reassemblyBuffer.map(b => b ? `"${b}"` : '_').join(', ')}]`, 'net');
        
        // Send ACK back
        const ackPath = findPath('S', 'C');
        if (ackPath) {
          const ackPkt = new Packet('', seq, total, ackPath, 'ack');
          packets.push(ackPkt);
        }
      }
      
      // Check if all packets assembled
      if (reassemblyBuffer.every(val => val !== null)) {
        const fullMessage = reassemblyBuffer.join('');
        setTimeout(() => {
          log(`[SUCCESS] Message fully reassembled by Server: "${fullMessage}"`, 'net');
          isTransmitting = false;
        }, 800);
      }
    } else if (pkt.status === 'dropped') {
      clearInterval(tracker);
      
      // Remove dropped packet from active list
      packets = packets.filter(p => p !== pkt);
      
      // Retransmit after timeout simulation
      log(`[TCP Retransmit] Timeout expired. Resending Packet ${seq}/${total} ("${payload}")...`, 'net');
      setTimeout(() => {
        sendPacketWithRetransmit(payload, seq, total);
      }, 1500);
    }
  }, 100);
}

// Canvas animation tick loop
function tick() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Links
  links.forEach(link => link.draw());

  // Draw Nodes
  nodes.forEach(node => node.draw());

  // Update & Draw Packets
  packets.forEach(pkt => {
    pkt.update();
    pkt.draw();
  });

  // Filter out arrived or dropped packets
  packets = packets.filter(pkt => pkt.status === 'transit');

  animationFrameId = requestAnimationFrame(tick);
}
