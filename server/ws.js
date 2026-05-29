import { WebSocketServer } from 'ws';
import ExchangeRate from './models/exchangeRate.model.js';

export let wss = null;

export const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws) => {
    try {
      const doc = await ExchangeRate.findOne({ base: 'USD' }).sort({ createdAt: -1 });
      if (doc) {
        ws.send(JSON.stringify({ type: 'rates', data: Object.fromEntries(doc.rates) }));
      }
    } catch (err) {
      console.error('WebSocket: failed to send rates on connect:', err);
    }
  });
};

export const broadcastRates = (rates) => {
  if (!wss) return;
  const message = JSON.stringify({ type: 'rates', data: rates });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
};
