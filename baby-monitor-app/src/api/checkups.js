import { post, get, put, del } from './client';

export const getCheckups = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `checkups?${queryString}` : 'checkups';
    
    const response = await get(endpoint);
    return response.checkups || response.data || [];
  } catch (error) {
    console.error('Get checkups error:', error);
    return [];
  }
};

export const getCheckup = async (id) => {
  try {
    const response = await get(`checkups/${id}`);
    return {
      success: true,
      data: response.checkup || response.data
    };
  } catch (error) {
    console.error('Get checkup error:', error);
    return {
      success: false,
      message: 'Failed to fetch checkup record'
    };
  }
};

export const addCheckup = async (checkupData) => {
  try {
    const response = await post('checkups', checkupData);
    return {
      success: true,
      data: response.checkup || response.data
    };
  } catch (error) {
    console.error('Add checkup error:', error);
    
    let message = 'Failed to add checkup';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid checkup data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const updateCheckup = async (id, checkupData) => {
  try {
    const response = await put(`checkups/${id}`, checkupData);
    return {
      success: true,
      data: response.checkup || response.data
    };
  } catch (error) {
    console.error('Update checkup error:', error);
    
    let message = 'Failed to update checkup';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid checkup data';
    } else if (error.status === 404) {
      message = 'Checkup record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteCheckup = async (id) => {
  try {
    await del(`checkups/${id}`);
    return {
      success: true,
      message: 'Checkup record deleted successfully'
    };
  } catch (error) {
    console.error('Delete checkup error:', error);
    
    let message = 'Failed to delete checkup record';
    if (error.status === 404) {
      message = 'Checkup record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getCheckupStats = async () => {
  try {
    const response = await get('checkups/stats');
    return response.stats || response.data || {};
  } catch (error) {
    console.error('Get checkup stats error:', error);
    return {};
  }
};

export const getUpcomingCheckups = async () => {
  try {
    const response = await get('checkups/upcoming');
    return response.upcoming || response.data || [];
  } catch (error) {
    console.error('Get upcoming checkups error:', error);
    return [];
  }
};

// Validation functions
export const validateCheckupData = (data) => {
  const errors = [];
  
  if (!data.date) {
    errors.push('Appointment date is required');
  } else {
    const appointmentDate = new Date(data.date);
    const today = new Date();
    if (appointmentDate > today) {
      errors.push('Checkup date cannot be in the future');
    }
  }
  
  if (!data.doctorName?.trim()) {
    errors.push('Doctor name is required');
  }
  
  if (data.weight && (data.weight < 0.5 || data.weight > 50)) {
    errors.push('Weight must be between 0.5kg and 50kg');
  }
  
  if (data.height && (data.height < 20 || data.height > 200)) {
    errors.push('Height must be between 20cm and 200cm');
  }
  
  if (data.headCircumference && (data.headCircumference < 20 || data.headCircumference > 60)) {
    errors.push('Head circumference must be between 20cm and 60cm');
  }
  
  if (data.nextAppointment) {
    const nextDate = new Date(data.nextAppointment);
    const appointmentDate = new Date(data.date);
    if (nextDate <= appointmentDate) {
      errors.push('Next appointment must be after the current appointment');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper functions
export const calculateAverageGrowth = (checkups) => {
  if (!checkups || checkups.length < 2) return null;
  
  const sorted = [...checkups].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const weightGain = last.weight - first.weight;
  const heightGain = last.height - first.height;
  const daysDiff = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
  
  return {
    weightGainPerDay: weightGain / daysDiff,
    heightGainPerDay: heightGain / daysDiff,
    totalWeightGain: weightGain,
    totalHeightGain: heightGain,
    daysBetween: daysDiff
  };
};

export const getVaccinationHistory = (checkups) => {
  if (!checkups || checkups.length === 0) return [];
  
  const vaccines = [];
  checkups.forEach(checkup => {
    if (checkup.vaccines && Array.isArray(checkup.vaccines)) {
      checkup.vaccines.forEach(vaccine => {
        vaccines.push({
          name: vaccine,
          date: checkup.date,
          doctor: checkup.doctorName,
          type: checkup.type
        });
      });
    }
  });
  
  return vaccines.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getNextAppointment = (checkups) => {
  if (!checkups || checkups.length === 0) return null;
  
  const now = new Date();
  const upcoming = checkups
    .filter(c => c.nextAppointment && new Date(c.nextAppointment) > now)
    .sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment))[0];
  
  return upcoming;
};

export const getCheckupsByType = (checkups) => {
  if (!checkups || checkups.length === 0) return {};
  
  const byType = {};
  checkups.forEach(checkup => {
    if (!byType[checkup.type]) {
      byType[checkup.type] = [];
    }
    byType[checkup.type].push(checkup);
  });
  
  return byType;
};