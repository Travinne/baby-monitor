import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  addDiaper, 
  getDiaperHistory,
  updateDiaper,
  deleteDiaper,
  getDiaperStats,
  getTodayDiapers,
  getWeeklySummary,
  getDiaperAnalytics,
  validateDiaperData,
  calculateDailyAverages,
  getTimeSinceLastDiaper,
  getLastDiaperTime,
  shouldAlertDoctor,
  quickLogWet,
  quickLogDirty,
  quickLogMixed
} from '../api/diapers';


const DiaperTracker = () => {
  const navigate = useNavigate();
  
  // State management
  const [diaperHistory, setDiaperHistory] = useState([]);
  const [todayDiapers, setTodayDiapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    type: 'wet',
    consistency: 'normal',
    color: 'yellow',
    notes: '',
    timestamp: new Date().toISOString().slice(0, 16),
    rash: false,
    rashSeverity: 'none',
    rashLocation: '',
    creamApplied: false,
    creamType: '',
    diaperSize: '',
    brand: ''
  });
  
  // Stats and analytics
  const [stats, setStats] = useState({
    todayTotal: 0,
    wet: 0,
    dirty: 0,
    mixed: 0,
    averages: {},
    timeSinceLast: '',
    alerts: []
  });
  
  const [analytics, setAnalytics] = useState({});
  const [weeklySummary, setWeeklySummary] = useState({});
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  
  // Options
  const diaperTypes = [
    { value: 'wet', label: 'Wet', icon: 'fas fa-tint', color: 'primary', bg: 'bg-blue-100' },
    { value: 'dirty', label: 'Dirty', icon: 'fas fa-poop', color: 'brown', bg: 'bg-brown-100' },
    { value: 'mixed', label: 'Mixed', icon: 'fas fa-exchange-alt', color: 'purple', bg: 'bg-purple-100' }
  ];
  
  const consistencyOptions = [
    { value: 'normal', label: 'Normal', description: 'Typical consistency' },
    { value: 'soft', label: 'Soft', description: 'Soft but formed' },
    { value: 'hard', label: 'Hard', description: 'Hard, pellet-like' },
    { value: 'watery', label: 'Watery', description: 'Liquid, diarrhea' },
    { value: 'mucous', label: 'Mucous', description: 'Contains mucous' },
    { value: 'seedy', label: 'Seedy', description: 'Breastfed baby typical' }
  ];
  
  const colorOptions = [
    { value: 'yellow', label: 'Yellow', color: '#ffd700', description: 'Normal for breastfed' },
    { value: 'brown', label: 'Brown', color: '#8b4513', description: 'Normal for formula-fed' },
    { value: 'green', label: 'Green', color: '#228b22', description: 'Normal variation' },
    { value: 'mustard', label: 'Mustard', color: '#e6b800', description: 'Breastfed normal' },
    { value: 'black', label: 'Black', color: '#000000', description: 'Contact doctor', alert: true },
    { value: 'red', label: 'Red', color: '#dc3545', description: 'Contact doctor', alert: true },
    { value: 'white', label: 'White', color: '#ffffff', description: 'Contact doctor', alert: true }
  ];
  
  const rashSeverityOptions = [
    { value: 'none', label: 'None', color: 'success' },
    { value: 'mild', label: 'Mild', color: 'warning' },
    { value: 'moderate', label: 'Moderate', color: 'warning' },
    { value: 'severe', label: 'Severe', color: 'danger' }
  ];
  
  const diaperSizes = ['Newborn', 'Size 1', 'Size 2', 'Size 3', 'Size 4', 'Size 5', 'Size 6', 'Size 7'];
  
  // Initial data fetching
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (todayDiapers.length > 0) {
      const newStats = calculateStats();
      setStats(newStats);
    }
  }, [todayDiapers]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [history, today, statsData, weekly, analyticsData] = await Promise.all([
        getDiaperHistory({ limit: 20 }),
        getTodayDiapers(),
        getDiaperStats('today'),
        getWeeklySummary(),
        getDiaperAnalytics('week')
      ]);
      
      setDiaperHistory(history);
      setTodayDiapers(today);
      setStats(prev => ({ ...prev, ...statsData }));
      setWeeklySummary(weekly);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch diaper data:', error);
      setError('Failed to load diaper data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const lastDiaper = getLastDiaperTime(todayDiapers);
    const timeSinceLast = getTimeSinceLastDiaper(todayDiapers);
    const averages = calculateDailyAverages(diaperHistory);
    
    const alerts = [];
    todayDiapers.forEach(diaper => {
      const diaperAlerts = shouldAlertDoctor(diaper);
      alerts.push(...diaperAlerts);
    });
    
    const todayStats = todayDiapers.reduce((acc, diaper) => {
      acc.total++;
      acc[diaper.type]++;
      return acc;
    }, { total: 0, wet: 0, dirty: 0, mixed: 0 });
    
    return {
      todayTotal: todayStats.total,
      wet: todayStats.wet,
      dirty: todayStats.dirty,
      mixed: todayStats.mixed,
      averages,
      timeSinceLast,
      alerts: [...new Set(alerts)], // Remove duplicates
      lastDiaper
    };
  };

  // Filter diapers
  const filteredDiapers = useMemo(() => {
    let filtered = filterDate ? diaperHistory.filter(d => {
      const diaperDate = new Date(d.timestamp).toISOString().split('T')[0];
      return diaperDate === filterDate;
    }) : diaperHistory;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.type === filterType);
    }
    
    return filtered;
  }, [diaperHistory, filterDate, filterType]);

  // Format date and time
  const formatDateTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        full: date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch {
      return { date: 'Invalid date', time: '', full: 'Invalid date' };
    }
  };

  const getDiaperTypeInfo = (type) => {
    return diaperTypes.find(t => t.value === type) || diaperTypes[0];
  };

  const getConsistencyText = (consistency) => {
    const option = consistencyOptions.find(c => c.value === consistency);
    return option ? option.label : consistency;
  };

  const getColorText = (color) => {
    const option = colorOptions.find(c => c.value === color);
    return option ? option.label : color;
  };

  // Form handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate data
    const validation = validateDiaperData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const diaperData = {
        ...formData,
        timestamp: new Date(formData.timestamp).toISOString(),
        date: new Date(formData.timestamp).toISOString().split('T')[0]
      };
      
      let result;
      
      if (editingId) {
        result = await updateDiaper(editingId, diaperData);
      } else {
        result = await addDiaper(diaperData);
      }
      
      if (result.success) {
        setSuccess(editingId ? 'Diaper updated successfully!' : 'Diaper logged successfully!');
        
        // Reset form if not editing
        if (!editingId) {
          resetForm();
        } else {
          setIsEditing(false);
          setEditingId(null);
        }
        
        // Refresh data
        await fetchData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save diaper:', error);
      setError(error.message || 'Failed to save diaper. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (diaper) => {
    setEditingId(diaper._id || diaper.id);
    setIsEditing(true);
    setFormData({
      type: diaper.type || 'wet',
      consistency: diaper.consistency || 'normal',
      color: diaper.color || 'yellow',
      notes: diaper.notes || '',
      timestamp: diaper.timestamp ? diaper.timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16),
      rash: diaper.rash || false,
      rashSeverity: diaper.rashSeverity || 'none',
      rashLocation: diaper.rashLocation || '',
      creamApplied: diaper.creamApplied || false,
      creamType: diaper.creamType || '',
      diaperSize: diaper.diaperSize || '',
      brand: diaper.brand || ''
    });
    setActiveTab('log');
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteDiaper(deletingId);
      if (result.success) {
        setSuccess('Diaper record deleted successfully!');
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to delete diaper record.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'wet',
      consistency: 'normal',
      color: 'yellow',
      notes: '',
      timestamp: new Date().toISOString().slice(0, 16),
      rash: false,
      rashSeverity: 'none',
      rashLocation: '',
      creamApplied: false,
      creamType: '',
      diaperSize: '',
      brand: ''
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  // Quick log functions
  const handleQuickLog = async (type, consistency = 'normal', color = 'yellow') => {
    setError('');
    setSuccess('');
    
    try {
      setIsSubmitting(true);
      
      const diaperData = {
        type,
        consistency,
        color,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await addDiaper(diaperData);
      
      if (result.success) {
        setSuccess(`${type === 'wet' ? 'Wet' : type === 'dirty' ? 'Dirty' : 'Mixed'} diaper logged!`);
        await fetchData();
        
        setTimeout(() => {
          setSuccess('');
          setShowQuickLog(false);
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to quick log diaper:', error);
      setError(error.message || 'Failed to log diaper.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterType('all');
  };

  const handleRetry = () => {
    fetchData();
  };

  // Loading state
  if (isLoading && diaperHistory.length === 0) {
    return (
      <div className="diaper-tracker-page">
        <Navbar />
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
            <p className="mt-3">Loading diaper data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="diaper-tracker-page">
      <Navbar />
      
      <main className="container">
        {/* Header */}
        <div className="page-header">
          <button 
            onClick={() => navigate('/trackers')}
            className="btn btn-secondary mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Trackers
          </button>
          <h1>Diaper Tracker</h1>
          <p className="text-secondary">
            Track diaper changes and monitor your baby's health
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger fade-in">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success fade-in">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </div>
        )}

        {/* Alerts for unusual diapers */}
        {stats.alerts.length > 0 && (
          <div className="alert alert-warning fade-in">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Important:</strong> {stats.alerts.join('. ')}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid-4-col mb-4">
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-tint text-primary"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.wet}</div>
              <div className="stat-label">Wet Today</div>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-poop text-brown"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.dirty}</div>
              <div className="stat-label">Dirty Today</div>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-exchange-alt text-purple"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.mixed}</div>
              <div className="stat-label">Mixed Today</div>
            </div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-clock text-success"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.timeSinceLast}</div>
              <div className="stat-label">Last Change</div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation mb-4">
          <button 
            className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            <i className="fas fa-plus-circle me-2"></i>
            Log Diaper
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fas fa-history me-2"></i>
            History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-bar me-2"></i>
            Analytics
          </button>
        </div>

        {/* Quick Log Buttons */}
        <div className="card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Quick Log</h3>
            <button 
              onClick={() => setShowQuickLog(!showQuickLog)}
              className="btn btn-sm btn-secondary"
            >
              {showQuickLog ? 'Hide' : 'Show'} Options
            </button>
          </div>
          
          <div className="quick-log-buttons">
            <button
              onClick={() => handleQuickLog('wet')}
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <i className="fas fa-tint me-2"></i>
              Log Wet Diaper
            </button>
            
            {showQuickLog && (
              <div className="grid-2-col mt-3">
                <button
                  onClick={() => handleQuickLog('dirty', 'normal', 'yellow')}
                  className="btn btn-brown"
                  disabled={isSubmitting}
                >
                  <i className="fas fa-poop me-2"></i>
                  Log Dirty Diaper
                </button>
                
                <button
                  onClick={() => handleQuickLog('mixed', 'normal', 'yellow')}
                  className="btn btn-purple"
                  disabled={isSubmitting}
                >
                  <i className="fas fa-exchange-alt me-2"></i>
                  Log Mixed Diaper
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Log Tab */}
          {activeTab === 'log' && (
            <div className="grid-2-col">
              <div className="card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3>{isEditing ? 'Edit Diaper Record' : 'Detailed Log'}</h3>
                  {isEditing && (
                    <button 
                      onClick={resetForm}
                      className="btn btn-sm btn-secondary"
                      disabled={isSubmitting}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Diaper Type</label>
                    <div className="diaper-type-selector">
                      {diaperTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          className={`diaper-type-btn ${formData.type === type.value ? 'active' : ''} ${type.color}`}
                          onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                          disabled={isSubmitting}
                        >
                          <i className={`${type.icon} fa-lg mb-2`}></i>
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dirty/Mixed specific fields */}
                  {(formData.type === 'dirty' || formData.type === 'mixed') && (
                    <>
                      <div className="form-group">
                        <label htmlFor="consistency" className="form-label">
                          Consistency
                        </label>
                        <select
                          id="consistency"
                          name="consistency"
                          value={formData.consistency}
                          onChange={handleChange}
                          className="form-control"
                          disabled={isSubmitting}
                        >
                          {consistencyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Color</label>
                        <div className="color-selector">
                          {colorOptions.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              className={`color-btn ${formData.color === color.value ? 'active' : ''} ${color.alert ? 'alert' : ''}`}
                              onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                              disabled={isSubmitting}
                              title={color.description}
                            >
                              <div 
                                className="color-sample"
                                style={{ backgroundColor: color.color }}
                              ></div>
                              <span>{color.label}</span>
                            </button>
                          ))}
                        </div>
                        {(formData.color === 'black' || formData.color === 'red' || formData.color === 'white') && (
                          <div className="alert alert-warning mt-2">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Please contact your doctor if this persists
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label htmlFor="timestamp" className="form-label">
                      Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      id="timestamp"
                      name="timestamp"
                      value={formData.timestamp}
                      onChange={handleChange}
                      className="form-control"
                      required
                      disabled={isSubmitting}
                      max={new Date().toISOString().slice(0, 16)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Any notes about this diaper change..."
                      rows="3"
                      disabled={isSubmitting}
                      maxLength="500"
                    />
                    <small className="form-text text-muted">
                      {500 - (formData.notes?.length || 0)} characters remaining
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Details</label>
                    <div className="grid-2-col">
                      <div className="form-group form-check">
                        <input
                          type="checkbox"
                          id="rash"
                          name="rash"
                          checked={formData.rash}
                          onChange={handleChange}
                          className="form-check-input"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="rash" className="form-check-label">
                          Diaper Rash?
                        </label>
                      </div>
                      
                      <div className="form-group form-check">
                        <input
                          type="checkbox"
                          id="creamApplied"
                          name="creamApplied"
                          checked={formData.creamApplied}
                          onChange={handleChange}
                          className="form-check-input"
                          disabled={isSubmitting}
                        />
                        <label htmlFor="creamApplied" className="form-check-label">
                          Cream Applied?
                        </label>
                      </div>
                    </div>
                    
                    {formData.rash && (
                      <div className="mt-2">
                        <div className="form-group">
                          <label htmlFor="rashSeverity" className="form-label">
                            Rash Severity
                          </label>
                          <select
                            id="rashSeverity"
                            name="rashSeverity"
                            value={formData.rashSeverity}
                            onChange={handleChange}
                            className="form-control"
                            disabled={isSubmitting}
                          >
                            {rashSeverityOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="rashLocation" className="form-label">
                            Rash Location
                          </label>
                          <input
                            type="text"
                            id="rashLocation"
                            name="rashLocation"
                            value={formData.rashLocation}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g., Buttocks, Thighs"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}
                    
                    {formData.creamApplied && (
                      <div className="form-group">
                        <label htmlFor="creamType" className="form-label">
                          Cream Type
                        </label>
                        <input
                          type="text"
                          id="creamType"
                          name="creamType"
                          value={formData.creamType}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="e.g., Zinc oxide, Petroleum jelly"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {isEditing ? 'Updating...' : 'Logging...'}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {isEditing ? 'Update' : 'Log'} Diaper Change
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Today's Summary */}
              <div className="card">
                <h3>Today's Summary</h3>
                <div className="today-stats">
                  <div className="stats-summary">
                    <div className="stat-row">
                      <span className="stat-label">Total Changes:</span>
                      <span className="stat-value">{stats.todayTotal}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Last Change:</span>
                      <span className="stat-value">{stats.timeSinceLast}</span>
                    </div>
                    {stats.averages.dailyAverage && (
                      <div className="stat-row">
                        <span className="stat-label">Daily Average:</span>
                        <span className="stat-value">{stats.averages.dailyAverage.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="today-chart">
                    <h5 className="mb-3">Today's Distribution</h5>
                    <div className="distribution-bar">
                      <div 
                        className="bar-segment wet"
                        style={{ width: `${(stats.wet / Math.max(stats.todayTotal, 1)) * 100}%` }}
                      >
                        <span>Wet: {stats.wet}</span>
                      </div>
                      <div 
                        className="bar-segment dirty"
                        style={{ width: `${(stats.dirty / Math.max(stats.todayTotal, 1)) * 100}%` }}
                      >
                        <span>Dirty: {stats.dirty}</span>
                      </div>
                      <div 
                        className="bar-segment mixed"
                        style={{ width: `${(stats.mixed / Math.max(stats.todayTotal, 1)) * 100}%` }}
                      >
                        <span>Mixed: {stats.mixed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Diaper History</h3>
                <div className="d-flex gap-2 align-items-center">
                  {/* Filters */}
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="form-control form-control-sm"
                    style={{width: '150px'}}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="form-select form-select-sm"
                    style={{width: '120px'}}
                  >
                    <option value="all">All Types</option>
                    {diaperTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  
                  {(filterDate || filterType !== 'all') && (
                    <button 
                      onClick={clearFilters}
                      className="btn btn-sm btn-secondary"
                    >
                      Clear
                    </button>
                  )}
                  
                  <button 
                    onClick={handleRetry}
                    className="btn btn-sm btn-secondary"
                    disabled={isLoading}
                  >
                    <i className="fas fa-redo"></i>
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-5">
                  <LoadingSpinner />
                  <p className="mt-3">Loading diaper history...</p>
                </div>
              ) : filteredDiapers.length > 0 ? (
                <div className="diaper-history">
                  {filteredDiapers.map((diaper, index) => {
                    const typeInfo = getDiaperTypeInfo(diaper.type);
                    const time = formatDateTime(diaper.timestamp);
                    
                    return (
                      <div key={diaper._id || index} className="history-item">
                        <div className={`history-icon ${typeInfo.bg}`}>
                          <i className={`${typeInfo.icon} text-${typeInfo.color}`}></i>
                        </div>
                        <div className="history-content">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="history-title">
                                {typeInfo.label} Diaper
                                {(diaper.type === 'dirty' || diaper.type === 'mixed') && diaper.consistency && (
                                  <span className="history-detail ms-2">
                                    ({getConsistencyText(diaper.consistency)}, {getColorText(diaper.color)})
                                  </span>
                                )}
                              </div>
                              <div className="history-meta">
                                <span className="history-time">
                                  <i className="fas fa-calendar me-1"></i>
                                  {time.full}
                                </span>
                                {diaper.rash && (
                                  <span className="history-rash ms-3">
                                    <i className="fas fa-exclamation-triangle text-warning me-1"></i>
                                    Rash
                                  </span>
                                )}
                                {diaper.creamApplied && (
                                  <span className="history-cream ms-3">
                                    <i className="fas fa-prescription-bottle-alt text-success me-1"></i>
                                    Cream
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEdit(diaper)}
                                className="btn btn-sm btn-outline-primary me-2"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(diaper._id || diaper.id)}
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          
                          {/* Additional Details */}
                          <div className="history-details mt-2">
                            {diaper.rash && diaper.rashSeverity !== 'none' && (
                              <span className="detail-tag warning">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                {diaper.rashSeverity} rash
                              </span>
                            )}
                            {diaper.creamApplied && diaper.creamType && (
                              <span className="detail-tag success">
                                <i className="fas fa-prescription-bottle-alt me-1"></i>
                                {diaper.creamType}
                              </span>
                            )}
                            {diaper.diaperSize && (
                              <span className="detail-tag info">
                                <i className="fas fa-ruler me-1"></i>
                                Size {diaper.diaperSize}
                              </span>
                            )}
                            {diaper.brand && (
                              <span className="detail-tag secondary">
                                <i className="fas fa-tag me-1"></i>
                                {diaper.brand}
                              </span>
                            )}
                          </div>
                          
                          {diaper.notes && (
                            <div className="history-notes mt-2">
                              <i className="fas fa-sticky-note me-1"></i>
                              <span className="text-secondary">{diaper.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state text-center py-5">
                  <i className="fas fa-history fa-3x mb-3 text-secondary"></i>
                  <h4>No Diaper History</h4>
                  <p className="text-secondary mb-4">
                    {filterDate || filterType !== 'all' 
                      ? 'No diapers found with current filters' 
                      : 'Start by logging your baby\'s first diaper change'
                    }
                  </p>
                  {(filterDate || filterType !== 'all') && (
                    <button 
                      onClick={clearFilters}
                      className="btn btn-secondary me-2"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('log')}
                    className="btn btn-primary"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Log First Diaper
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="grid-2-col">
              <div className="card">
                <h3>Weekly Overview</h3>
                <div className="analytics-section">
                  {weeklySummary.days && Object.keys(weeklySummary.days).length > 0 ? (
                    <div className="weekly-chart">
                      {Object.entries(weeklySummary.days).map(([day, stats]) => (
                        <div key={day} className="week-day">
                          <div className="day-label">{day.slice(0, 3)}</div>
                          <div className="day-bar">
                            <div 
                              className="bar wet" 
                              style={{ height: `${(stats.wet / Math.max(stats.total, 1)) * 50}px` }}
                            ></div>
                            <div 
                              className="bar dirty" 
                              style={{ height: `${(stats.dirty / Math.max(stats.total, 1)) * 50}px` }}
                            ></div>
                            <div 
                              className="bar mixed" 
                              style={{ height: `${(stats.mixed / Math.max(stats.total, 1)) * 50}px` }}
                            ></div>
                          </div>
                          <div className="day-total">{stats.total}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-secondary">No weekly data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card">
                <h3>Patterns & Trends</h3>
                <div className="trends-section">
                  {stats.averages.dailyAverage ? (
                    <div className="trends-list">
                      <div className="trend-item">
                        <i className="fas fa-chart-line text-primary me-3"></i>
                        <div>
                          <div className="trend-label">Daily Average</div>
                          <div className="trend-value">{stats.averages.dailyAverage.toFixed(1)} diapers/day</div>
                        </div>
                      </div>
                      
                      <div className="trend-item">
                        <i className="fas fa-tint text-blue me-3"></i>
                        <div>
                          <div className="trend-label">Wet Diaper Average</div>
                          <div className="trend-value">{stats.averages.wetAverage?.toFixed(1) || 0}/day</div>
                        </div>
                      </div>
                      
                      <div className="trend-item">
                        <i className="fas fa-poop text-brown me-3"></i>
                        <div>
                          <div className="trend-label">Dirty Diaper Average</div>
                          <div className="trend-value">{stats.averages.dirtyAverage?.toFixed(1) || 0}/day</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-secondary">Not enough data for trends</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Health Guidelines */}
        <div className="card mt-4">
          <h3>Diaper Health Guidelines</h3>
          <div className="guidelines-grid">
            <div className="guideline-item">
              <div className="guideline-icon">
                <i className="fas fa-check-circle text-success"></i>
              </div>
              <div>
                <h5>Normal Range</h5>
                <p className="text-secondary">
                  Newborns: 6-8 wet, 3-4 dirty diapers daily<br />
                  1-6 months: 4-6 wet, 1-3 dirty diapers daily
                </p>
              </div>
            </div>
            
            <div className="guideline-item">
              <div className="guideline-icon">
                <i className="fas fa-exclamation-triangle text-warning"></i>
              </div>
              <div>
                <h5>Warning Signs</h5>
                <p className="text-secondary">
                  • Red, white, or black stool<br />
                  • No wet diapers for 8+ hours<br />
                  • Watery stools 3+ times
                </p>
              </div>
            </div>
            
            <div className="guideline-item">
              <div className="guideline-icon">
                <i className="fas fa-info-circle text-info"></i>
              </div>
              <div>
                <h5>Hydration Check</h5>
                <p className="text-secondary">
                  Fewer than 6 wet diapers in 24 hours<br />
                  may indicate dehydration
                </p>
              </div>
            </div>
            
            <div className="guideline-item">
              <div className="guideline-icon">
                <i className="fas fa-baby text-primary"></i>
              </div>
              <div>
                <h5>Breastfed Babies</h5>
                <p className="text-secondary">
                  Stool is typically yellow, soft,<br />
                  and may contain small seeds
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this diaper record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaperTracker;