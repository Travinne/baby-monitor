import { get, post, put, del, upload } from './client';

export const getBabyProfile = async () => {
  try {
    const response = await get('baby/profile');
    return response.baby || response.data;
  } catch (error) {
    console.error('Get baby profile error:', error);
    return null;
  }
};

export const createBabyProfile = async (profileData) => {
  try {
    const response = await post('baby/profile', profileData);
    return {
      success: true,
      data: response.baby || response.data
    };
  } catch (error) {
    console.error('Create baby profile error:', error);
    
    let message = 'Failed to create baby profile';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid profile data';
    } else if (error.status === 409) {
      message = 'Baby profile already exists';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const updateBabyProfile = async (profileData) => {
  try {
    const response = await put('baby/profile', profileData);
    return {
      success: true,
      data: response.baby || response.data
    };
  } catch (error) {
    console.error('Update baby profile error:', error);
    
    let message = 'Failed to update baby profile';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid profile data';
    } else if (error.status === 404) {
      message = 'Baby profile not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const uploadBabyPhoto = async (photoFile) => {
  try {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await upload('baby/upload-photo', formData);
    return {
      success: true,
      photoUrl: response.photoUrl || response.url
    };
  } catch (error) {
    console.error('Upload baby photo error:', error);
    
    let message = 'Failed to upload photo';
    if (error.status === 400) {
      message = 'Invalid image file';
    } else if (error.status === 413) {
      message = 'Image file too large';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getGrowthHistory = async () => {
  try {
    const response = await get('baby/growth');
    return response.growthRecords || response.data || [];
  } catch (error) {
    console.error('Get growth history error:', error);
    return [];
  }
};

export const getGrowthRecord = async (id) => {
  try {
    const response = await get(`baby/growth/${id}`);
    return {
      success: true,
      data: response.record || response.data
    };
  } catch (error) {
    console.error('Get growth record error:', error);
    return {
      success: false,
      message: 'Failed to fetch growth record'
    };
  }
};

export const addGrowthRecord = async (recordData) => {
  try {
    const response = await post('baby/growth', recordData);
    return {
      success: true,
      data: response.record || response.data
    };
  } catch (error) {
    console.error('Add growth record error:', error);
    
    let message = 'Failed to add growth record';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid growth data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const updateGrowthRecord = async (id, recordData) => {
  try {
    const response = await put(`baby/growth/${id}`, recordData);
    return {
      success: true,
      data: response.record || response.data
    };
  } catch (error) {
    console.error('Update growth record error:', error);
    
    let message = 'Failed to update growth record';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid growth data';
    } else if (error.status === 404) {
      message = 'Growth record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteGrowthRecord = async (id) => {
  try {
    await del(`baby/growth/${id}`);
    return { 
      success: true,
      message: 'Growth record deleted successfully'
    };
  } catch (error) {
    console.error('Delete growth record error:', error);
    
    let message = 'Failed to delete growth record';
    if (error.status === 404) {
      message = 'Growth record not found';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const calculatePercentile = async (measurementData) => {
  try {
    const response = await post('baby/percentile', measurementData);
    return {
      success: true,
      data: response.percentiles || response.data
    };
  } catch (error) {
    console.error('Calculate percentile error:', error);
    return {
      success: false,
      message: 'Failed to calculate percentiles'
    };
  }
};

export const getVaccinationHistory = async () => {
  try {
    const response = await get('baby/vaccinations');
    return response.vaccinations || response.data || [];
  } catch (error) {
    console.error('Get vaccination history error:', error);
    return [];
  }
};

export const addVaccinationRecord = async (vaccinationData) => {
  try {
    const response = await post('baby/vaccinations', vaccinationData);
    return {
      success: true,
      data: response.vaccination || response.data
    };
  } catch (error) {
    console.error('Add vaccination record error:', error);
    return {
      success: false,
      message: 'Failed to add vaccination record'
    };
  }
};

export const getMilestones = async () => {
  try {
    const response = await get('baby/milestones');
    return response.milestones || response.data || [];
  } catch (error) {
    console.error('Get milestones error:', error);
    return [];
  }
};

export const addMilestone = async (milestoneData) => {
  try {
    const response = await post('baby/milestones', milestoneData);
    return {
      success: true,
      data: response.milestone || response.data
    };
  } catch (error) {
    console.error('Add milestone error:', error);
    return {
      success: false,
      message: 'Failed to add milestone'
    };
  }
};

// Helper functions
export const validateBabyData = (data) => {
  const errors = [];
  
  if (!data.name?.trim()) {
    errors.push('Baby name is required');
  }
  
  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    if (dob > today) {
      errors.push('Date of birth cannot be in the future');
    }
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateGrowthData = (data) => {
  const errors = [];
  
  if (!data.date) {
    errors.push('Date is required');
  } else {
    const recordDate = new Date(data.date);
    const today = new Date();
    if (recordDate > today) {
      errors.push('Record date cannot be in the future');
    }
  }
  
  if (!data.weight && !data.height && !data.headCircumference) {
    errors.push('At least one measurement is required');
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
};