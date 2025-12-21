import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const TrackerMenu = () => {
  const trackers = [
    {
      title: 'Feeding',
      description: 'Log breast, formula, and solid feedings',
      icon: 'fas fa-bottle-feeding',
      color: 'blue',
      path: '/feeding'
    },
    {
      title: 'Diaper',
      description: 'Track diaper changes and types',
      icon: 'fas fa-baby',
      color: 'yellow',
      path: '/diaper'
    },
    {
      title: 'Sleep',
      description: 'Monitor sleep patterns and duration',
      icon: 'fas fa-bed',
      color: 'purple',
      path: '/sleep'
    },
    {
      title: 'Bath Time',
      description: 'Record bath times and notes',
      icon: 'fas fa-shower',
      color: 'cyan',
      path: '/bath'
    },
    {
      title: 'Growth',
      description: 'Track height, weight, and milestones',
      icon: 'fas fa-chart-line',
      color: 'green',
      path: '/growth'
    },
    {
      title: 'Checkups',
      description: 'Schedule and log doctor visits',
      icon: 'fas fa-stethoscope',
      color: 'red',
      path: '/checkups'
    },
    {
      title: 'Allergies',
      description: 'Monitor allergies and medications',
      icon: 'fas fa-allergies',
      color: 'orange',
      path: '/allergies'
    }
  ];

  return (
    <div className="tracker-menu-page">
      <Navbar />
      
      <main className="container">
        <div className="page-header">
          <h1>Activity Trackers</h1>
          <p className="text-secondary">
            Choose a tracker to log your baby's daily activities
          </p>
        </div>

        <div className="trackers-grid">
          {trackers.map((tracker, index) => (
            <Link 
              key={index}
              to={tracker.path}
              className={`tracker-card ${tracker.color}`}
            >
              <div className="tracker-icon">
                <i className={tracker.icon}></i>
              </div>
              <div className="tracker-content">
                <h3>{tracker.title}</h3>
                <p>{tracker.description}</p>
              </div>
              <div className="tracker-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </Link>
          ))}
        </div>

        <div className="quick-tips-card mt-4">
          <h3>Tracking Tips</h3>
          <div className="tips-list">
            <div className="tip-item">
              <i className="fas fa-check-circle text-success me-2"></i>
              <span>Log activities immediately for accuracy</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-check-circle text-success me-2"></i>
              <span>Use notes to record important details</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-check-circle text-success me-2"></i>
              <span>Review patterns weekly to identify trends</span>
            </div>
            <div className="tip-item">
              <i className="fas fa-check-circle text-success me-2"></i>
              <span>Share data with your pediatrician during visits</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackerMenu;