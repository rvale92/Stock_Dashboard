import React, { useState, useEffect } from 'react';
import { fetchStockNews } from '../utils/api';

function NewsFeed({ symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (symbol) {
      loadNews(symbol);
    } else {
      setNews([]);
    }
  }, [symbol]);

  const loadNews = async (stockSymbol) => {
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await fetchStockNews(stockSymbol, 5);
      setNews(newsData);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="news-feed">
      <h2>News Feed {symbol && `- ${symbol}`}</h2>
      {loading ? (
        <div className="loading">Loading news...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !symbol ? (
        <div className="no-data">Select a stock to view news</div>
      ) : news.length > 0 ? (
        <ul className="news-items">
          {news.map((item, index) => (
            <li key={index} className="news-item">
              <h3>{item.title}</h3>
              {item.summary && <p>{item.summary}</p>}
              <div className="news-meta">
                <span className="news-source">{item.source}</span>
                <span className="news-date">{formatDate(item.date)}</span>
              </div>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="news-link"
                >
                  Read more →
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-data">No news available for this stock</div>
      )}
    </div>
  );
}

export default NewsFeed;
