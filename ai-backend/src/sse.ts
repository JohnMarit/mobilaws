import { Response } from 'express';

/**
 * Initialize SSE response with proper headers
 */
export function initSSE(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
}

/**
 * Write an SSE event to the response stream
 */
export function writeEvent(res: Response, eventName: string, data: any): void {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${payload}\n\n`);
}

/**
 * Send a heartbeat comment to keep connection alive
 */
export function sendHeartbeat(res: Response): void {
  res.write(': heartbeat\n\n');
}

/**
 * Close the SSE stream gracefully
 */
export function closeStream(res: Response): void {
  res.end();
}

/**
 * Create a heartbeat interval that sends periodic comments
 * Returns the interval ID that can be cleared later
 */
export function startHeartbeat(res: Response, intervalMs: number = 15000): NodeJS.Timeout {
  return setInterval(() => {
    try {
      sendHeartbeat(res);
    } catch (err) {
      // Connection closed, ignore
    }
  }, intervalMs);
}

/**
 * Clean up resources when SSE connection closes
 */
export function setupSSECleanup(
  res: Response,
  heartbeatInterval: NodeJS.Timeout,
  onClose?: () => void
): void {
  res.on('close', () => {
    clearInterval(heartbeatInterval);
    if (onClose) {
      onClose();
    }
  });

  res.on('error', (err) => {
    console.error('SSE connection error:', err);
    clearInterval(heartbeatInterval);
    if (onClose) {
      onClose();
    }
  });
}


