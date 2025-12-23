import React, { createContext, useState, useContext, useEffect } from 'react';


const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiStatus, setApiStatus] = useState({
    healthy: true,
    message: '',
    loading: false
  });

  const checkConnection = async () => {
    setApiStatus(prev => ({ ...prev, loading: true }));
    try {
      const health = await checkApiHealth();
      setApiStatus({
        healthy: health.healthy,
        message: health.message,
        loading: false
      });
    } catch (error) {
      setApiStatus({
        healthy: false,
        message: 'Cannot connect to server',
        loading: false
      });
    }
  };

  useEffect(() => {
    // Check initial connection
    checkConnection();

    // Set up network listeners
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setApiStatus({
        healthy: false,
        message: 'You are offline',
        loading: false
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll API health every 30 seconds
    const intervalId = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  const retryConnection = () => {
    checkConnection();
  };

  const value = {
    isOnline,
    apiStatus,
    checkConnection,
    retryConnection
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
      
      {/* Connection Status Indicator */}
      {!isOnline && (
        <div className="network-alert">
          <i className="fas fa-wifi-slash me-2"></i>
          You are offline. Some features may not work.
        </div>
      )}
      
      {isOnline && !apiStatus.healthy && !apiStatus.loading && (
        <div className="network-alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {apiStatus.message}
          <button onClick={retryConnection} className="retry-btn">
            Retry
          </button>
        </div>
      )}
    </ApiContext.Provider>
  );
};