import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getSettings,
  updateSettings,
  updateNotificationSettings,
  getCurrentUser,
  updateProfile,
  exportUserData,
  deleteAccount,
  logout 
} from '../api/settings';

const Settings = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dataStats, setDataStats] = useState({
    feedingRecords: 0,
    diaperRecords: 0,
    sleepRecords: 0,
    growthRecords: 0
  });

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
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
  });

  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    language: 'en',
    measurementSystem: 'metric',
    autoSync: true,
    dataBackup: true,
    shareWithPartner: true,
    privacyMode: false,
    deleteDataAfter: 'never'
  });

  const fetchUserData = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      if (userData) {
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          emergencyContact: userData.emergencyContact || '',
          emergencyPhone: userData.emergencyPhone || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [settingsData, userData] = await Promise.all([
        getSettings(),
        fetchUserData()
      ]);
      
      // Handle settings data
      if (settingsData) {
        if (settingsData.app) {
          setAppSettings(prev => ({ ...prev, ...settingsData.app }));
        }
        if (settingsData.notifications) {
          setNotificationSettings(prev => ({ ...prev, ...settingsData.notifications }));
        }
      }
      
      setRetryCount(0); // Reset retry count on success
      
      // Fetch data statistics (simulated for now)
      setDataStats({
        feedingRecords: 42,
        diaperRecords: 156,
        sleepRecords: 87,
        growthRecords: 12
      });
      
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchSettings();
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError('Failed to load settings. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, fetchUserData]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const validateProfile = () => {
    const errors = [];
    
    if (!profileData.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!profileData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (profileData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(profileData.phone.replace(/\D/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    if (profileData.emergencyContact && !profileData.emergencyPhone) {
      errors.push('Please provide emergency contact phone number');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateProfile()) return;

    setIsSaving(true);

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess(result.message || 'Profile updated successfully!');
        setUser(result.user);
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setIsSaving(true);

    try {
      const result = await updateNotificationSettings(notificationSettings);
      if (result.success) {
        setSuccess(result.message || 'Notification settings updated!');
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
      setError(error.message || 'Failed to update notification settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAppSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setIsSaving(true);

    try {
      const result = await updateSettings({ app: appSettings });
      if (result.success) {
        setSuccess(result.message || 'App settings updated!');
        
        // Auto-scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Apply theme change immediately
        if (appSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        const timer = setTimeout(() => setSuccess(''), 3000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(error.message || 'Failed to update app settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeProfile = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleChangeNotification = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleChangeAppSettings = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleExportData = async () => {
    if (!window.confirm('This will download all your baby data as a JSON file. Continue?')) {
      return;
    }

    try {
      const result = await exportUserData();
      if (result.success) {
        // Create download link
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `baby-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        setSuccess('Data exported successfully! Check your downloads folder.');
        
        const timer = setTimeout(() => setSuccess(''), 5000);
        return () => clearTimeout(timer);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      setError(error.message || 'Failed to export data. Please try again.');
    }
  };

  const handleImportData = () => {
    alert('Import feature coming soon! You can upload JSON files to restore your data.');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete your account and all your baby data. This action cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }

    try {
      const result = await deleteAccount();
      if (result.success) {
        alert('Account deleted successfully. You will be logged out.');
        await handleLogout();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      if (onLogout) {
        onLogout();
      }
      navigate('/login');
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchSettings();
  };

  const resetAllSettings = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setAppSettings({
        theme: 'light',
        language: 'en',
        measurementSystem: 'metric',
        autoSync: true,
        dataBackup: true,
        shareWithPartner: true,
        privacyMode: false,
        deleteDataAfter: 'never'
      });
      setNotificationSettings({
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
      });
      setSuccess('Settings reset to defaults. Click Save to apply.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar onLogout={onLogout} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account, notifications, and app preferences
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 animate-fadeIn">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 animate-fadeIn">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-500 mr-3"></i>
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Tabs */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-1">
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'profile' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('profile')}
                >
                  <i className="fas fa-user mr-3"></i>
                  Profile
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'notifications' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className="fas fa-bell mr-3"></i>
                  Notifications
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'app' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('app')}
                >
                  <i className="fas fa-cog mr-3"></i>
                  App Settings
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'data' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('data')}
                >
                  <i className="fas fa-database mr-3"></i>
                  Data Management
                </button>
                <button
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeTab === 'about' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('about')}
                >
                  <i className="fas fa-info-circle mr-3"></i>
                  About & Help
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Profile Settings</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </div>
                
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleChangeProfile}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleChangeProfile}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="phone" className="block text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChangeProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="address" className="block text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={profileData.address}
                      onChange={handleChangeProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="2"
                      placeholder="Your home address"
                    />
                  </div>

                  <div className="border-t pt-6 mb-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="emergencyContact" className="block text-gray-700 mb-2">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          id="emergencyContact"
                          name="emergencyContact"
                          value={profileData.emergencyContact}
                          onChange={handleChangeProfile}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Spouse, family member, or friend"
                        />
                      </div>

                      <div>
                        <label htmlFor="emergencyPhone" className="block text-gray-700 mb-2">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          id="emergencyPhone"
                          name="emergencyPhone"
                          value={profileData.emergencyPhone}
                          onChange={handleChangeProfile}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Emergency contact number"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        address: user?.address || '',
                        emergencyContact: user?.emergencyContact || '',
                        emergencyPhone: user?.emergencyPhone || ''
                      })}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reset Changes
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="fas fa-save mr-2"></i>
                          Save Profile
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Notification Settings</h3>
                <form onSubmit={handleNotificationSubmit}>
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Reminder Types</h4>
                    <div className="space-y-4">
                      {[
                        { id: 'feedingReminders', icon: 'fas fa-bottle-feeding', label: 'Feeding Reminders', color: 'text-blue-600', description: 'Remind me when it\'s time for baby\'s next feeding' },
                        { id: 'diaperReminders', icon: 'fas fa-baby', label: 'Diaper Change Reminders', color: 'text-yellow-600', description: 'Remind me to check and change diapers regularly' },
                        { id: 'sleepReminders', icon: 'fas fa-bed', label: 'Sleep Schedule Reminders', color: 'text-purple-600', description: 'Remind me about nap times and bedtime routines' },
                        { id: 'medicationReminders', icon: 'fas fa-pills', label: 'Medication Reminders', color: 'text-red-600', description: 'Remind me when it\'s time for medications or vitamins' },
                        { id: 'appointmentReminders', icon: 'fas fa-calendar-check', label: 'Appointment Reminders', color: 'text-green-600', description: 'Remind me about upcoming doctor appointments' }
                      ].map(item => (
                        <div key={item.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                              <i className={`${item.icon} ${item.color}`}></i>
                            </div>
                            <div>
                              <label htmlFor={item.id} className="font-medium text-gray-800 cursor-pointer">
                                {item.label}
                              </label>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              id={item.id}
                              name={item.id}
                              checked={notificationSettings[item.id]}
                              onChange={handleChangeNotification}
                              className="sr-only"
                            />
                            <div 
                              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${notificationSettings[item.id] ? 'bg-green-500' : 'bg-gray-300'}`}
                              onClick={() => handleChangeNotification({ 
                                target: { 
                                  name: item.id, 
                                  type: 'checkbox', 
                                  checked: !notificationSettings[item.id] 
                                } 
                              })}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform transform mt-0.5 ml-0.5 ${notificationSettings[item.id] ? 'translate-x-6' : ''}`}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Notification Channels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { id: 'emailNotifications', icon: 'fas fa-envelope', label: 'Email' },
                        { id: 'pushNotifications', icon: 'fas fa-mobile-alt', label: 'Push' },
                        { id: 'smsNotifications', icon: 'fas fa-sms', label: 'SMS' }
                      ].map(channel => (
                        <div key={channel.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <i className={channel.icon}></i>
                              <span className="font-medium">{channel.label}</span>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                id={channel.id}
                                name={channel.id}
                                checked={notificationSettings[channel.id]}
                                onChange={handleChangeNotification}
                                className="sr-only"
                              />
                              <div 
                                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${notificationSettings[channel.id] ? 'bg-blue-500' : 'bg-gray-300'}`}
                                onClick={() => handleChangeNotification({ 
                                  target: { 
                                    name: channel.id, 
                                    type: 'checkbox', 
                                    checked: !notificationSettings[channel.id] 
                                  } 
                                })}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform transform mt-0.5 ml-0.5 ${notificationSettings[channel.id] ? 'translate-x-5' : ''}`}></div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {channel.id === 'smsNotifications' ? 'Standard rates may apply' : 'Instant notifications'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Advanced Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="reminderInterval" className="block text-gray-700 mb-2">
                          Reminder Interval
                        </label>
                        <select
                          id="reminderInterval"
                          name="reminderInterval"
                          value={notificationSettings.reminderInterval}
                          onChange={handleChangeNotification}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="1">Every 1 hour</option>
                          <option value="2">Every 2 hours</option>
                          <option value="3">Every 3 hours</option>
                          <option value="4">Every 4 hours</option>
                          <option value="6">Every 6 hours</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="quietHoursStart" className="block text-gray-700 mb-2">
                          Quiet Hours Start
                        </label>
                        <input
                          type="time"
                          id="quietHoursStart"
                          name="quietHoursStart"
                          value={notificationSettings.quietHoursStart}
                          onChange={handleChangeNotification}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label htmlFor="quietHoursEnd" className="block text-gray-700 mb-2">
                          Quiet Hours End
                        </label>
                        <input
                          type="time"
                          id="quietHoursEnd"
                          name="quietHoursEnd"
                          value={notificationSettings.quietHoursEnd}
                          onChange={handleChangeNotification}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="fas fa-bell mr-2"></i>
                          Save Notification Settings
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* App Settings Tab */}
            {activeTab === 'app' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">App Preferences</h3>
                  <button
                    onClick={resetAllSettings}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    <i className="fas fa-undo mr-1"></i>
                    Reset to Defaults
                  </button>
                </div>
                
                <form onSubmit={handleAppSettingsSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label htmlFor="theme" className="block text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        id="theme"
                        name="theme"
                        value={appSettings.theme}
                        onChange={handleChangeAppSettings}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="language" className="block text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        id="language"
                        name="language"
                        value={appSettings.language}
                        onChange={handleChangeAppSettings}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="measurementSystem" className="block text-gray-700 mb-2">
                        Measurement System
                      </label>
                      <select
                        id="measurementSystem"
                        name="measurementSystem"
                        value={appSettings.measurementSystem}
                        onChange={handleChangeAppSettings}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="metric">Metric (kg, cm)</option>
                        <option value="imperial">Imperial (lb, in)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="deleteDataAfter" className="block text-gray-700 mb-2">
                        Auto-Delete Inactive Data
                      </label>
                      <select
                        id="deleteDataAfter"
                        name="deleteDataAfter"
                        value={appSettings.deleteDataAfter}
                        onChange={handleChangeAppSettings}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="never">Never</option>
                        <option value="30days">After 30 days</option>
                        <option value="90days">After 90 days</option>
                        <option value="1year">After 1 year</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-800 mb-4">Data & Sync</h4>
                    <div className="space-y-4">
                      {[
                        { id: 'autoSync', label: 'Auto Sync', description: 'Automatically sync data with the cloud' },
                        { id: 'dataBackup', label: 'Automatic Backups', description: 'Daily backup of your baby\'s data' },
                        { id: 'shareWithPartner', label: 'Share with Partner', description: 'Allow partner to view and edit baby\'s data' },
                        { id: 'privacyMode', label: 'Privacy Mode', description: 'Hide sensitive information on app screenshots' }
                      ].map(item => (
                        <div key={item.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <label htmlFor={item.id} className="font-medium text-gray-800 cursor-pointer">
                              {item.label}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              id={item.id}
                              name={item.id}
                              checked={appSettings[item.id]}
                              onChange={handleChangeAppSettings}
                              className="sr-only"
                            />
                            <div 
                              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${appSettings[item.id] ? 'bg-green-500' : 'bg-gray-300'}`}
                              onClick={() => handleChangeAppSettings({ 
                                target: { 
                                  name: item.id, 
                                  type: 'checkbox', 
                                  checked: !appSettings[item.id] 
                                } 
                              })}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full transition-transform transform mt-0.5 ml-0.5 ${appSettings[item.id] ? 'translate-x-6' : ''}`}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <i className="fas fa-save mr-2"></i>
                          Save App Settings
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Data Management Tab */}
            {activeTab === 'data' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Data Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg mr-4">
                        <i className="fas fa-download text-blue-600 text-lg"></i>
                      </div>
                      <h5 className="font-medium text-gray-800">Export Data</h5>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Download all your baby's data as a JSON file for backup or transfer
                    </p>
                    <button
                      onClick={handleExportData}
                      className="w-full bg-white border border-blue-600 text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <i className="fas fa-file-export mr-2"></i>
                      Export Data
                    </button>
                  </div>

                  <div className="border border-green-200 rounded-lg p-6 bg-green-50">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg mr-4">
                        <i className="fas fa-upload text-green-600 text-lg"></i>
                      </div>
                      <h5 className="font-medium text-gray-800">Import Data</h5>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Import baby data from previous backups or other tracking apps
                    </p>
                    <button
                      onClick={handleImportData}
                      className="w-full bg-white border border-green-600 text-green-600 font-medium py-2 px-4 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <i className="fas fa-file-import mr-2"></i>
                      Import Data
                    </button>
                  </div>

                  <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-red-100 rounded-lg mr-4">
                        <i className="fas fa-trash-alt text-red-600 text-lg"></i>
                      </div>
                      <h5 className="font-medium text-gray-800">Delete Account</h5>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full bg-white border border-red-600 text-red-600 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete Account
                    </button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h5 className="text-lg font-medium text-gray-800 mb-4">Data Statistics</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{dataStats.feedingRecords}</div>
                      <div className="text-sm text-gray-600">Feeding Records</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{dataStats.diaperRecords}</div>
                      <div className="text-sm text-gray-600">Diaper Records</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{dataStats.sleepRecords}</div>
                      <div className="text-sm text-gray-600">Sleep Records</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800">{dataStats.growthRecords}</div>
                      <div className="text-sm text-gray-600">Growth Records</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About & Help Tab */}
            {activeTab === 'about' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">About & Help</h3>
                
                <div className="mb-8">
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <i className="fas fa-baby text-blue-600 text-2xl"></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">Baby Monitor</h4>
                      <p className="text-gray-600">Version 1.0.0</p>
                      <p className="text-sm text-gray-500 mt-1">Last updated: Dec 2024</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h5 className="text-lg font-medium text-gray-800 mb-4">Help & Support</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { icon: 'fas fa-question-circle', label: 'User Guide & Tutorials', color: 'text-blue-600' },
                      { icon: 'fas fa-envelope', label: 'Contact Support', color: 'text-green-600' },
                      { icon: 'fas fa-shield-alt', label: 'Privacy Policy', color: 'text-purple-600' },
                      { icon: 'fas fa-file-contract', label: 'Terms of Service', color: 'text-yellow-600' },
                      { icon: 'fas fa-star', label: 'Rate This App', color: 'text-orange-600' },
                      { icon: 'fas fa-bug', label: 'Report a Bug', color: 'text-red-600' }
                    ].map(link => (
                      <a
                        key={link.label}
                        href="#"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <i className={`${link.icon} ${link.color} mr-3`}></i>
                        <span className="font-medium text-gray-800">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h5 className="text-lg font-medium text-gray-800 mb-4">Quick Tips</h5>
                  <ul className="space-y-3">
                    {[
                      'Use the dashboard for a quick overview of your baby\'s day',
                      'Set up notifications to never miss important activities',
                      'Export your data regularly for backup',
                      'Share access with your partner for better coordination',
                      'Use dark mode for night-time feedings'
                    ].map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <i className="fas fa-lightbulb text-yellow-500 mr-3 mt-1"></i>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-6">
                  <h5 className="text-lg font-medium text-gray-800 mb-4">Account</h5>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 mb-2">Signed in as: <span className="font-medium">{user?.email || 'Unknown'}</span></p>
                      <p className="text-sm text-gray-500">You will need to login again to access your baby's data</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <div>
                <h5 className="font-medium text-gray-800">Connection Status</h5>
                <p className="text-sm text-gray-600">Connected to backend server</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-redo mr-2"></i>
                Refresh Status
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-question-circle mr-2"></i>
                Get Help
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;