import { post, get, put } from './client';

export const login = async (credentials) => {
  try {
    const response = await post('auth/login', credentials);
    
    // Store token and user data
    if (response.token && response.user) {
      localStorage.setItem('babyMonitorToken', response.token);
      localStorage.setItem('babyMonitorUser', JSON.stringify(response.user));
    }
    
    return {
      success: true,
      token: response.token,
      user: response.user
    };
  } catch (error) {
    console.error('Login error:', error);
    
    let message = 'Login failed. Please try again.';
    if (error.status === 401) {
      message = 'Invalid email or password';
    } else if (error.status === 400) {
      message = error.data?.message || 'Invalid request';
    } else if (error.message.includes('timeout') || error.message.includes('Network')) {
      message = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await post('auth/register', userData);
    
    // Store token and user data
    if (response.token && response.user) {
      localStorage.setItem('babyMonitorToken', response.token);
      localStorage.setItem('babyMonitorUser', JSON.stringify(response.user));
    }
    
    return {
      success: true,
      token: response.token,
      user: response.user
    };
  } catch (error) {
    console.error('Register error:', error);
    
    let message = 'Registration failed. Please try again.';
    if (error.status === 409) {
      message = 'User with this email already exists';
    } else if (error.status === 400) {
      message = error.data?.message || 'Invalid registration data';
    } else if (error.message.includes('timeout') || error.message.includes('Network')) {
      message = 'Network error. Please check your connection.';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const logout = async () => {
  try {
    await post('auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('babyMonitorToken');
    localStorage.removeItem('babyMonitorUser');
    sessionStorage.removeItem('babyMonitorToken');
    sessionStorage.removeItem('babyMonitorUser');
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
    if (!token) return null;
    
    const response = await get('auth/me');
    return response.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await put('auth/profile', profileData);
    
    // Update stored user data
    const currentUser = JSON.parse(localStorage.getItem('babyMonitorUser') || sessionStorage.getItem('babyMonitorUser') || '{}');
    const updatedUser = { ...currentUser, ...response.user };
    
    if (localStorage.getItem('babyMonitorUser')) {
      localStorage.setItem('babyMonitorUser', JSON.stringify(updatedUser));
    }
    if (sessionStorage.getItem('babyMonitorUser')) {
      sessionStorage.setItem('babyMonitorUser', JSON.stringify(updatedUser));
    }
    
    return {
      success: true,
      user: response.user
    };
  } catch (error) {
    console.error('Update profile error:', error);
    
    let message = 'Failed to update profile';
    if (error.status === 400) {
      message = error.data?.message || 'Invalid profile data';
    }
    
    return {
      success: false,
      message
    };
  }
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const requestPasswordReset = async (email) => {
  try {
    await post('auth/forgot-password', { email });
    return {
      success: true,
      message: 'Password reset link sent to your email'
    };
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to send reset link'
    };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    await post('auth/reset-password', { token, newPassword });
    return {
      success: true,
      message: 'Password reset successful'
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: error.data?.message || 'Failed to reset password'
    };
  }
};

// Verify token on app load
export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
    if (!token) return { valid: false };
    
    const response = await get('auth/verify');
    return { valid: true, user: response.user };
  } catch (error) {
    console.error('Token verification error:', error);
    // Clear invalid token
    if (error.status === 401) {
      localStorage.removeItem('babyMonitorToken');
      localStorage.removeItem('babyMonitorUser');
      sessionStorage.removeItem('babyMonitorToken');
      sessionStorage.removeItem('babyMonitorUser');
    }
    return { valid: false };
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
  return !!token;
};

// Get stored token
export const getToken = () => {
  return localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
};