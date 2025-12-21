import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ onLogout }) => {
  const location = useLocation();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fas fa-home' },
    { path: '/baby-profile', label: 'Baby Profile', icon: 'fas fa-user-circle' },
    { path: '/trackers', label: 'Trackers', icon: 'fas fa-plus-circle' },
    { path: '/settings', label: 'Settings', icon: 'fas fa-cog' }
  ];

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-brand">
          <i className="fas fa-baby"></i> Baby Monitor
        </Link>
        
        <div className="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <i className={`${link.icon} me-2`}></i>
              {link.label}
            </Link>
          ))}
          
          <button 
            onClick={onLogout}
            className="btn btn-outline-danger btn-sm"
          >
            <i className="fas fa-sign-out-alt me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;