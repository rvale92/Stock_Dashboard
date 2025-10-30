import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHistoricalData } from '../utils/api';

function StockChart({ symbol }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interval, setInterval] = useState('daily');
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  useEffect(() => {
    if (symbol) {
      loadChartData(symbol, interval);
    } else {
      setChartData(null);
    }
  }, [symbol, interval]);

  const loadChartData = async (stockSymbol, timeInterval) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchHistoricalData(stockSymbol, timeInterval);
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err.message || 'Failed to load chart data');
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Format data for Recharts (limit to last 30 data points for readability)
  const formatChartData = () => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return [];
    }
    
    // Get last 30 data points and format dates
    const recentData = chartData.data.slice(-30).map(point => ({
      ...point,
      dateShort: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
    
    return recentData;
  };

  const renderChart = () => {
    const formattedData = formatChartData();
    
    if (formattedData.length === 0) {
      return <div className="no-chart-data">No chart data available</div>;
    }

    const chartProps = {
      data: formattedData,
      margin: { top: 5, right: 20, left: 10, bottom: 5 }
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateShort" 
              angle={-45} 
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Close']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#007bff" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Close Price"
            />
            <Line 
              type="monotone" 
              dataKey="high" 
              stroke="#28a745" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              name="High"
            />
            <Line 
              type="monotone" 
              dataKey="low" 
              stroke="#dc3545" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              name="Low"
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateShort" 
              angle={-45} 
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Close']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="close" fill="#007bff" name="Close Price" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <h2>Stock Chart</h2>
        {symbol && (
          <div className="chart-controls">
            <div className="interval-selector">
              <button 
                className={interval === 'daily' ? 'active' : ''}
                onClick={() => setInterval('daily')}
              >
                Daily
              </button>
              <button 
                className={interval === 'weekly' ? 'active' : ''}
                onClick={() => setInterval('weekly')}
              >
                Weekly
              </button>
              <button 
                className={interval === 'monthly' ? 'active' : ''}
                onClick={() => setInterval('monthly')}
              >
                Monthly
              </button>
            </div>
            <div className="chart-type-selector">
              <button 
                className={chartType === 'line' ? 'active' : ''}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
              <button 
                className={chartType === 'bar' ? 'active' : ''}
                onClick={() => setChartType('bar')}
              >
                Bar
              </button>
            </div>
          </div>
        )}
      </div>
      {loading ? (
        <div className="loading">Loading chart data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : chartData && chartData.data ? (
        <div className="chart-container">
          <div className="chart-info">
            <strong>{chartData.symbol}</strong> - {interval} data ({chartData.data.length} data points)
          </div>
          {renderChart()}
        </div>
      ) : (
        <div className="no-data">
          {symbol ? 'No chart data available for this symbol' : 'Select a stock from watchlist to view chart'}
        </div>
      )}
    </div>
  );
}

export default StockChart;
