import React, { useState, useEffect } from 'react';
import { fetchStockQuote } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { checkAlerts, getAlertsForSymbol } from '../utils/alerts';
import AlertManager from './AlertManager';

// Common stock symbols for autocomplete
const COMMON_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B',
  'V', 'UNH', 'JNJ', 'WMT', 'JPM', 'MA', 'PG', 'HD', 'DIS', 'BAC',
  'VZ', 'ADBE', 'CSCO', 'CMCSA', 'PEP', 'TMO', 'COST', 'ABT', 'NFLX',
  'CRM', 'AVGO', 'TXN', 'ACN', 'DHR', 'QCOM', 'LIN', 'NKE', 'BMY'
];

function Watchlist({ onStockSelect }) {
  const [stocks, setStocks] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSymbolForAlert, setSelectedSymbolForAlert] = useState(null);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const savedStocks = localStorage.getItem('watchlist');
    if (savedStocks) {
      const saved = JSON.parse(savedStocks);
      setStocks(saved);
      // Fetch data for saved stocks
      saved.forEach(stock => fetchStockData(stock));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem('watchlist', JSON.stringify(stocks));
    }
  }, [stocks]);

  // WebSocket connection for real-time updates
  const handleWebSocketUpdate = (data) => {
    if (data && data.symbol && data.price) {
      // Check for alerts first
      const triggered = checkAlerts(data.symbol, data.price);
      
      // Update stock data with real-time price
      setStockData(prev => ({
        ...prev,
        [data.symbol]: {
          ...prev[data.symbol],
          price: data.price,
          timestamp: data.timestamp || new Date().toISOString()
        }
      }));
      
      // If alerts triggered, force re-render
      if (triggered.length > 0) {
        setStockData(prev => ({ ...prev }));
      }
    }
  };

  const { isConnected: wsConnected, lastUpdate } = useWebSocket(
    stocks.length > 0 ? stocks : null,
    handleWebSocketUpdate,
    stocks.length > 0
  );

  // Fallback polling: Refresh stock quotes every 60 seconds if WebSocket is not connected
  useEffect(() => {
    if (stocks.length === 0 || wsConnected) return; // Skip polling if WebSocket is active

    const updateAllStocks = async () => {
      for (const stock of stocks) {
        try {
          // Use useCache=false to force fresh data
          const data = await fetchStockQuote(stock, false);
          setStockData(prev => ({ ...prev, [stock]: data }));
        } catch (err) {
          console.error(`Error updating ${stock}:`, err);
        }
      }
    };

    // Initial update after mount
    updateAllStocks();
    const intervalId = setInterval(updateAllStocks, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [stocks, wsConnected]);

  const fetchStockData = async (stockSymbol) => {
    setLoading(prev => ({ ...prev, [stockSymbol]: true }));
    setError(prev => ({ ...prev, [stockSymbol]: null }));
    
    try {
      const data = await fetchStockQuote(stockSymbol);
      setStockData(prev => ({ ...prev, [stockSymbol]: data }));
      setError(prev => ({ ...prev, [stockSymbol]: null }));
      
      // Check for price alerts
      if (data && data.price) {
        const triggered = checkAlerts(stockSymbol, data.price);
        if (triggered.length > 0) {
          // Force re-render to show triggered alerts
          setStockData(prev => ({ ...prev }));
        }
      }
    } catch (err) {
      console.error(`Error fetching data for ${stockSymbol}:`, err);
      setError(prev => ({ ...prev, [stockSymbol]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [stockSymbol]: false }));
    }
  };

  const addStock = async () => {
    await addStockFromSymbol(symbol);
  };

  const removeStock = (stockSymbol) => {
    setStocks(stocks.filter(s => s !== stockSymbol));
    // Remove from stockData and loading states
    setStockData(prev => {
      const newData = { ...prev };
      delete newData[stockSymbol];
      return newData;
    });
    setLoading(prev => {
      const newLoading = { ...prev };
      delete newLoading[stockSymbol];
      return newLoading;
    });
    setError(prev => {
      const newError = { ...prev };
      delete newError[stockSymbol];
      return newError;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addStock();
    }
  };

  const handleStockClick = (stockSymbol) => {
    if (onStockSelect) {
      onStockSelect(stockSymbol);
    }
  };

  // Filter stocks for autocomplete
  const filteredSuggestions = COMMON_STOCKS.filter(
    stock => stock.toLowerCase().includes(searchTerm.toLowerCase()) && 
             !stocks.includes(stock)
  ).slice(0, 5);

  const handleSearchChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSearchTerm(value);
    setSymbol(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setSymbol(suggestion);
    setSearchTerm('');
    setShowSuggestions(false);
    // Auto-add the stock
    if (!stocks.includes(suggestion)) {
      addStockFromSymbol(suggestion);
    }
  };

  const addStockFromSymbol = async (stockSymbol) => {
    const upperSymbol = stockSymbol.toUpperCase().trim();
    if (upperSymbol && !stocks.includes(upperSymbol)) {
      setStocks([...stocks, upperSymbol]);
      setSymbol('');
      setSearchTerm('');
      setShowSuggestions(false);
      await fetchStockData(upperSymbol);
    }
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return '--';
    const sign = change >= 0 ? '+' : '';
    const colorClass = change >= 0 ? 'positive' : 'negative';
    return (
      <span className={colorClass}>
        {sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h2>Watchlist</h2>
        {stocks.length > 0 && (
          <span className={`connection-status ${wsConnected ? 'connected' : 'polling'}`}>
            {wsConnected ? '⚡ Live' : '🔄 Polling'}
          </span>
        )}
      </div>
      <div className="watchlist-input-container">
        <div className="watchlist-input-wrapper">
          <input
            type="text"
            placeholder="Search or enter symbol (e.g., AAPL)"
            value={symbol}
            onChange={handleSearchChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(searchTerm.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <button onClick={addStock}>Add</button>
        </div>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul className="suggestions-list">
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="watchlist-items">
        {stocks.length === 0 ? (
          <li className="watchlist-empty">No stocks in watchlist</li>
        ) : (
          stocks.map((stock) => {
            const data = stockData[stock];
            const isLoading = loading[stock];
            const hasError = error[stock];
            
            return (
              <li 
                key={stock} 
                className={`watchlist-item ${data ? 'clickable' : ''}`}
                onClick={() => data && handleStockClick(stock)}
              >
                <div className="watchlist-item-info">
                  <span className="stock-symbol">{stock}</span>
                  {isLoading && <span className="loading-text">Loading...</span>}
                  {hasError && <span className="error-text">{hasError}</span>}
                  {data && !isLoading && (
                    <div className="stock-quote">
                      <span className="stock-price">{formatPrice(data.price)}</span>
                      <span className="stock-change">{formatChange(data.change, data.changePercent)}</span>
                      {(() => {
                        const alerts = getAlertsForSymbol(stock);
                        const hasActiveAlert = alerts.some(a => !a.triggered && !a.cleared);
                        const hasTriggeredAlert = alerts.some(a => a.triggered && !a.cleared);
                        return (
                          <>
                            {hasActiveAlert && (
                              <span 
                                className="alert-badge active" 
                                title="Price alert set"
                                aria-label={`Price alert active for ${stock}`}
                                role="status"
                              >
                                <span aria-hidden="true">🔔</span>
                              </span>
                            )}
                            {hasTriggeredAlert && (
                              <span 
                                className="alert-badge triggered" 
                                title="Price alert triggered!"
                                aria-label={`Price alert triggered for ${stock}!`}
                                role="alert"
                              >
                                <span aria-hidden="true">🚨</span>
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div className="watchlist-item-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSymbolForAlert(selectedSymbolForAlert === stock ? null : stock);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        setSelectedSymbolForAlert(selectedSymbolForAlert === stock ? null : stock);
                      }
                    }}
                    className={`alert-btn ${selectedSymbolForAlert === stock ? 'active' : ''}`}
                    aria-label={`Set price alert for ${stock}`}
                    title="Set price alert"
                    tabIndex={0}
                  >
                    <span aria-hidden="true">🔔</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStock(stock);
                    }}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
      
      {selectedSymbolForAlert && stockData[selectedSymbolForAlert] && (
        <AlertManager 
          symbol={selectedSymbolForAlert}
          currentPrice={stockData[selectedSymbolForAlert]?.price}
        />
      )}
    </div>
  );
}

export default Watchlist;
