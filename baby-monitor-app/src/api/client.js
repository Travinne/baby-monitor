// client.js - Updated to match backend routes
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://baby-monitor-3vgm.onrender.com';

// Request timeout (30 seconds for file uploads)
const REQUEST_TIMEOUT = 30000;

const timeoutPromise = (timeout) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
};

const getHeaders = (isFormData = false) => {
  const token = localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  headers['Accept'] = 'application/json';
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (response) => {
  // Try to parse JSON, but handle non-JSON responses
  let data;
  const contentType = response.headers.get('content-type');
  
  // Handle 204 No Content responses
  if (response.status === 204) {
    return { success: true, message: 'Operation successful' };
  }
  
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  } else if (contentType && contentType.includes('text/')) {
    data = await response.text();
  } else {
    data = null;
  }
  
  if (!response.ok) {
    const error = new Error(data?.message || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

// Enhanced fetch with timeout and retry logic
const fetchWithTimeout = async (url, options, timeout = REQUEST_TIMEOUT, retries = 1) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await Promise.race([
        fetch(url, options),
        timeoutPromise(timeout)
      ]);
      return response;
    } catch (error) {
      if (error.message === 'Request timeout' && i < retries - 1) {
        console.warn(`Request timeout, retrying... (${i + 1}/${retries})`);
        continue;
      }
      throw error;
    }
  }
};

// GET request
export const get = async (endpoint, options = {}, timeout = REQUEST_TIMEOUT) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`GET ${url}`);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(),
      ...options,
    }, timeout);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`GET ${endpoint} error:`, error);
    
    // Handle specific errors
    if (error.message === 'Request timeout') {
      const customError = new Error('Request timeout. Please check your connection.');
      customError.status = 408;
      throw customError;
    }
    
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      const customError = new Error('Network error. Please check your internet connection.');
      customError.status = 0;
      throw customError;
    }
    
    // Re-throw handled errors
    if (error.status && error.data) {
      throw error;
    }
    
    // Wrap unhandled errors
    const wrappedError = new Error(`Request failed: ${error.message}`);
    wrappedError.status = 500;
    throw wrappedError;
  }
};

// POST request
export const post = async (endpoint, data = {}, options = {}, timeout = REQUEST_TIMEOUT) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`POST ${url}`, data);
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    }, timeout);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`POST ${endpoint} error:`, error);
    
    if (error.message === 'Request timeout') {
      const customError = new Error('Request timeout. Please try again.');
      customError.status = 408;
      throw customError;
    }
    
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      const customError = new Error('Network error. Please check your connection.');
      customError.status = 0;
      throw customError;
    }
    
    if (error.status && error.data) {
      throw error;
    }
    
    const wrappedError = new Error(`Request failed: ${error.message}`);
    wrappedError.status = 500;
    throw wrappedError;
  }
};

// PUT request
export const put = async (endpoint, data = {}, options = {}, timeout = REQUEST_TIMEOUT) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`PUT ${url}`, data);
    
    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      ...options,
    }, timeout);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`PUT ${endpoint} error:`, error);
    
    if (error.message === 'Request timeout') {
      const customError = new Error('Request timeout. Please try again.');
      customError.status = 408;
      throw customError;
    }
    
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      const customError = new Error('Network error. Please check your connection.');
      customError.status = 0;
      throw customError;
    }
    
    if (error.status && error.data) {
      throw error;
    }
    
    const wrappedError = new Error(`Request failed: ${error.message}`);
    wrappedError.status = 500;
    throw wrappedError;
  }
};

// DELETE request
export const del = async (endpoint, options = {}, timeout = REQUEST_TIMEOUT) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`DELETE ${url}`);
    
    const response = await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: getHeaders(),
      ...options,
    }, timeout);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`DELETE ${endpoint} error:`, error);
    
    if (error.message === 'Request timeout') {
      const customError = new Error('Request timeout. Please try again.');
      customError.status = 408;
      throw customError;
    }
    
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      const customError = new Error('Network error. Please check your connection.');
      customError.status = 0;
      throw customError;
    }
    
    if (error.status && error.data) {
      throw error;
    }
    
    const wrappedError = new Error(`Request failed: ${error.message}`);
    wrappedError.status = 500;
    throw wrappedError;
  }
};

// Upload file (FormData)
export const upload = async (endpoint, formData, options = {}, timeout = 60000) => {
  try {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`UPLOAD ${url}`);
    
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
      ...options,
    }, timeout);
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`UPLOAD ${endpoint} error:`, error);
    
    if (error.message === 'Request timeout') {
      const customError = new Error('Upload timeout. The file may be too large.');
      customError.status = 408;
      throw customError;
    }
    
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      const customError = new Error('Network error. Please check your connection.');
      customError.status = 0;
      throw customError;
    }
    
    if (error.status && error.data) {
      throw error;
    }
    
    const wrappedError = new Error(`Upload failed: ${error.message}`);
    wrappedError.status = 500;
    throw wrappedError;
  }
};

// Check API health
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        healthy: true, 
        status: data.status,
        service: data.service,
        version: data.version 
      };
    }
    
    return { 
      healthy: false, 
      message: 'API is not responding properly',
      status: response.status 
    };
  } catch (error) {
    return { 
      healthy: false, 
      message: 'Cannot connect to API. Please check your connection.',
      error: error.message 
    };
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
  return !!token;
};

// Get token
export const getToken = () => {
  return localStorage.getItem('babyMonitorToken') || sessionStorage.getItem('babyMonitorToken');
};

// Clear authentication data
export const clearAuthData = () => {
  localStorage.removeItem('babyMonitorToken');
  localStorage.removeItem('babyMonitorUser');
  sessionStorage.removeItem('babyMonitorToken');
  sessionStorage.removeItem('babyMonitorUser');
};

// Store authentication data
export const storeAuthData = (token, user, rememberMe = false) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('babyMonitorToken', token);
  storage.setItem('babyMonitorUser', JSON.stringify(user));
};

// Get stored user data
export const getStoredUser = () => {
  const userStr = localStorage.getItem('babyMonitorUser') || sessionStorage.getItem('babyMonitorUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }
  return null;
};

// Enhanced error handler for API calls
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error?.status === 401) {
    // Clear auth data on unauthorized
    clearAuthData();
    return {
      success: false,
      message: 'Session expired. Please login again.',
      requiresLogin: true
    };
  }
  
  if (error?.status === 403) {
    return {
      success: false,
      message: 'You do not have permission to perform this action.'
    };
  }
  
  if (error?.status === 404) {
    return {
      success: false,
      message: 'Resource not found.'
    };
  }
  
  if (error?.status === 409) {
    return {
      success: false,
      message: error.data?.message || 'Conflict occurred.'
    };
  }
  
  if (error?.status === 422) {
    return {
      success: false,
      message: 'Validation error.',
      errors: error.data?.errors || []
    };
  }
  
  if (error?.status === 500) {
    return {
      success: false,
      message: 'Server error. Please try again later.'
    };
  }
  
  return {
    success: false,
    message: error?.message || defaultMessage
  };
};