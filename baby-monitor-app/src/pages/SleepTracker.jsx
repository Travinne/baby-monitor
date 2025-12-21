import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  addSleep, 
  getSleepHistory, 
  getSleepStats,
  endSleep,
  deleteSleep,
  getSleepRecommendations
} from '../api/sleep';

const SleepTracker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'nap',
    quality: 'good',
    notes: '',
    startTime: new Date().toISOString().slice(0, 16)
  });
  const [sleepHistory, setSleepHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSleep, setCurrentSleep] = useState(null);
  const [stats, setStats] = useState({
    todayDuration: 0,
    averageDuration: 0,
    naps: 0,
    nightSleep: 0,
    sleepQuality: {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      restless: 0
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [recommendations, setRecommendations] = useState({
    totalSleep: '14-17 hours',
    nightSleep: '8-9 hours',
    naps: '7-9 hours',
    napCount: '3-5 naps'
  });

  const fetchSleepData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [history, statsData, recData] = await Promise.all([
        getSleepHistory({ limit: 10, sort: '-startTime' }),
        getSleepStats('today'),
        getSleepRecommendations(6) // Assuming baby is 6 months old
      ]);
      
      setSleepHistory(Array.isArray(history) ? history : []);
      setStats(statsData);
      setRecommendations(recData);
      
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch sleep data:', error);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSleepData();
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError('Failed to load sleep data. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchSleepData();
    checkCurrentSleep();
  }, [fetchSleepData]);

  const checkCurrentSleep = useCallback(async () => {
    try {
      const current = await getCurrentSleep();
      setCurrentSleep(current);
    } catch (error) {
      console.error('Failed to check current sleep:', error);
    }
  }, []);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.startTime) {
      errors.push('Please select a start time');
    } else {
      const selectedTime = new Date(formData.startTime);
      const now = new Date();
      const futureLimit = new Date();
      futureLimit.setHours(now.getHours() + 1); // Allow 1 hour in future for time zone issues
      
      if (selectedTime > futureLimit) {
        errors.push('Start time cannot be more than 1 hour in the future');
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleStartSleep = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const sleepData = {
        ...formData,
        startTime: formData.startTime,
        endTime: null,
        duration: 0
      };

      const result = await addSleep(sleepData);
      
      if (result.success) {
        setSuccess(result.message || 'Sleep session started!');
        setCurrentSleep(result.data);
        
        // Reset form
        setFormData({
          type: 'nap',
          quality: 'good',
          notes: '',
          startTime: new Date().toISOString().slice(0, 16)
        });
        
        // Refresh data
        await fetchSleepData();
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success message after 3 seconds
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to start sleep session:', error);
      setError(error.message || 'Failed to start sleep session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSleep = async () => {
    if (!currentSleep) return;

    try {
      const endTime = new Date().toISOString();
      const result = await endSleep(currentSleep._id, endTime);
      
      if (result.success) {
        setSuccess(result.message || 'Sleep session ended!');
        setCurrentSleep(null);
        
        // Refresh data
        await fetchSleepData();
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to end sleep session:', error);
      setError(error.message || 'Failed to end sleep session. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sleep record? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteSleep(id);
      if (result.success) {
        setSuccess(result.message || 'Sleep record deleted successfully!');
        
        // Optimistic UI update
        setSleepHistory(prev => prev.filter(record => record._id !== id));
        
        // Refresh stats
        const statsData = await getSleepStats('today');
        setStats(statsData);
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete sleep record:', error);
      setError(error.message || 'Failed to delete sleep record. Please try again.');
      // Refresh data to get correct state
      fetchSleepData();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return 'N/A';
      
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours < 24) {
        if (diffHours < 1) {
          return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
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

  const calculateDuration = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    if (isNaN(start.getTime())) return 'Invalid time';
    
    const durationMs = end - start;
    
    if (durationMs < 0) return 'Invalid duration';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSleepTypeInfo = (type) => {
    const types = {
      'nap': { 
        icon: 'fas fa-sun', 
        color: 'text-yellow-600', 
        label: 'Nap',
        bg: 'bg-yellow-100'
      },
      'night': { 
        icon: 'fas fa-moon', 
        color: 'text-indigo-600', 
        label: 'Night Sleep',
        bg: 'bg-indigo-100'
      }
    };
    
    return types[type] || { 
      icon: 'fas fa-bed', 
      color: 'text-gray-600', 
      label: 'Sleep',
      bg: 'bg-gray-100'
    };
  };

  const getQualityText = (quality) => {
    const qualityMap = {
      'excellent': { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' },
      'good': { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' },
      'fair': { text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'poor': { text: 'Poor', color: 'text-orange-600', bg: 'bg-orange-100' },
      'restless': { text: 'Restless', color: 'text-red-600', bg: 'bg-red-100' }
    };
    
    return qualityMap[quality] || { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchSleepData();
    checkCurrentSleep();
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const calculateQualityPercentage = () => {
    const total = stats.sleepQuality.excellent + stats.sleepQuality.good + 
                  stats.sleepQuality.fair + stats.sleepQuality.poor + 
                  stats.sleepQuality.restless;
    
    if (total === 0) return 0;
    
    const goodSleep = stats.sleepQuality.excellent + stats.sleepQuality.good;
    return Math.round((goodSleep / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="text-3xl font-bold text-gray-800">Sleep Tracker</h1>
          <p className="text-gray-600 mt-2">
            Monitor your baby's sleep patterns and duration
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

        {/* Current Sleep Session */}
        {currentSleep && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md p-6 mb-6 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg mr-3">
                    <i className="fas fa-moon text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold">Baby is Sleeping</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-blue-100">
                    <i className="fas fa-clock mr-2"></i>
                    Started {formatTime(currentSleep.startTime)}
                  </p>
                  <p className="text-blue-100">
                    <i className="fas fa-hourglass-half mr-2"></i>
                    Duration: {calculateDuration(currentSleep.startTime, null)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleEndSleep}
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition-colors flex items-center"
              >
                <i className="fas fa-stop mr-2"></i>
                End Sleep Session
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sleep Form */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {currentSleep ? 'Sleep in Progress' : 'Start New Sleep Session'}
            </h3>
            
            {currentSleep ? (
              <div className="current-sleep-info">
                <div className="text-center py-8">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-bed text-4xl text-blue-600"></i>
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <i className="fas fa-moon text-white"></i>
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">Sleeping Now</h4>
                  <p className="text-gray-600 mb-6">
                    Started: {formatTime(currentSleep.startTime)}
                  </p>
                  <button
                    onClick={handleEndSleep}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center mx-auto"
                  >
                    <i className="fas fa-stop mr-2"></i>
                    End Sleep Session
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartSleep}>
                <div className="mb-6">
                  <label className="block text-gray-700 mb-3">Sleep Type</label>
                  <div className="flex space-x-3">
                    {[
                      { value: 'nap', icon: 'fas fa-sun', label: 'Nap' },
                      { value: 'night', icon: 'fas fa-moon', label: 'Night Sleep' }
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

                <div className="mb-6">
                  <label htmlFor="quality" className="block text-gray-700 mb-2">
                    Expected Quality
                  </label>
                  <select
                    id="quality"
                    name="quality"
                    value={formData.quality}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="restless">Restless</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="startTime" className="block text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
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
                    placeholder="Any notes about this sleep session (feeding before, wake-ups, etc)..."
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
                      Starting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-play mr-2"></i>
                      Start Sleep Session
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Stats & History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Summary</h3>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Loading sleep data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(stats.todayDuration)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Today</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDuration(stats.averageDuration)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Avg Duration</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.naps}</div>
                    <div className="text-sm text-gray-600 mt-1">Naps</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.nightSleep}</div>
                    <div className="text-sm text-gray-600 mt-1">Night Sleeps</div>
                  </div>
                </div>

                {calculateQualityPercentage() > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Sleep Quality Score</span>
                      <span className="font-medium text-gray-800">{calculateQualityPercentage()}% Good</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${calculateQualityPercentage()}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-800">Recent Sleep Sessions</h4>
                    <button 
                      onClick={handleRetry}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      <i className="fas fa-redo"></i>
                    </button>
                  </div>
                  
                  {sleepHistory.length > 0 ? (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {sleepHistory.map((sleep, index) => {
                        const typeInfo = getSleepTypeInfo(sleep.type);
                        const duration = calculateDuration(sleep.startTime, sleep.endTime);
                        const qualityInfo = getQualityText(sleep.quality);
                        
                        return (
                          <div key={sleep._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                                  <i className={`${typeInfo.icon} ${typeInfo.color}`}></i>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800 flex items-center flex-wrap gap-2">
                                    {typeInfo.label}
                                    <span className={`text-xs px-2 py-1 rounded-full ${qualityInfo.bg} ${qualityInfo.color}`}>
                                      {qualityInfo.text}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                                    <span>{formatTime(sleep.startTime)}</span>
                                    {sleep.endTime && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <span>{formatTime(sleep.endTime)}</span>
                                      </>
                                    )}
                                    <span className="text-gray-300">•</span>
                                    <span className="font-medium">{duration}</span>
                                  </div>
                                  {sleep.notes && (
                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                      <i className="fas fa-sticky-note mr-1 text-gray-400"></i>
                                      {sleep.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete(sleep._id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete sleep record"
                                disabled={!sleep.endTime}
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
                      <p className="text-gray-600">No sleep history yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Start by logging your baby's first sleep session
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sleep Guidelines & Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Sleep Guidelines & Recommendations</h3>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-baby text-blue-600"></i>
              </div>
              <span className="text-gray-700">Based on 6-month old baby</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Recommended Sleep (6 months)</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-moon text-blue-600 mr-3"></i>
                    <span className="text-gray-700">Total Sleep</span>
                  </div>
                  <span className="font-bold text-blue-600">{recommendations.totalSleep}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-bed text-green-600 mr-3"></i>
                    <span className="text-gray-700">Night Sleep</span>
                  </div>
                  <span className="font-bold text-green-600">{recommendations.nightSleep}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-sun text-yellow-600 mr-3"></i>
                    <span className="text-gray-700">Daytime Naps</span>
                  </div>
                  <span className="font-bold text-yellow-600">{recommendations.naps}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-4">Sleep Tips</h4>
              <div className="space-y-3">
                {[
                  'Establish a consistent bedtime routine',
                  'Keep the room dark, cool, and quiet',
                  'Put baby down drowsy but awake',
                  'Watch for sleep cues: rubbing eyes, yawning, fussiness',
                  'Use white noise to mask household sounds',
                  'Maintain consistent nap times'
                ].map((tip, index) => (
                  <div key={index} className="flex items-start">
                    <div className="p-1 bg-yellow-100 rounded-lg mr-3 mt-1">
                      <i className="fas fa-lightbulb text-yellow-600 text-sm"></i>
                    </div>
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Sleep Guidelines by Age</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sleep
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Night Sleep
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Naps
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { age: 'Newborn (0-3 months)', total: '14-17 hours', night: '8-9 hours', naps: '7-9 hours (3-5 naps)' },
                    { age: 'Infant (4-11 months)', total: '12-15 hours', night: '9-10 hours', naps: '4-5 hours (2-3 naps)' },
                    { age: 'Toddler (1-2 years)', total: '11-14 hours', night: '10-12 hours', naps: '2-3 hours (1-2 naps)' },
                    { age: 'Preschool (3-5 years)', total: '10-13 hours', night: '10-12 hours', naps: '0-2 hours (0-1 nap)' }
                  ].map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-800 font-medium">
                        {row.age}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.total}</td>
                      <td className="px-4 py-3 text-gray-700">{row.night}</td>
                      <td className="px-4 py-3 text-gray-700">{row.naps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SleepTracker;