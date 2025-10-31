import { useEffect, useRef, useState } from 'react';
import { subscribeToSymbols } from '../utils/websocket';

// Using Finnhub sandbox demo key (hardcoded for public deployment)
const FINNHUB_API_KEY = 'sandbox_c0ja2ad3ad1r2jrtm9q0';

/**
 * Custom hook for WebSocket connections
 * @param {string|string[]} symbols - Stock symbol(s) to subscribe to
 * @param {Function} onUpdate - Callback for price updates
 * @param {boolean} enabled - Whether WebSocket is enabled
 * @returns {Object} WebSocket state and controls
 */
export const useWebSocket = (symbols, onUpdate, enabled = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!enabled || !symbols || (Array.isArray(symbols) && symbols.length === 0) || !FINNHUB_API_KEY) {
      // Fallback to polling if WebSocket is not available
      setIsConnected(false);
      return;
    }

    const symbolsArray = Array.isArray(symbols) ? symbols : [symbols];
    
    const handleUpdate = (data) => {
      if (data.error) {
        console.error('WebSocket update error:', data.error);
        setIsConnected(false);
        return;
      }

      setIsConnected(true);
      setLastUpdate(new Date());
      
      if (onUpdate) {
        onUpdate(data);
      }
    };

    // Subscribe to symbols
    const cleanup = subscribeToSymbols(symbolsArray, FINNHUB_API_KEY, handleUpdate);
    
    if (cleanup) {
      cleanupRef.current = cleanup;
      setIsConnected(true);
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setIsConnected(false);
    };
  }, [symbols, enabled, onUpdate]);

  return {
    isConnected,
    lastUpdate,
    disconnect: () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        setIsConnected(false);
      }
    }
  };
};

