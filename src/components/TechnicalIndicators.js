import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  ShowChart as ChartIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { LineChart, Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchHistoricalData } from '../utils/api';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/indicators';

function TechnicalIndicators({ symbol }) {
  const [historicalData, setHistoricalData] = useState([]);
  const [indicatorData, setIndicatorData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState('SMA');

  useEffect(() => {
    if (symbol) {
      loadHistoricalData(symbol);
    } else {
      setHistoricalData([]);
      setIndicatorData({});
    }
  }, [symbol]);

  useEffect(() => {
    if (historicalData.length > 0) {
      calculateAllIndicators(historicalData);
    }
  }, [historicalData]);

  const loadHistoricalData = async (stockSymbol) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistoricalData(stockSymbol, 'daily');
      const sortedData = data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setHistoricalData(sortedData);
    } catch (err) {
      console.error('Error fetching historical data for indicators:', err);
      setError(err.message || 'Failed to load historical data for indicators');
      setHistoricalData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllIndicators = (data) => {
    const closes = data.map(d => d.close);
    const dates = data.map(d => d.date);

    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes, 12, 26, 9);
    const bollingerBands = calculateBollingerBands(closes, 20);

    const combinedData = dates.map((date, index) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      close: closes[index],
      sma20: sma20[index - (20 - 1)] || null,
      sma50: sma50[index - (50 - 1)] || null,
      ema20: ema20[index - (20 - 1)] || null,
      ema50: ema50[index - (50 - 1)] || null,
      rsi: rsi[index - (14 - 1)] || null,
      macd: macd?.macdLine[index - (26 - 1)] || null,
      signal: macd?.signalLine[index - (26 - 1)] || null,
      histogram: macd?.histogram[index - (26 - 1)] || null,
      upperBand: bollingerBands?.upper[index - (20 - 1)] || null,
      middleBand: bollingerBands?.middle[index - (20 - 1)] || null,
      lowerBand: bollingerBands?.lower[index - (20 - 1)] || null,
    }));

    setIndicatorData({
      sma: combinedData.filter(d => d.sma20 !== null),
      ema: combinedData.filter(d => d.ema20 !== null),
      rsi: combinedData.filter(d => d.rsi !== null),
      macd: combinedData.filter(d => d.macd !== null),
      bollingerBands: combinedData.filter(d => d.upperBand !== null),
    });
  };

  const renderSMACart = () => {
    const data = indicatorData.sma?.slice(-30) || [];
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip formatter={(value) => `$${value?.toFixed(2) || value}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={1} dot={false} name="Close Price" />
          <Line type="monotone" dataKey="sma20" stroke="#82ca9d" strokeWidth={2} dot={false} name="SMA (20)" />
          <Line type="monotone" dataKey="sma50" stroke="#ffc658" strokeWidth={2} dot={false} name="SMA (50)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderEMACart = () => {
    const data = indicatorData.ema?.slice(-30) || [];
    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip formatter={(value) => `$${value?.toFixed(2) || value}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={1} dot={false} name="Close Price" />
          <Line type="monotone" dataKey="ema20" stroke="#82ca9d" strokeWidth={2} dot={false} name="EMA (20)" />
          <Line type="monotone" dataKey="ema50" stroke="#ffc658" strokeWidth={2} dot={false} name="EMA (50)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderRSIChart = () => {
    const rawData = indicatorData.rsi?.slice(-30) || [];
    const data = rawData.map(item => ({ ...item, overbought: 70, oversold: 30 }));

    return (
      <ResponsiveContainer width="100%" height={350}>
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
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis yAxisId="left" domain={['auto', 'auto']} />
          <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} />
          <Tooltip formatter={(value) => `${value?.toFixed(2) || value}`} />
          <Legend />
          <Bar yAxisId="right" dataKey="histogram" fill="#4CAF50" name="Histogram" />
          <Line yAxisId="left" type="monotone" dataKey="macd" stroke="#007bff" strokeWidth={2} dot={false} name="MACD Line" />
          <Line yAxisId="left" type="monotone" dataKey="signal" stroke="#ffc107" strokeWidth={2} dot={false} name="Signal Line" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderBollingerBandsChart = () => {
    const data = indicatorData.bollingerBands?.slice(-30) || [];

    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} interval="preserveStartEnd" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip formatter={(value) => `$${value?.toFixed(2) || value}`} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={1} dot={false} name="Close Price" />
          <Line type="monotone" dataKey="upperBand" stroke="#dc3545" strokeWidth={2} dot={false} name="Upper Band" />
          <Line type="monotone" dataKey="middleBand" stroke="#82ca9d" strokeWidth={2} dot={false} name="Middle Band (SMA)" />
          <Line type="monotone" dataKey="lowerBand" stroke="#007bff" strokeWidth={2} dot={false} name="Lower Band" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const getIndicatorInfo = () => {
    const info = {
      SMA: {
        name: 'Simple Moving Average (SMA)',
        description: 'The simple moving average (SMA) is the unweighted mean of the previous n data points. It is used to identify trends and potential support/resistance levels.',
        params: 'Periods: 20, 50'
      },
      EMA: {
        name: 'Exponential Moving Average (EMA)',
        description: 'The exponential moving average (EMA) is a type of moving average that places a greater weight and significance on the most recent data points. It reacts more significantly to recent price changes than the SMA.',
        params: 'Periods: 20, 50'
      },
      RSI: {
        name: 'Relative Strength Index (RSI)',
        description: 'The Relative Strength Index (RSI) is a momentum indicator used in technical analysis that measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions in the price of a stock or other asset. Readings above 70 typically indicate overbought conditions, while readings below 30 indicate oversold conditions.',
        params: 'Period: 14'
      },
      MACD: {
        name: 'Moving Average Convergence Divergence (MACD)',
        description: 'MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a security price. The MACD line is the 12-period EMA minus the 26-period EMA. The signal line is a 9-period EMA of the MACD line.',
        params: 'Fast Period: 12, Slow Period: 26, Signal Period: 9'
      },
      BollingerBands: {
        name: 'Bollinger Bands',
        description: 'Bollinger Bands are a technical analysis tool defined by a set of three curves drawn in relation to a security price. The middle band is typically a 20-period simple moving average. The upper and lower bands are usually two standard deviations above and below the SMA.',
        params: 'Period: 20, Standard Deviations: 2'
      }
    };
    return info[selectedIndicator] || { name: '', description: '', params: '' };
  };

  const currentIndicatorInfo = getIndicatorInfo();

  if (loading) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon />
              <Typography variant="h5">Technical Indicators</Typography>
            </Box>
          }
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
          }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon />
              <Typography variant="h5">Technical Indicators</Typography>
            </Box>
          }
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
          }}
        />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!symbol) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon />
              <Typography variant="h5">Technical Indicators</Typography>
            </Box>
          }
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
          }}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select a stock to view technical indicators
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (historicalData.length === 0) {
    return (
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon />
              <Typography variant="h5">Technical Indicators - {symbol}</Typography>
            </Box>
          }
          sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
          }}
        />
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No historical data available for indicators
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              <Typography variant="h5">Technical Indicators - {symbol}</Typography>
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Indicator</InputLabel>
              <Select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                label="Indicator"
              >
                <MenuItem value="SMA">SMA</MenuItem>
                <MenuItem value="EMA">EMA</MenuItem>
                <MenuItem value="RSI">RSI</MenuItem>
                <MenuItem value="MACD">MACD</MenuItem>
                <MenuItem value="BollingerBands">Bollinger Bands</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
        }}
      />
      <CardContent>
        <Box sx={{ mb: 2 }}>
          {selectedIndicator === 'SMA' && renderSMACart()}
          {selectedIndicator === 'EMA' && renderEMACart()}
          {selectedIndicator === 'RSI' && renderRSIChart()}
          {selectedIndicator === 'MACD' && renderMACDChart()}
          {selectedIndicator === 'BollingerBands' && renderBollingerBandsChart()}
        </Box>
        {currentIndicatorInfo.name && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {currentIndicatorInfo.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {currentIndicatorInfo.description}
            </Typography>
            {currentIndicatorInfo.params && (
              <Typography variant="body2" color="text.secondary">
                <strong>Parameters:</strong> {currentIndicatorInfo.params}
              </Typography>
            )}
          </Paper>
        )}
      </CardContent>
    </Card>
  );
}

export default TechnicalIndicators;
