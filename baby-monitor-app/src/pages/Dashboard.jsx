import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../api/notifications';
import { getBabyProfile } from '../api/babyprofile';
import { getTodayFeedings } from '../api/feeding';
import { getSleepStats } from '../api/sleep';
import { getTodayDiapers } from '../api/diapers';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState({
    recentActivities: [],
    stats: {
      todayFeeds: 0,
      todaySleeps: 0,
      todayDiapers: 0,
      activeAlerts: 0
    },
    babyInfo: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch data from multiple endpoints
      const [babyProfile, feedings, sleepStats, diapers, notifications] = await Promise.allSettled([
        getBabyProfile(),
        getTodayFeedings(),
        getSleepStats('today'),
        getTodayDiapers(),
        getDashboardData()
      ]);

      const baby = babyProfile.status === 'fulfilled' ? babyProfile.value : null;
      const todayFeeds = feedings.status === 'fulfilled' ? feedings.value.length : 0;
      const todaySleep = sleepStats.status === 'fulfilled' ? sleepStats.value.totalDuration : 0;
      const todayDiapers = diapers.status === 'fulfilled' ? diapers.value.length : 0;
      const dashboard = notifications.status === 'fulfilled' ? notifications.value : {};

      // Calculate age from date of birth
      let babyAge = '';
      if (baby?.dateOfBirth) {
        const dob = new Date(baby.dateOfBirth);
        const today = new Date();
        const months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
        if (months < 12) {
          babyAge = `${months} month${months !== 1 ? 's' : ''}`;
        } else {
          const years = Math.floor(months / 12);
          const remainingMonths = months % 12;
          babyAge = `${years} year${years !== 1 ? 's' : ''}`;
          if (remainingMonths > 0) {
            babyAge += ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
          }
        }
      }

      setDashboardData({
        recentActivities: dashboard.recentActivities || [],
        stats: {
          todayFeeds,
          todaySleeps: Math.round(todaySleep / 60), // Convert to hours
          todayDiapers,
          activeAlerts: dashboard.activeAlerts || 0
        },
        babyInfo: baby ? {
          name: baby.name || 'Baby',
          age: babyAge,
          lastCheckup: baby.lastCheckup || 'Not recorded'
        } : null
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'Invalid time';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'feeding':
        return { icon: 'fas fa-bottle-feeding', color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'sleep':
        return { icon: 'fas fa-bed', color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'diaper':
        return { icon: 'fas fa-baby', color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'bath':
        return { icon: 'fas fa-shower', color: 'text-cyan-500', bg: 'bg-cyan-100' };
      default:
        return { icon: 'fas fa-bell', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Navbar onLogout={onLogout} />
        <div className="container">
          <div className="loading-card">
            <LoadingSpinner />
            <p className="mt-3">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <Navbar onLogout={onLogout} />
        <div className="container">
          <div className="error-card">
            <i className="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
            <h3>Error Loading Dashboard</h3>
            <p className="text-secondary mb-4">{error}</p>
            <button onClick={handleRetry} className="btn btn-primary">
              <i className="fas fa-redo me-2"></i>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar onLogout={onLogout} />
      
      <main className="container">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="text-secondary">
              Welcome back! Here's your baby's activity summary.
            </p>
          </div>
          <div className="dashboard-actions">
            <Link to="/baby-profile" className="btn btn-primary">
              <i className="fas fa-user-circle me-2"></i>
              View Profile
            </Link>
            <Link to="/trackers" className="btn btn-secondary">
              <i className="fas fa-plus-circle me-2"></i>
              Add Activity
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon feeding">
              <i className="fas fa-bottle-feeding"></i>
            </div>
            <div className="stat-value">{dashboardData.stats.todayFeeds}</div>
            <div className="stat-label">Feeds Today</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon sleeping">
              <i className="fas fa-bed"></i>
            </div>
            <div className="stat-value">{dashboardData.stats.todaySleeps}h</div>
            <div className="stat-label">Sleep Today</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon diaper">
              <i className="fas fa-baby"></i>
            </div>
            <div className="stat-value">{dashboardData.stats.todayDiapers}</div>
            <div className="stat-label">Diapers Today</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon alert">
              <i className="fas fa-bell"></i>
            </div>
            <div className="stat-value">{dashboardData.stats.activeAlerts}</div>
            <div className="stat-label">Active Alerts</div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-home me-2"></i>
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <i className="fas fa-history me-2"></i>
            Recent Activities
          </button>
          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <i className="fas fa-bell me-2"></i>
            Alerts
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="grid-2-col">
                {/* Quick Actions */}
                <div className="card">
                  <h3>Quick Actions</h3>
                  <div className="quick-actions">
                    <Link to="/feeding" className="quick-action-btn">
                      <i className="fas fa-bottle-feeding"></i>
                      <span>Log Feeding</span>
                    </Link>
                    <Link to="/diaper" className="quick-action-btn">
                      <i className="fas fa-baby"></i>
                      <span>Log Diaper</span>
                    </Link>
                    <Link to="/sleep" className="quick-action-btn">
                      <i className="fas fa-bed"></i>
                      <span>Log Sleep</span>
                    </Link>
                    <Link to="/bath" className="quick-action-btn">
                      <i className="fas fa-shower"></i>
                      <span>Log Bath</span>
                    </Link>
                  </div>
                </div>

                {/* Baby Info */}
                {dashboardData.babyInfo && (
                  <div className="card">
                    <h3>Baby Information</h3>
                    <div className="baby-info">
                      <div className="info-row">
                        <span className="info-label">Name:</span>
                        <span className="info-value">{dashboardData.babyInfo.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Age:</span>
                        <span className="info-value">{dashboardData.babyInfo.age || 'Not set'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Last Checkup:</span>
                        <span className="info-value">{dashboardData.babyInfo.lastCheckup}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recent' && (
            <div className="card">
              <h3>Recent Activities</h3>
              {dashboardData.recentActivities.length > 0 ? (
                <div className="activity-log">
                  {dashboardData.recentActivities.slice(0, 10).map((activity, index) => {
                    const icon = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="activity-item">
                        <div className={`activity-icon ${icon.bg}`}>
                          <i className={`${icon.icon} ${icon.color}`}></i>
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title}</div>
                          <div className="activity-details">
                            {activity.details && (
                              <span className="activity-detail">{activity.details}</span>
                            )}
                            <span className="activity-time">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-history fa-2x mb-3 text-secondary"></i>
                  <p>No activities recorded yet.</p>
                  <Link to="/trackers" className="btn btn-primary mt-3">
                    Start Logging Activities
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="card">
              <h3>Alerts & Reminders</h3>
              <div className="empty-state">
                <i className="fas fa-bell fa-2x mb-3 text-secondary"></i>
                <p>No active alerts at the moment.</p>
                <p className="text-sm text-secondary">
                  You'll see alerts here for upcoming feedings, medications, and appointments.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;