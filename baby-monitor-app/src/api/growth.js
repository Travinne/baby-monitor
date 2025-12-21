// api/growth.js - Complete version
import { post, get, put, del } from './client';

export const getGrowthData = async () => {
  try {
    const response = await get('growth');
    return response.growthData || response.data || [];
  } catch (error) {
    console.error('Get growth data error:', error);
    // Return consistent error structure
    throw {
      success: false,
      message: error.data?.message || 'Failed to fetch growth data',
      status: error.status
    };
  }
};

export const addGrowthData = async (growthData) => {
  try {
    const response = await post('growth', growthData);
    return {
      success: true,
      data: response.growth || response.data,
      message: 'Growth record added successfully!'
    };
  } catch (error) {
    console.error('Add growth data error:', error);
    
    let message = 'Failed to add growth data';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid growth data provided';
    } else if (error.status === 401) {
      message = 'Please login to add growth records';
    } else if (error.status === 409) {
      message = 'A record already exists for this date';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const updateGrowthData = async (id, growthData) => {
  try {
    const response = await put(`growth/${id}`, growthData);
    return {
      success: true,
      data: response.growth || response.data,
      message: 'Growth record updated successfully!'
    };
  } catch (error) {
    console.error('Update growth data error:', error);
    
    let message = 'Failed to update growth data';
    if (error.status === 404) {
      message = 'Growth record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to update this record';
    } else if (error.status === 400) {
      message = error.data?.message || 'Invalid growth data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteGrowthData = async (id) => {
  try {
    await del(`growth/${id}`);
    return {
      success: true,
      message: 'Growth record deleted successfully!'
    };
  } catch (error) {
    console.error('Delete growth data error:', error);
    
    let message = 'Failed to delete growth data';
    if (error.status === 404) {
      message = 'Growth record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to delete this record';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Optional: Get growth statistics
export const getGrowthStats = async () => {
  try {
    const response = await get('growth/stats');
    return response.stats || response.data || {
      totalRecords: 0,
      lastUpdate: null,
      averages: {
        weight: 0,
        height: 0,
        headCircumference: 0
      }
    };
  } catch (error) {
    console.error('Get growth stats error:', error);
    return {
      totalRecords: 0,
      lastUpdate: null,
      averages: {
        weight: 0,
        height: 0,
        headCircumference: 0
      }
    };
  }
};

// Get growth data for a specific date range
export const getGrowthByDateRange = async (startDate, endDate) => {
  try {
    const response = await get(`growth/range?start=${startDate}&end=${endDate}`);
    return response.growthData || response.data || [];
  } catch (error) {
    console.error('Get growth by date range error:', error);
    return [];
  }
};