import { Response } from 'express';

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

// In-memory map of userId to their SSE response objects
// A user can have multiple connections (multiple browser tabs/devices)
const clients: Map<string, Set<Response>> = new Map();

/**
 * Add a client connection for SSE
 * @param userId - User ID
 * @param res - Express Response object for SSE
 */
export function addClient(userId: string, res: Response): void {
  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }
  clients.get(userId)!.add(res);
  console.log(`SSE: Client connected for user ${userId}. Total connections: ${clients.get(userId)!.size}`);
}

/**
 * Remove a client connection
 * @param userId - User ID
 * @param res - Express Response object to remove
 */
export function removeClient(userId: string, res: Response): void {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.delete(res);
    console.log(`SSE: Client disconnected for user ${userId}. Remaining connections: ${userClients.size}`);

    // Clean up empty sets
    if (userClients.size === 0) {
      clients.delete(userId);
    }
  }
}

/**
 * Send an event to a specific user
 * @param userId - User ID to send event to
 * @param event - Event object with type and data
 */
export function sendToUser(userId: string, event: SSEEvent): void {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    console.log(`SSE: No connected clients for user ${userId}`);
    return;
  }

  const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;

  let successCount = 0;
  const deadClients: Response[] = [];

  userClients.forEach((res) => {
    try {
      res.write(eventString);
      successCount++;
    } catch (error) {
      console.error(`SSE: Failed to send to client for user ${userId}:`, error);
      deadClients.push(res);
    }
  });

  // Clean up dead clients
  deadClients.forEach((res) => {
    userClients.delete(res);
  });

  if (userClients.size === 0) {
    clients.delete(userId);
  }

  console.log(`SSE: Sent event '${event.type}' to ${successCount} client(s) for user ${userId}`);
}

/**
 * Get the number of connected clients for a user
 * @param userId - User ID
 * @returns Number of connected clients
 */
export function getClientCount(userId: string): number {
  return clients.get(userId)?.size || 0;
}

/**
 * Get total number of all connected clients
 * @returns Total number of connected clients
 */
export function getTotalClientCount(): number {
  let total = 0;
  clients.forEach((userClients) => {
    total += userClients.size;
  });
  return total;
}
