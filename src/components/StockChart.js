import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  ButtonGroup,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHistoricalData } from '../utils/api';
import { getSeriesLastN, sanitizeSeries } from '../utils/series';

function StockChart({ symbol }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeInterval, setTimeInterval] = useState('daily');
  const [chartType, setChartType] = useState('line');

  const loadChartData = useCallback(async (stockSymbol) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchHistoricalData(stockSymbol, timeInterval);
      
      // Log first item to verify shape
      console.log('[History]', stockSymbol, data?.data?.[0]);
      
      if (!data || !data.data || data.data.length === 0) {
        setChartData(null);
        setError('No chart data available');
        return;
      }
      
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err.message || 'Failed to load chart data');
      setChartData(null);
    } finally {
      setLoading(false);
    }
  }, [timeInterval]);

  useEffect(() => {
    if (symbol) {
      loadChartData(symbol);
    } else {
      setChartData(null);
      setError(null);
    }
  }, [symbol, loadChartData]);

  

  const formatChartData = () => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return [];
    }

    // Sanitize and get last 30 items
    const sanitized = sanitizeSeries(chartData.data);
    const recentData = getSeriesLastN(sanitized, 30).map(point => {
      if (!point || !point.date) return null;
      
      return {
        date: point.date,
        open: Number.isFinite(point.open) ? Number(point.open) : null,
        high: Number.isFinite(point.high) ? Number(point.high) : null,
        low: Number.isFinite(point.low) ? Number(point.low) : null,
        close: Number.isFinite(point.close) ? Number(point.close) : null,
        volume: Number.isFinite(point.volume) ? Number(point.volume) : 0,
        dateShort: new Date(point.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      };
    }).filter(p => p !== null && p.close !== null);

    return recentData;
  };

  const renderChart = () => {
    const formattedData = formatChartData();

    if (formattedData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No chart data available
          </Typography>
        </Box>
      );
    }

    const chartProps = {
      data: formattedData,
      margin: { top: 5, right: 20, left: 10, bottom: 5 }
    };

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
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
              formatter={(value) => {
                if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
                return [`$${Number(value).toFixed(2)}`, 'Close'];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#2196F3"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              name="Close Price"
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke="#4CAF50"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
              name="High"
            />
            <Line
              type="monotone"
              dataKey="low"
              stroke="#F44336"
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
        <ResponsiveContainer width="100%" height={350}>
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
              formatter={(value) => {
                if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
                return [`$${Number(value).toFixed(2)}`, 'Close'];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Bar dataKey="close" fill="#2196F3" name="Close Price" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" component="h2">
              Stock Chart
            </Typography>
            {symbol && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    onClick={() => setTimeInterval('daily')}
                    variant={timeInterval === 'daily' ? 'contained' : 'outlined'}
                  >
                    Daily
                  </Button>
                  <Button
                    onClick={() => setTimeInterval('weekly')}
                    variant={timeInterval === 'weekly' ? 'contained' : 'outlined'}
                  >
                    Weekly
                  </Button>
                  <Button
                    onClick={() => setTimeInterval('monthly')}
                    variant={timeInterval === 'monthly' ? 'contained' : 'outlined'}
                  >
                    Monthly
                  </Button>
                </ButtonGroup>
                <ButtonGroup size="small" variant="outlined">
                  <Button
                    onClick={() => setChartType('line')}
                    variant={chartType === 'line' ? 'contained' : 'outlined'}
                    startIcon={<ChartIcon />}
                  >
                    Line
                  </Button>
                  <Button
                    onClick={() => setChartType('bar')}
                    variant={chartType === 'bar' ? 'contained' : 'outlined'}
                    startIcon={<BarChartIcon />}
                  >
                    Bar
                  </Button>
                </ButtonGroup>
              </Box>
            )}
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          '& .MuiCardHeader-title': {
            color: 'white',
            fontWeight: 700,
          },
        }}
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : chartData && chartData.data ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              <strong>{chartData.symbol}</strong> - {timeInterval} data ({chartData.data.length} data points)
            </Typography>
            {renderChart()}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {symbol ? 'No chart data available for this symbol' : 'Select a stock from watchlist to view chart'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default StockChart;
