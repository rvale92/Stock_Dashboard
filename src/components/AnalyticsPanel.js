import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { fetchStockQuote, fetchCompanyProfile } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { checkAlerts } from '../utils/alerts';

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

  // WebSocket not available in Alpha Vantage demo mode - use polling only
  useWebSocket(symbol ? [symbol] : []);

  // Polling: Refresh quote data every 60 seconds
  useEffect(() => {
    if (!symbol) return;

    const updateQuote = async () => {
      try {
        const quoteData = await fetchStockQuote(symbol);
        if (quoteData && quoteData.price) {
          checkAlerts(symbol, quoteData.price);
        }
        setQuote(quoteData);
      } catch (err) {
        console.error(`Error updating quote for ${symbol}:`, err.message);
      }
    };

    updateQuote();
    const intervalId = setInterval(updateQuote, 60000);
    return () => clearInterval(intervalId);
  }, [symbol]);

  const loadAnalytics = async (stockSymbol) => {
    setLoading(true);
    setError(null);

    try {
      const [quoteData, profileData] = await Promise.all([
        fetchStockQuote(stockSymbol).catch(err => {
          console.error('Quote fetch failed:', err);
          return null;
        }),
        fetchCompanyProfile(stockSymbol).catch(err => {
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
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatCurrency = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return null;
    const isPositive = change >= 0;
    return (
      <Chip
        icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
        label={`${change >= 0 ? '+' : ''}${formatNumber(change)} (${change >= 0 ? '+' : ''}${formatNumber(changePercent)}%)`}
        color={isPositive ? 'success' : 'error'}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon />
            <Typography variant="h5" component="h2">
              Analytics Panel
            </Typography>
            {symbol && quote && (
              <Chip
                label="🔄 Polling"
                color="warning"
                size="small"
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
        ) : symbol ? (
          <Box>
            {quote && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatCurrency(quote.price)}
                    </Typography>
                    {formatChange(quote.change, quote.changePercent)}
                    {quote.volume && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Volume: {new Intl.NumberFormat('en-US').format(quote.volume)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        High / Low
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(quote.high)} / {formatCurrency(quote.low)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Open: {formatCurrency(quote.open)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {profile && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Market Cap
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatCurrency(profile.marketCap)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      P/E Ratio
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatNumber(profile.peRatio) || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Sector
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {profile.sector || 'N/A'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      52 Week High
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(profile.week52High)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      52 Week Low
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(profile.week52Low)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Dividend Yield
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatNumber(profile.dividendYield) || 'N/A'}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {!quote && !profile && !loading && (
              <Alert severity="info">
                Unable to load analytics data. Please try again later.
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select a stock from watchlist to view analytics
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalyticsPanel;
