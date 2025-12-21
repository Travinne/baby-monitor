import { post, get, put, del } from './client';

export const addDiaper = async (diaperData) => {
  try {
    const response = await post('diapers', diaperData);
    return {
      success: true,
      data: response.diaper || response.data
    };
  } catch (error) {
    console.error('Add diaper error:', error);
    
    let message = 'Failed to log diaper change';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid diaper data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getDiaperHistory = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `diapers?${queryString}` : 'diapers';
    
    const response = await get(endpoint);
    return response.diapers || response.data || [];
  } catch (error) {
    console.error('Get diaper history error:', error);
    return [];
  }
};

export const getDiaperRecord = async (id) => {
  try {
    const response = await get(`diapers/${id}`);
    return {
      success: true,
      data: response.diaper || response.data
    };
  } catch (error) {
    console.error('Get diaper record error:', error);
    return {
      success: false,
      message: 'Failed to fetch diaper record'
    };
  }
};

export const updateDiaper = async (id, updates) => {
  try {
    const response = await put(`diapers/${id}`, updates);
    return {
      success: true,
      data: response.diaper || response.data
    };
  } catch (error) {
    console.error('Update diaper error:', error);
    
    let message = 'Failed to update diaper record';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid diaper data';
    } else if (error.status === 404) {
      message = 'Diaper record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteDiaper = async (id) => {
  try {
    await del(`diapers/${id}`);
    return {
      success: true,
      message: 'Diaper record deleted successfully'
    };
  } catch (error) {
    console.error('Delete diaper error:', error);
    
    let message = 'Failed to delete diaper record';
    if (error.status === 404) {
      message = 'Diaper record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getDiaperStats = async (period = 'today') => {
  try {
    const response = await get(`diapers/stats?period=${period}`);
    return response.stats || response.data || {
      total: 0,
      wet: 0,
      dirty: 0,
      mixed: 0,
      byHour: {},
      trends: {}
    };
  } catch (error) {
    console.error('Get diaper stats error:', error);
    return {
      total: 0,
      wet: 0,
      dirty: 0,
      mixed: 0,
      byHour: {},
      trends: {}
    };
  }
};

export const getDiaperTrends = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const response = await get(`diapers/trends?${params.toString()}`);
    return response.trends || response.data || [];
  } catch (error) {
    console.error('Get diaper trends error:', error);
    return [];
  }
};

export const getTodayDiapers = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await get(`diapers?date=${today}&limit=50`);
    return response.diapers || response.data || [];
  } catch (error) {
    console.error('Get today diapers error:', error);
    return [];
  }
};

export const getWeeklySummary = async () => {
  try {
    const response = await get('diapers/weekly-summary');
    return response.summary || response.data || {};
  } catch (error) {
    console.error('Get weekly summary error:', error);
    return {};
  }
};

export const getDiaperAnalytics = async (period = 'week') => {
  try {
    const response = await get(`diapers/analytics?period=${period}`);
    return response.analytics || response.data || {};
  } catch (error) {
    console.error('Get diaper analytics error:', error);
    return {};
  }
};

// Validation functions
export const validateDiaperData = (data) => {
  const errors = [];
  
  if (!data.timestamp) {
    errors.push('Timestamp is required');
  } else {
    const diaperTime = new Date(data.timestamp);
    const now = new Date();
    if (diaperTime > now) {
      errors.push('Diaper time cannot be in the future');
    }
  }
  
  if (!data.type) {
    errors.push('Diaper type is required');
  }
  
  if (data.notes && data.notes.length > 500) {
    errors.push('Notes cannot exceed 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper functions
export const calculateDailyAverages = (diapers) => {
  if (!diapers || diapers.length === 0) return {};
  
  const byDate = {};
  diapers.forEach(diaper => {
    const date = new Date(diaper.timestamp).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { wet: 0, dirty: 0, mixed: 0, total: 0 };
    }
    byDate[date][diaper.type]++;
    byDate[date].total++;
  });
  
  const days = Object.keys(byDate).length;
  if (days === 0) return {};
  
  const totals = Object.values(byDate).reduce((acc, day) => ({
    wet: acc.wet + day.wet,
    dirty: acc.dirty + day.dirty,
    mixed: acc.mixed + day.mixed,
    total: acc.total + day.total
  }), { wet: 0, dirty: 0, mixed: 0, total: 0 });
  
  return {
    dailyAverage: totals.total / days,
    wetAverage: totals.wet / days,
    dirtyAverage: totals.dirty / days,
    mixedAverage: totals.mixed / days
  };
};

export const getFrequencyByHour = (diapers) => {
  if (!diapers || diapers.length === 0) return Array(24).fill(0);
  
  const hourlyCounts = Array(24).fill(0);
  diapers.forEach(diaper => {
    const hour = new Date(diaper.timestamp).getHours();
    hourlyCounts[hour]++;
  });
  
  return hourlyCounts;
};

export const getLastDiaperTime = (diapers) => {
  if (!diapers || diapers.length === 0) return null;
  
  const sorted = [...diapers].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  return sorted[0];
};

export const getTimeSinceLastDiaper = (diapers) => {
  if (!diapers || diapers.length === 0) return 'No diapers recorded';
  
  const lastDiaper = getLastDiaperTime(diapers);
  if (!lastDiaper) return 'No diapers recorded';
  
  const lastTime = new Date(lastDiaper.timestamp);
  const now = new Date();
  const diffMs = now - lastTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ago`;
  }
  return `${diffMinutes}m ago`;
};

export const getConsistencyDistribution = (diapers) => {
  if (!diapers || diapers.length === 0) return {};
  
  const distribution = {};
  diapers.forEach(diaper => {
    if (diaper.consistency) {
      distribution[diaper.consistency] = (distribution[diaper.consistency] || 0) + 1;
    }
  });
  
  return distribution;
};

export const getColorDistribution = (diapers) => {
  if (!diapers || diapers.length === 0) return {};
  
  const distribution = {};
  diapers.forEach(diaper => {
    if (diaper.color) {
      distribution[diaper.color] = (distribution[diaper.color] || 0) + 1;
    }
  });
  
  return distribution;
};

export const shouldAlertDoctor = (diaper) => {
  const warnings = [];
  
  if (diaper.color === 'black' || diaper.color === 'red' || diaper.color === 'white') {
    warnings.push('Unusual stool color - consult a doctor');
  }
  
  if (diaper.consistency === 'watery' && diaper.type === 'dirty') {
    warnings.push('Watery stool could indicate diarrhea');
  }
  
  if (diaper.consistency === 'hard') {
    warnings.push('Hard stool may indicate constipation');
  }
  
  return warnings;
};

// Quick log functions
export const quickLogWet = async (notes = '') => {
  return addDiaper({
    type: 'wet',
    timestamp: new Date().toISOString(),
    notes
  });
};

export const quickLogDirty = async (consistency = 'normal', color = 'yellow', notes = '') => {
  return addDiaper({
    type: 'dirty',
    consistency,
    color,
    timestamp: new Date().toISOString(),
    notes
  });
};

export const quickLogMixed = async (consistency = 'normal', color = 'yellow', notes = '') => {
  return addDiaper({
    type: 'mixed',
    consistency,
    color,
    timestamp: new Date().toISOString(),
    notes
  });
};