import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsActiveIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { getAlerts, getTriggeredAlerts, getActiveAlerts, clearAllTriggeredAlerts, deleteAlert } from '../utils/alerts';

function AlertsDashboard() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    setLoading(true);
    const all = getAlerts();
    const active = getActiveAlerts();
    const triggered = getTriggeredAlerts();
    
    setAllAlerts(all);
    setActiveAlerts(active);
    setTriggeredAlerts(triggered);
    setLoading(false);
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
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon />
            <Typography variant="h5">Price Alerts Dashboard</Typography>
          </Box>
        }
        action={
          <IconButton onClick={loadAlerts} aria-label="Refresh alerts" color="inherit">
            <RefreshIcon />
          </IconButton>
        }
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          '& .MuiCardHeader-title': { color: 'white', fontWeight: 700 },
          '& .MuiIconButton-root': { color: 'white' },
        }}
      />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center', border: '2px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Alerts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {allAlerts.length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center', border: '2px solid', borderColor: 'primary.main' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {activeAlerts.length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center', border: '2px solid', borderColor: 'error.main' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Triggered
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {triggeredAlerts.length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, textAlign: 'center', border: '2px solid', borderColor: 'text.secondary' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cleared
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {allAlerts.filter(a => a.cleared).length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Alerts</MenuItem>
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="triggered">Triggered Only</MenuItem>
              <MenuItem value="cleared">Cleared Only</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
            >
              <MenuItem value="date">Date Created</MenuItem>
              <MenuItem value="symbol">Symbol</MenuItem>
              <MenuItem value="price">Target Price</MenuItem>
            </Select>
          </FormControl>
          {triggeredAlerts.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleClearAll}
              sx={{ ml: 'auto' }}
            >
              Clear All Triggered
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : getFilteredAlerts().length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No alerts found
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.paper' }}>
                  <TableCell><strong>Symbol</strong></TableCell>
                  <TableCell><strong>Direction</strong></TableCell>
                  <TableCell><strong>Target Price</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell><strong>Triggered</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredAlerts().map(alert => (
                  <TableRow
                    key={alert.id}
                    sx={{
                      bgcolor: alert.triggered && !alert.cleared ? 'error.light' : 'background.paper',
                      opacity: alert.cleared ? 0.6 : 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {alert.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {alert.direction === 'above' ? '≥' : '≤'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        ${alert.targetPrice.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {alert.cleared ? (
                        <Chip label="Cleared" size="small" color="default" />
                      ) : alert.triggered ? (
                        <Chip
                          icon={<NotificationsActiveIcon />}
                          label="Triggered"
                          size="small"
                          color="error"
                        />
                      ) : (
                        <Chip
                          icon={<NotificationsIcon />}
                          label="Active"
                          size="small"
                          color="warning"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(alert.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {alert.triggeredAt ? formatDate(alert.triggeredAt) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {!alert.cleared && (
                        <Tooltip title="Delete alert">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(alert.id)}
                            color="error"
                            aria-label={`Delete alert for ${alert.symbol}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertsDashboard;
