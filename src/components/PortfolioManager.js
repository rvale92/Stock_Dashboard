import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import { 
  getPortfolios, 
  createPortfolio, 
  deletePortfolio,
  updatePortfolio
} from '../utils/portfolios';

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
      createPortfolio(newPortfolioName.trim());
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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderIcon />
            <Typography variant="h5">Portfolios</Typography>
          </Box>
        }
        action={
          <IconButton onClick={onClose} aria-label="Close portfolio sidebar" color="inherit">
            <CloseIcon />
          </IconButton>
        }
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
        }}
      />
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="New portfolio name..."
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreatePortfolio()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    onClick={handleCreatePortfolio}
                    disabled={!newPortfolioName.trim()}
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                      },
                    }}
                  >
                    <AddIcon />
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {portfolios.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: 'background.default',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No portfolios yet. Create one to get started!
            </Typography>
          </Paper>
        ) : (
          <List sx={{ p: 0 }}>
            {portfolios.map((portfolio) => (
              <ListItem
                key={portfolio.id}
                button
                selected={selectedPortfolioId === portfolio.id}
                onClick={() => onPortfolioSelect(portfolio.id)}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  border: selectedPortfolioId === portfolio.id ? 2 : 1,
                  borderColor: selectedPortfolioId === portfolio.id ? 'primary.main' : 'divider',
                  bgcolor: selectedPortfolioId === portfolio.id ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                {editingId === portfolio.id ? (
                  <Box sx={{ display: 'flex', gap: 1, width: '100%' }} onClick={(e) => e.stopPropagation()}>
                    <TextField
                      fullWidth
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(portfolio.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                      sx={{ mr: 1 }}
                    />
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleSaveEdit(portfolio.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={handleCancelEdit}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {portfolio.name}
                        </Typography>
                      }
                      secondary={`${portfolio.symbols.length} ${portfolio.symbols.length === 1 ? 'stock' : 'stocks'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPortfolio(portfolio.id, portfolio.name);
                        }}
                        aria-label={`Rename ${portfolio.name}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePortfolio(portfolio.id);
                        }}
                        aria-label={`Delete ${portfolio.name}`}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default PortfolioManager;
