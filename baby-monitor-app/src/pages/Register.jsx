import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, validatePassword } from '../api/auth';


const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value.trim()) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value))
          return 'Only letters, numbers, and underscores allowed';
        return '';
        
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Please enter a valid email';
        return '';
        
      case 'password':
        if (!value) return 'Password is required';
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          return passwordValidation.errors[0];
        }
        return '';
        
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
        
      case 'acceptTerms':
        if (!value) return 'You must accept the terms and conditions';
        return '';
        
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(formData).forEach(key => {
      if (key === 'rememberMe') return; // Skip rememberMe for validation
      
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.success) {
        // Handle storage based on remember me
        if (!formData.rememberMe) {
          // Move to session storage
          const token = localStorage.getItem('babyMonitorToken');
          const user = localStorage.getItem('babyMonitorUser');
          if (token && user) {
            localStorage.removeItem('babyMonitorToken');
            localStorage.removeItem('babyMonitorUser');
            sessionStorage.setItem('babyMonitorToken', token);
            sessionStorage.setItem('babyMonitorUser', user);
          }
        }
        
        if (onLogin) {
          onLogin(response.token, response.user);
        }
        navigate('/dashboard');
      } else {
        setServerError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) setServerError('');
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'rememberMe') return;
    
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleDemoRegister = () => {
    setFormData({
      username: 'demo_user',
      email: 'demo@example.com',
      password: 'DemoPass123',
      confirmPassword: 'DemoPass123',
      rememberMe: false,
      acceptTerms: true
    });
  };

  return (
    <div className="auth-page">
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="nav-brand">
            <i className="fas fa-baby"></i> Baby Monitor
          </Link>
        </div>
      </nav>

      <main className="container">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Create Account</h2>
              <p className="text-secondary">
                Start tracking your baby's development today
              </p>
            </div>
            
            {serverError && (
              <div className="alert alert-danger fade-in">
                <i className="fas fa-exclamation-circle me-2"></i>
                {serverError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username *
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-user"></i>
                  </span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    placeholder="Choose a username"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.username}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-envelope"></i>
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.email}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.password}
                  </div>
                )}
                <small className="form-text text-muted">
                  Password must be at least 8 characters with uppercase, lowercase, and a number
                </small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password *
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
              
              <div className="form-group form-check">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="form-check-input"
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="form-check-label">
                  Remember me (stay logged in)
                </label>
              </div>
              
              <div className="form-group form-check">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`}
                  disabled={isLoading}
                />
                <label htmlFor="acceptTerms" className="form-check-label">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary">
                    Privacy Policy
                  </Link>
                  *
                </label>
                {errors.acceptTerms && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.acceptTerms}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </button>
              </div>
              
              <div className="form-group text-center">
                <button
                  type="button"
                  onClick={handleDemoRegister}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={isLoading}
                >
                  <i className="fas fa-magic me-1"></i>
                  Try Demo Account
                </button>
              </div>
            </form>
            
            <div className="auth-footer">
              <div className="divider">
                <span>or</span>
              </div>
              
              <div className="text-center">
                <p className="mb-2">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary">
                    Sign in here
                  </Link>
                </p>
                <p className="mt-3">
                  <Link to="/" className="text-secondary">
                    <i className="fas fa-arrow-left me-1"></i>
                    Back to Home
                  </Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="auth-info">
            <div className="info-card">
              <h3>Get Started with Baby Monitor</h3>
              <ul className="features-list">
                <li><i className="fas fa-check-circle text-success me-2"></i> Free 30-day trial</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> No credit card required</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Track unlimited babies</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Family sharing included</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Doctor-approved tracking</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> 24/7 support</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Secure data encryption</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;