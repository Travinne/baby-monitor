// client.js - Updated to match backend routes exactly
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://baby-monitor-3vgm.onrender.com/api';

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

export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('API unreachable');
    }

    return {
      healthy: true,
      message: 'Connected to server',
    };
  } catch (error) {
    throw new Error('Cannot connect to server');
  }
};

// Fix: Since API_BASE_URL already includes /api, we don't need to prepend it
const getFullUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
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
    const url = getFullUrl(endpoint);
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
    const url = getFullUrl(endpoint);
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
    const url = getFullUrl(endpoint);
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
    const url = getFullUrl(endpoint);
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
    const url = getFullUrl(endpoint);
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

// Get image URL for baby photos
export const getImageUrl = (filename) => {
  if (!filename) return null;
  const base = API_BASE_URL.replace('/api', '');
  return `${base}/uploads/baby_photos/${filename}`;
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

// API service functions that match backend routes
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => post('auth/login', credentials),
    register: (userData) => post('auth/register', userData),
    logout: () => post('auth/logout'),
    refresh: () => post('auth/refresh'),
    verify: () => get('auth/verify'),
  },
  
  // Baby endpoints
  baby: {
    getAll: () => get('baby'),
    getById: (id) => get(`baby/${id}`),
    create: (babyData) => post('baby', babyData),
    update: (id, babyData) => put(`baby/${id}`, babyData),
    delete: (id) => del(`baby/${id}`),
    uploadPhoto: (id, formData) => upload(`baby/${id}/photo`, formData),
  },
  
  // Feeding endpoints
  feedings: {
    getAll: () => get('feedings'),
    getById: (id) => get(`feedings/${id}`),
    create: (feedingData) => post('feedings', feedingData),
    update: (id, feedingData) => put(`feedings/${id}`, feedingData),
    delete: (id) => del(`feedings/${id}`),
    getByBaby: (babyId) => get(`feedings/baby/${babyId}`),
  },
  
  // Sleep endpoints
  sleep: {
    getAll: () => get('sleep'),
    getById: (id) => get(`sleep/${id}`),
    create: (sleepData) => post('sleep', sleepData),
    update: (id, sleepData) => put(`sleep/${id}`, sleepData),
    delete: (id) => del(`sleep/${id}`),
    getByBaby: (babyId) => get(`sleep/baby/${babyId}`),
  },
  
  // Diaper endpoints
  diapers: {
    getAll: () => get('diapers'),
    getById: (id) => get(`diapers/${id}`),
    create: (diaperData) => post('diapers', diaperData),
    update: (id, diaperData) => put(`diapers/${id}`, diaperData),
    delete: (id) => del(`diapers/${id}`),
    getByBaby: (babyId) => get(`diapers/baby/${babyId}`),
  },
  
  // Bath endpoints
  baths: {
    getAll: () => get('baths'),
    getById: (id) => get(`baths/${id}`),
    create: (bathData) => post('baths', bathData),
    update: (id, bathData) => put(`baths/${id}`, bathData),
    delete: (id) => del(`baths/${id}`),
    getByBaby: (babyId) => get(`baths/baby/${babyId}`),
  },
  
  // Growth endpoints
  growth: {
    getAll: () => get('growth'),
    getById: (id) => get(`growth/${id}`),
    create: (growthData) => post('growth', growthData),
    update: (id, growthData) => put(`growth/${id}`, growthData),
    delete: (id) => del(`growth/${id}`),
    getByBaby: (babyId) => get(`growth/baby/${babyId}`),
  },
  
  // Checkup endpoints
  checkups: {
    getAll: () => get('checkups'),
    getById: (id) => get(`checkups/${id}`),
    create: (checkupData) => post('checkups', checkupData),
    update: (id, checkupData) => put(`checkups/${id}`, checkupData),
    delete: (id) => del(`checkups/${id}`),
    getByBaby: (babyId) => get(`checkups/baby/${babyId}`),
  },
  
  // Allergies endpoints
  allergies: {
    getAll: () => get('allergies'),
    getById: (id) => get(`allergies/${id}`),
    create: (allergyData) => post('allergies', allergyData),
    update: (id, allergyData) => put(`allergies/${id}`, allergyData),
    delete: (id) => del(`allergies/${id}`),
    getByBaby: (babyId) => get(`allergies/baby/${babyId}`),
  },
  
  // Settings endpoints
  settings: {
    getUserSettings: () => get('settings'),
    updateUserSettings: (settings) => put('settings', settings),
  },
  
  // Notifications endpoints
  notifications: {
    getAll: () => get('notifications'),
    getUnread: () => get('notifications/unread'),
    markAsRead: (id) => put(`notifications/${id}/read`),
    markAllAsRead: () => put('notifications/read-all'),
    delete: (id) => del(`notifications/${id}`),
  },
};