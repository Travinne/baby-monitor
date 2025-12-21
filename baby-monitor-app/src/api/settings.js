// api/settings.js - Complete version
import { get, put } from './client';

export const getSettings = async () => {
  try {
    const response = await get('settings');
    return response.settings || response.data || {};
  } catch (error) {
    console.error('Get settings error:', error);
    // Return default settings structure
    return {
      app: {
        theme: 'light',
        language: 'en',
        measurementSystem: 'metric',
        autoSync: true,
        dataBackup: true,
        shareWithPartner: true,
        privacyMode: false,
        deleteDataAfter: 'never'
      },
      notifications: {
        feedingReminders: true,
        diaperReminders: true,
        sleepReminders: true,
        medicationReminders: true,
        appointmentReminders: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        reminderInterval: '3',
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      }
    };
  }
};

export const updateSettings = async (settingsData) => {
  try {
    const response = await put('settings', settingsData);
    return {
      success: true,
      data: response.settings || response.data,
      message: 'Settings updated successfully!'
    };
  } catch (error) {
    console.error('Update settings error:', error);
    
    let message = 'Failed to update settings';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid settings data';
    } else if (error.status === 401) {
      message = 'Please login to update settings';
    } else if (error.status === 403) {
      message = 'Not authorized to update settings';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const updateNotificationSettings = async (notificationSettings) => {
  try {
    const response = await put('settings/notifications', notificationSettings);
    return {
      success: true,
      data: response.settings || response.data,
      message: 'Notification settings updated successfully!'
    };
  } catch (error) {
    console.error('Update notification settings error:', error);
    
    let message = 'Failed to update notification settings';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid notification settings';
    } else if (error.status === 401) {
      message = 'Please login to update notification settings';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Get user profile data (assuming this is from auth API)
export const getCurrentUser = async () => {
  try {
    const response = await get('auth/me');
    return response.user || response.data || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await put('auth/profile', profileData);
    return {
      success: true,
      user: response.user || response.data,
      message: 'Profile updated successfully!'
    };
  } catch (error) {
    console.error('Update profile error:', error);
    
    let message = 'Failed to update profile';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid profile data';
    } else if (error.status === 401) {
      message = 'Please login to update profile';
    } else if (error.status === 409) {
      message = 'Email already in use';
    }
    
    return {
      success: false,
      message
    };
  }
};

// Logout function
export const logout = async () => {
  try {
    await get('auth/logout');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: true }; // Still logout even if API fails
  }
};

// Export user data
export const exportUserData = async () => {
  try {
    const response = await get('data/export');
    return {
      success: true,
      data: response.data,
      message: 'Data exported successfully!'
    };
  } catch (error) {
    console.error('Export data error:', error);
    return {
      success: false,
      message: 'Failed to export data'
    };
  }
};

// Delete account
export const deleteAccount = async () => {
  try {
    await put('auth/delete-account');
    return {
      success: true,
      message: 'Account deleted successfully!'
    };
  } catch (error) {
    console.error('Delete account error:', error);
    
    let message = 'Failed to delete account';
    if (error.status === 401) {
      message = 'Please login to delete account';
    } else if (error.status === 403) {
      message = 'Please confirm your password to delete account';
    }
    
    return {
      success: false,
      message
    };
  }
};