// In-memory SSE broadcaster — one EventEmitter per project
// Works for single-server/single-process deployment (Laragon dev & Vercel serverless with caveats).

type SSEClient = { controller: ReadableStreamDefaultController; userId: string };

const rooms = new Map<string, Set<SSEClient>>();

export function subscribe(projectId: string, client: SSEClient): () => void {
  if (!rooms.has(projectId)) rooms.set(projectId, new Set());
  rooms.get(projectId)!.add(client);

  return () => {
    rooms.get(projectId)?.delete(client);
    if (rooms.get(projectId)?.size === 0) rooms.delete(projectId);
  };
}

export function broadcast(projectId: string, event: string, data: unknown, excludeUserId?: string) {
  const clients = rooms.get(projectId);
  if (!clients) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  for (const client of clients) {
    if (excludeUserId && client.userId === excludeUserId) continue;
    try {
      client.controller.enqueue(encoder.encode(payload));
    } catch {
      clients.delete(client);
    }
  }
}
