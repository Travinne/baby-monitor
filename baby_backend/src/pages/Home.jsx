import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const babyData = localStorage.getItem("baby");
  const babyName = babyData ? JSON.parse(babyData).fullName : null;

  const features = [
    { icon: "🍼", title: "Feeding Tracker", desc: "Monitor feeding schedules and amounts" },
    { icon: "😴", title: "Sleep Tracker", desc: "Track sleep patterns and duration" },
    { icon: "💉", title: "Health Records", desc: "Keep vaccination and checkup records" },
    { icon: "📊", title: "Growth Charts", desc: "Monitor weight and height progress" },
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Baby Monitor</h1>
        {babyName && (
          <p className="baby-welcome">
            Tracking {babyName}'s journey
          </p>
        )}
        <p className="home-subtitle">
          Your all-in-one tool to track your baby's growth, feeding, sleeping, 
          checkups, and more all in one place.
        </p>
        <div className="date-time-display">
          <div className="date-display">{formattedDate}</div>
          <div className="time-display">{formattedTime}</div>
        </div>
      </header>

      <main className="home-main">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>
            Head over to your Dashboard to start tracking and managing everything 
            about your baby in one simple view.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </main>

      <footer className="home-footer">
        <p>Baby Monitor App &copy; 2025</p>
        <p className="footer-links">
          <a href="/terms">Terms</a> | <a href="/privacy">Privacy</a> | <a href="/contact">Contact</a>
        </p>
      </footer>
    </div>
  );
}

export default Home;