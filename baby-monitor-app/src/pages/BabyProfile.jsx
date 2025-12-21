import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getBabyProfile, 
  updateBabyProfile, 
  uploadBabyPhoto,
  getGrowthHistory,
  addGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
  validateBabyData,
  validateGrowthData
} from '../api/babyprofile';
import GrowthChart from './GrowthChart';

const BabyProfile = () => {
  const navigate = useNavigate();
  
  // State management
  const [profile, setProfile] = useState(null);
  const [growthRecords, setGrowthRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [editingGrowthId, setEditingGrowthId] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'male',
    weight: '',
    height: '',
    headCircumference: '',
    birthWeight: '',
    birthHeight: '',
    bloodType: '',
    pediatrician: '',
    pediatricianPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: '',
    specialNotes: ''
  });
  
  const [growthForm, setGrowthForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    headCircumference: '',
    notes: ''
  });
  
  // File upload
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Initial data fetching
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [profileData, growthData] = await Promise.all([
        getBabyProfile(),
        getGrowthHistory()
      ]);
      
      setProfile(profileData);
      setGrowthRecords(growthData);
      
      if (profileData) {
        setFormData({
          name: profileData.name || '',
          dateOfBirth: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
          gender: profileData.gender || 'male',
          weight: profileData.weight || '',
          height: profileData.height || '',
          headCircumference: profileData.headCircumference || '',
          birthWeight: profileData.birthWeight || '',
          birthHeight: profileData.birthHeight || '',
          bloodType: profileData.bloodType || '',
          pediatrician: profileData.pediatrician || '',
          pediatricianPhone: profileData.pediatricianPhone || '',
          emergencyContact: profileData.emergencyContact || '',
          emergencyPhone: profileData.emergencyPhone || '',
          allergies: profileData.allergies || '',
          specialNotes: profileData.specialNotes || ''
        });
        
        if (profileData.photoUrl) {
          setPhotoPreview(profileData.photoUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch baby data:', error);
      setError('Failed to load baby data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate baby's age
  const calculateAge = () => {
    if (!profile?.dateOfBirth) return '';
    
    const dob = new Date(profile.dateOfBirth);
    const today = new Date();
    
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();
    
    // Adjust for negative days/months
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    if (years > 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  // Calculate age in months for growth charts
  const calculateAgeInMonths = (date) => {
    if (!profile?.dateOfBirth || !date) return 0;
    
    const dob = new Date(profile.dateOfBirth);
    const recordDate = new Date(date);
    
    let months = (recordDate.getFullYear() - dob.getFullYear()) * 12;
    months += recordDate.getMonth() - dob.getMonth();
    
    // Adjust for days
    if (recordDate.getDate() < dob.getDate()) {
      months--;
    }
    
    return Math.max(0, months);
  };

  // Handle profile form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Handle growth form changes
  const handleGrowthFormChange = (e) => {
    const { name, value } = e.target;
    setGrowthForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size should be less than 5MB');
      return;
    }
    
    setPhoto(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate data
    const validation = validateBabyData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setIsSaving(true);
    
    try {
      let photoUrl = profile?.photoUrl;
      
      // Upload new photo if selected
      if (photo) {
        const uploadResult = await uploadBabyPhoto(photo);
        if (uploadResult.success) {
          photoUrl = uploadResult.photoUrl;
        } else {
          throw new Error(uploadResult.message);
        }
      }
      
      // Prepare update data
      const updateData = {
        ...formData,
        photoUrl,
        lastUpdated: new Date().toISOString()
      };
      
      // Update profile
      const result = await updateBabyProfile(updateData);
      
      if (result.success) {
        setProfile(result.data);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
      setPhoto(null);
    }
  };

  // Handle growth record submission
  const handleGrowthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate growth data
    const validation = validateGrowthData(growthForm);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setIsSaving(true);
    
    try {
      let result;
      
      if (editingGrowthId) {
        result = await updateGrowthRecord(editingGrowthId, growthForm);
      } else {
        result = await addGrowthRecord(growthForm);
      }
      
      if (result.success) {
        setSuccess(editingGrowthId ? 'Growth record updated!' : 'Growth record added!');
        setGrowthForm({
          date: new Date().toISOString().split('T')[0],
          weight: '',
          height: '',
          headCircumference: '',
          notes: ''
        });
        setEditingGrowthId(null);
        setShowGrowthForm(false);
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save growth record:', error);
      setError(error.message || 'Failed to save growth record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit growth record
  const handleEditGrowth = (record) => {
    setEditingGrowthId(record._id || record.id);
    setGrowthForm({
      date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
      weight: record.weight || '',
      height: record.height || '',
      headCircumference: record.headCircumference || '',
      notes: record.notes || ''
    });
    setShowGrowthForm(true);
    setActiveTab('growth');
  };

  // Delete growth record
  const handleDeleteGrowth = async (id) => {
    setDeletingId(id);
    setShowConfirmDelete(true);
  };

  const confirmDeleteGrowth = async () => {
    try {
      const result = await deleteGrowthRecord(deletingId);
      if (result.success) {
        setSuccess('Growth record deleted successfully!');
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to delete growth record');
    } finally {
      setShowConfirmDelete(false);
      setDeletingId(null);
    }
  };

  // Reset forms
  const resetForm = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
        gender: profile.gender || 'male',
        weight: profile.weight || '',
        height: profile.height || '',
        headCircumference: profile.headCircumference || '',
        birthWeight: profile.birthWeight || '',
        birthHeight: profile.birthHeight || '',
        bloodType: profile.bloodType || '',
        pediatrician: profile.pediatrician || '',
        pediatricianPhone: profile.pediatricianPhone || '',
        emergencyContact: profile.emergencyContact || '',
        emergencyPhone: profile.emergencyPhone || '',
        allergies: profile.allergies || '',
        specialNotes: profile.specialNotes || ''
      });
      setPhotoPreview(profile.photoUrl || '');
    }
    setPhoto(null);
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const resetGrowthForm = () => {
    setGrowthForm({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      headCircumference: '',
      notes: ''
    });
    setEditingGrowthId(null);
    setShowGrowthForm(false);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="baby-profile-page">
        <Navbar />
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
            <p className="mt-3">Loading baby profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="baby-profile-page">
      <Navbar />
      
      <main className="container">
        {/* Header */}
        <div className="page-header">
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Dashboard
          </button>
          <h1>Baby Profile</h1>
          <p className="text-secondary">
            Manage your baby's information, track growth, and monitor development
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger fade-in">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success fade-in">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </div>
        )}

        {/* Profile Summary Card */}
        <div className="card profile-summary-card mb-4">
          <div className="profile-header">
            <div className="profile-photo-container">
              <img 
                src={photoPreview || '/default-baby.png'} 
                alt="Baby" 
                className="profile-photo"
              />
              {isEditing && (
                <div className="photo-upload-overlay">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="d-none"
                  />
                  <label htmlFor="photo-upload" className="photo-upload-btn">
                    <i className="fas fa-camera"></i>
                    <span>Change Photo</span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-control form-control-lg mb-2"
                  placeholder="Baby's Name"
                  required
                />
              ) : (
                <h2>{profile?.name || 'Add Baby Name'}</h2>
              )}
              
              <div className="profile-meta">
                <div className="meta-item">
                  <i className="fas fa-birthday-cake me-2"></i>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="form-control form-control-sm d-inline-block"
                      style={{width: 'auto'}}
                      required
                    />
                  ) : (
                    <span>
                      {profile?.dateOfBirth 
                        ? formatDate(profile.dateOfBirth)
                        : 'Date of birth not set'
                      }
                    </span>
                  )}
                </div>
                
                <div className="meta-item">
                  <i className="fas fa-venus-mars me-2"></i>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-control form-control-sm w-auto d-inline-block"
                    >
                      <option value="male">Boy</option>
                      <option value="female">Girl</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <span>{profile?.gender === 'male' ? 'Boy' : profile?.gender === 'female' ? 'Girl' : 'Other'}</span>
                  )}
                </div>
                
                {profile?.dateOfBirth && (
                  <div className="meta-item">
                    <i className="fas fa-calendar-alt me-2"></i>
                    <span>{calculateAge()} old</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="profile-actions mt-4">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-edit me-2"></i>
                Edit Profile
              </button>
            ) : (
              <div className="d-flex gap-2">
                <button 
                  onClick={handleSaveProfile}
                  className="btn btn-success"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
                <button 
                  onClick={resetForm}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="tabs-navigation mb-4">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user me-2"></i>
            Profile Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'growth' ? 'active' : ''}`}
            onClick={() => setActiveTab('growth')}
          >
            <i className="fas fa-chart-line me-2"></i>
            Growth Tracking
          </button>
          <button 
            className={`tab-btn ${activeTab === 'medical' ? 'active' : ''}`}
            onClick={() => setActiveTab('medical')}
          >
            <i className="fas fa-heartbeat me-2"></i>
            Medical Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Profile Details Tab */}
          {activeTab === 'profile' && !isEditing && profile && (
            <div className="grid-2-col">
              <div className="card">
                <h3>Current Measurements</h3>
                <div className="measurements-grid">
                  <div className="measurement-card">
                    <div className="measurement-icon">
                      <i className="fas fa-weight"></i>
                    </div>
                    <div className="measurement-value">
                      {profile.weight ? `${profile.weight} kg` : 'Not set'}
                    </div>
                    <div className="measurement-label">Weight</div>
                  </div>
                  
                  <div className="measurement-card">
                    <div className="measurement-icon">
                      <i className="fas fa-ruler-vertical"></i>
                    </div>
                    <div className="measurement-value">
                      {profile.height ? `${profile.height} cm` : 'Not set'}
                    </div>
                    <div className="measurement-label">Height</div>
                  </div>
                  
                  <div className="measurement-card">
                    <div className="measurement-icon">
                      <i className="fas fa-circle"></i>
                    </div>
                    <div className="measurement-value">
                      {profile.headCircumference ? `${profile.headCircumference} cm` : 'Not set'}
                    </div>
                    <div className="measurement-label">Head Circumference</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3>Birth Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Birth Weight:</span>
                    <span className="info-value">{profile.birthWeight || 'Not recorded'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Birth Height:</span>
                    <span className="info-value">{profile.birthHeight || 'Not recorded'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Blood Type:</span>
                    <span className="info-value">{profile.bloodType || 'Not recorded'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">
                      {profile.lastUpdated ? formatDate(profile.lastUpdated) : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Growth Tracking Tab */}
          {activeTab === 'growth' && (
            <div>
              {/* Growth Chart */}
              {growthRecords.length > 0 && (
                <div className="card mb-4">
                  <h3>Growth Chart</h3>
                  <GrowthChart 
                    records={growthRecords}
                    birthDate={profile?.dateOfBirth}
                  />
                </div>
              )}
              
              {/* Growth Form */}
              {(showGrowthForm || growthRecords.length === 0) && (
                <div className="card mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3>{editingGrowthId ? 'Edit Growth Record' : 'Add Growth Record'}</h3>
                    <button 
                      onClick={resetGrowthForm}
                      className="btn btn-sm btn-secondary"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <form onSubmit={handleGrowthSubmit}>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={growthForm.date}
                        onChange={handleGrowthFormChange}
                        className="form-control"
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div className="grid-3-col">
                      <div className="form-group">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          type="number"
                          name="weight"
                          value={growthForm.weight}
                          onChange={handleGrowthFormChange}
                          className="form-control"
                          step="0.01"
                          min="0.5"
                          max="50"
                          placeholder="e.g., 3.5"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input
                          type="number"
                          name="height"
                          value={growthForm.height}
                          onChange={handleGrowthFormChange}
                          className="form-control"
                          step="0.1"
                          min="20"
                          max="200"
                          placeholder="e.g., 52.5"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label">Head Circ. (cm)</label>
                        <input
                          type="number"
                          name="headCircumference"
                          value={growthForm.headCircumference}
                          onChange={handleGrowthFormChange}
                          className="form-control"
                          step="0.1"
                          min="20"
                          max="60"
                          placeholder="e.g., 36.2"
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        name="notes"
                        value={growthForm.notes}
                        onChange={handleGrowthFormChange}
                        className="form-control"
                        rows="2"
                        placeholder="Any additional notes about this measurement..."
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus-circle me-2"></i>
                          {editingGrowthId ? 'Update' : 'Add'} Record
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
              
              {/* Growth History */}
              <div className="card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="mb-0">Growth History</h3>
                  {!showGrowthForm && (
                    <button 
                      onClick={() => setShowGrowthForm(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Record
                    </button>
                  )}
                </div>
                
                {growthRecords.length > 0 ? (
                  <div className="growth-history">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Age</th>
                            <th>Weight (kg)</th>
                            <th>Height (cm)</th>
                            <th>Head (cm)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {growthRecords.map((record) => (
                            <tr key={record._id || record.id}>
                              <td>{formatDate(record.date)}</td>
                              <td>{calculateAgeInMonths(record.date)} months</td>
                              <td>{record.weight || '-'}</td>
                              <td>{record.height || '-'}</td>
                              <td>{record.headCircumference || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    onClick={() => handleEditGrowth(record)}
                                    className="btn btn-sm btn-outline-primary me-2"
                                    title="Edit"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGrowth(record._id || record.id)}
                                    className="btn btn-sm btn-outline-danger"
                                    title="Delete"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state text-center py-5">
                    <i className="fas fa-chart-line fa-3x text-secondary mb-3"></i>
                    <h4>No Growth Records Yet</h4>
                    <p className="text-secondary mb-4">
                      Start tracking your baby's growth by adding the first measurement
                    </p>
                    <button 
                      onClick={() => setShowGrowthForm(true)}
                      className="btn btn-primary"
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add First Measurement
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medical Info Tab */}
          {activeTab === 'medical' && (
            <div className="grid-2-col">
              <div className="card">
                <h3>Medical Contacts</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Pediatrician:</span>
                    <span className="info-value">{profile?.pediatrician || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Pediatrician Phone:</span>
                    <span className="info-value">{profile?.pediatricianPhone || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Emergency Contact:</span>
                    <span className="info-value">{profile?.emergencyContact || 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Emergency Phone:</span>
                    <span className="info-value">{profile?.emergencyPhone || 'Not set'}</span>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3>Health Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Allergies:</span>
                    <span className="info-value">{profile?.allergies || 'None recorded'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Special Notes:</span>
                    <span className="info-value">{profile?.specialNotes || 'None'}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4>Medical Records</h4>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-file-medical me-2"></i>
                      View Vaccinations
                    </button>
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-stethoscope me-2"></i>
                      View Doctor Visits
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Delete */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="btn-close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this growth record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteGrowth}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyProfile;