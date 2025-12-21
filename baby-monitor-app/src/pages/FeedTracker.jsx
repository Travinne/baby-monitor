// FeedTracker.jsx - Updated version
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  addFeeding, 
  getFeedHistory, 
  getFeedingStats,
  deleteFeeding 
} from '../api/feeding';
import LoadingSpinner from '../components/LoadingSpinner';


const FeedTracker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'breast',
    side: 'left',
    amount: '',
    duration: '',
    notes: '',
    timestamp: new Date().toISOString().slice(0, 16)
  });
  const [feedHistory, setFeedHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    todayTotal: 0,
    last24Hours: 0,
    averageDuration: 0,
    totalAmount: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchFeedData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [history, statsData] = await Promise.all([
        getFeedHistory({ limit: 10, sort: '-timestamp' }), // Add sorting
        getFeedingStats('today')
      ]);
      
      setFeedHistory(Array.isArray(history) ? history : []);
      
      // Make sure statsData has the expected structure
      const formattedStats = {
        todayTotal: statsData?.total || 0,
        last24Hours: statsData?.last24Hours || statsData?.total || 0, // Fallback
        averageDuration: statsData?.averageDuration || 0,
        totalAmount: statsData?.totalAmount || 0
      };
      setStats(formattedStats);
      
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch feed data:', error);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchFeedData();
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError('Failed to load feeding data. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.duration) {
      errors.push('Please enter feeding duration');
    } else if (parseInt(formData.duration) < 1 || parseInt(formData.duration) > 120) {
      errors.push('Duration should be between 1 and 120 minutes');
    }
    
    if (formData.type !== 'breast') {
      if (!formData.amount) {
        errors.push('Please enter amount');
      } else if (parseFloat(formData.amount) <= 0) {
        errors.push('Amount must be greater than 0');
      } else if (formData.type === 'formula' && parseFloat(formData.amount) > 500) {
        errors.push('Formula amount should not exceed 500ml');
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const feedingData = {
        type: formData.type,
        side: formData.type === 'breast' ? formData.side : undefined,
        amount: formData.type !== 'breast' ? parseFloat(formData.amount) : null,
        duration: parseInt(formData.duration),
        notes: formData.notes.trim() || undefined,
        timestamp: formData.timestamp
      };

      const result = await addFeeding(feedingData);
      
      if (result.success) {
        // Reset form but keep the same type
        setFormData({
          type: formData.type, // Keep same type for convenience
          side: formData.type === 'breast' ? formData.side : 'left',
          amount: '',
          duration: '',
          notes: '',
          timestamp: new Date().toISOString().slice(0, 16)
        });

        setSuccess(result.message || 'Feeding logged successfully!');
        
        // Refresh data
        await fetchFeedData();
        
        // Auto-scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success message after 3 seconds
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to log feeding:', error);
      setError(error.message || 'Failed to log feeding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feeding record?')) {
      return;
    }

    try {
      const result = await deleteFeeding(id);
      if (result.success) {
        setSuccess(result.message || 'Feeding record deleted successfully!');
        // Optimistic UI update
        setFeedHistory(prev => prev.filter(feed => feed._id !== id));
        // Refresh stats
        const statsData = await getFeedingStats('today');
        setStats({
          todayTotal: statsData.total || 0,
          last24Hours: statsData.last24Hours || 0,
          averageDuration: statsData.averageDuration || 0,
          totalAmount: statsData.totalAmount || 0
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete feeding:', error);
      setError(error.message || 'Failed to delete feeding record. Please try again.');
      // Refresh data to get correct state
      fetchFeedData();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      }
      
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getFeedTypeInfo = (type) => {
    const types = {
      'breast': { 
        icon: 'fas fa-female', 
        color: 'text-pink-500', 
        label: 'Breast',
        unit: ''
      },
      'formula': { 
        icon: 'fas fa-bottle-water', 
        color: 'text-blue-500', 
        label: 'Formula',
        unit: 'ml'
      },
      'solid': { 
        icon: 'fas fa-utensils', 
        color: 'text-green-500', 
        label: 'Solid',
        unit: 'g'
      }
    };
    
    return types[type] || { 
      icon: 'fas fa-utensils', 
      color: 'text-gray-500', 
      label: 'Other',
      unit: ''
    };
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchFeedData();
  };

  return (
    <div className="tracker-page">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="page-header mb-6">
          <button 
            onClick={() => navigate('/trackers')}
            className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors mb-4"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Trackers
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Feeding Tracker</h1>
          <p className="text-gray-600 mt-2">
            Log feedings and monitor your baby's nutrition
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 animate-fadeIn">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 animate-fadeIn">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-3"></i>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feed Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Log New Feeding</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-3">Feeding Type</label>
                <div className="flex space-x-3">
                  {[
                    { value: 'breast', icon: 'fas fa-female', label: 'Breast' },
                    { value: 'formula', icon: 'fas fa-bottle-water', label: 'Formula' },
                    { value: 'solid', icon: 'fas fa-utensils', label: 'Solid' }
                  ].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      className={`flex-1 flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                        formData.type === type.value 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                      onClick={() => handleChange({ target: { name: 'type', value: type.value } })}
                    >
                      <i className={`${type.icon} text-2xl mb-2`}></i>
                      <span className="font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breastfeeding specific */}
              {formData.type === 'breast' && (
                <div className="mb-6">
                  <label className="block text-gray-700 mb-3">Breast Side</label>
                  <div className="flex space-x-3">
                    {['left', 'right', 'both'].map(side => (
                      <button
                        key={side}
                        type="button"
                        className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                          formData.side === side 
                            ? 'border-pink-500 bg-pink-50 text-pink-600' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                        onClick={() => handleChange({ target: { name: 'side', value: side } })}
                      >
                        <i className={`fas fa-${side === 'both' ? 'exchange-alt' : 'hand-point-' + (side === 'left' ? 'right' : 'left')} mr-2`}></i>
                        <span className="capitalize">{side}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Formula/Solid specific */}
              {(formData.type === 'formula' || formData.type === 'solid') && (
                <div className="mb-6">
                  <label htmlFor="amount" className="block text-gray-700 mb-2">
                    Amount <span className="text-sm text-gray-500">({formData.type === 'formula' ? 'ml' : 'grams'})</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Enter amount in ${formData.type === 'formula' ? 'milliliters' : 'grams'}`}
                    min="0"
                    step={formData.type === 'formula' ? '10' : '1'}
                    required={formData.type !== 'breast'}
                  />
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="duration" className="block text-gray-700 mb-2">
                  Duration <span className="text-sm text-gray-500">(minutes)</span>
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter feeding duration"
                  min="1"
                  max="120"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="timestamp" className="block text-gray-700 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="timestamp"
                  name="timestamp"
                  value={formData.timestamp}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="notes" className="block text-gray-700 mb-2">
                  Notes <span className="text-sm text-gray-500">(Optional)</span>
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any notes about this feeding..."
                  rows="3"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                    Logging...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="fas fa-save mr-2"></i>
                    Log Feeding
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Stats & History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Summary</h3>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Loading feeding data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.todayTotal}</div>
                    <div className="text-sm text-gray-600 mt-1">Feeds Today</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.last24Hours}</div>
                    <div className="text-sm text-gray-600 mt-1">Last 24 Hours</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.averageDuration}m</div>
                    <div className="text-sm text-gray-600 mt-1">Avg Duration</div>
                  </div>
                  {stats.totalAmount > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.totalAmount}</div>
                      <div className="text-sm text-gray-600 mt-1">Total ml/g</div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-800">Recent Feedings</h4>
                    <button 
                      onClick={handleRetry}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <i className="fas fa-redo"></i>
                    </button>
                  </div>
                  
                  {feedHistory.length > 0 ? (
                    <div className="space-y-4">
                      {feedHistory.map((feed, index) => {
                        const typeInfo = getFeedTypeInfo(feed.type);
                        return (
                          <div key={feed._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${feed.type === 'breast' ? 'bg-pink-50' : feed.type === 'formula' ? 'bg-blue-50' : 'bg-green-50'}`}>
                                  <i className={`${typeInfo.icon} ${typeInfo.color}`}></i>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {typeInfo.label} Feeding
                                    {feed.type === 'breast' && feed.side && (
                                      <span className="ml-2 text-sm text-gray-500">
                                        ({feed.side} side)
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                    <span>{formatTime(feed.timestamp)}</span>
                                    {feed.duration > 0 && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <span>{feed.duration} min</span>
                                      </>
                                    )}
                                    {feed.amount && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <span>{feed.amount}{typeInfo.unit}</span>
                                      </>
                                    )}
                                  </div>
                                  {feed.notes && (
                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                      <i className="fas fa-sticky-note mr-1 text-gray-400"></i>
                                      {feed.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(feed._id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete feeding"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-history text-4xl text-gray-300 mb-3"></i>
                      <p className="text-gray-600">No feeding history yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start by logging your baby's first feeding
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Feeding Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-lightbulb text-yellow-600"></i>
              </div>
              <p className="text-sm text-gray-700">Newborns typically feed 8-12 times per day</p>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-lightbulb text-yellow-600"></i>
              </div>
              <p className="text-sm text-gray-700">Watch for hunger cues: rooting, hand-to-mouth, sucking sounds</p>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-lightbulb text-yellow-600"></i>
              </div>
              <p className="text-sm text-gray-700">Burp your baby halfway through and after feeding</p>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-lightbulb text-yellow-600"></i>
              </div>
              <p className="text-sm text-gray-700">Formula-fed babies typically feed every 3-4 hours</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeedTracker;