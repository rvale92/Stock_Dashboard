import React, { useState, useEffect } from 'react';
import { getAlerts, getActiveAlerts, getTriggeredAlerts, clearAllTriggeredAlerts, deleteAlert } from '../utils/alerts';

function AlertsDashboard() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'active', 'triggered', 'cleared'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'symbol', 'price'

  useEffect(() => {
    loadAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    const all = getAlerts();
    const active = getActiveAlerts();
    const triggered = getTriggeredAlerts();
    
    setAllAlerts(all);
    setActiveAlerts(active);
    setTriggeredAlerts(triggered);
  };

  const getFilteredAlerts = () => {
    let filtered = allAlerts;
    
    switch (filterBy) {
      case 'active':
        filtered = activeAlerts;
        break;
      case 'triggered':
        filtered = triggeredAlerts;
        break;
      case 'cleared':
        filtered = allAlerts.filter(a => a.cleared);
        break;
      default:
        filtered = allAlerts;
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return b.targetPrice - a.targetPrice;
        case 'date':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all triggered alerts?')) {
      clearAllTriggeredAlerts();
      loadAlerts();
    }
  };

  const handleDelete = (alertId) => {
    if (window.confirm('Delete this alert?')) {
      deleteAlert(alertId);
      loadAlerts();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="alerts-dashboard">
      <div className="alerts-dashboard-header">
        <h2>Price Alerts Dashboard</h2>
        <button
          onClick={loadAlerts}
          className="refresh-btn"
          aria-label="Refresh alerts"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      <div className="alerts-stats">
        <div className="stat-card">
          <div className="stat-label">Total Alerts</div>
          <div className="stat-value">{allAlerts.length}</div>
        </div>
        <div className="stat-card active">
          <div className="stat-label">Active</div>
          <div className="stat-value">{activeAlerts.length}</div>
        </div>
        <div className="stat-card triggered">
          <div className="stat-label">Triggered</div>
          <div className="stat-value">{triggeredAlerts.length}</div>
        </div>
        <div className="stat-card cleared">
          <div className="stat-label">Cleared</div>
          <div className="stat-value">{allAlerts.filter(a => a.cleared).length}</div>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="filter-group">
          <label htmlFor="filter-alerts">Filter:</label>
          <select
            id="filter-alerts"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            aria-label="Filter alerts"
          >
            <option value="all">All Alerts</option>
            <option value="active">Active Only</option>
            <option value="triggered">Triggered Only</option>
            <option value="cleared">Cleared Only</option>
          </select>
        </div>
        <div className="sort-group">
          <label htmlFor="sort-alerts">Sort by:</label>
          <select
            id="sort-alerts"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort alerts"
          >
            <option value="date">Date Created</option>
            <option value="symbol">Symbol</option>
            <option value="price">Target Price</option>
          </select>
        </div>
        {triggeredAlerts.length > 0 && (
          <button
            className="clear-all-btn"
            onClick={handleClearAll}
            aria-label="Clear all triggered alerts"
          >
            Clear All Triggered
          </button>
        )}
      </div>

      <div className="alerts-list-container">
        {getFilteredAlerts().length === 0 ? (
          <div className="no-alerts">No alerts found</div>
        ) : (
          <div className="alerts-table">
            <div className="alerts-table-header">
              <div>Symbol</div>
              <div>Direction</div>
              <div>Target Price</div>
              <div>Status</div>
              <div>Created</div>
              <div>Triggered</div>
              <div>Actions</div>
            </div>
            {getFilteredAlerts().map(alert => (
              <div
                key={alert.id}
                className={`alerts-table-row ${alert.triggered ? 'triggered' : ''} ${alert.cleared ? 'cleared' : ''}`}
                role={alert.triggered && !alert.cleared ? 'alert' : 'row'}
              >
                <div className="alert-symbol-cell">
                  <strong>{alert.symbol}</strong>
                </div>
                <div className="alert-direction-cell">
                  {alert.direction === 'above' ? '≥' : '≤'}
                </div>
                <div className="alert-price-cell">
                  ${alert.targetPrice.toFixed(2)}
                </div>
                <div className="alert-status-cell">
                  {alert.cleared ? (
                    <span className="status-badge cleared">Cleared</span>
                  ) : alert.triggered ? (
                    <span className="status-badge triggered">
                      <span aria-hidden="true">🚨</span> Triggered
                    </span>
                  ) : (
                    <span className="status-badge active">
                      <span aria-hidden="true">🔔</span> Active
                    </span>
                  )}
                </div>
                <div className="alert-date-cell">
                  {formatDate(alert.createdAt)}
                </div>
                <div className="alert-triggered-cell">
                  {alert.triggeredAt ? formatDate(alert.triggeredAt) : '-'}
                </div>
                <div className="alert-actions-cell">
                  {!alert.cleared && (
                    <button
                      className="delete-alert-btn-small"
                      onClick={() => handleDelete(alert.id)}
                      aria-label={`Delete alert for ${alert.symbol}`}
                      title="Delete"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsDashboard;

