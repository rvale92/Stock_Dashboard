// Price alert management utilities

const ALERTS_STORAGE_KEY = 'stock_price_alerts';

/**
 * Get all alerts from localStorage
 * @returns {Array} Array of alert objects
 */
export const getAlerts = () => {
  try {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading alerts:', error);
    return [];
  }
};

/**
 * Save alerts to localStorage
 * @param {Array} alerts - Array of alert objects
 */
export const saveAlerts = (alerts) => {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alerts:', error);
  }
};

/**
 * Create a new price alert
 * @param {string} symbol - Stock symbol
 * @param {number} targetPrice - Target price
 * @param {string} direction - 'above' or 'below'
 * @returns {Object} New alert object
 */
export const createAlert = (symbol, targetPrice, direction) => {
  const alerts = getAlerts();
  const upperSymbol = symbol.toUpperCase().trim();
  
  // Check if alert already exists for this symbol and direction
  const existing = alerts.find(
    a => a.symbol === upperSymbol && 
         a.direction === direction &&
         !a.triggered &&
         !a.cleared
  );
  
  if (existing) {
    // Update existing alert
    existing.targetPrice = targetPrice;
    existing.createdAt = existing.createdAt || new Date().toISOString();
    existing.updatedAt = new Date().toISOString();
    saveAlerts(alerts);
    return existing;
  }
  
  const newAlert = {
    id: Date.now().toString(),
    symbol: upperSymbol,
    targetPrice: parseFloat(targetPrice),
    direction: direction, // 'above' or 'below'
    triggered: false,
    triggeredAt: null,
    cleared: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  alerts.push(newAlert);
  saveAlerts(alerts);
  return newAlert;
};

/**
 * Delete alert by ID
 * @param {string} alertId - Alert ID
 */
export const deleteAlert = (alertId) => {
  const alerts = getAlerts();
  const filtered = alerts.filter(a => a.id !== alertId);
  saveAlerts(filtered);
};

/**
 * Clear (mark as cleared) alert
 * @param {string} alertId - Alert ID
 */
export const clearAlert = (alertId) => {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.cleared = true;
    alert.updatedAt = new Date().toISOString();
    saveAlerts(alerts);
  }
};

/**
 * Clear all triggered alerts
 */
export const clearAllTriggeredAlerts = () => {
  const alerts = getAlerts();
  alerts.forEach(alert => {
    if (alert.triggered && !alert.cleared) {
      alert.cleared = true;
      alert.updatedAt = new Date().toISOString();
    }
  });
  saveAlerts(alerts);
};

/**
 * Get alerts for a specific symbol
 * @param {string} symbol - Stock symbol
 * @returns {Array} Array of alerts for symbol
 */
export const getAlertsForSymbol = (symbol) => {
  const alerts = getAlerts();
  return alerts.filter(
    a => a.symbol === symbol.toUpperCase() && !a.cleared
  );
};

/**
 * Get active (not triggered, not cleared) alerts
 * @returns {Array} Array of active alerts
 */
export const getActiveAlerts = () => {
  const alerts = getAlerts();
  return alerts.filter(a => !a.triggered && !a.cleared);
};

/**
 * Get triggered alerts
 * @returns {Array} Array of triggered alerts
 */
export const getTriggeredAlerts = () => {
  const alerts = getAlerts();
  return alerts.filter(a => a.triggered && !a.cleared);
};

/**
 * Check if price triggers any alerts
 * @param {string} symbol - Stock symbol
 * @param {number} currentPrice - Current stock price
 * @returns {Array} Array of triggered alerts
 */
export const checkAlerts = (symbol, currentPrice) => {
  if (!symbol || !currentPrice || isNaN(currentPrice)) {
    return [];
  }

  const alerts = getAlerts();
  const symbolAlerts = alerts.filter(
    a => a.symbol === symbol.toUpperCase() && 
         !a.triggered && 
         !a.cleared
  );
  
  const triggered = [];
  
  symbolAlerts.forEach(alert => {
    let isTriggered = false;
    
    if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
      isTriggered = true;
    } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
      isTriggered = true;
    }
    
    if (isTriggered) {
      alert.triggered = true;
      alert.triggeredAt = new Date().toISOString();
      alert.updatedAt = new Date().toISOString();
      triggered.push(alert);
      
      // Show browser notification if permission granted
      showBrowserNotification(alert, currentPrice);
    }
  });
  
  if (triggered.length > 0) {
    saveAlerts(alerts);
  }
  
  return triggered;
};

/**
 * Show browser notification for triggered alert
 * @param {Object} alert - Alert object
 * @param {number} currentPrice - Current price
 */
const showBrowserNotification = async (alert, currentPrice) => {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    return;
  }

  // Request permission if not granted
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    const direction = alert.direction === 'above' ? 'above' : 'below';
    const title = `Price Alert: ${alert.symbol}`;
    const body = `${alert.symbol} is now $${currentPrice.toFixed(2)}, ${direction} your target of $${alert.targetPrice.toFixed(2)}`;
    
    new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      tag: `alert-${alert.id}`,
      requireInteraction: false
    });
  }
};

/**
 * Request notification permission
 * @returns {Promise<boolean>} Whether permission was granted
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

