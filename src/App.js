import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { deepPurple, blue, green, red, orange } from '@mui/material/colors';
import Watchlist from './components/Watchlist';
import StockChart from './components/StockChart';
import AnalyticsPanel from './components/AnalyticsPanel';
import NewsFeed from './components/NewsFeed';
import TechnicalIndicators from './components/TechnicalIndicators';
import PortfolioManager from './components/PortfolioManager';
import PortfolioView from './components/PortfolioView';
import AlertsDashboard from './components/AlertsDashboard';
import ConnectionStatus from './components/ConnectionStatus';
import { useDarkMode } from './contexts/DarkModeContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Badge,
  useMediaQuery
} from '@mui/material';
import {
  Assessment as PortfolioIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';

// Create Material-UI theme that respects dark mode
function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [showPortfolioSidebar, setShowPortfolioSidebar] = useState(false);
  const [showAlertsDashboard, setShowAlertsDashboard] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  // Get triggered alerts count
  const getTriggeredCount = () => {
    try {
      const { getTriggeredAlerts } = require('./utils/alerts');
      return getTriggeredAlerts().length;
    } catch {
      return 0;
    }
  };
  
  const [triggeredCount, setTriggeredCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTriggeredCount(getTriggeredCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStockSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const handlePortfolioSelect = (portfolioId) => {
    setSelectedPortfolioId(portfolioId);
    setShowPortfolioSidebar(false);
  };

  // Create theme based on dark mode
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: blue[600],
        light: blue[400],
        dark: blue[800],
      },
      secondary: {
        main: deepPurple[500],
      },
      success: {
        main: green[600],
      },
      error: {
        main: red[600],
      },
      warning: {
        main: orange[600],
      },
      background: {
        default: darkMode ? '#1a1a1a' : '#f5f5f5',
        paper: darkMode ? '#2d2d2d' : '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
              : '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: darkMode 
                ? '0 8px 12px rgba(0, 0, 0, 0.4)' 
                : '0 8px 12px rgba(0, 0, 0, 0.15)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
    },
  });

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        <ConnectionStatus />
        <AppBar 
          position="sticky" 
          elevation={2}
          sx={{
            background: darkMode
              ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
          }}
        >
          <Toolbar>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #e3f2fd 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Stock Analysis Dashboard
            </Typography>
            
            {selectedSymbol && !isMobile && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mr: 2,
                  opacity: 0.9,
                  color: 'white'
                }}
              >
                Viewing: {selectedSymbol}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PortfolioIcon />}
                onClick={() => setShowPortfolioSidebar(!showPortfolioSidebar)}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                aria-label="Toggle Portfolio Sidebar"
                aria-expanded={showPortfolioSidebar}
              >
                {isMobile ? '' : 'Portfolios'}
              </Button>
              
              <Badge badgeContent={triggeredCount > 0 ? triggeredCount : 0} color="error">
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => setShowAlertsDashboard(!showAlertsDashboard)}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  aria-label="View Alerts Dashboard"
                  aria-expanded={showAlertsDashboard}
                >
                  {isMobile ? '' : 'Alerts'}
                </Button>
              </Badge>
              
              <IconButton
                onClick={toggleDarkMode}
                onKeyPress={(e) => e.key === 'Enter' && toggleDarkMode()}
                aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                tabIndex={0}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: isMobile ? 'column' : 'row' }}>
            {/* Portfolio Sidebar */}
            {showPortfolioSidebar && (
              <Box 
                sx={{ 
                  width: isMobile ? '100%' : 300,
                  mb: isMobile ? 2 : 0,
                }}
              >
                <PortfolioManager
                  selectedPortfolioId={selectedPortfolioId}
                  onPortfolioSelect={handlePortfolioSelect}
                  onClose={() => setShowPortfolioSidebar(false)}
                />
              </Box>
            )}

            {/* Main Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {showAlertsDashboard ? (
                <AlertsDashboard />
              ) : (
                <Box>
                  {/* Left Panel - Watchlist/Portfolio */}
                  <Box 
                    sx={{ 
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                      gap: 3,
                      mb: 3
                    }}
                  >
                    {selectedPortfolioId ? (
                      <>
                        <PortfolioView 
                          portfolioId={selectedPortfolioId}
                          onStockSelect={handleStockSelect}
                          onBack={() => setSelectedPortfolioId(null)}
                        />
                        <NewsFeed symbol={selectedSymbol} />
                      </>
                    ) : (
                      <>
                        <Watchlist onStockSelect={handleStockSelect} />
                        <NewsFeed symbol={selectedSymbol} />
                      </>
                    )}
                  </Box>

                  {/* Right Panel - Charts and Analytics */}
                  <Box 
                    sx={{ 
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: '1fr' },
                      gap: 3
                    }}
                  >
                    <StockChart symbol={selectedSymbol} />
                    <AnalyticsPanel symbol={selectedSymbol} />
                    <TechnicalIndicators symbol={selectedSymbol} />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
