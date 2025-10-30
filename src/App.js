import React, { useState, useEffect } from 'react';
import Watchlist from './components/Watchlist';
import StockChart from './components/StockChart';
import AnalyticsPanel from './components/AnalyticsPanel';
import NewsFeed from './components/NewsFeed';
import TechnicalIndicators from './components/TechnicalIndicators';
import PortfolioManager from './components/PortfolioManager';
import PortfolioView from './components/PortfolioView';
import AlertsDashboard from './components/AlertsDashboard';
import { useDarkMode } from './contexts/DarkModeContext';

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Analysis Dashboard</h1>
        <div className="header-actions">
          <button 
            className="portfolio-toggle-btn"
            onClick={() => setShowPortfolioSidebar(!showPortfolioSidebar)}
            title="Toggle Portfolio Sidebar"
            aria-label="Toggle Portfolio Sidebar"
            aria-expanded={showPortfolioSidebar}
          >
            📊 Portfolios
          </button>
          <button
            className="header-btn"
            onClick={() => setShowAlertsDashboard(!showAlertsDashboard)}
            title="View Alerts Dashboard"
            aria-label="View Alerts Dashboard"
            aria-expanded={showAlertsDashboard}
          >
            🔔 Alerts {triggeredCount > 0 && `(${triggeredCount})`}
          </button>
          <button
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            onKeyPress={(e) => e.key === 'Enter' && toggleDarkMode()}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            tabIndex={0}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {selectedSymbol && (
            <p className="selected-symbol">Viewing: {selectedSymbol}</p>
          )}
        </div>
      </header>
      <main className="App-main">
        <div className="main-layout">
          {showPortfolioSidebar && (
            <div className="portfolio-sidebar">
              <PortfolioManager
                selectedPortfolioId={selectedPortfolioId}
                onPortfolioSelect={handlePortfolioSelect}
                onClose={() => setShowPortfolioSidebar(false)}
              />
            </div>
          )}
          {showAlertsDashboard ? (
            <div className="alerts-dashboard-container">
              <AlertsDashboard />
            </div>
          ) : (
            <div className="dashboard-container">
              <div className="left-panel">
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
              </div>
              <div className="right-panel">
                <StockChart symbol={selectedSymbol} />
                <AnalyticsPanel symbol={selectedSymbol} />
                <TechnicalIndicators symbol={selectedSymbol} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
