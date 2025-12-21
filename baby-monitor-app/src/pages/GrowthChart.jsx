import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getGrowthData,
  addGrowthData,
  updateGrowthData,
  deleteGrowthData 
} from '../api/growth';

const GrowthChart = () => {
  const navigate = useNavigate();
  const [growthData, setGrowthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('weight'); // 'weight', 'height', 'head'
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    headCircumference: '',
    notes: ''
  });

  const fetchGrowthData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getGrowthData();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setGrowthData(data);
      } else if (data && data.success === false) {
        throw new Error(data.message);
      } else {
        setGrowthData([]);
      }
      
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchGrowthData();
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError(error.message || 'Failed to load growth data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount]);

  useEffect(() => {
    fetchGrowthData();
  }, [fetchGrowthData]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.date) {
      errors.push('Please select a date');
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate > today) {
        errors.push('Date cannot be in the future');
      }
    }

    if (!formData.weight && !formData.height && !formData.headCircumference) {
      errors.push('Please enter at least one measurement');
    }

    // Validate weight
    if (formData.weight) {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight) || weight <= 0) {
        errors.push('Weight must be a positive number');
      } else if (weight > 50) {
        errors.push('Weight should be less than 50kg');
      }
    }

    // Validate height
    if (formData.height) {
      const height = parseFloat(formData.height);
      if (isNaN(height) || height <= 0) {
        errors.push('Height must be a positive number');
      } else if (height > 200) {
        errors.push('Height should be less than 200cm');
      }
    }

    // Validate head circumference
    if (formData.headCircumference) {
      const head = parseFloat(formData.headCircumference);
      if (isNaN(head) || head <= 0) {
        errors.push('Head circumference must be a positive number');
      } else if (head > 60) {
        errors.push('Head circumference should be less than 60cm');
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
      let result;
      const growthRecord = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        headCircumference: formData.headCircumference ? parseFloat(formData.headCircumference) : null,
        notes: formData.notes.trim() || null
      };

      if (editingId) {
        result = await updateGrowthData(editingId, growthRecord);
      } else {
        result = await addGrowthData(growthRecord);
      }
      
      if (result.success) {
        setSuccess(result.message || (editingId ? 'Growth record updated!' : 'Growth record added!'));
        resetForm();
        await fetchGrowthData();
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success message after 3 seconds
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save growth record:', error);
      setError(error.message || 'Failed to save growth record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setFormData({
      date: record.date ? (typeof record.date === 'string' ? record.date.split('T')[0] : new Date(record.date).toISOString().split('T')[0]) : '',
      weight: record.weight || '',
      height: record.height || '',
      headCircumference: record.headCircumference || '',
      notes: record.notes || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this growth record? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteGrowthData(id);
      if (result.success) {
        setSuccess(result.message || 'Growth record deleted successfully!');
        
        // Optimistic UI update
        setGrowthData(prev => prev.filter(record => record._id !== id));
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear success message after 3 seconds
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete growth record:', error);
      setError(error.message || 'Failed to delete growth record. Please try again.');
      // Refresh data to get correct state
      fetchGrowthData();
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      headCircumference: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const calculatePercentile = (value, type, ageMonths) => {
    if (!value || typeof ageMonths !== 'number' || ageMonths < 0) return 'N/A';

    // WHO growth chart percentiles (simplified for demo)
    // Real implementation would use exact WHO growth chart data
    const percentiles = {
      weight: {
        3: 2.4,  10: 2.8,  25: 3.2,  50: 3.6,  75: 4.0,  90: 4.4,  97: 4.8,
        6: 6.0,  // Continue for other ages...
      },
      height: {
        3: 55,  10: 57,  25: 59,  50: 61,  75: 63,  90: 65,  97: 67,
      },
      head: {
        3: 37,  10: 38,  25: 39,  50: 40,  75: 41,  90: 42,  97: 43,
      }
    };

    const ageKey = Math.min(ageMonths, 36); // Cap at 36 months for demo
    const percentilesForType = percentiles[type];
    
    if (!percentilesForType) return 'N/A';

    // Find closest percentile
    const sortedPercentiles = [3, 10, 25, 50, 75, 90, 97];
    for (let i = 0; i < sortedPercentiles.length; i++) {
      const p = sortedPercentiles[i];
      const refValue = percentilesForType[ageKey] || percentilesForType[ageKey + 3] || percentilesForType[ageKey + 6];
      
      if (value <= refValue) {
        if (p === 50) return '50th';
        return `${sortedPercentiles[i]}th`;
      }
    }
    
    return 'Above 97th';
  };

  const calculateAgeInMonths = (dateString) => {
    try {
      if (!dateString) return 0;
      
      // This should come from baby profile - using demo birthdate
      const birthDate = new Date('2024-01-01');
      const recordDate = new Date(dateString);
      
      if (isNaN(birthDate.getTime()) || isNaN(recordDate.getTime())) return 0;
      
      const months = (recordDate.getFullYear() - birthDate.getFullYear()) * 12 + 
                     (recordDate.getMonth() - birthDate.getMonth());
      return Math.max(0, months);
    } catch {
      return 0;
    }
  };

  const getLatestMeasurements = () => {
    if (!growthData || growthData.length === 0) return null;
    
    const sorted = [...growthData].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });
    
    return sorted[0];
  };

  const getViewData = () => {
    if (!growthData || growthData.length === 0) return [];
    
    const filteredData = growthData
      .filter(record => record[viewMode] != null && record[viewMode] > 0)
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      })
      .slice(-8); // Last 8 records for better chart display
    
    return filteredData;
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchGrowthData();
  };

  const latest = getLatestMeasurements();
  const chartData = getViewData();

  return (
    <div className="growth-chart-page">
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
          <h1 className="text-3xl font-bold text-gray-800">Growth Chart</h1>
          <p className="text-gray-600 mt-2">
            Track your baby's growth patterns and percentiles
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

        {/* Latest Measurements */}
        {latest && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Latest Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latest.weight && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <i className="fas fa-weight text-blue-600"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{latest.weight} kg</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(latest.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    {calculatePercentile(latest.weight, 'weight', calculateAgeInMonths(latest.date))} percentile
                  </div>
                </div>
              )}

              {latest.height && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <i className="fas fa-ruler-vertical text-green-600"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{latest.height} cm</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(latest.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {calculatePercentile(latest.height, 'height', calculateAgeInMonths(latest.date))} percentile
                  </div>
                </div>
              )}

              {latest.headCircumference && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <i className="fas fa-circle text-purple-600"></i>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{latest.headCircumference} cm</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(latest.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-600 font-medium">
                    {calculatePercentile(latest.headCircumference, 'head', calculateAgeInMonths(latest.date))} percentile
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart View */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Growth Trends</h3>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'weight' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('weight')}
              >
                <i className="fas fa-weight mr-2"></i>
                Weight
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'height' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('height')}
              >
                <i className="fas fa-ruler-vertical mr-2"></i>
                Height
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'head' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setViewMode('head')}
              >
                <i className="fas fa-circle mr-2"></i>
                Head
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Loading growth data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <div>
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-800">
                  {viewMode === 'weight' ? 'Weight (kg)' : viewMode === 'height' ? 'Height (cm)' : 'Head Circumference (cm)'}
                </h4>
              </div>
              
              <div className="relative h-64 bg-gray-50 rounded-lg p-4">
                <div className="absolute inset-0 flex items-end space-x-4 px-4">
                  {chartData.map((record, index) => {
                    const value = record[viewMode];
                    const values = chartData.map(r => r[viewMode]);
                    const maxValue = Math.max(...values);
                    const minValue = Math.min(...values);
                    const range = maxValue - minValue;
                    
                    // Calculate bar height (80% of container height)
                    const percentage = range > 0 ? ((value - minValue) / range) * 80 + 10 : 50;
                    
                    return (
                      <div key={record._id || index} className="flex flex-col items-center flex-1 h-full">
                        <div className="text-xs text-gray-500 mb-2 truncate w-full text-center">
                          {formatDate(record.date)}
                        </div>
                        <div className="relative flex-1 w-full flex items-end">
                          <div 
                            className={`w-full rounded-t-lg transition-all hover:opacity-80 ${
                              viewMode === 'weight' ? 'bg-blue-500' :
                              viewMode === 'height' ? 'bg-green-500' :
                              'bg-purple-500'
                            }`}
                            style={{ height: `${percentage}%` }}
                            title={`${value} ${viewMode === 'weight' ? 'kg' : 'cm'}`}
                          ></div>
                        </div>
                        <div className="text-sm font-medium mt-2">
                          {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <i className="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-600">No {viewMode} data available</p>
              <p className="text-sm text-gray-500 mt-1">
                Add growth records to see the chart
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Growth Record' : 'Add Growth Record'}
              </h3>
              <button 
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="date" className="block text-gray-700 mb-2">
                  Measurement Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label htmlFor="weight" className="block text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    max="50"
                    placeholder="e.g., 5.2"
                  />
                </div>

                <div>
                  <label htmlFor="height" className="block text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                    min="0"
                    max="200"
                    placeholder="e.g., 58.5"
                  />
                </div>

                <div>
                  <label htmlFor="headCircumference" className="block text-gray-700 mb-2">
                    Head Circ. (cm)
                  </label>
                  <input
                    type="number"
                    id="headCircumference"
                    name="headCircumference"
                    value={formData.headCircumference}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                    min="0"
                    max="60"
                    placeholder="e.g., 38.2"
                  />
                </div>
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
                  placeholder="Any notes about this measurement..."
                  rows="3"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                      {editingId ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-save mr-2"></i>
                      {editingId ? 'Update' : 'Add'} Record
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Growth History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-800">Growth History</h3>
            <div className="flex space-x-3">
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Record
                </button>
              )}
              <button 
                onClick={handleRetry}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Loading growth history...</p>
            </div>
          ) : growthData && growthData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight (kg)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Height (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Head (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {growthData
                    .sort((a, b) => {
                      const dateA = new Date(a.date);
                      const dateB = new Date(b.date);
                      return dateB - dateA;
                    })
                    .map((record) => {
                      const ageMonths = calculateAgeInMonths(record.date);
                      
                      return (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {formatDate(record.date)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {record.weight ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {record.weight} kg
                                </div>
                                <div className="text-xs text-blue-600">
                                  {calculatePercentile(record.weight, 'weight', ageMonths)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {record.height ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {record.height} cm
                                </div>
                                <div className="text-xs text-green-600">
                                  {calculatePercentile(record.height, 'height', ageMonths)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {record.headCircumference ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {record.headCircumference} cm
                                </div>
                                <div className="text-xs text-purple-600">
                                  {calculatePercentile(record.headCircumference, 'head', ageMonths)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {ageMonths === 0 ? 'Newborn' : `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(record._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <i className="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>
              <p className="text-gray-600">No growth records yet</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                Track your baby's growth by adding measurements
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Add First Measurement
              </button>
            </div>
          )}
        </div>

        {/* Growth Guidelines */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Growth Guidelines (WHO Standards)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <i className="fas fa-weight text-blue-600"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Weight Gain</h5>
                <p className="text-sm text-gray-600">
                  First 6 months: 140-200g per week<br />
                  6-12 months: 85-140g per week
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <i className="fas fa-ruler-vertical text-green-600"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Height Growth</h5>
                <p className="text-sm text-gray-600">
                  First year: ~25cm (10 inches)<br />
                  Second year: ~12cm (5 inches)
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <i className="fas fa-brain text-purple-600"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Head Growth</h5>
                <p className="text-sm text-gray-600">
                  First 3 months: ~2cm/month<br />
                  4-6 months: ~1cm/month<br />
                  6-12 months: ~0.5cm/month
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <i className="fas fa-chart-line text-yellow-600"></i>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-1">Percentiles</h5>
                <p className="text-sm text-gray-600">
                  Consistency along a percentile line is more important than being at a specific percentile
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GrowthChart;