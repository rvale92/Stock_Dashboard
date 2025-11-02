import { useState, useEffect } from 'react';

export function useWebSocket(symbols) {
  const [connected] = useState(false);

  useEffect(() => {
    // WebSocket not currently implemented - using polling mode
    console.log('WebSocket disabled - polling mode active');
  }, [symbols]);

  return { connected };
}
