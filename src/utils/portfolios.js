// Portfolio management utilities

const PORTFOLIOS_STORAGE_KEY = 'stock_portfolios';

/**
 * Get all portfolios from localStorage
 * @returns {Array} Array of portfolio objects
 */
export const getPortfolios = () => {
  try {
    const stored = localStorage.getItem(PORTFOLIOS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading portfolios:', error);
    return [];
  }
};

/**
 * Save portfolios to localStorage
 * @param {Array} portfolios - Array of portfolio objects
 */
export const savePortfolios = (portfolios) => {
  try {
    localStorage.setItem(PORTFOLIOS_STORAGE_KEY, JSON.stringify(portfolios));
  } catch (error) {
    console.error('Error saving portfolios:', error);
  }
};

/**
 * Create a new portfolio
 * @param {string} name - Portfolio name
 * @returns {Object} New portfolio object
 */
export const createPortfolio = (name) => {
  const portfolios = getPortfolios();
  const newPortfolio = {
    id: Date.now().toString(),
    name: name.trim(),
    symbols: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  portfolios.push(newPortfolio);
  savePortfolios(portfolios);
  return newPortfolio;
};

/**
 * Get portfolio by ID
 * @param {string} portfolioId - Portfolio ID
 * @returns {Object|null} Portfolio object or null
 */
export const getPortfolioById = (portfolioId) => {
  const portfolios = getPortfolios();
  return portfolios.find(p => p.id === portfolioId) || null;
};

/**
 * Update portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {Object} updates - Updates to apply
 */
export const updatePortfolio = (portfolioId, updates) => {
  const portfolios = getPortfolios();
  const index = portfolios.findIndex(p => p.id === portfolioId);
  
  if (index !== -1) {
    portfolios[index] = {
      ...portfolios[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    savePortfolios(portfolios);
    return portfolios[index];
  }
  
  return null;
};

/**
 * Delete portfolio
 * @param {string} portfolioId - Portfolio ID
 */
export const deletePortfolio = (portfolioId) => {
  const portfolios = getPortfolios();
  const filtered = portfolios.filter(p => p.id !== portfolioId);
  savePortfolios(filtered);
};

/**
 * Add symbol to portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {string} symbol - Stock symbol
 */
export const addSymbolToPortfolio = (portfolioId, symbol) => {
  const portfolio = getPortfolioById(portfolioId);
  if (!portfolio) return null;
  
  const upperSymbol = symbol.toUpperCase().trim();
  if (!portfolio.symbols.includes(upperSymbol)) {
    portfolio.symbols.push(upperSymbol);
    return updatePortfolio(portfolioId, { symbols: portfolio.symbols });
  }
  
  return portfolio;
};

/**
 * Remove symbol from portfolio
 * @param {string} portfolioId - Portfolio ID
 * @param {string} symbol - Stock symbol
 */
export const removeSymbolFromPortfolio = (portfolioId, symbol) => {
  const portfolio = getPortfolioById(portfolioId);
  if (!portfolio) return null;
  
  portfolio.symbols = portfolio.symbols.filter(s => s !== symbol.toUpperCase());
  return updatePortfolio(portfolioId, { symbols: portfolio.symbols });
};

/**
 * Calculate portfolio performance
 * @param {Array} portfolioData - Array of stock quote data for portfolio symbols
 * @returns {Object} Portfolio performance metrics
 */
export const calculatePortfolioPerformance = (portfolioData) => {
  if (!portfolioData || portfolioData.length === 0) {
    return {
      totalValue: 0,
      totalChange: 0,
      totalChangePercent: 0,
      averageChange: 0,
      stockCount: 0,
      stocks: []
    };
  }

  const validData = portfolioData.filter(d => d && d.price && !isNaN(d.price));
  
  if (validData.length === 0) {
    return {
      totalValue: 0,
      totalChange: 0,
      totalChangePercent: 0,
      averageChange: 0,
      stockCount: 0,
      stocks: []
    };
  }

  const totalValue = validData.reduce((sum, stock) => sum + (stock.price || 0), 0);
  const totalChange = validData.reduce((sum, stock) => sum + (stock.change || 0), 0);
  
  // Calculate weighted average change percent
  const totalChangePercent = validData.length > 0 
    ? validData.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / validData.length
    : 0;

  return {
    totalValue,
    totalChange,
    totalChangePercent,
    averageChange: totalChange / validData.length,
    stockCount: validData.length,
    stocks: validData
  };
};

