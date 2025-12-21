import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';


const Home = ({ isAuthenticated }) => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShowWelcome(true);
  }, []);

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="nav-brand">
            <i className="fas fa-baby"></i> Baby Monitor
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link active">Home</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/settings" className="nav-link">Settings</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        <div className={`hero-section fade-in ${showWelcome ? 'visible' : ''}`}>
          <div className="hero-content">
            <h1>Welcome to Baby Monitor</h1>
            <p className="subtitle">
              The ultimate tool for tracking your baby's daily activities, health, and development
            </p>
            
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard <i className="fas fa-arrow-right"></i>
              </Link>
            ) : (
              <div className="cta-buttons">
                <Link to="/login" className="btn btn-primary btn-lg">
                  <i className="fas fa-sign-in-alt"></i> Login
                </Link>
                <Link to="/register" className="btn btn-secondary btn-lg">
                  <i className="fas fa-user-plus"></i> Register
                </Link>
              </div>
            )}
          </div>
          
          <div className="hero-image">
            <div className="floating-icons">
              <div className="icon-item feeding">
                <i className="fas fa-bottle-feeding"></i>
                <span>Feeding</span>
              </div>
              <div className="icon-item sleeping">
                <i className="fas fa-bed"></i>
                <span>Sleeping</span>
              </div>
              <div className="icon-item diaper">
                <i className="fas fa-baby"></i>
                <span>Diaper</span>
              </div>
              <div className="icon-item health">
                <i className="fas fa-heartbeat"></i>
                <span>Health</span>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2 className="text-center">Everything You Need in One Place</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Growth Tracking</h3>
              <p>Monitor your baby's height, weight, and milestones with detailed charts and insights.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h3>Activity Logging</h3>
              <p>Track feeding times, diaper changes, sleep patterns, and bath times with ease.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bell"></i>
              </div>
              <h3>Smart Reminders</h3>
              <p>Get timely reminders for feedings, medications, and important appointments.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>Mobile Friendly</h3>
              <p>Access your baby's data anywhere, anytime from your smartphone or tablet.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Baby Monitor. All rights reserved.</p>
          <p>Made with <i className="fas fa-heart" style={{color: '#ef4444'}}></i> for parents everywhere</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;