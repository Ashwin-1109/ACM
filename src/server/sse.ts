import { Response } from 'express';

interface SseClient {
  id: string;
  res: Response;
}

const clients = new Set<SseClient>();

export function registerSseClient(res: Response): string {
  const id = Math.random().toString(36).substring(2, 9);
  const client: SseClient = { id, res };
  clients.add(client);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send initial connected ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: Date.now() })}\n\n`);

  res.on('close', () => {
    clients.delete(client);
  });

  return id;
}

export function broadcastEvent(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

// Periodic ping to keep SSE connections alive without blocking process shutdown
const ssePingTimer = setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(`: ping\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}, 25000);

if (ssePingTimer.unref) {
  ssePingTimer.unref();
}
