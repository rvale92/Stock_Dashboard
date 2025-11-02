import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Autocomplete,
  Paper,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  
} from '@mui/icons-material';
import { fetchStockQuote } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { checkAlerts, getAlertsForSymbol } from '../utils/alerts';
import AlertManager from './AlertManager';
import { POLL_MS, STAGGER_DELAY_MS } from '../constants';

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
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [selectedSymbolForAlert, setSelectedSymbolForAlert] = useState(null);

  // Load watchlist from localStorage on mount with staggered initial loads
  useEffect(() => {
    const savedStocks = localStorage.getItem('watchlist');
    if (savedStocks) {
      const parsed = JSON.parse(savedStocks);
      setStocks(parsed);
      // Stagger initial loads to avoid burst requests
      parsed.forEach((stock, index) => {
        setTimeout(() => {
          fetchStockData(stock);
        }, index * STAGGER_DELAY_MS);
      });
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem('watchlist', JSON.stringify(stocks));
    }
  }, [stocks]);

  // WebSocket not currently implemented - use polling only
  useWebSocket(stocks);

  // Polling: Refresh stock quotes every POLL_MS (65 seconds to respect API limits)
  useEffect(() => {
    if (stocks.length === 0) return;

    // Track active requests to avoid duplicate fetches
    const activeRequests = new Set();

    const updateAllStocks = async () => {
      // Stagger updates to avoid burst requests
      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        
        // Skip if already fetching this symbol
        if (activeRequests.has(stock)) {
          console.log(`Skipping ${stock} - already fetching`);
          continue;
        }

        setTimeout(async () => {
          activeRequests.add(stock);
          try {
            const data = await fetchStockQuote(stock);
            if (data && data.price) {
              checkAlerts(stock, data.price);
            }
            setStockData(prev => ({ ...prev, [stock]: data }));
          } catch (err) {
            console.error(`[Watchlist] Error fetching ${stock}:`, err);
            setStockData(prev => ({ ...prev, [stock]: { symbol: stock, error: err.message || 'API connection failed — check proxy URL configuration.' } }));
            setError(prev => {
              const newError = { ...prev };
              delete newError[stock];
              return newError;
            });
          } catch (err) {
            console.error(`Error updating ${stock}:`, err.message);
            const errorMsg = err.message || 'Unknown error';
            const lowerMsg = errorMsg.toLowerCase();
            
            // Show helpful error messages
            let displayMsg = 'No data available';
            if (lowerMsg.includes('rate') || lowerMsg.includes('limit')) {
              displayMsg = 'Rate limited — retrying…';
            } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
              displayMsg = 'Network error — retrying…';
            } else if (lowerMsg.includes('invalid')) {
              displayMsg = 'Invalid symbol';
            } else {
              displayMsg = errorMsg;
            }
            
            setError(prev => ({ ...prev, [stock]: displayMsg }));
          } finally {
            activeRequests.delete(stock);
          }
        }, i * 500); // 500ms spacing between requests
      }
    };

    updateAllStocks();
    const intervalId = setInterval(updateAllStocks, POLL_MS);
    return () => {
      clearInterval(intervalId);
      activeRequests.clear();
    };
  }, [stocks]);

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
          setStockData(prev => ({ ...prev }));
        }
      }
    } catch (err) {
      console.error(`Error fetching ${stockSymbol}:`, err.message);
      const errorMsg = err.message || 'Unknown error';
      const lowerMsg = errorMsg.toLowerCase();
      
      // Show helpful error messages
      let displayMsg = 'No data available';
      if (lowerMsg.includes('rate') || lowerMsg.includes('limit')) {
        displayMsg = 'Rate limited — retrying…';
      } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
        displayMsg = 'Network error — retrying…';
      } else if (lowerMsg.includes('invalid')) {
        displayMsg = 'Invalid symbol';
      } else {
        displayMsg = `Failed to fetch: ${errorMsg}`;
      }
      
      setError(prev => ({ ...prev, [stockSymbol]: displayMsg }));
    } finally {
      setLoading(prev => ({ ...prev, [stockSymbol]: false }));
    }
  };

  const addStockFromSymbol = async (stockSymbol) => {
    const upperSymbol = stockSymbol.toUpperCase().trim();
    if (upperSymbol && !stocks.includes(upperSymbol)) {
      setStocks([...stocks, upperSymbol]);
      setSymbol('');
      await fetchStockData(upperSymbol);
    }
  };

  const addStock = async () => {
    await addStockFromSymbol(symbol);
  };

  const removeStock = (stockSymbol) => {
    setStocks(stocks.filter(s => s !== stockSymbol));
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

  const handleStockClick = (stockSymbol) => {
    if (stockData[stockSymbol]) {
      onStockSelect(stockSymbol);
    }
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatChange = (change, changePercent) => {
    if (change === undefined || changePercent === undefined) return '--';
    const sign = change >= 0 ? '+' : '';
    const isPositive = change >= 0;
    return (
      <Chip
        icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
        label={`${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`}
        color={isPositive ? 'success' : 'error'}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addStock();
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" component="h2">
              Watchlist
            </Typography>
            {stocks.length > 0 && (
              <Chip
                label="🔄 Polling"
                color="warning"
                size="small"
                sx={{ fontWeight: 600 }}
              />
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
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            freeSolo
            options={COMMON_STOCKS}
            value={symbol}
            onChange={(event, newValue) => {
              if (newValue) {
                setSymbol(newValue);
                addStockFromSymbol(newValue);
              }
            }}
            onInputChange={(event, newInputValue) => {
              setSymbol(newInputValue.toUpperCase());
            }}
            inputValue={symbol}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search or enter symbol"
                variant="outlined"
                fullWidth
                size="small"
                onKeyPress={handleKeyPress}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <IconButton
                        onClick={addStock}
                        disabled={!symbol.trim() || stocks.includes(symbol.toUpperCase().trim())}
                        color="primary"
                        sx={{
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                          },
                          '&.Mui-disabled': {
                            background: 'rgba(0, 0, 0, 0.12)',
                          },
                        }}
                        aria-label="Add stock"
                      >
                        <AddIcon />
                      </IconButton>
                    </>
                  ),
                }}
              />
            )}
            PaperComponent={({ children, ...other }) => (
              <Paper
                {...other}
                sx={{
                  mt: 1,
                  boxShadow: 3,
                }}
              >
                {children}
              </Paper>
            )}
          />
        </Box>

        {stocks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No stocks in watchlist. Add stocks to get started!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {stocks.map((stock) => {
              const data = stockData[stock];
              const isLoading = loading[stock];
              const hasError = error[stock];
              const alerts = getAlertsForSymbol(stock);
              const hasActiveAlert = alerts.some(a => !a.triggered && !a.cleared);
              const hasTriggeredAlert = alerts.some(a => a.triggered && !a.cleared);
              
              return (
                <ListItem
                  key={stock}
                  button
                  onClick={() => data && handleStockClick(stock)}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {stock}
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
                    }
                    secondary={
                      isLoading ? (
                        <CircularProgress size={16} />
                      ) : hasError ? (
                        <Alert severity="error" sx={{ py: 0, mt: 0.5 }}>
                          {hasError}
                        </Alert>
                      ) : data ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {formatPrice(data.price)}
                          </Typography>
                          {formatChange(data.change, data.changePercent)}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Loading...
                        </Typography>
                      )
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Set price alert">
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbolForAlert(selectedSymbolForAlert === stock ? null : stock);
                        }}
                        color={selectedSymbolForAlert === stock ? 'primary' : 'default'}
                        aria-label={`Set price alert for ${stock}`}
                      >
                        <NotificationsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove from watchlist">
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStock(stock);
                        }}
                        color="error"
                        aria-label={`Remove ${stock}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}

        <Collapse in={!!selectedSymbolForAlert}>
          {selectedSymbolForAlert && stockData[selectedSymbolForAlert] && (
            <Box sx={{ mt: 2 }}>
              <AlertManager 
                symbol={selectedSymbolForAlert}
                currentPrice={stockData[selectedSymbolForAlert]?.price}
              />
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default Watchlist;
