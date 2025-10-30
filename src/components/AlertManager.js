import React, { useState, useEffect } from 'react';
import { getAlertsForSymbol, createAlert, deleteAlert, clearAlert } from '../utils/alerts';

function AlertManager({ symbol, currentPrice, onAlertTriggered }) {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetPrice: '',
    direction: 'above'
  });
  const [activeTriggered, setActiveTriggered] = useState([]);

  useEffect(() => {
    if (symbol) {
      loadAlerts();
      // Refresh alerts when price changes
      const checkInterval = setInterval(() => {
        if (currentPrice && symbol) {
          loadAlerts(); // Reload to check for newly triggered alerts
        }
      }, 10000); // Check every 10 seconds
      return () => clearInterval(checkInterval);
    } else {
      setAlerts([]);
      setActiveTriggered([]);
    }
  }, [symbol, currentPrice]);

  const loadAlerts = () => {
    if (!symbol) return;
    const symbolAlerts = getAlertsForSymbol(symbol);
    setAlerts(symbolAlerts);
    
    // Separate triggered alerts
    const triggered = symbolAlerts.filter(a => a.triggered && !a.cleared);
    setActiveTriggered(triggered);
    
    if (onAlertTriggered && triggered.length > 0) {
      onAlertTriggered(triggered);
    }
  };

  const handleCreateAlert = (e) => {
    e.preventDefault();
    if (!symbol || !formData.targetPrice) return;

    const targetPrice = parseFloat(formData.targetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }

    createAlert(symbol, targetPrice, formData.direction);
    setFormData({ targetPrice: '', direction: 'above' });
    setShowForm(false);
    loadAlerts();
  };

  const handleDeleteAlert = (alertId) => {
    deleteAlert(alertId);
    loadAlerts();
  };

  const handleClearAlert = (alertId) => {
    clearAlert(alertId);
    loadAlerts();
  };

  if (!symbol) {
    return null;
  }

  return (
    <div className="alert-manager">
      <div className="alert-manager-header">
        <h3>Price Alerts</h3>
        <button 
          className="add-alert-btn"
          onClick={() => setShowForm(!showForm)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setShowForm(!showForm);
            }
          }}
          aria-label={showForm ? 'Cancel alert form' : 'Open alert form'}
          aria-expanded={showForm}
          tabIndex={0}
        >
          {showForm ? 'Cancel' : '+ Set Alert'}
        </button>
      </div>

      {activeTriggered.length > 0 && (
        <div className="triggered-alerts">
          {activeTriggered.map(alert => (
            <div key={alert.id} className="alert-item triggered" role="alert">
              <div className="alert-info">
                <span className="alert-badge" aria-label="Alert triggered">
                  <span aria-hidden="true">🚨</span> Alert Triggered
                </span>
                <span className="alert-text">
                  {symbol} {alert.direction === 'above' ? 'above' : 'below'} ${alert.targetPrice.toFixed(2)}
                  {currentPrice && ` (Current: $${currentPrice.toFixed(2)})`}
                </span>
              </div>
              <button 
                className="clear-alert-btn"
                onClick={() => handleClearAlert(alert.id)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClearAlert(alert.id);
                  }
                }}
                aria-label={`Clear alert for ${symbol}`}
                title="Clear alert"
                tabIndex={0}
              >
                <span aria-hidden="true">✓</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form className="alert-form" onSubmit={handleCreateAlert} aria-label="Price alert form">
          <div className="form-group">
            <label htmlFor="alert-direction">Alert when price is</label>
            <select
              id="alert-direction"
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              aria-label="Alert direction"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="alert-price">Target Price</label>
            <input
              id="alert-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter target price"
              value={formData.targetPrice}
              onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
              aria-label="Target price"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-alert-btn">Save Alert</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {alerts.length > 0 && (
        <div className="alerts-list">
          <h4>Active Alerts</h4>
          {alerts.filter(a => !a.triggered).map(alert => (
            <div key={alert.id} className="alert-item">
              <div className="alert-info">
                <span className="alert-symbol">{alert.symbol}</span>
                <span className="alert-text">
                  {alert.direction === 'above' ? '≥' : '≤'} ${alert.targetPrice.toFixed(2)}
                </span>
              </div>
              <button 
                className="delete-alert-btn"
                onClick={() => handleDeleteAlert(alert.id)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleDeleteAlert(alert.id);
                  }
                }}
                aria-label={`Delete alert for ${alert.symbol}`}
                title="Delete alert"
                tabIndex={0}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlertManager;

