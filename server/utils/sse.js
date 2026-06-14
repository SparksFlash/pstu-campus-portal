/**
 * Server-Sent Events client registry.
 * Each logged-in user can have one active SSE connection.
 * Maps userId (string) → Express Response object.
 */
const clients = new Map();

/**
 * Register a new SSE client.
 * Sends SSE headers and an initial "connected" event.
 */
function addClient(userId, res) {
  res.set({
    'Content-Type':  'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
    'X-Accel-Buffering': 'no', // disable Nginx buffering
  });
  res.flushHeaders();

  // Send a heartbeat every 25 s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  clients.set(String(userId), { res, heartbeat });

  res.on('close', () => removeClient(userId));
}

/** Deregister client and clear heartbeat. */
function removeClient(userId) {
  const entry = clients.get(String(userId));
  if (entry) {
    clearInterval(entry.heartbeat);
    clients.delete(String(userId));
  }
}

/**
 * Send a named event to a specific user.
 * Returns true if delivered, false if user is not connected.
 */
function sendToUser(userId, eventName, data) {
  const entry = clients.get(String(userId));
  if (!entry) return false;
  try {
    entry.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    removeClient(userId);
    return false;
  }
}

/** Broadcast to every connected client. */
function broadcast(eventName, data) {
  for (const [userId] of clients) {
    sendToUser(userId, eventName, data);
  }
}

module.exports = { addClient, removeClient, sendToUser, broadcast };
