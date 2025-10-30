import React, { useState, useEffect } from 'react';
import { LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHistoricalData } from '../utils/api';
import { formatIndicatorData, calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/indicators';

function TechnicalIndicators({ symbol }) {
  const [historicalData, setHistoricalData] = useState(null);
  const [indicatorData, setIndicatorData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState('sma');
  const [indicatorPeriod, setIndicatorPeriod] = useState(20);

  useEffect(() => {
    if (symbol) {
      loadData(symbol);
    } else {
      setHistoricalData(null);
      setIndicatorData({});
    }
  }, [symbol]);

  useEffect(() => {
    if (historicalData) {
      calculateIndicators();
    }
  }, [historicalData, selectedIndicator, indicatorPeriod]);

  const loadData = async (stockSymbol) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchHistoricalData(stockSymbol, 'daily');
      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err.message || 'Failed to load historical data');
      setHistoricalData(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateIndicators = () => {
    if (!historicalData || !historicalData.data || historicalData.data.length === 0) {
      return;
    }

    const closes = historicalData.data.map(d => d.close);
    const dates = historicalData.data.map(d => d.date);

    const indicators = {};

    // Calculate SMA
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    indicators.sma = dates.slice(19).map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: closes[i + 19],
      sma20: sma20[i],
      sma50: i < sma50.length ? sma50[i] : null
    }));

    // Calculate EMA
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    indicators.ema = dates.slice(19).map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: closes[i + 19],
      ema20: ema20[i],
      ema50: i < ema50.length ? ema50[i] : null
    }));

    // Calculate RSI
    const rsi = calculateRSI(closes, 14);
    indicators.rsi = dates.slice(14).map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rsi: rsi[i]
    }));

    // Calculate MACD
    const macdData = calculateMACD(closes, 12, 26, 9);
    const macdStart = macdData.macd.length - macdData.signal.length;
    indicators.macd = dates.slice(macdStart).map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      macd: macdData.macd[macdStart + i],
      signal: macdData.signal[i],
      histogram: macdData.histogram[i]
    }));

    // Calculate Bollinger Bands
    const bbData = calculateBollingerBands(closes, 20, 2);
    indicators.bollinger = dates.slice(19).map((date, i) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: closes[i + 19],
      upper: bbData.upper[i],
      middle: bbData.middle[i],
      lower: bbData.lower[i]
    }));

    setIndicatorData(indicators);
  };

  const renderSMAChart = () => {
    const data = indicatorData.sma?.slice(-30) || [];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#007bff" strokeWidth={2} name="Close Price" />
          <Line type="monotone" dataKey="sma20" stroke="#28a745" strokeWidth={1.5} name="SMA 20" />
          <Line type="monotone" dataKey="sma50" stroke="#ffc107" strokeWidth={1.5} name="SMA 50" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderEMAChart = () => {
    const data = indicatorData.ema?.slice(-30) || [];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#007bff" strokeWidth={2} name="Close Price" />
          <Line type="monotone" dataKey="ema20" stroke="#28a745" strokeWidth={1.5} name="EMA 20" />
          <Line type="monotone" dataKey="ema50" stroke="#ffc107" strokeWidth={1.5} name="EMA 50" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderRSIChart = () => {
    const rawData = indicatorData.rsi?.slice(-30) || [];
    // Add reference lines for RSI
    const data = rawData.map(item => ({ ...item, overbought: 70, oversold: 30 }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value?.toFixed(2) || value}`} />
          <Legend />
          <Line type="monotone" dataKey="rsi" stroke="#9c27b0" strokeWidth={2} name="RSI (14)" />
          <Line type="monotone" dataKey="overbought" stroke="#dc3545" strokeWidth={1} strokeDasharray="3 3" name="Overbought (70)" />
          <Line type="monotone" dataKey="oversold" stroke="#28a745" strokeWidth={1} strokeDasharray="3 3" name="Oversold (30)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderMACDChart = () => {
    const data = indicatorData.macd?.slice(-30) || [];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="right" dataKey="histogram" fill="#8884d8" name="Histogram" />
          <Line yAxisId="left" type="monotone" dataKey="macd" stroke="#007bff" strokeWidth={2} name="MACD" />
          <Line yAxisId="left" type="monotone" dataKey="signal" stroke="#ffc107" strokeWidth={2} name="Signal" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderBollingerChart = () => {
    const data = indicatorData.bollinger?.slice(-30) || [];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#007bff" strokeWidth={2} name="Close Price" />
          <Line type="monotone" dataKey="upper" stroke="#dc3545" strokeWidth={1} strokeDasharray="3 3" name="Upper Band" />
          <Line type="monotone" dataKey="middle" stroke="#6c757d" strokeWidth={1} name="Middle (SMA 20)" />
          <Line type="monotone" dataKey="lower" stroke="#28a745" strokeWidth={1} strokeDasharray="3 3" name="Lower Band" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (selectedIndicator) {
      case 'sma':
        return renderSMAChart();
      case 'ema':
        return renderEMAChart();
      case 'rsi':
        return renderRSIChart();
      case 'macd':
        return renderMACDChart();
      case 'bollinger':
        return renderBollingerChart();
      default:
        return <div className="no-data">Select an indicator</div>;
    }
  };

  if (loading) {
    return (
      <div className="technical-indicators">
        <h2>Technical Indicators</h2>
        <div className="loading">Loading indicator data...</div>
      </div>
    );
  }

  if (error && !historicalData) {
    return (
      <div className="technical-indicators">
        <h2>Technical Indicators</h2>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="technical-indicators">
      <div className="indicators-header">
        <h2>Technical Indicators {symbol && `- ${symbol}`}</h2>
        {symbol && (
          <div className="indicator-selector">
            <select 
              value={selectedIndicator} 
              onChange={(e) => setSelectedIndicator(e.target.value)}
              className="indicator-dropdown"
            >
              <option value="sma">SMA (Simple Moving Average)</option>
              <option value="ema">EMA (Exponential Moving Average)</option>
              <option value="rsi">RSI (Relative Strength Index)</option>
              <option value="macd">MACD</option>
              <option value="bollinger">Bollinger Bands</option>
            </select>
          </div>
        )}
      </div>
      {!symbol ? (
        <div className="no-data">Select a stock to view technical indicators</div>
      ) : !historicalData ? (
        <div className="no-data">Loading indicator data...</div>
      ) : (
        <div className="indicators-container">
          {renderChart()}
          <div className="indicator-info">
            <strong>{selectedIndicator.toUpperCase()}</strong>
            {selectedIndicator === 'sma' && <p>Simple Moving Average shows average price over a period.</p>}
            {selectedIndicator === 'ema' && <p>Exponential Moving Average gives more weight to recent prices.</p>}
            {selectedIndicator === 'rsi' && <p>RSI indicates overbought (&gt;70) or oversold (&lt;30) conditions.</p>}
            {selectedIndicator === 'macd' && <p>MACD shows momentum and trend direction.</p>}
            {selectedIndicator === 'bollinger' && <p>Bollinger Bands show price volatility and potential support/resistance.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TechnicalIndicators;

