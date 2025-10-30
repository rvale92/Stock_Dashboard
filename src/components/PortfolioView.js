import React, { useState, useEffect } from 'react';
import { 
  getPortfolioById, 
  addSymbolToPortfolio,
  removeSymbolFromPortfolio 
} from '../utils/portfolios';
import { fetchMultipleQuotes } from '../utils/api';
import { calculatePortfolioPerformance } from '../utils/portfolios';
import { checkAlerts, getAlertsForSymbol } from '../utils/alerts';
import AlertManager from './AlertManager';

function PortfolioView({ portfolioId, onStockSelect, onBack }) {
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState(null);
  const [selectedSymbolForAlert, setSelectedSymbolForAlert] = useState(null);

  useEffect(() => {
    if (portfolioId) {
      loadPortfolio();
    } else {
      setPortfolio(null);
      setPortfolioData([]);
      setPerformance(null);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolio && portfolio.symbols.length > 0) {
      loadPortfolioData();
      // Refresh data every 30 seconds
      const interval = setInterval(() => {
        loadPortfolioData();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setPortfolioData([]);
      setPerformance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio]);

  const loadPortfolio = () => {
    const loaded = getPortfolioById(portfolioId);
    setPortfolio(loaded);
  };

  const loadPortfolioData = async () => {
    if (!portfolio || portfolio.symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch quotes for all symbols in portfolio
      const quotes = await fetchMultipleQuotes(portfolio.symbols);
      
      // Filter out errors and map to portfolio data structure
      const validQuotes = quotes
        .filter(q => q && !q.error && q.price)
        .map(quote => {
          // Check for alerts when loading data
          if (quote.price) {
            const triggered = checkAlerts(quote.symbol, quote.price);
            if (triggered.length > 0) {
              // Force re-render if alerts triggered
              setTimeout(() => loadAlerts(), 100);
            }
          }
          return {
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change || 0,
            changePercent: quote.changePercent || 0,
            volume: quote.volume
          };
        });

      setPortfolioData(validQuotes);
      setPerformance(calculatePortfolioPerformance(validQuotes));
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadAlerts = () => {
    // This triggers a re-check of alerts
    if (portfolio && portfolio.symbols.length > 0) {
      portfolioData.forEach(stock => {
        if (stock.price) {
          checkAlerts(stock.symbol, stock.price);
        }
      });
    }
  };

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || !portfolio) return;

    const upperSymbol = newSymbol.toUpperCase().trim();
    
    // Check if symbol already exists
    if (portfolio.symbols.includes(upperSymbol)) {
      setError(`Symbol ${upperSymbol} already in portfolio`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      // Verify symbol exists by fetching quote
      const quotes = await fetchMultipleQuotes([upperSymbol]);
      if (quotes.length === 0 || quotes[0].error) {
        setError(`Invalid symbol: ${upperSymbol}`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      addSymbolToPortfolio(portfolioId, upperSymbol);
      setNewSymbol('');
      loadPortfolio();
    } catch (err) {
      console.error('Error adding symbol:', err);
      setError('Failed to add symbol');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveSymbol = (symbol) => {
    if (portfolio) {
      removeSymbolFromPortfolio(portfolioId, symbol);
      loadPortfolio();
    }
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return '--';
    const sign = change >= 0 ? '+' : '';
    return (
      <span className={change >= 0 ? 'positive' : 'negative'}>
        {sign}{change.toFixed(2)} ({sign}{changePercent.toFixed(2)}%)
      </span>
    );
  };

  if (!portfolioId || !portfolio) {
    return (
      <div className="portfolio-view">
        <div className="empty-portfolio">
          Select or create a portfolio to view details
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-view">
      <div className="portfolio-header">
        <div>
          <h2>{portfolio.name}</h2>
          <div className="portfolio-meta">
            {portfolio.symbols.length} {portfolio.symbols.length === 1 ? 'stock' : 'stocks'}
          </div>
        </div>
        {onBack && (
          <button className="back-to-watchlist-btn" onClick={onBack} title="Back to Watchlist">
            ← Watchlist
          </button>
        )}
      </div>

      {performance && (
        <div className="portfolio-performance">
          <div className="performance-metric">
            <label>Total Value</label>
            <span className="metric-value">{formatPrice(performance.totalValue)}</span>
          </div>
          <div className="performance-metric">
            <label>Total Change</label>
            <span className="metric-value">
              {formatChange(performance.totalChange, performance.totalChangePercent)}
            </span>
          </div>
          <div className="performance-metric">
            <label>Average Change</label>
            <span className="metric-value">
              {performance.averageChange ? `${performance.averageChange >= 0 ? '+' : ''}${performance.averageChange.toFixed(2)}` : '--'}
            </span>
          </div>
        </div>
      )}

      <div className="portfolio-symbols">
        <div className="add-symbol-section">
          <input
            type="text"
            placeholder="Add stock symbol..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
          />
          <button onClick={handleAddSymbol}>Add</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="portfolio-stocks-list">
          {portfolio.symbols.length === 0 ? (
            <div className="empty-stocks">No stocks in portfolio. Add some to get started!</div>
          ) : loading && portfolioData.length === 0 ? (
            <div className="loading-stocks">Loading portfolio data...</div>
          ) : (
            portfolio.symbols.map((symbol) => {
              const stockData = portfolioData.find(s => s.symbol === symbol);
              return (
                <div 
                  key={symbol} 
                  className={`portfolio-stock-item ${stockData ? 'clickable' : ''}`}
                  onClick={() => stockData && onStockSelect && onStockSelect(symbol)}
                >
                  <div className="stock-info">
                    <span className="stock-symbol">{symbol}</span>
                    {stockData ? (
                      <div className="stock-quote">
                        <span className="stock-price">{formatPrice(stockData.price)}</span>
                        <span className="stock-change">
                          {formatChange(stockData.change, stockData.changePercent)}
                        </span>
                        {(() => {
                          const alerts = getAlertsForSymbol(symbol);
                          const hasActiveAlert = alerts.some(a => !a.triggered && !a.cleared);
                          const hasTriggeredAlert = alerts.some(a => a.triggered && !a.cleared);
                          return (
                            <>
                              {hasActiveAlert && (
                                <span 
                                  className="alert-badge active" 
                                  title="Price alert set"
                                  aria-label={`Price alert active for ${symbol}`}
                                  role="status"
                                >
                                  <span aria-hidden="true">🔔</span>
                                </span>
                              )}
                              {hasTriggeredAlert && (
                                <span 
                                  className="alert-badge triggered" 
                                  title="Price alert triggered!"
                                  aria-label={`Price alert triggered for ${symbol}!`}
                                  role="alert"
                                >
                                  <span aria-hidden="true">🚨</span>
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="stock-loading">Loading...</span>
                    )}
                  </div>
                  <div className="portfolio-stock-actions">
                    <button
                      className="alert-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSymbolForAlert(selectedSymbolForAlert === symbol ? null : symbol);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setSelectedSymbolForAlert(selectedSymbolForAlert === symbol ? null : symbol);
                        }
                      }}
                      aria-label={`Set price alert for ${symbol}`}
                      title="Set price alert"
                      tabIndex={0}
                    >
                      <span aria-hidden="true">🔔</span>
                    </button>
                    <button
                      className="remove-symbol-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSymbol(symbol);
                      }}
                      title="Remove from portfolio"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {selectedSymbolForAlert && (
          <AlertManager 
            symbol={selectedSymbolForAlert}
            currentPrice={portfolioData.find(s => s.symbol === selectedSymbolForAlert)?.price}
          />
        )}
      </div>
    </div>
  );
}

export default PortfolioView;

