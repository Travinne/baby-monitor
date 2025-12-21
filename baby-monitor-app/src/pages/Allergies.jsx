import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getAllergies,
  addAllergy,
  updateAllergy,
  deleteAllergy 
} from '../api/allergies';

const AllergiesTracker = () => {
  const navigate = useNavigate();
  const [allergies, setAllergies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'food',
    severity: 'mild',
    symptoms: [],
    triggers: [],
    treatment: '',
    notes: '',
    diagnosedDate: new Date().toISOString().split('T')[0],
    doctorNotes: ''
  });

  const [symptomInput, setSymptomInput] = useState('');
  const [triggerInput, setTriggerInput] = useState('');

  const allergyTypes = [
    { value: 'food', label: 'Food Allergy', icon: 'fas fa-utensils' },
    { value: 'environmental', label: 'Environmental', icon: 'fas fa-tree' },
    { value: 'medication', label: 'Medication', icon: 'fas fa-pills' },
    { value: 'skin', label: 'Skin Contact', icon: 'fas fa-hand-paper' },
    { value: 'insect', label: 'Insect Sting', icon: 'fas fa-bug' },
    { value: 'other', label: 'Other', icon: 'fas fa-allergies' }
  ];

  const severityLevels = [
    { value: 'mild', label: 'Mild', color: 'warning', description: 'Minor symptoms, no medical intervention needed' },
    { value: 'moderate', label: 'Moderate', color: 'orange', description: 'Some discomfort, may need medication' },
    { value: 'severe', label: 'Severe', color: 'danger', description: 'Requires medical attention' },
    { value: 'anaphylaxis', label: 'Anaphylaxis', color: 'danger', description: 'Life-threatening, requires emergency care' }
  ];

  useEffect(() => {
    fetchAllergies();
  }, []);

  const fetchAllergies = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getAllergies();
      setAllergies(data);
    } catch (error) {
      console.error('Failed to fetch allergies:', error);
      setError('Failed to load allergies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.type) {
      setError('Please fill in required fields (name and type)');
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (editingId) {
        result = await updateAllergy(editingId, formData);
      } else {
        result = await addAllergy(formData);
      }
      
      if (result.success) {
        setSuccess(editingId ? 'Allergy updated!' : 'Allergy added!');
        resetForm();
        await fetchAllergies();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save allergy:', error);
      setError(error.message || 'Failed to save allergy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (allergy) => {
    setEditingId(allergy._id || allergy.id);
    setFormData({
      name: allergy.name || '',
      type: allergy.type || 'food',
      severity: allergy.severity || 'mild',
      symptoms: allergy.symptoms || [],
      triggers: allergy.triggers || [],
      treatment: allergy.treatment || '',
      notes: allergy.notes || '',
      diagnosedDate: allergy.diagnosedDate ? allergy.diagnosedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      doctorNotes: allergy.doctorNotes || ''
    });
    setSymptomInput('');
    setTriggerInput('');
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this allergy record?')) {
      return;
    }

    try {
      const result = await deleteAllergy(id);
      if (result.success) {
        setSuccess('Allergy record deleted successfully!');
        await fetchAllergies();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to delete allergy:', error);
      setError('Failed to delete allergy. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'food',
      severity: 'mild',
      symptoms: [],
      triggers: [],
      treatment: '',
      notes: '',
      diagnosedDate: new Date().toISOString().split('T')[0],
      doctorNotes: ''
    });
    setSymptomInput('');
    setTriggerInput('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSymptomAdd = () => {
    if (symptomInput.trim()) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()]
      }));
      setSymptomInput('');
    }
  };

  const handleSymptomRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleTriggerAdd = () => {
    if (triggerInput.trim()) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, triggerInput.trim()]
      }));
      setTriggerInput('');
    }
  };

  const handleTriggerRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTypeInfo = (type) => {
    return allergyTypes.find(t => t.value === type) || allergyTypes[0];
  };

  const getSeverityInfo = (severity) => {
    return severityLevels.find(s => s.value === severity) || severityLevels[0];
  };

  const filteredAllergies = severityFilter === 'all' 
    ? allergies 
    : allergies.filter(a => a.severity === severityFilter);

  const hasEmergencyAllergies = allergies.some(a => 
    a.severity === 'severe' || a.severity === 'anaphylaxis'
  );

  const handleRetry = () => {
    fetchAllergies();
  };

  // Helper function for handling input key press
  const handleInputKeyPress = (e, addFunction) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFunction();
    }
  };

  return (
    <div className="allergies-page">
      <Navbar />
      
      <main className="container">
        <div className="page-header">
          <button 
            onClick={() => navigate('/trackers')}
            className="btn btn-secondary mb-3"
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Trackers
          </button>
          <h1>Allergies & Medications</h1>
          <p className="text-secondary">
            Track allergies, medications, and health conditions
          </p>
        </div>

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

        {/* Emergency Warning */}
        {hasEmergencyAllergies && (
          <div className="card emergency-card mb-4">
            <div className="d-flex align-items-center">
              <div className="emergency-icon">
                <i className="fas fa-exclamation-triangle text-danger"></i>
              </div>
              <div className="ms-3">
                <h4 className="text-danger">Emergency Allergy Alert</h4>
                <p className="mb-0">
                  Your baby has severe allergies. Always carry emergency medication and inform caregivers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>{editingId ? 'Edit Allergy' : 'Add New Allergy'}</h3>
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
                  <label htmlFor="name" className="form-label">
                    Allergy Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="e.g., Peanut Allergy, Penicillin Allergy"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    Allergy Type *
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
                    {allergyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level</label>
                <div className="severity-selector">
                  {severityLevels.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      className={`severity-btn ${formData.severity === level.value ? 'active' : ''} ${level.color}`}
                      onClick={() => handleChange({ target: { name: 'severity', value: level.value } })}
                      disabled={isSubmitting}
                    >
                      <span className="severity-label">{level.label}</span>
                      <span className="severity-description">{level.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="diagnosedDate" className="form-label">
                  Diagnosed Date
                </label>
                <input
                  type="date"
                  id="diagnosedDate"
                  name="diagnosedDate"
                  value={formData.diagnosedDate}
                  onChange={handleChange}
                  className="form-control"
                  max={new Date().toISOString().split('T')[0]}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <div className="symptoms-input-group">
                  <input
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyPress={(e) => handleInputKeyPress(e, handleSymptomAdd)}
                    className="form-control"
                    placeholder="Enter symptom (e.g., Rash, Swelling, Difficulty Breathing)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleSymptomAdd}
                    className="btn btn-outline-primary"
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                {formData.symptoms.length > 0 && (
                  <div className="symptoms-list mt-2">
                    {formData.symptoms.map((symptom, index) => (
                      <div key={index} className="symptom-tag">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        <span>{symptom}</span>
                        <button
                          type="button"
                          onClick={() => handleSymptomRemove(index)}
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

              <div className="form-group">
                <label className="form-label">Triggers</label>
                <div className="triggers-input-group">
                  <input
                    type="text"
                    value={triggerInput}
                    onChange={(e) => setTriggerInput(e.target.value)}
                    onKeyPress={(e) => handleInputKeyPress(e, handleTriggerAdd)}
                    className="form-control"
                    placeholder="Enter trigger (e.g., Peanuts, Dairy, Pollen)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleTriggerAdd}
                    className="btn btn-outline-primary"
                    disabled={isSubmitting}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                
                {formData.triggers.length > 0 && (
                  <div className="triggers-list mt-2">
                    {formData.triggers.map((trigger, index) => (
                      <div key={index} className="trigger-tag">
                        <i className="fas fa-bolt me-1"></i>
                        <span>{trigger}</span>
                        <button
                          type="button"
                          onClick={() => handleTriggerRemove(index)}
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

              <div className="form-group">
                <label htmlFor="treatment" className="form-label">
                  Treatment/Medication
                </label>
                <textarea
                  id="treatment"
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Antihistamine, Epinephrine Auto-Injector, Avoidance"
                  rows="2"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="doctorNotes" className="form-label">
                  Doctor's Notes
                </label>
                <textarea
                  id="doctorNotes"
                  name="doctorNotes"
                  value={formData.doctorNotes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Doctor's instructions and recommendations..."
                  rows="2"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Any additional information..."
                  rows="2"
                  disabled={isSubmitting}
                />
              </div>

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
                      {editingId ? 'Update' : 'Add'} Allergy
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

        {/* Allergies List */}
        <div className="card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Allergies List</h3>
            <div className="d-flex gap-2">
              <div className="filter-group">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="form-select form-select-sm"
                  disabled={isLoading}
                >
                  <option value="all">All Severities</option>
                  {severityLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
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
                  Add Allergy
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
              <p className="mt-3">Loading allergies...</p>
            </div>
          ) : filteredAllergies.length > 0 ? (
            <div className="allergies-list">
              {filteredAllergies.map((allergy) => {
                const typeInfo = getTypeInfo(allergy.type);
                const severityInfo = getSeverityInfo(allergy.severity);
                
                return (
                  <div key={allergy._id || allergy.id} className="allergy-item">
                    <div className="allergy-header">
                      <div className="allergy-type">
                        <div className={`type-icon ${allergy.type}`}>
                          <i className={typeInfo.icon}></i>
                        </div>
                        <div>
                          <h4 className="allergy-title">{allergy.name}</h4>
                          <div className="allergy-meta">
                            <span className="allergy-type-label">{typeInfo.label}</span>
                            <span className={`severity-badge ${severityInfo.color}`}>
                              {severityInfo.label}
                            </span>
                            {allergy.diagnosedDate && (
                              <span className="allergy-date ms-2">
                                <i className="fas fa-calendar me-1"></i>
                                Diagnosed: {formatDate(allergy.diagnosedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="allergy-actions">
                        <button
                          onClick={() => handleEdit(allergy)}
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(allergy._id || allergy.id)}
                          className="btn btn-sm btn-outline-danger ms-2"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    {/* Symptoms */}
                    {allergy.symptoms && allergy.symptoms.length > 0 && (
                      <div className="allergy-section mt-3">
                        <h5>Symptoms</h5>
                        <div className="symptoms-tags">
                          {allergy.symptoms.map((symptom, index) => (
                            <span key={index} className="symptom-tag">
                              <i className="fas fa-exclamation-circle me-1"></i>
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Triggers */}
                    {allergy.triggers && allergy.triggers.length > 0 && (
                      <div className="allergy-section mt-3">
                        <h5>Triggers to Avoid</h5>
                        <div className="triggers-tags">
                          {allergy.triggers.map((trigger, index) => (
                            <span key={index} className="trigger-tag">
                              <i className="fas fa-ban me-1"></i>
                              {trigger}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Treatment */}
                    {allergy.treatment && (
                      <div className="allergy-section mt-3">
                        <h5>Treatment</h5>
                        <p className="treatment-text">{allergy.treatment}</p>
                      </div>
                    )}

                    {/* Doctor's Notes */}
                    {allergy.doctorNotes && (
                      <div className="allergy-section mt-3">
                        <h5>Doctor's Instructions</h5>
                        <p className="doctor-notes">{allergy.doctorNotes}</p>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {allergy.notes && (
                      <div className="allergy-section mt-3">
                        <h5>Additional Notes</h5>
                        <p className="notes-text">{allergy.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-allergies fa-2x mb-3 text-secondary"></i>
              <p>No allergies recorded yet</p>
              <p className="text-sm text-secondary mb-4">
                Add your baby's allergies to keep track of symptoms and treatments
              </p>
              {severityFilter !== 'all' && (
                <button 
                  onClick={() => setSeverityFilter('all')}
                  className="btn btn-secondary me-2"
                >
                  Show All Allergies
                </button>
              )}
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                <i className="fas fa-plus me-2"></i>
                Add First Allergy
              </button>
            </div>
          )}
        </div>

        {/* Common Allergies Info */}
        <div className="card mt-4">
          <h3>Common Baby Allergies</h3>
          <div className="common-allergies">
            <div className="allergy-category">
              <h4>Food Allergies</h4>
              <div className="allergy-items">
                <div className="allergy-item-info">
                  <div className="item-name">Cow's Milk</div>
                  <div className="item-desc">Most common in infants, symptoms appear within weeks</div>
                </div>
                <div className="allergy-item-info">
                  <div className="item-name">Eggs</div>
                  <div className="item-desc">Usually outgrown by age 5-7</div>
                </div>
                <div className="allergy-item-info">
                  <div className="item-name">Peanuts</div>
                  <div className="item-desc">Can be severe, often lifelong</div>
                </div>
                <div className="allergy-item-info">
                  <div className="item-name">Tree Nuts</div>
                  <div className="item-desc">Walnuts, almonds, cashews - often lifelong</div>
                </div>
              </div>
            </div>

            <div className="allergy-category mt-4">
              <h4>Environmental Allergies</h4>
              <div className="allergy-items">
                <div className="allergy-item-info">
                  <div className="item-name">Dust Mites</div>
                  <div className="item-desc">Common trigger for eczema and asthma</div>
                </div>
                <div className="allergy-item-info">
                  <div className="item-name">Pet Dander</div>
                  <div className="item-desc">Cats and dogs are common triggers</div>
                </div>
                <div className="allergy-item-info">
                  <div className="item-name">Pollen</div>
                  <div className="item-desc">Seasonal, trees/grasses/weeds</div>
                </div>
              </div>
            </div>

            <div className="emergency-info mt-4 p-3 bg-danger-light border-left-danger">
              <h5 className="text-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Emergency Signs (Seek Immediate Help)
              </h5>
              <ul className="mb-0">
                <li>Difficulty breathing or wheezing</li>
                <li>Swelling of lips, tongue, or throat</li>
                <li>Severe vomiting or diarrhea</li>
                <li>Dizziness or fainting</li>
                <li>Rapid heartbeat or weak pulse</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AllergiesTracker;