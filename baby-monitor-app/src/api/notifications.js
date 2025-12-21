import { get, post } from './client';

export const getDashboardData = async () => {
  try {
    const response = await get('dashboard');
    return response.data || {
      recentActivities: [],
      stats: {
        todayFeeds: 0,
        todaySleeps: 0,
        todayDiapers: 0,
        activeAlerts: 0
      },
      babyInfo: null
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return {
      recentActivities: [],
      stats: {
        todayFeeds: 0,
        todaySleeps: 0,
        todayDiapers: 0,
        activeAlerts: 0
      },
      babyInfo: null
    };
  }
};

export const getNotifications = async () => {
  try {
    const response = await get('notifications');
    return response.notifications || response.data || [];
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await put(`notifications/${notificationId}/read`);
    return { success: true };
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return { success: false };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await put('notifications/read-all');
    return { success: true };
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return { success: false };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await del(`notifications/${notificationId}`);
    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false };
  }
};



export const createNotification = async (notificationData) => {
  try {
    const response = await post('notifications', notificationData);
    return {
      success: true,
      data: response.notification || response.data
    };
  } catch (error) {
    console.error('Create notification error:', error);
    
    return {
      success: false,
      message: error.data?.message || 'Failed to create notification'
    };
  }
};

export const getAlertCount = async () => {
  try {
    const response = await get('notifications/unread-count');
    return response.count || 0;
  } catch (error) {
    console.error('Get alert count error:', error);
    return 0;
  }
};

