import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, validatePassword } from '../api/auth';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setServerError('');
    
    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password
      });
      
      if (response.success) {
        // Store based on remember me
        if (formData.rememberMe) {
          // Already stored by login function
        } else {
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
        setServerError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) setServerError('');
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@example.com',
      password: 'DemoPass123',
      rememberMe: false
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
              <h2>Welcome Back</h2>
              <p className="text-secondary">
                Sign in to access your baby's dashboard
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
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle me-1"></i>
                    {errors.password}
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
                  Remember me
                </label>
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
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </>
                  )}
                </button>
              </div>
              
              <div className="form-group text-center">
                <button
                  type="button"
                  onClick={handleDemoLogin}
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
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary">
                    Sign up here
                  </Link>
                </p>
                <p className="mb-0">
                  <Link to="/forgot-password" className="text-secondary">
                    <i className="fas fa-key me-1"></i>
                    Forgot your password?
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
              <h3>Why Baby Monitor?</h3>
              <ul className="features-list">
                <li><i className="fas fa-check-circle text-success me-2"></i> Track all baby activities</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Monitor growth patterns</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Set smart reminders</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Share with family members</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Access from any device</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> 24/7 monitoring insights</li>
                <li><i className="fas fa-check-circle text-success me-2"></i> Doctor-approved tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;