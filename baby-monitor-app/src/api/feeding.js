// api/feeding.js - Updated version
import { post, get, put, del } from './client';

export const addFeeding = async (feedingData) => {
  try {
    const response = await post('feedings', feedingData);
    return {
      success: true,
      data: response.feeding || response.data,
      message: 'Feeding logged successfully!'
    };
  } catch (error) {
    console.error('Add feeding error:', error);
    
    let message = 'Failed to log feeding';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid feeding data';
    } else if (error.status === 401) {
      message = 'Please login to log feedings';
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getFeedHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `feedings?${queryParams}` : 'feedings';
    const response = await get(endpoint);
    return response.feedings || response.data || [];
  } catch (error) {
    console.error('Get feed history error:', error);
    // Return empty array but include error info for debugging
    return [];
  }
};

export const getFeedingStats = async (period = 'today') => {
  try {
    const response = await get(`feedings/stats?period=${period}`);
    return response.stats || response.data || {
      total: 0,
      last24Hours: 0,
      averageDuration: 0,
      totalAmount: 0,
      byType: {}
    };
  } catch (error) {
    console.error('Get feeding stats error:', error);
    return {
      total: 0,
      last24Hours: 0,
      averageDuration: 0,
      totalAmount: 0,
      byType: {}
    };
  }
};

export const updateFeeding = async (id, updates) => {
  try {
    const response = await put(`feedings/${id}`, updates);
    return {
      success: true,
      data: response.feeding || response.data,
      message: 'Feeding updated successfully!'
    };
  } catch (error) {
    console.error('Update feeding error:', error);
    
    let message = 'Failed to update feeding';
    if (error.status === 404) {
      message = 'Feeding record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to update this feeding';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteFeeding = async (id) => {
  try {
    await del(`feedings/${id}`);
    return { 
      success: true,
      message: 'Feeding record deleted successfully!'
    };
  } catch (error) {
    console.error('Delete feeding error:', error);
    
    let message = 'Failed to delete feeding';
    if (error.status === 404) {
      message = 'Feeding record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to delete this feeding';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Helper function for today's feedings
export const getTodayFeedings = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await get(`feedings/today?date=${today}`);
    return response.feedings || response.data || [];
  } catch (error) {
    console.error('Get today feedings error:', error);
    return [];
  }
};