import React, { useState, useEffect, useCallback } from 'react';
import {
  
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Box,
  Chip,
  Collapse,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';
import { getAlertsForSymbol, createAlert, deleteAlert, clearAlert } from '../utils/alerts';

function AlertManager({ symbol, currentPrice, onAlertTriggered }) {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetPrice: '',
    direction: 'above'
  });
  const [activeTriggered, setActiveTriggered] = useState([]);

  const loadAlerts = useCallback(() => {
    if (!symbol) return;
    const symbolAlerts = getAlertsForSymbol(symbol);
    setAlerts(symbolAlerts);
    
    const triggered = symbolAlerts.filter(a => a.triggered && !a.cleared);
    setActiveTriggered(triggered);
    
    if (onAlertTriggered && triggered.length > 0) {
      onAlertTriggered(triggered);
    }
  }, [symbol, onAlertTriggered]);

  useEffect(() => {
    if (symbol) {
      loadAlerts();
      const checkInterval = setInterval(() => {
        if (currentPrice && symbol) {
          loadAlerts();
        }
      }, 10000);
      return () => clearInterval(checkInterval);
    } else {
      setAlerts([]);
      setActiveTriggered([]);
    }
  }, [symbol, currentPrice, loadAlerts]);

  const handleCreateAlert = (e) => {
    e.preventDefault();
    if (!symbol || !formData.targetPrice) return;

    const targetPrice = parseFloat(formData.targetPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
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
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Price Alerts
        </Typography>
        <Button
          variant={showForm ? 'outlined' : 'contained'}
          startIcon={showForm ? <CancelIcon /> : <AddIcon />}
          onClick={() => setShowForm(!showForm)}
          size="small"
          sx={{
            background: showForm ? 'transparent' : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: showForm ? undefined : 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
            },
          }}
          aria-label={showForm ? 'Cancel alert form' : 'Open alert form'}
          aria-expanded={showForm}
        >
          {showForm ? 'Cancel' : '+ Set Alert'}
        </Button>
      </Box>

      {activeTriggered.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {activeTriggered.map(alert => (
            <Alert
              key={alert.id}
              severity="error"
              icon={<NotificationsActiveIcon />}
              action={
                <IconButton
                  size="small"
                  onClick={() => handleClearAlert(alert.id)}
                  aria-label={`Clear alert for ${symbol}`}
                  color="inherit"
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              }
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Alert Triggered: {symbol} {alert.direction === 'above' ? 'above' : 'below'} ${alert.targetPrice.toFixed(2)}
                {currentPrice && ` (Current: $${currentPrice.toFixed(2)})`}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Collapse in={showForm}>
        <Paper
          elevation={0}
          component="form"
          onSubmit={handleCreateAlert}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Alert when price is</InputLabel>
            <Select
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              label="Alert when price is"
            >
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Target Price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter target price"
            value={formData.targetPrice}
            onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
            required
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                },
              }}
            >
              Save Alert
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {alerts.filter(a => !a.triggered).length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Active Alerts
          </Typography>
          <List sx={{ p: 0 }}>
            {alerts.filter(a => !a.triggered).map(alert => (
              <ListItem
                key={alert.id}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {alert.symbol}
                      </Typography>
                      <Chip
                        label={`${alert.direction === 'above' ? '≥' : '≤'} $${alert.targetPrice.toFixed(2)}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteAlert(alert.id)}
                    color="error"
                    aria-label={`Delete alert for ${alert.symbol}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
}

export default AlertManager;
