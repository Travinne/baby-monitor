import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getCheckups, 
  addCheckup,
  updateCheckup,
  deleteCheckup,
  getCheckupStats,
  getUpcomingCheckups,
  validateCheckupData,
  getVaccinationHistory,
  getNextAppointment,
  getCheckupsByType
} from '../api/checkups';


const CheckUps = () => {
  const navigate = useNavigate();
  
  // State management
  const [checkups, setCheckups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    doctorName: '',
    clinic: '',
    type: 'routine',
    weight: '',
    height: '',
    headCircumference: '',
    vaccines: [],
    notes: '',
    nextAppointment: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    developmentalMilestones: '',
    concerns: '',
    recommendations: '',
    medicationPrescribed: '',
    followUpInstructions: ''
  });
  
  const [vaccineInput, setVaccineInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Options
  const checkupTypes = [
    { value: 'routine', label: 'Routine Checkup', icon: 'fas fa-stethoscope', color: 'primary' },
    { value: 'vaccination', label: 'Vaccination', icon: 'fas fa-syringe', color: 'success' },
    { value: 'sick', label: 'Sick Visit', icon: 'fas fa-heartbeat', color: 'danger' },
    { value: 'followup', label: 'Follow-up', icon: 'fas fa-calendar-check', color: 'info' },
    { value: 'specialist', label: 'Specialist', icon: 'fas fa-user-md', color: 'warning' },
    { value: 'emergency', label: 'Emergency', icon: 'fas fa-ambulance', color: 'danger' },
    { value: 'dental', label: 'Dental', icon: 'fas fa-tooth', color: 'cyan' },
    { value: 'vision', label: 'Vision', icon: 'fas fa-eye', color: 'purple' }
  ];
  
  const standardVaccines = [
    'DTaP (Diphtheria, Tetanus, Pertussis)',
    'Hib (Haemophilus influenzae type b)',
    'Hepatitis B',
    'IPV (Polio)',
    'PCV13 (Pneumococcal)',
    'RV (Rotavirus)',
    'MMR (Measles, Mumps, Rubella)',
    'Varicella (Chickenpox)',
    'Hepatitis A',
    'Influenza (Flu)',
    'COVID-19',
    'Meningococcal',
    'HPV (Human Papillomavirus)'
  ];
  
  // Initial data fetching
  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (checkups.length > 0) {
      const statsData = calculateStats();
      setStats(statsData);
      
      const next = getNextAppointment(checkups);
      setUpcoming(next ? [next] : []);
    }
  }, [checkups]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [history, statsData, upcomingData] = await Promise.all([
        getCheckups(),
        getCheckupStats(),
        getUpcomingCheckups()
      ]);
      
      setCheckups(history);
      setStats(statsData);
      setUpcoming(upcomingData);
    } catch (error) {
      console.error('Failed to fetch checkup data:', error);
      setError('Failed to load checkup data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const vaccinationHistory = getVaccinationHistory(checkups);
    const checkupsByType = getCheckupsByType(checkups);
    
    return {
      totalCheckups: checkups.length,
      totalVaccines: vaccinationHistory.length,
      lastCheckup: checkups.length > 0 ? new Date(checkups[0].date) : null,
      nextCheckup: upcoming.length > 0 ? new Date(upcoming[0].nextAppointment) : null,
      byType: Object.keys(checkupsByType).length,
      recentVaccines: vaccinationHistory.slice(0, 5)
    };
  };

  // Filter checkups
  const filteredCheckups = useMemo(() => {
    if (filterType === 'all') return checkups;
    return checkups.filter(checkup => checkup.type === filterType);
  }, [checkups, filterType]);

  // Format date and time
  const formatDate = (dateString, includeTime = false) => {
    try {
      const date = new Date(dateString);
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return date.toLocaleDateString('en-US', options);
    } catch {
      return 'Invalid date';
    }
  };

  const getTypeInfo = (type) => {
    return checkupTypes.find(t => t.value === type) || checkupTypes[0];
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past due';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  // Form handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate data
    const validation = validateCheckupData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const checkupData = {
        ...formData,
        timestamp: new Date().toISOString(),
        status: editingId ? 'updated' : 'logged'
      };
      
      let result;
      
      if (editingId) {
        result = await updateCheckup(editingId, checkupData);
      } else {
        result = await addCheckup(checkupData);
      }
      
      if (result.success) {
        setSuccess(editingId ? 'Checkup updated successfully!' : 'Checkup added successfully!');
        
        // Reset form
        resetForm();
        
        // Refresh data
        await fetchData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save checkup:', error);
      setError(error.message || 'Failed to save checkup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (checkup) => {
    setEditingId(checkup._id || checkup.id);
    setShowForm(true);
    setFormData({
      date: checkup.date ? checkup.date.split('T')[0] : new Date().toISOString().split('T')[0],
      doctorName: checkup.doctorName || '',
      clinic: checkup.clinic || '',
      type: checkup.type || 'routine',
      weight: checkup.weight || '',
      height: checkup.height || '',
      headCircumference: checkup.headCircumference || '',
      vaccines: checkup.vaccines || [],
      notes: checkup.notes || '',
      nextAppointment: checkup.nextAppointment ? checkup.nextAppointment.split('T')[0] : '',
      temperature: checkup.temperature || '',
      bloodPressure: checkup.bloodPressure || '',
      heartRate: checkup.heartRate || '',
      respiratoryRate: checkup.respiratoryRate || '',
      oxygenSaturation: checkup.oxygenSaturation || '',
      developmentalMilestones: checkup.developmentalMilestones || '',
      concerns: checkup.concerns || '',
      recommendations: checkup.recommendations || '',
      medicationPrescribed: checkup.medicationPrescribed || '',
      followUpInstructions: checkup.followUpInstructions || ''
    });
    setVaccineInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const result = await deleteCheckup(deletingId);
      if (result.success) {
        setSuccess('Checkup record deleted successfully!');
        await fetchData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to delete checkup record.');
    } finally {
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      doctorName: '',
      clinic: '',
      type: 'routine',
      weight: '',
      height: '',
      headCircumference: '',
      vaccines: [],
      notes: '',
      nextAppointment: '',
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      developmentalMilestones: '',
      concerns: '',
      recommendations: '',
      medicationPrescribed: '',
      followUpInstructions: ''
    });
    setVaccineInput('');
    setEditingId(null);
    setShowForm(false);
    setShowAdvanced(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleVaccineAdd = () => {
    if (vaccineInput.trim()) {
      setFormData(prev => ({
        ...prev,
        vaccines: [...prev.vaccines, vaccineInput.trim()]
      }));
      setVaccineInput('');
    }
  };

  const handleVaccineRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      vaccines: prev.vaccines.filter((_, i) => i !== index)
    }));
  };

  const handleVaccineSelect = (vaccine) => {
    if (!formData.vaccines.includes(vaccine)) {
      setFormData(prev => ({
        ...prev,
        vaccines: [...prev.vaccines, vaccine]
      }));
    }
  };

  const handleVaccineKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVaccineAdd();
    }
  };

  const handleRetry = () => {
    fetchData();
  };

  const clearFilter = () => {
    setFilterType('all');
  };

  // Loading state
  if (isLoading && checkups.length === 0) {
    return (
      <div className="checkups-page">
        <Navbar />
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
            <p className="mt-3">Loading medical checkups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkups-page">
      <Navbar />
      
      <main className="container">
        {/* Header */}
        <div className="page-header">
          <button 
            onClick={() => navigate('/trackers')}
            className="btn btn-secondary mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Trackers
          </button>
          <h1>Medical Checkups</h1>
          <p className="text-secondary">
            Track doctor visits, vaccinations, and medical appointments
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

        {/* Stats and Upcoming Cards */}
        <div className="grid-3-col mb-4">
          {/* Total Checkups */}
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-stethoscope text-primary"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCheckups || 0}</div>
              <div className="stat-label">Total Checkups</div>
            </div>
          </div>
          
          {/* Total Vaccines */}
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-syringe text-success"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalVaccines || 0}</div>
              <div className="stat-label">Vaccines Given</div>
            </div>
          </div>
          
          {/* Next Checkup */}
          <div className="card stat-card">
            <div className="stat-icon">
              <i className="fas fa-calendar-alt text-warning"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {upcoming.length > 0 ? getDaysUntil(upcoming[0].nextAppointment) : 'None'}
              </div>
              <div className="stat-label">Next Checkup</div>
            </div>
          </div>
        </div>

        {/* Upcoming Checkups */}
        {upcoming.length > 0 && (
          <div className="card upcoming-card mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="upcoming-icon">
                  <i className="fas fa-bell text-warning"></i>
                </div>
                <div className="ms-3">
                  <h4 className="text-primary mb-1">Upcoming Appointment</h4>
                  <p className="text-secondary mb-0">
                    {formatDate(upcoming[0].nextAppointment)} with {upcoming[0].doctorName}
                    {upcoming[0].clinic && ` at ${upcoming[0].clinic}`}
                  </p>
                </div>
              </div>
              <div className={`badge ${getDaysUntil(upcoming[0].nextAppointment) === 'Today' ? 'bg-danger' : 'bg-warning'} text-dark`}>
                {getDaysUntil(upcoming[0].nextAppointment)}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>{editingId ? 'Edit Checkup' : 'Add New Checkup'}</h3>
              <button 
                onClick={resetForm}
                className="btn btn-sm btn-secondary"
                disabled={isSubmitting}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid-2-col">
                <div className="form-group">
                  <label htmlFor="date" className="form-label">
                    <i className="fas fa-calendar me-2"></i>
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="form-control"
                    max={new Date().toISOString().split('T')[0]}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    <i className="fas fa-tag me-2"></i>
                    Appointment Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="form-control"
                    required
                    disabled={isSubmitting}
                  >
                    {checkupTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label htmlFor="doctorName" className="form-label">
                    <i className="fas fa-user-md me-2"></i>
                    Doctor's Name *
                  </label>
                  <input
                    type="text"
                    id="doctorName"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Dr. Smith"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clinic" className="form-label">
                    <i className="fas fa-hospital me-2"></i>
                    Clinic/Hospital
                  </label>
                  <input
                    type="text"
                    id="clinic"
                    name="clinic"
                    value={formData.clinic}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Children's Hospital"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <h5 className="mt-4 mb-3">
                <i className="fas fa-ruler-combined me-2"></i>
                Measurements
              </h5>
              <div className="grid-3-col">
                <div className="form-group">
                  <label htmlFor="weight" className="form-label">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="form-control"
                    step="0.01"
                    min="0"
                    max="50"
                    placeholder="e.g., 5.2"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="height" className="form-label">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="form-control"
                    step="0.1"
                    min="0"
                    max="200"
                    placeholder="e.g., 58.5"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="headCircumference" className="form-label">
                    Head Circ. (cm)
                  </label>
                  <input
                    type="number"
                    id="headCircumference"
                    name="headCircumference"
                    value={formData.headCircumference}
                    onChange={handleChange}
                    className="form-control"
                    step="0.1"
                    min="0"
                    max="60"
                    placeholder="e.g., 38.2"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Vaccines Section */}
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-syringe me-2"></i>
                  Vaccines Administered
                </label>
                
                {/* Quick Select */}
                <div className="quick-vaccines mb-2">
                  <small className="text-muted d-block mb-2">Quick select:</small>
                  <div className="vaccine-quick-select">
                    {standardVaccines.slice(0, 6).map(vaccine => (
                      <button
                        key={vaccine}
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2 mb-2"
                        onClick={() => handleVaccineSelect(vaccine)}
                        disabled={isSubmitting || formData.vaccines.includes(vaccine)}
                      >
                        <i className="fas fa-plus me-1"></i>
                        {vaccine.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Manual Input */}
                <div className="vaccines-input-group">
                  <input
                    type="text"
                    value={vaccineInput}
                    onChange={(e) => setVaccineInput(e.target.value)}
                    onKeyPress={handleVaccineKeyPress}
                    className="form-control"
                    placeholder="Enter vaccine name (e.g., DTaP)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleVaccineAdd}
                    className="btn btn-outline-primary"
                    disabled={isSubmitting || !vaccineInput.trim()}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                {/* Selected Vaccines */}
                {formData.vaccines.length > 0 && (
                  <div className="vaccines-list mt-2">
                    {formData.vaccines.map((vaccine, index) => (
                      <div key={index} className="vaccine-tag">
                        <i className="fas fa-syringe me-1"></i>
                        <span>{vaccine}</span>
                        <button
                          type="button"
                          onClick={() => handleVaccineRemove(index)}
                          className="btn btn-sm btn-link text-danger"
                          disabled={isSubmitting}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  <i className="fas fa-sticky-note me-2"></i>
                  Visit Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Doctor's notes, observations, concerns..."
                  rows="3"
                  disabled={isSubmitting}
                  maxLength="1000"
                />
                <small className="form-text text-muted">
                  {1000 - (formData.notes?.length || 0)} characters remaining
                </small>
              </div>

              {/* Next Appointment */}
              <div className="form-group">
                <label htmlFor="nextAppointment" className="form-label">
                  <i className="fas fa-calendar-check me-2"></i>
                  Next Appointment
                </label>
                <input
                  type="date"
                  id="nextAppointment"
                  name="nextAppointment"
                  value={formData.nextAppointment}
                  onChange={handleChange}
                  className="form-control"
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                />
              </div>

              {/* Advanced Options Toggle */}
              <div className="form-group">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  <i className={`fas fa-${showAdvanced ? 'minus' : 'plus'} me-2`}></i>
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <>
                  <h5 className="mt-4 mb-3">Vital Signs & Additional Info</h5>
                  
                  <div className="grid-3-col">
                    <div className="form-group">
                      <label htmlFor="temperature" className="form-label">
                        Temperature (°C)
                      </label>
                      <input
                        type="number"
                        id="temperature"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        className="form-control"
                        step="0.1"
                        min="34"
                        max="42"
                        placeholder="e.g., 36.6"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bloodPressure" className="form-label">
                        Blood Pressure
                      </label>
                      <input
                        type="text"
                        id="bloodPressure"
                        name="bloodPressure"
                        value={formData.bloodPressure}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="e.g., 110/70"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="heartRate" className="form-label">
                        Heart Rate (BPM)
                      </label>
                      <input
                        type="number"
                        id="heartRate"
                        name="heartRate"
                        value={formData.heartRate}
                        onChange={handleChange}
                        className="form-control"
                        min="40"
                        max="200"
                        placeholder="e.g., 120"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="developmentalMilestones" className="form-label">
                      Developmental Milestones
                    </label>
                    <textarea
                      id="developmentalMilestones"
                      name="developmentalMilestones"
                      value={formData.developmentalMilestones}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Any developmental milestones achieved..."
                      rows="2"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="recommendations" className="form-label">
                      Doctor's Recommendations
                    </label>
                    <textarea
                      id="recommendations"
                      name="recommendations"
                      value={formData.recommendations}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Doctor's recommendations..."
                      rows="2"
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      {editingId ? 'Update' : 'Add'} Checkup
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Checkup History */}
        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Checkup History</h3>
            <div className="d-flex gap-2 align-items-center">
              {/* Filter */}
              <div className="filter-group">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-select form-select-sm"
                  disabled={isLoading}
                >
                  <option value="all">All Types</option>
                  {checkupTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Checkup
                </button>
              )}
              
              <button 
                onClick={handleRetry}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-5">
              <LoadingSpinner />
              <p className="mt-3">Loading checkup history...</p>
            </div>
          ) : filteredCheckups.length > 0 ? (
            <div className="checkup-history">
              {filteredCheckups.map((checkup) => {
                const typeInfo = getTypeInfo(checkup.type);
                const daysUntilNext = checkup.nextAppointment ? getDaysUntil(checkup.nextAppointment) : null;
                
                return (
                  <div key={checkup._id || checkup.id} className="checkup-item">
                    <div className="checkup-header">
                      <div className="checkup-type">
                        <div className={`type-icon ${typeInfo.color}`}>
                          <i className={typeInfo.icon}></i>
                        </div>
                        <div>
                          <h4 className="checkup-title">
                            {typeInfo.label}
                            <span className="doctor-name"> with {checkup.doctorName}</span>
                          </h4>
                          <div className="checkup-meta">
                            <span className="checkup-date">
                              <i className="fas fa-calendar me-1"></i>
                              {formatDate(checkup.date)}
                            </span>
                            {checkup.clinic && (
                              <span className="checkup-clinic ms-3">
                                <i className="fas fa-hospital me-1"></i>
                                {checkup.clinic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="checkup-actions">
                        <button
                          onClick={() => handleEdit(checkup)}
                          className="btn btn-sm btn-outline-primary me-2"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(checkup._id || checkup.id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* Measurements */}
                    {(checkup.weight || checkup.height || checkup.headCircumference) && (
                      <div className="checkup-measurements mt-3">
                        <h5>Measurements</h5>
                        <div className="measurements-grid">
                          {checkup.weight && (
                            <div className="measurement">
                              <span className="measurement-label">Weight:</span>
                              <span className="measurement-value">{checkup.weight} kg</span>
                            </div>
                          )}
                          {checkup.height && (
                            <div className="measurement">
                              <span className="measurement-label">Height:</span>
                              <span className="measurement-value">{checkup.height} cm</span>
                            </div>
                          )}
                          {checkup.headCircumference && (
                            <div className="measurement">
                              <span className="measurement-label">Head Circ.:</span>
                              <span className="measurement-value">{checkup.headCircumference} cm</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vital Signs */}
                    {(checkup.temperature || checkup.heartRate || checkup.bloodPressure) && (
                      <div className="checkup-vitals mt-3">
                        <h5>Vital Signs</h5>
                        <div className="vitals-grid">
                          {checkup.temperature && (
                            <div className="vital">
                              <span className="vital-label">Temp:</span>
                              <span className="vital-value">{checkup.temperature}°C</span>
                            </div>
                          )}
                          {checkup.heartRate && (
                            <div className="vital">
                              <span className="vital-label">Heart Rate:</span>
                              <span className="vital-value">{checkup.heartRate} BPM</span>
                            </div>
                          )}
                          {checkup.bloodPressure && (
                            <div className="vital">
                              <span className="vital-label">BP:</span>
                              <span className="vital-value">{checkup.bloodPressure}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vaccines */}
                    {checkup.vaccines && checkup.vaccines.length > 0 && (
                      <div className="checkup-vaccines mt-3">
                        <h5>Vaccines Administered</h5>
                        <div className="vaccines-list">
                          {checkup.vaccines.map((vaccine, index) => (
                            <div key={index} className="vaccine-badge">
                              <i className="fas fa-syringe me-1"></i>
                              {vaccine}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {checkup.notes && (
                      <div className="checkup-notes mt-3">
                        <h5>Notes</h5>
                        <p className="notes-text">{checkup.notes}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {checkup.recommendations && (
                      <div className="checkup-recommendations mt-3">
                        <h5>Doctor's Recommendations</h5>
                        <p className="recommendations-text">{checkup.recommendations}</p>
                      </div>
                    )}

                    {/* Next Appointment */}
                    {checkup.nextAppointment && (
                      <div className="checkup-next mt-3">
                        <div className="next-appointment">
                          <i className="fas fa-calendar-check me-2"></i>
                          <span>
                            Next appointment: <strong>{formatDate(checkup.nextAppointment)}</strong>
                            {daysUntilNext && (
                              <span className={`ms-2 badge ${daysUntilNext === 'Today' || daysUntilNext === 'Past due' ? 'bg-danger' : 'bg-warning'}`}>
                                {daysUntilNext}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state text-center py-5">
              <i className="fas fa-stethoscope fa-3x mb-3 text-secondary"></i>
              <h4>No Checkups Found</h4>
              <p className="text-secondary mb-4">
                {filterType !== 'all' 
                  ? `No ${filterType} checkups found` 
                  : 'Add your baby\'s first medical checkup to get started'
                }
              </p>
              {filterType !== 'all' && (
                <button 
                  onClick={clearFilter}
                  className="btn btn-secondary me-2"
                >
                  Show All Checkups
                </button>
              )}
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-plus me-2"></i>
                Add First Checkup
              </button>
            </div>
          )}
        </div>

        {/* Recent Vaccines */}
        {stats.recentVaccines && stats.recentVaccines.length > 0 && (
          <div className="card mt-4">
            <h3>Recent Vaccinations</h3>
            <div className="recent-vaccines">
              {stats.recentVaccines.map((vaccine, index) => (
                <div key={index} className="vaccine-item">
                  <div className="vaccine-icon">
                    <i className="fas fa-syringe text-success"></i>
                  </div>
                  <div className="vaccine-info">
                    <div className="vaccine-name">{vaccine.name}</div>
                    <div className="vaccine-meta">
                      <span className="vaccine-date">
                        <i className="fas fa-calendar me-1"></i>
                        {formatDate(vaccine.date)}
                      </span>
                      <span className="vaccine-doctor ms-3">
                        <i className="fas fa-user-md me-1"></i>
                        {vaccine.doctor}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vaccination Schedule */}
        <div className="card mt-4">
          <h3>Standard Vaccination Schedule</h3>
          <div className="vaccine-schedule">
            <div className="table-responsive">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Vaccine</th>
                    <th>Purpose</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Birth</td>
                    <td>Hepatitis B (1st dose)</td>
                    <td>Protects against liver infection</td>
                    <td>Given within 24 hours of birth</td>
                  </tr>
                  <tr>
                    <td>2 months</td>
                    <td>DTaP, Hib, Polio, PCV13, Rotavirus</td>
                    <td>Multiple disease protection</td>
                    <td>First round of routine vaccines</td>
                  </tr>
                  <tr>
                    <td>4 months</td>
                    <td>DTaP, Hib, Polio, PCV13, Rotavirus</td>
                    <td>Booster doses</td>
                    <td>Second round of routine vaccines</td>
                  </tr>
                  <tr>
                    <td>6 months</td>
                    <td>DTaP, Hib, PCV13, Rotavirus, Influenza</td>
                    <td>Continued immunization</td>
                    <td>Flu vaccine can start at 6 months</td>
                  </tr>
                  <tr>
                    <td>12-15 months</td>
                    <td>MMR, Varicella, Hepatitis A</td>
                    <td>Measles, mumps, rubella, chickenpox</td>
                    <td>Important milestone vaccines</td>
                  </tr>
                  <tr>
                    <td>15-18 months</td>
                    <td>DTaP, Hib, PCV13</td>
                    <td>Final booster doses</td>
                    <td>Complete primary series</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="schedule-note mt-3 p-3 bg-info-light">
              <i className="fas fa-info-circle text-info me-2"></i>
              <span className="text-secondary">
                Always follow your pediatrician's recommended schedule. This is a general guideline based on CDC recommendations.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Delete</h5>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-close"
              ></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this checkup record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
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

export default CheckUps;