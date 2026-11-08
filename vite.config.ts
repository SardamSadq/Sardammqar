import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import { defineConfig, Plugin } from 'vite';

function lanServerPlugin(): Plugin {
  let sseClients: any[] = [];
  let sharedState: any = {
    settings: null,
    tables: [],
    menu: [],
    stations: [],
    orders: [],
    staff: [],
    printers: [],
  };

  function getLanInfo(port = 3000) {
    const interfaces = os.networkInterfaces();
    const allIps: Array<{ name: string; ip: string }> = [];
    let preferredIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          allIps.push({ name, ip: iface.address });
          if (iface.address.startsWith('192.168.')) {
            preferredIp = iface.address;
          } else if (preferredIp === '127.0.0.1' && !iface.address.startsWith('169.254.')) {
            preferredIp = iface.address;
          }
        }
      }
    }

    if (preferredIp === '127.0.0.1' && allIps.length > 0) {
      preferredIp = allIps[0].ip;
    }

    return {
      preferredIp,
      port,
      waiterUrl: `http://${preferredIp}:${port}/?view=waiter`,
      cashierUrl: `http://${preferredIp}:${port}/`,
      allIps,
      connectedTablets: sseClients.length,
    };
  }

  function broadcastEvent(msg: any) {
    const sseData = `data: ${JSON.stringify(msg)}\n\n`;
    sseClients = sseClients.filter((clientRes) => {
      try {
        clientRes.write(sseData);
        return true;
      } catch {
        return false;
      }
    });
  }

  return {
    name: 'lan-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        if (pathname === '/api/lan-info') {
          const port = Number(server.config.server.port) || 3000;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(getLanInfo(port)));
          return;
        }

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

        if (pathname === '/api/sync/state' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(sharedState));
          return;
        }

        if (pathname === '/api/sync/state' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              sharedState = { ...sharedState, ...JSON.parse(body || '{}') };
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
          return;
        }

        if (pathname === '/api/sync/event' && req.method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const msg = JSON.parse(body || '{}');
              if (msg && msg.type) {
                if (msg.type === 'ORDER_SUBMITTED' && msg.payload?.order) {
                  const incomingOrder = msg.payload.order;
                  const idx = sharedState.orders.findIndex((o: any) => o.id === incomingOrder.id);
                  if (idx >= 0) {
                    sharedState.orders[idx] = incomingOrder;
                  } else {
                    sharedState.orders.push(incomingOrder);
                  }
                }
                broadcastEvent(msg);
              }
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), lanServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
