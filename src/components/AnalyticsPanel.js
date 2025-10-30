import React, { useState, useEffect } from 'react';
import { fetchStockQuote, fetchCompanyProfile } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';

function AnalyticsPanel({ symbol }) {
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadAnalytics(symbol);
    } else {
      setQuote(null);
      setProfile(null);
    }
  }, [symbol]);

  // WebSocket connection for real-time updates
  const handleWebSocketUpdate = (data) => {
    if (data && data.symbol === symbol && data.price) {
      // Update quote with real-time price
      setQuote(prev => ({
        ...prev,
        price: data.price,
        timestamp: data.timestamp || new Date().toISOString()
      }));
    }
  };

  const { isConnected: wsConnected } = useWebSocket(
    symbol,
    handleWebSocketUpdate,
    !!symbol
  );

  // Fallback polling: Refresh quote data every 60 seconds if WebSocket is not connected
  useEffect(() => {
    if (!symbol || wsConnected) return; // Skip polling if WebSocket is active

    const updateQuote = async () => {
      try {
        const quoteData = await fetchStockQuote(symbol, false);
        setQuote(prev => {
          if (prev) return quoteData;
          return quoteData;
        });
      } catch (err) {
        console.error(`Error updating quote for ${symbol}:`, err);
      }
    };

    updateQuote();
    const intervalId = setInterval(updateQuote, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [symbol, wsConnected]);

  const loadAnalytics = async (stockSymbol) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both quote and profile in parallel
      // Use cache for initial load, but allow fresh data on manual refresh
      const [quoteData, profileData] = await Promise.all([
        fetchStockQuote(stockSymbol, true).catch(err => {
          console.error('Quote fetch failed:', err);
          return null;
        }),
        fetchCompanyProfile(stockSymbol, true).catch(err => {
          console.error('Profile fetch failed:', err);
          return null;
        })
      ]);
      
      setQuote(quoteData);
      setProfile(profileData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '--';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  const formatVolume = (volume) => {
    if (!volume) return '--';
    return volume.toLocaleString();
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

  if (loading) {
    return (
      <div className="analytics-panel">
        <h2>Analytics</h2>
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error && !quote && !profile) {
    return (
      <div className="analytics-panel">
        <h2>Analytics</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-panel">
      <h2>Analytics {symbol && `- ${symbol}`}</h2>
      {!symbol ? (
        <div className="no-data">Select a stock to view analytics</div>
      ) : (
        <div className="analytics-content">
          {quote && (
            <>
              <div className="metric">
                <label>Price</label>
                <span className="value-large">${quote.price?.toFixed(2) || '--'}</span>
              </div>
              <div className="metric">
                <label>Change</label>
                <span>{formatChange(quote.change, quote.changePercent)}</span>
              </div>
              <div className="metric">
                <label>Volume</label>
                <span>{formatVolume(quote.volume)}</span>
              </div>
              <div className="metric">
                <label>High (Day)</label>
                <span>${quote.high?.toFixed(2) || '--'}</span>
              </div>
              <div className="metric">
                <label>Low (Day)</label>
                <span>${quote.low?.toFixed(2) || '--'}</span>
              </div>
              <div className="metric">
                <label>Open</label>
                <span>${quote.open?.toFixed(2) || '--'}</span>
              </div>
              <div className="metric">
                <label>Previous Close</label>
                <span>${quote.previousClose?.toFixed(2) || '--'}</span>
              </div>
            </>
          )}
          {profile && (
            <>
              <div className="metric">
                <label>Market Cap</label>
                <span>{formatNumber(profile.marketCap)}</span>
              </div>
              <div className="metric">
                <label>P/E Ratio</label>
                <span>{profile.peRatio || '--'}</span>
              </div>
              <div className="metric">
                <label>Dividend Yield</label>
                <span>{profile.dividendYield ? `${(profile.dividendYield * 100).toFixed(2)}%` : '--'}</span>
              </div>
              <div className="metric">
                <label>Beta</label>
                <span>{profile.beta || '--'}</span>
              </div>
              <div className="metric">
                <label>52 Week High</label>
                <span>${profile['52WeekHigh'] || '--'}</span>
              </div>
              <div className="metric">
                <label>52 Week Low</label>
                <span>${profile['52WeekLow'] || '--'}</span>
              </div>
              <div className="metric full-width">
                <label>Sector</label>
                <span>{profile.sector || '--'}</span>
              </div>
              <div className="metric full-width">
                <label>Industry</label>
                <span>{profile.industry || '--'}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyticsPanel;
