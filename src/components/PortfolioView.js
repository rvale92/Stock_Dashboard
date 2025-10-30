import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Box,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Badge,
  Collapse
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
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
      const loaded = getPortfolioById(portfolioId);
      setPortfolio(loaded);
    } else {
      setPortfolio(null);
      setPortfolioData([]);
      setPerformance(null);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolio && portfolio.symbols.length > 0) {
      loadPortfolioData();
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

  

  const loadPortfolioData = async () => {
    if (!portfolio || portfolio.symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const quotes = await fetchMultipleQuotes(portfolio.symbols);
      
      const validQuotes = quotes
        .filter(q => q && !q.error && q.price)
        .map(quote => {
          if (quote.price) {
            const triggered = checkAlerts(quote.symbol, quote.price);
            if (triggered.length > 0) {
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
    
    if (portfolio.symbols.includes(upperSymbol)) {
      setError(`${upperSymbol} is already in this portfolio`);
      return;
    }

    try {
      addSymbolToPortfolio(portfolio.id, upperSymbol);
      setNewSymbol('');
      setError(null);
      const updated = getPortfolioById(portfolio.id);
      setPortfolio(updated);
      loadPortfolioData();
    } catch (err) {
      setError(err.message || 'Failed to add symbol');
    }
  };

  const handleRemoveSymbol = (symbol) => {
    if (!portfolio) return;
    removeSymbolFromPortfolio(portfolio.id, symbol);
    const updated = getPortfolioById(portfolio.id);
    setPortfolio(updated);
    loadPortfolioData();
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return null;
    const isPositive = change >= 0;
    return (
      <Chip
        icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
        label={`${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`}
        color={isPositive ? 'success' : 'error'}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  if (!portfolio) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select a portfolio to view its details.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WalletIcon />
              <Typography variant="h5">{portfolio.name}</Typography>
              <Chip label={`${portfolio.symbols.length} ${portfolio.symbols.length === 1 ? 'stock' : 'stocks'}`} size="small" />
            </Box>
            {onBack && (
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                variant="outlined"
                size="small"
              >
                Back to Watchlist
              </Button>
            )}
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
        }}
      />
      <CardContent>
        {performance && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {formatPrice(performance.totalValue)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Change
                </Typography>
                {formatChange(performance.totalChange, performance.averageChangePercent)}
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Change
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {performance.averageChangePercent >= 0 ? '+' : ''}{performance.averageChangePercent.toFixed(2)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add stock symbol (e.g., AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
            error={!!error}
            helperText={error}
            InputProps={{
              endAdornment: (
                <Button
                  variant="contained"
                  onClick={handleAddSymbol}
                  disabled={!newSymbol.trim()}
                  size="small"
                  sx={{
                    ml: 1,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <AddIcon />
                </Button>
              ),
            }}
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {portfolio.symbols.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              This portfolio is empty. Add stocks to get started!
            </Typography>
          </Paper>
        ) : (
          <Box>
            {portfolioData.map((stockData) => {
              const symbol = stockData.symbol;
              const alerts = getAlertsForSymbol(symbol);
              const hasActiveAlert = alerts.some(a => !a.triggered && !a.cleared);
              const hasTriggeredAlert = alerts.some(a => a.triggered && !a.cleared);

              return (
                <Paper
                  key={symbol}
                  elevation={0}
                  onClick={() => onStockSelect && onStockSelect(symbol)}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {symbol}
                        </Typography>
                        {hasActiveAlert && (
                          <Tooltip title="Price alert active">
                            <NotificationsIcon fontSize="small" color="warning" />
                          </Tooltip>
                        )}
                        {hasTriggeredAlert && (
                          <Tooltip title="Price alert triggered!">
                            <Badge color="error" variant="dot">
                              <NotificationsActiveIcon fontSize="small" color="error" />
                            </Badge>
                          </Tooltip>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {formatPrice(stockData.price)}
                        </Typography>
                        {formatChange(stockData.change, stockData.changePercent)}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Set price alert">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSymbolForAlert(selectedSymbolForAlert === symbol ? null : symbol);
                          }}
                          color={selectedSymbolForAlert === symbol ? 'primary' : 'default'}
                          aria-label={`Set price alert for ${symbol}`}
                        >
                          <NotificationsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from portfolio">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSymbol(symbol);
                          }}
                          color="error"
                          aria-label={`Remove ${symbol}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        <Collapse in={!!selectedSymbolForAlert}>
          {selectedSymbolForAlert && portfolioData.find(s => s.symbol === selectedSymbolForAlert) && (
            <Box sx={{ mt: 2 }}>
              <AlertManager 
                symbol={selectedSymbolForAlert}
                currentPrice={portfolioData.find(s => s.symbol === selectedSymbolForAlert)?.price}
              />
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default PortfolioView;
