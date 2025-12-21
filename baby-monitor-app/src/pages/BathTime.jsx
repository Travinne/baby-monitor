import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  addBath, 
  getBathHistory,
  updateBath,
  deleteBath,
  getBathStats,
  validateBathData,
  calculateAverageDuration,
  getMostUsedProducts,
  getRecentBathTimes,
  getBathFrequency
} from '../api/baths';


const BathTime = () => {
  const navigate = useNavigate();
  
  // State management
  const [bathHistory, setBathHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    time: new Date().toISOString().slice(0, 16),
    duration: '',
    waterTemperature: 'warm',
    mood: 'happy',
    productsUsed: [],
    notes: '',
    skinCondition: 'normal',
    hairWashed: false,
    nailsTrimmed: false
  });
  
  const [productsInput, setProductsInput] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stats, setStats] = useState({});
  
  // Options
  const moodOptions = [
    { value: 'happy', label: '😊 Happy', icon: 'fas fa-laugh', color: 'success' },
    { value: 'calm', label: '😌 Calm', icon: 'fas fa-smile', color: 'info' },
    { value: 'neutral', label: '😐 Neutral', icon: 'fas fa-meh', color: 'secondary' },
    { value: 'fussy', label: '😟 Fussy', icon: 'fas fa-frown', color: 'warning' },
    { value: 'crying', label: '😢 Crying', icon: 'fas fa-sad-tear', color: 'danger' },
    { value: 'sleepy', label: '😴 Sleepy', icon: 'fas fa-bed', color: 'purple' }
  ];
  
  const temperatureOptions = [
    { value: 'cool', label: 'Cool', description: 'Below 36°C / 96°F', color: 'info' },
    { value: 'warm', label: 'Warm', description: '36-38°C / 96-100°F', color: 'warning' },
    { value: 'hot', label: 'Hot', description: 'Above 38°C / 100°F', color: 'danger' }
  ];
  
  const skinConditionOptions = [
    { value: 'normal', label: 'Normal', icon: 'fas fa-check-circle' },
    { value: 'dry', label: 'Dry', icon: 'fas fa-hand-sparkles' },
    { value: 'rash', label: 'Rash', icon: 'fas fa-allergies' },
    { value: 'eczema', label: 'Eczema', icon: 'fas fa-hand-paper' },
    { value: 'sunburn', label: 'Sunburn', icon: 'fas fa-sun' }
  ];
  
  // Initial data fetching
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (bathHistory.length > 0) {
      const newStats = calculateStats();
      setStats(newStats);
    }
  }, [bathHistory]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [history, statsData] = await Promise.all([
        getBathHistory(),
        getBathStats('week')
      ]);
      
      setBathHistory(history);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch bath data:', error);
      setError('Failed to load bath data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    return {
      totalBaths: bathHistory.length,
      averageDuration: calculateAverageDuration(bathHistory),
      mostUsedProducts: getMostUsedProducts(bathHistory),
      recentBaths: getRecentBathTimes(bathHistory, 3),
      frequency: getBathFrequency(bathHistory),
      favoriteMood: getFavoriteMood(),
      lastBath: bathHistory.length > 0 ? new Date(bathHistory[0].time || bathHistory[0].timestamp) : null
    };
  };

  const getFavoriteMood = () => {
    if (bathHistory.length === 0) return null;
    
    const moodCounts = {};
    bathHistory.forEach(bath => {
      moodCounts[bath.mood] = (moodCounts[bath.mood] || 0) + 1;
    });
    
    const favorite = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      mood: favorite[0],
      count: favorite[1],
      percentage: Math.round((favorite[1] / bathHistory.length) * 100)
    };
  };

  // Filter baths by date
  const filteredBaths = useMemo(() => {
    if (!filterDate) return bathHistory;
    
    return bathHistory.filter(bath => {
      const bathDate = new Date(bath.time || bath.timestamp).toDateString();
      const filter = new Date(filterDate).toDateString();
      return bathDate === filter;
    });
  }, [bathHistory, filterDate]);

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

  const getMoodInfo = (mood) => {
    return moodOptions.find(m => m.value === mood) || moodOptions[0];
  };

  const getTemperatureInfo = (temp) => {
    return temperatureOptions.find(t => t.value === temp) || temperatureOptions[1];
  };

  const getSkinConditionInfo = (condition) => {
    return skinConditionOptions.find(s => s.value === condition) || skinConditionOptions[0];
  };

  // Form handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate data
    const validation = validateBathData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const bathData = {
        ...formData,
        duration: parseInt(formData.duration) || 0,
        timestamp: formData.time,
        date: new Date(formData.time).toISOString().split('T')[0]
      };
      
      let result;
      
      if (editingId) {
        result = await updateBath(editingId, bathData);
      } else {
        result = await addBath(bathData);
      }
      
      if (result.success) {
        setSuccess(editingId ? 'Bath updated successfully!' : 'Bath logged successfully!');
        
        // Reset form
        if (!editingId) {
          resetForm();
        }
        
        // Refresh data
        await fetchData();
        
        // Exit edit mode if editing
        if (editingId) {
          setIsEditing(false);
          setEditingId(null);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save bath:', error);
      setError(error.message || 'Failed to save bath. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (bath) => {
    setEditingId(bath._id || bath.id);
    setIsEditing(true);
    setFormData({
      time: bath.time ? bath.time.slice(0, 16) : new Date(bath.timestamp).toISOString().slice(0, 16),
      duration: bath.duration?.toString() || '',
      waterTemperature: bath.waterTemperature || 'warm',
      mood: bath.mood || 'happy',
      productsUsed: bath.productsUsed || [],
      notes: bath.notes || '',
      skinCondition: bath.skinCondition || 'normal',
      hairWashed: bath.hairWashed || false,
      nailsTrimmed: bath.nailsTrimmed || false
    });
    setProductsInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteBath(deletingId);
      if (result.success) {
        setSuccess('Bath record deleted successfully!');
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to delete bath record.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      time: new Date().toISOString().slice(0, 16),
      duration: '',
      waterTemperature: 'warm',
      mood: 'happy',
      productsUsed: [],
      notes: '',
      skinCondition: 'normal',
      hairWashed: false,
      nailsTrimmed: false
    });
    setProductsInput('');
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

  const handleProductAdd = () => {
    if (productsInput.trim() && formData.productsUsed.length < 10) {
      setFormData(prev => ({
        ...prev,
        productsUsed: [...prev.productsUsed, productsInput.trim()]
      }));
      setProductsInput('');
    }
  };

  const handleProductRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      productsUsed: prev.productsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleProductKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProductAdd();
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  const clearFilter = () => {
    setFilterDate('');
  };

  // Loading state
  if (isLoading && bathHistory.length === 0) {
    return (
      <div className="bath-time-page">
        <Navbar />
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
            <p className="mt-3">Loading bath data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bath-time-page">
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
          <h1>Bath Time Tracker</h1>
          <p className="text-secondary">
            Log bath times and track your baby's bath routine
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

        <div className="grid-2-col">
          {/* Bath Form */}
          <div className="card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>{isEditing ? 'Edit Bath Record' : 'Log Bath Time'}</h3>
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
                <label htmlFor="time" className="form-label">
                  <i className="fas fa-clock me-2"></i>
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="form-control"
                  required
                  disabled={isSubmitting}
                  max={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration" className="form-label">
                  <i className="fas fa-hourglass-half me-2"></i>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter bath duration"
                  min="1"
                  max="60"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-thermometer-half me-2"></i>
                  Water Temperature
                </label>
                <div className="temperature-selector">
                  {temperatureOptions.map(temp => (
                    <button
                      key={temp.value}
                      type="button"
                      className={`temp-btn ${formData.waterTemperature === temp.value ? 'active' : ''} ${temp.color}`}
                      onClick={() => setFormData(prev => ({ ...prev, waterTemperature: temp.value }))}
                      disabled={isSubmitting}
                    >
                      <span className="temp-label">{temp.label}</span>
                      <span className="temp-description">{temp.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-smile me-2"></i>
                  Baby's Mood
                </label>
                <div className="mood-selector">
                  {moodOptions.map(mood => (
                    <button
                      key={mood.value}
                      type="button"
                      className={`mood-btn ${formData.mood === mood.value ? 'active' : ''} ${mood.color}`}
                      onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                      disabled={isSubmitting}
                    >
                      <i className={`${mood.icon} fa-lg mb-2`}></i>
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-pump-soap me-2"></i>
                  Products Used
                </label>
                <div className="products-input-group">
                  <input
                    type="text"
                    value={productsInput}
                    onChange={(e) => setProductsInput(e.target.value)}
                    onKeyPress={handleProductKeyPress}
                    className="form-control"
                    placeholder="Enter product name (e.g., Baby Shampoo)"
                    disabled={isSubmitting || formData.productsUsed.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={handleProductAdd}
                    className="btn btn-outline-primary"
                    disabled={isSubmitting || !productsInput.trim() || formData.productsUsed.length >= 10}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                {formData.productsUsed.length > 0 && (
                  <div className="products-list mt-2">
                    {formData.productsUsed.map((product, index) => (
                      <div key={index} className="product-tag">
                        <span>{product}</span>
                        <button
                          type="button"
                          onClick={() => handleProductRemove(index)}
                          className="btn btn-sm btn-link text-danger"
                          disabled={isSubmitting}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-hand-sparkles me-2"></i>
                  Skin Condition After Bath
                </label>
                <div className="skin-selector">
                  {skinConditionOptions.map(condition => (
                    <button
                      key={condition.value}
                      type="button"
                      className={`skin-btn ${formData.skinCondition === condition.value ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, skinCondition: condition.value }))}
                      disabled={isSubmitting}
                    >
                      <i className={`${condition.icon} me-1`}></i>
                      {condition.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group form-check">
                  <input
                    type="checkbox"
                    id="hairWashed"
                    name="hairWashed"
                    checked={formData.hairWashed}
                    onChange={handleChange}
                    className="form-check-input"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="hairWashed" className="form-check-label">
                    Hair Washed
                  </label>
                </div>
                
                <div className="form-group form-check">
                  <input
                    type="checkbox"
                    id="nailsTrimmed"
                    name="nailsTrimmed"
                    checked={formData.nailsTrimmed}
                    onChange={handleChange}
                    className="form-check-input"
                    disabled={isSubmitting}
                  />
                  <label htmlFor="nailsTrimmed" className="form-check-label">
                    Nails Trimmed
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  <i className="fas fa-sticky-note me-2"></i>
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Any notes about the bath..."
                  rows="3"
                  disabled={isSubmitting}
                  maxLength="500"
                />
                <small className="form-text text-muted">
                  {500 - (formData.notes?.length || 0)} characters remaining
                </small>
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
                    <i className="fas fa-shower me-2"></i>
                    {isEditing ? 'Update Bath' : 'Log Bath Time'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History and Stats */}
          <div className="card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0">Bath History</h3>
              <div className="d-flex gap-2">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="form-control form-control-sm"
                  style={{width: '150px'}}
                  max={new Date().toISOString().split('T')[0]}
                />
                {filterDate && (
                  <button 
                    onClick={clearFilter}
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
            
            {/* Stats Overview */}
            <div className="stats-overview mb-4">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-shower text-primary"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalBaths || 0}</div>
                  <div className="stat-label">Total Baths</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-clock text-success"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.averageDuration || 0}m</div>
                  <div className="stat-label">Avg. Duration</div>
                </div>
              </div>
              
              {stats.favoriteMood && (
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className={`${getMoodInfo(stats.favoriteMood.mood).icon} text-warning`}></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.favoriteMood.percentage}%</div>
                    <div className="stat-label">Most Common Mood</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Baths */}
            <div className="history-section">
              <h4 className="mb-3">Recent Baths</h4>
              
              {isLoading ? (
                <div className="text-center py-3">
                  <LoadingSpinner size="small" />
                  <p className="mt-2">Loading history...</p>
                </div>
              ) : filteredBaths.length > 0 ? (
                <div className="bath-history">
                  {filteredBaths.map((bath, index) => {
                    const mood = getMoodInfo(bath.mood);
                    const temp = getTemperatureInfo(bath.waterTemperature);
                    const skin = getSkinConditionInfo(bath.skinCondition);
                    const time = formatDateTime(bath.time || bath.timestamp);
                    
                    return (
                      <div key={bath._id || index} className="history-item">
                        <div className="history-icon">
                          <i className={`fas fa-shower text-${mood.color}`}></i>
                        </div>
                        <div className="history-content">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="history-title">
                                {bath.duration} minute bath
                                <span className={`history-temp ms-2 ${temp.color}`}>
                                  <i className="fas fa-thermometer-half me-1"></i>
                                  {temp.label}
                                </span>
                              </div>
                              <div className="history-meta">
                                <span className="history-time">
                                  <i className="fas fa-calendar me-1"></i>
                                  {time.full}
                                </span>
                                <span className="history-mood ms-3">
                                  <i className={`${mood.icon} me-1 text-${mood.color}`}></i>
                                  {mood.label}
                                </span>
                                <span className="history-skin ms-3">
                                  <i className={`${skin.icon} me-1`}></i>
                                  {skin.label}
                                </span>
                              </div>
                            </div>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEdit(bath)}
                                className="btn btn-sm btn-outline-primary me-2"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(bath._id || bath.id)}
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          
                          {/* Additional Details */}
                          <div className="history-details mt-2">
                            {bath.hairWashed && (
                              <span className="detail-tag">
                                <i className="fas fa-air-freshener me-1"></i>
                                Hair Washed
                              </span>
                            )}
                            {bath.nailsTrimmed && (
                              <span className="detail-tag">
                                <i className="fas fa-cut me-1"></i>
                                Nails Trimmed
                              </span>
                            )}
                            {bath.productsUsed && bath.productsUsed.length > 0 && (
                              <span className="detail-tag">
                                <i className="fas fa-pump-soap me-1"></i>
                                {bath.productsUsed.length} product{bath.productsUsed.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {bath.productsUsed && bath.productsUsed.length > 0 && (
                            <div className="history-products mt-2">
                              <i className="fas fa-tags me-1"></i>
                              <span className="text-secondary">
                                {bath.productsUsed.join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {bath.notes && (
                            <div className="history-notes mt-2">
                              <i className="fas fa-sticky-note me-1"></i>
                              <span className="text-secondary">{bath.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state text-center py-5">
                  <i className="fas fa-shower fa-3x mb-3 text-secondary"></i>
                  <h4>No Baths Recorded</h4>
                  <p className="text-secondary mb-4">
                    {filterDate ? 'No baths found for the selected date' : 'Start by logging your baby\'s first bath'}
                  </p>
                  {filterDate && (
                    <button 
                      onClick={clearFilter}
                      className="btn btn-secondary me-2"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popular Products */}
        {stats.mostUsedProducts && stats.mostUsedProducts.length > 0 && (
          <div className="card mt-4">
            <h3>Most Used Products</h3>
            <div className="products-list">
              {stats.mostUsedProducts.map((item, index) => (
                <div key={index} className="product-item">
                  <span className="product-rank badge bg-primary me-2">
                    #{index + 1}
                  </span>
                  <span className="product-name">{item.product}</span>
                  <span className="product-count ms-auto">
                    {item.count} time{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bath Safety Tips */}
        <div className="card mt-4">
          <h3>Bath Safety Tips</h3>
          <div className="safety-tips-grid">
            <div className="tip-item">
              <div className="tip-icon">
                <i className="fas fa-thermometer-half text-danger"></i>
              </div>
              <div>
                <h5>Water Temperature</h5>
                <p className="text-secondary">
                  Test water with your wrist or elbow before bathing. Ideal temperature is 37-38°C (98-100°F).
                </p>
              </div>
            </div>
            
            <div className="tip-item">
              <div className="tip-icon">
                <i className="fas fa-hand-holding-water text-primary"></i>
              </div>
              <div>
                <h5>Never Leave Unattended</h5>
                <p className="text-secondary">
                  Never leave baby alone in bath, even for a moment. Gather all supplies before starting.
                </p>
              </div>
            </div>
            
            <div className="tip-item">
              <div className="tip-icon">
                <i className="fas fa-clock text-warning"></i>
              </div>
              <div>
                <h5>Bath Duration</h5>
                <p className="text-secondary">
                  Keep baths short (5-10 minutes) to prevent baby from getting too cold.
                </p>
              </div>
            </div>
            
            <div className="tip-item">
              <div className="tip-icon">
                <i className="fas fa-baby text-success"></i>
              </div>
              <div>
                <h5>Bath Frequency</h5>
                <p className="text-secondary">
                  Newborns: 2-3 times/week. Over-bathing can dry out sensitive skin.
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
              <p>Are you sure you want to delete this bath record? This action cannot be undone.</p>
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

export default BathTime;