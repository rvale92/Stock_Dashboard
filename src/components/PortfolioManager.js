import React, { useState, useEffect } from 'react';
import { 
  getPortfolios, 
  createPortfolio, 
  deletePortfolio,
  addSymbolToPortfolio,
  removeSymbolFromPortfolio,
  updatePortfolio
} from '../utils/portfolios';
import { fetchMultipleQuotes } from '../utils/api';
import { calculatePortfolioPerformance } from '../utils/portfolios';

function PortfolioManager({ selectedPortfolioId, onPortfolioSelect, onClose }) {
  const [portfolios, setPortfolios] = useState([]);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = () => {
    setPortfolios(getPortfolios());
  };

  const handleCreatePortfolio = () => {
    if (newPortfolioName.trim()) {
      createPortfolio(newPortfolioName);
      setNewPortfolioName('');
      loadPortfolios();
    }
  };

  const handleDeletePortfolio = (portfolioId) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      deletePortfolio(portfolioId);
      if (selectedPortfolioId === portfolioId) {
        onPortfolioSelect(null);
      }
      loadPortfolios();
    }
  };

  const handleEditPortfolio = (portfolioId, currentName) => {
    setEditingId(portfolioId);
    setEditName(currentName);
  };

  const handleSaveEdit = (portfolioId) => {
    if (editName.trim()) {
      updatePortfolio(portfolioId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      loadPortfolios();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="portfolio-manager">
      <div className="portfolio-manager-header">
        <h2>Portfolios</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="portfolio-create">
        <input
          type="text"
          placeholder="New portfolio name..."
          value={newPortfolioName}
          onChange={(e) => setNewPortfolioName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreatePortfolio()}
        />
        <button onClick={handleCreatePortfolio}>Create</button>
      </div>

      <div className="portfolio-list">
        {portfolios.length === 0 ? (
          <div className="empty-state">No portfolios yet. Create one to get started!</div>
        ) : (
          portfolios.map((portfolio) => (
            <div 
              key={portfolio.id} 
              className={`portfolio-item ${selectedPortfolioId === portfolio.id ? 'active' : ''}`}
              onClick={() => onPortfolioSelect(portfolio.id)}
            >
              {editingId === portfolio.id ? (
                <div className="portfolio-edit" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(portfolio.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <button onClick={() => handleSaveEdit(portfolio.id)}>✓</button>
                  <button onClick={handleCancelEdit}>✕</button>
                </div>
              ) : (
                <>
                  <div className="portfolio-info">
                    <div className="portfolio-name">{portfolio.name}</div>
                    <div className="portfolio-stock-count">{portfolio.symbols.length} stocks</div>
                  </div>
                  <div className="portfolio-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPortfolio(portfolio.id, portfolio.name);
                      }}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePortfolio(portfolio.id);
                      }}
                      title="Delete"
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PortfolioManager;

