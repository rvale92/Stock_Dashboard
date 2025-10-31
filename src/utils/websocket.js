// WebSocket utility for real-time stock price updates
// WebSocket is disabled in demo mode (Alpha Vantage doesn't provide WebSocket)
// Users can enable WebSocket by adding their own Finnhub API key
const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

// Store active connections
const connections = new Map();

/**
 * Create and manage WebSocket connection for stock symbol
 * @param {string} symbol - Stock symbol
 * @param {string} apiKey - Finnhub API key
 * @param {Function} onMessage - Callback for price updates
 * @returns {Function} Function to close the connection
 */
export const createWebSocketConnection = (symbol, apiKey, onMessage) => {
  // Disabled in demo mode - Alpha Vantage doesn't provide WebSocket
  // Users need to add their own Finnhub API key for WebSocket support
  if (!symbol || !apiKey || apiKey === 'demo') {
    console.log('WebSocket not available in demo mode. Using polling instead.');
    return null;
  }
  
  if (!apiKey) {
    console.warn('WebSocket requires valid API key. Using polling instead.');
    return null;
  }

  const connectionKey = `${symbol}_${apiKey}`;
  
  // Reuse existing connection if available
  if (connections.has(connectionKey)) {
    const existing = connections.get(connectionKey);
    existing.subscribers.add(onMessage);
    return () => {
      existing.subscribers.delete(onMessage);
      if (existing.subscribers.size === 0) {
        existing.ws.close();
        connections.delete(connectionKey);
      }
    };
  }

  try {
    // Use sandbox WebSocket endpoint with token
    const ws = new WebSocket(`${FINNHUB_WS_URL}?token=${apiKey}`);
    const subscribers = new Set([onMessage]);

    ws.onopen = () => {
      console.log(`WebSocket connected for ${symbol}`);
      // Subscribe to the symbol
      ws.send(JSON.stringify({ type: 'subscribe', symbol: symbol }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Finnhub sends data in format: { data: [{ s: symbol, p: price, ... }] }
        if (data.type === 'trade' && data.data) {
          data.data.forEach(trade => {
            // Notify all subscribers
            subscribers.forEach(callback => {
              callback({
                symbol: trade.s || symbol,
                price: trade.p,
                volume: trade.v,
                timestamp: trade.t,
                type: trade.type || 'trade'
              });
            });
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
      // Notify subscribers of error
      subscribers.forEach(callback => {
        callback({ symbol, error: 'WebSocket connection error' });
      });
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for ${symbol}`);
      connections.delete(connectionKey);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (subscribers.size > 0) {
          console.log(`Attempting to reconnect WebSocket for ${symbol}`);
          const newConnection = createWebSocketConnection(symbol, apiKey, onMessage);
          return newConnection;
        }
      }, 5000);
    };

    connections.set(connectionKey, { ws, subscribers });

    return () => {
      subscribers.delete(onMessage);
      if (subscribers.size === 0) {
        ws.close();
        connections.delete(connectionKey);
      }
    };
  } catch (error) {
    console.error(`Failed to create WebSocket for ${symbol}:`, error);
    return null;
  }
};

/**
 * Subscribe to multiple symbols
 * @param {string[]} symbols - Array of stock symbols
 * @param {string} apiKey - Finnhub API key
 * @param {Function} onMessage - Callback for updates
 * @returns {Function} Function to close all connections
 */
export const subscribeToSymbols = (symbols, apiKey, onMessage) => {
  // Disabled in demo mode
  if (!symbols || symbols.length === 0 || !apiKey || apiKey === 'demo') {
    console.log('WebSocket not available in demo mode. Using polling instead.');
    return null;
  }
  
  if (!apiKey) {
    return null;
  }

  const cleanupFunctions = symbols.map(symbol => 
    createWebSocketConnection(symbol, apiKey, onMessage)
  ).filter(Boolean);

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup && cleanup());
  };
};

/**
 * Close all WebSocket connections
 */
export const closeAllConnections = () => {
  connections.forEach(({ ws }) => {
    ws.close();
  });
  connections.clear();
};

