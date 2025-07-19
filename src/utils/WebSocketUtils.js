// Utility for consistent WebSocket connections across nodes

export function createWebSocket({ apiEndpoint, path, onOpen, onMessage, onClose, onError }) {
  try {
    const wsProtocol = apiEndpoint.startsWith('https') ? 'wss' : 'ws';
    const url = new URL(apiEndpoint);
    const ws = new WebSocket(`${wsProtocol}://${url.host}/ws${path}`);

    ws.onopen = () => { if (onOpen) onOpen(ws); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        if (onError) onError(e);
      }
    };
    ws.onclose = () => { if (onClose) onClose(); };
    ws.onerror = (e) => { if (onError) onError(e); };

    return ws;
  } catch (error) {
    if (onError) onError(error);
    return null;
  }
}