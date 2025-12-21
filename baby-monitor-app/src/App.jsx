import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { verifyToken } from './api/auth';
import { ApiProvider } from './context/ApiContext';
import ProtectedRoutes from './pages/ProtectedRoutes';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BabyProfile from './pages/BabyProfile';
import FeedTracker from './pages/FeedTracker';
import DiaperTracker from './pages/DiaperTracker';
import SleepTracker from './pages/SleepTracker';
import BathTime from './pages/BathTime';
import CheckUps from './pages/CheckUps';
import GrowthChart from './pages/GrowthChart';
import Allergies from './pages/Allergies';
import Settings from './pages/Settings';
import TrackerMenu from './pages/TrackerMenu';
import './App.css';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('babyMonitorToken');
      if (token) {
        const verification = await verifyToken();
        setIsAuthenticated(verification.valid);
        
        if (!verification.valid) {
          localStorage.removeItem('babyMonitorToken');
          localStorage.removeItem('babyMonitorUser');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('babyMonitorToken', token);
    localStorage.setItem('babyMonitorUser', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('babyMonitorToken');
      localStorage.removeItem('babyMonitorUser');
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Baby Monitor...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoutes isAuthenticated={isAuthenticated} />}>
            <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
            <Route path="/baby-profile" element={<BabyProfile />} />
            <Route path="/trackers" element={<TrackerMenu />} />
            <Route path="/feeding" element={<FeedTracker />} />
            <Route path="/diaper" element={<DiaperTracker />} />
            <Route path="/sleep" element={<SleepTracker />} />
            <Route path="/bath" element={<BathTime />} />
            <Route path="/checkups" element={<CheckUps />} />
            <Route path="/growth" element={<GrowthChart />} />
            <Route path="/allergies" element={<Allergies />} />
            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ApiProvider>
      <AppContent />
    </ApiProvider>
  );
}

export default App;