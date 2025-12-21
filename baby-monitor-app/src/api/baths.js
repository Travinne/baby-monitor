import { post, get, put, del } from './client';

export const addBath = async (bathData) => {
  try {
    const response = await post('baths', bathData);
    return {
      success: true,
      data: response.bath || response.data
    };
  } catch (error) {
    console.error('Add bath error:', error);
    
    let message = 'Failed to log bath';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid bath data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getBathHistory = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `baths?${queryString}` : 'baths';
    
    const response = await get(endpoint);
    return response.baths || response.data || [];
  } catch (error) {
    console.error('Get bath history error:', error);
    return [];
  }
};

export const getBathRecord = async (id) => {
  try {
    const response = await get(`baths/${id}`);
    return {
      success: true,
      data: response.bath || response.data
    };
  } catch (error) {
    console.error('Get bath record error:', error);
    return {
      success: false,
      message: 'Failed to fetch bath record'
    };
  }
};

export const updateBath = async (id, bathData) => {
  try {
    const response = await put(`baths/${id}`, bathData);
    return {
      success: true,
      data: response.bath || response.data
    };
  } catch (error) {
    console.error('Update bath error:', error);
    
    let message = 'Failed to update bath record';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid bath data';
    } else if (error.status === 404) {
      message = 'Bath record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteBath = async (id) => {
  try {
    await del(`baths/${id}`);
    return {
      success: true,
      message: 'Bath record deleted successfully'
    };
  } catch (error) {
    console.error('Delete bath error:', error);
    
    let message = 'Failed to delete bath record';
    if (error.status === 404) {
      message = 'Bath record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getBathStats = async (period = 'week') => {
  try {
    const response = await get(`baths/stats?period=${period}`);
    return response.stats || response.data || {};
  } catch (error) {
    console.error('Get bath stats error:', error);
    return {};
  }
};

export const validateBathData = (data) => {
  const errors = [];
  
  if (!data.time) {
    errors.push('Time is required');
  } else {
    const bathTime = new Date(data.time);
    const now = new Date();
    if (bathTime > now) {
      errors.push('Bath time cannot be in the future');
    }
  }
  
  if (!data.duration) {
    errors.push('Duration is required');
  } else if (data.duration < 1 || data.duration > 60) {
    errors.push('Duration must be between 1 and 60 minutes');
  }
  
  if (data.productsUsed && data.productsUsed.length > 10) {
    errors.push('Maximum 10 products allowed');
  }
  
  if (data.notes && data.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateAverageDuration = (baths) => {
  if (!baths || baths.length === 0) return 0;
  
  const total = baths.reduce((sum, bath) => sum + (bath.duration || 0), 0);
  return Math.round(total / baths.length);
};

export const getMostUsedProducts = (baths) => {
  if (!baths || baths.length === 0) return [];
  
  const productCounts = {};
  baths.forEach(bath => {
    if (bath.productsUsed && Array.isArray(bath.productsUsed)) {
      bath.productsUsed.forEach(product => {
        productCounts[product] = (productCounts[product] || 0) + 1;
      });
    }
  });
  
  return Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, count]) => ({ product, count }));
};

export const getRecentBathTimes = (baths, count = 5) => {
  if (!baths || baths.length === 0) return [];
  
  return [...baths]
    .sort((a, b) => new Date(b.time || b.timestamp) - new Date(a.time || a.timestamp))
    .slice(0, count);
};

// Get bath frequency by day of week
export const getBathFrequency = (baths) => {
  if (!baths || baths.length === 0) return {};
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const frequency = days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
  
  baths.forEach(bath => {
    const date = new Date(bath.time || bath.timestamp);
    const day = days[date.getDay()];
    frequency[day]++;
  });
  
  return frequency;
};