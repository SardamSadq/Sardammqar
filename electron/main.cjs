const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const url = require('url');

let mainWindow = null;
let localServer = null;
let serverPort = 3000;
let sseClients = [];
let sharedState = {
  settings: null,
  tables: [],
  menu: [],
  stations: [],
  orders: [],
  staff: [],
  printers: [],
};

// MIME Types for serving static web assets from dist
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

// Detect all LAN / Wi-Fi IP addresses on the laptop
function getLanInfo() {
  const interfaces = os.networkInterfaces();
  const allIps = [];
  let preferredIp = '127.0.0.1';

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        allIps.push({
          name,
          ip: iface.address,
        });

        // Prioritize standard local Wi-Fi / LAN subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (iface.address.startsWith('192.168.')) {
          preferredIp = iface.address;
        } else if (preferredIp === '127.0.0.1' && !iface.address.startsWith('169.254.')) {
          preferredIp = iface.address;
        }
      }
    }
  }

  // If only 169.254 or nothing was found, pick first available or localhost
  if (preferredIp === '127.0.0.1' && allIps.length > 0) {
    preferredIp = allIps[0].ip;
  }

  return {
    preferredIp,
    port: serverPort,
    waiterUrl: `http://${preferredIp}:${serverPort}/?view=waiter`,
    cashierUrl: `http://${preferredIp}:${serverPort}/`,
    allIps,
    connectedTablets: sseClients.length,
  };
}

// Broadcast event to all connected tablets via SSE
function broadcastEvent(msg) {
  const sseData = `data: ${JSON.stringify(msg)}\n\n`;
  sseClients = sseClients.filter((clientRes) => {
    try {
      clientRes.write(sseData);
      return true;
    } catch {
      return false;
    }
  });

  // Also notify laptop main window if it exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('lan-sync-event', msg);
  }
}

// Read body helper
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Create and start the embedded Node.js HTTP LAN Server
function startEmbeddedLanServer(portToTry = 3000) {
  const distPath = path.join(__dirname, '../dist');

  const server = http.createServer(async (req, res) => {
    // Enable CORS for all local requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname || '/';

    // 1. GET /api/lan-info - Returns local Wi-Fi IP and tablet URL
    if (pathname === '/api/lan-info') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(getLanInfo()));
      return;
    }

    // 2. GET /api/sync/stream - Server-Sent Events (SSE) for instant real-time sync
    if (pathname === '/api/sync/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      });
      res.write(': connected\n\n');
      sseClients.push(res);

      req.on('close', () => {
        sseClients = sseClients.filter((c) => c !== res);
      });
      return;
    }

    // 3. GET /api/sync/state - Return current state
    if (pathname === '/api/sync/state' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(sharedState));
      return;
    }

    // 4. POST /api/sync/state - Save updated state from laptop
    if (pathname === '/api/sync/state' && req.method === 'POST') {
      try {
        const body = await readRequestBody(req);
        sharedState = { ...sharedState, ...body };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(e) }));
      }
      return;
    }

    // 5. POST /api/sync/event - Receive event from tablet or laptop and broadcast
    if (pathname === '/api/sync/event' && req.method === 'POST') {
      try {
        const msg = await readRequestBody(req);
        if (msg && msg.type) {
          // If this is an order submitted, update shared orders state
          if (msg.type === 'ORDER_SUBMITTED' && msg.payload && msg.payload.order) {
            const incomingOrder = msg.payload.order;
            const existingIdx = sharedState.orders.findIndex((o) => o.id === incomingOrder.id);
            if (existingIdx >= 0) {
              sharedState.orders[existingIdx] = incomingOrder;
            } else {
              sharedState.orders.push(incomingOrder);
            }
          }
          broadcastEvent(msg);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    // 6. Serve static files from dist directory for laptop and tablets
    let safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(distPath, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA routing
        filePath = path.join(distPath, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('File Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} in use, trying ${portToTry + 1}...`);
      startEmbeddedLanServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(portToTry, '0.0.0.0', () => {
    serverPort = portToTry;
    localServer = server;
    console.log(`Cafeteria LAN Server running on http://0.0.0.0:${serverPort}`);
    console.log(`Waiter Tablet URL: ${getLanInfo().waiterUrl}`);

    // Set 25-second keepalive ping for SSE clients
    setInterval(() => {
      sseClients = sseClients.filter((clientRes) => {
        try {
          clientRes.write(': ping\n\n');
          return true;
        } catch {
          return false;
        }
      });
    }, 25000);
  });
}

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 700,
      title: 'سیستەمی کافتریا و ڕێستۆرانت (POS Hub)',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
      },
    });

    // Load from local embedded LAN server so origins, relative APIs, and ports match tablets
    const serverUrl = `http://localhost:${serverPort}`;
    mainWindow.loadURL(serverUrl).catch(() => {
      // Fallback to direct file loading if server startup was delayed
      const indexPath = path.join(__dirname, '../dist/index.html');
      mainWindow.loadFile(indexPath).catch(() => {
        mainWindow.loadURL('http://localhost:3000');
      });
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    // 1. Start embedded LAN Server on 0.0.0.0 so tablets can connect
    startEmbeddedLanServer(3000);

    // 2. Allow short moment for server to bind then create POS window
    setTimeout(() => {
      createWindow();
    }, 400);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (localServer) {
      localServer.close();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Handle thermal receipt printing
  ipcMain.on('print-receipt', (event, options = {}) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    win.webContents.print({
      silent: options.silent ?? false,
      printBackground: true,
      deviceName: options.printerName || '',
    });
  });

  // IPC to provide LAN server info to the UI
  ipcMain.handle('get-lan-server-info', () => {
    return getLanInfo();
  });

  // IPC to clear storage and reset shared LAN state
  ipcMain.handle('clear-app-data', async () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.webContents.session.clearStorageData();
      }
      sharedState = {
        settings: null,
        tables: [],
        menu: [],
        stations: [],
        orders: [],
        staff: [],
        printers: [],
      };
      return { success: true };
    } catch (e) {
      return { error: String(e) };
    }
  });

  // IPC to broadcast an event from laptop to all connected tablets
  ipcMain.on('broadcast-sync', (event, msg) => {
    broadcastEvent(msg);
  });
}
