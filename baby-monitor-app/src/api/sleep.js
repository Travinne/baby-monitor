// api/sleep.js - Complete version
import { post, get, put, del } from './client';

export const addSleep = async (sleepData) => {
  try {
    const response = await post('sleep', sleepData);
    return {
      success: true,
      data: response.sleep || response.data,
      message: 'Sleep session started successfully!'
    };
  } catch (error) {
    console.error('Add sleep error:', error);
    
    let message = 'Failed to log sleep session';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid sleep data';
    } else if (error.status === 401) {
      message = 'Please login to log sleep sessions';
    } else if (error.status === 409) {
      message = 'Sleep session already in progress';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getSleepHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `sleep?${queryParams}` : 'sleep';
    const response = await get(endpoint);
    return response.sleepRecords || response.data || [];
  } catch (error) {
    console.error('Get sleep history error:', error);
    return [];
  }
};

export const getSleepStats = async (period = 'today') => {
  try {
    const response = await get(`sleep/stats?period=${period}`);
    return response.stats || response.data || {
      totalDuration: 0,
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
    };
  } catch (error) {
    console.error('Get sleep stats error:', error);
    return {
      totalDuration: 0,
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
    };
  }
};

export const updateSleep = async (id, updates) => {
  try {
    const response = await put(`sleep/${id}`, updates);
    return {
      success: true,
      data: response.sleep || response.data,
      message: 'Sleep record updated successfully!'
    };
  } catch (error) {
    console.error('Update sleep error:', error);
    
    let message = 'Failed to update sleep record';
    if (error.status === 404) {
      message = 'Sleep record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to update this sleep record';
    } else if (error.status === 400) {
      message = error.data?.message || 'Invalid sleep data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const deleteSleep = async (id) => {
  try {
    await del(`sleep/${id}`);
    return {
      success: true,
      message: 'Sleep record deleted successfully!'
    };
  } catch (error) {
    console.error('Delete sleep error:', error);
    
    let message = 'Failed to delete sleep record';
    if (error.status === 404) {
      message = 'Sleep record not found';
    } else if (error.status === 403) {
      message = 'Not authorized to delete this sleep record';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const getSleepTrends = async (startDate, endDate) => {
  try {
    const response = await get(`sleep/trends?start=${startDate}&end=${endDate}`);
    return response.trends || response.data || [];
  } catch (error) {
    console.error('Get sleep trends error:', error);
    return [];
  }
};

export const getCurrentSleep = async () => {
  try {
    const response = await get('sleep/current');
    return response.currentSleep || response.data || null;
  } catch (error) {
    console.error('Get current sleep error:', error);
    return null;
  }
};

export const endSleep = async (id, endTime) => {
  try {
    const response = await put(`sleep/${id}/end`, { endTime });
    return {
      success: true,
      data: response.sleep || response.data,
      message: 'Sleep session ended successfully!'
    };
  } catch (error) {
    console.error('End sleep error:', error);
    
    let message = 'Failed to end sleep session';
    if (error.status === 404) {
      message = 'Sleep session not found';
    } else if (error.status === 400) {
      message = error.data?.message || 'Invalid end time';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Get sleep recommendations based on baby's age
export const getSleepRecommendations = async (babyAgeMonths) => {
  try {
    const response = await get(`sleep/recommendations?age=${babyAgeMonths}`);
    return response.recommendations || response.data || {
      totalSleep: '14-17 hours',
      nightSleep: '8-9 hours',
      naps: '7-9 hours',
      napCount: '3-5 naps'
    };
  } catch (error) {
    console.error('Get sleep recommendations error:', error);
    return {
      totalSleep: '14-17 hours',
      nightSleep: '8-9 hours',
      naps: '7-9 hours',
      napCount: '3-5 naps'
    };
  }
};