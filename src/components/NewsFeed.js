import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  Link,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Article as ArticleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
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
      setError(null);
    }
  }, [symbol]);

  const loadNews = async (stockSymbol) => {
    setLoading(true);
    setError(null);

    try {
      const newsData = await fetchStockNews(stockSymbol);
      setNews(newsData);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to load news');
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleIcon />
            <Typography variant="h5" component="h2">
              News Feed
            </Typography>
            {symbol && (
              <Chip label={symbol} size="small" color="primary" sx={{ ml: 'auto' }} />
            )}
          </Box>
        }
        sx={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          '& .MuiCardHeader-title': {
            color: 'white',
            fontWeight: 700,
          },
        }}
      />
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : symbol ? (
          news.length > 0 ? (
            <List sx={{ p: 0 }}>
              {news.map((article, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      mb: 2,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-2px)',
                        transition: 'transform 0.2s ease-in-out',
                      },
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          '& a': {
                            color: 'primary.main',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          },
                        }}
                      >
                        {article.url ? (
                          <Link href={article.url} target="_blank" rel="noopener noreferrer">
                            {article.title}
                          </Link>
                        ) : (
                          article.title
                        )}
                      </Typography>
                    </Box>
                    {article.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {article.description}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {article.source && (
                        <Chip
                          label={article.source}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(article.date)}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < news.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No news available for {symbol}
              </Typography>
            </Box>
          )
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Select a stock to view news
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default NewsFeed;
