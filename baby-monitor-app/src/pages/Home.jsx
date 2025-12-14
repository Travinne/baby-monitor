import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFeedings } from "../api/feeding.js";
import { getSleeps } from "../api/sleep.js";
import { getGrowth } from "../api/growth.js";

export default function Home() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [baby, setBaby] = useState(null);
  const [lastFeeding, setLastFeeding] = useState(null);
  const [lastSleep, setLastSleep] = useState(null);
  const [lastGrowth, setLastGrowth] = useState(null);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch baby and activities if logged in
  useEffect(() => {
    const babyData = localStorage.getItem("baby");
    if (babyData) setBaby(JSON.parse(babyData));

    if (!token) return;

    const fetchActivities = async () => {
      try {
        const feedings = await getFeedings();
        const sleeps = await getSleeps();
        const growths = await getGrowth();

        setLastFeeding(feedings?.sort((a, b) => new Date(b.time) - new Date(a.time))[0] || null);
        setLastSleep(sleeps?.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))[0] || null);
        setLastGrowth(growths?.sort((a, b) => new Date(b.time) - new Date(a.time))[0] || null);
      } catch (err) {
        console.error("Failed to fetch last activities:", err);
      }
    };

    fetchActivities();
  }, [token]);

  const formattedDate = currentTime.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const formattedTime = currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const calculateAge = (dob) => {
    if (!dob) return null;
    const diff = new Date() - new Date(dob);
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    return years > 0 ? `${years} yr${years > 1 ? "s" : ""} ${months % 12} mo` : `${months} mo`;
  };

  const features = [
    { icon: "🍼", title: "Feeding Tracker", desc: "Monitor feeding schedules and amounts" },
    { icon: "😴", title: "Sleep Tracker", desc: "Track sleep patterns and duration" },
    { icon: "💉", title: "Health Records", desc: "Keep vaccination and checkup records" },
    { icon: "📊", title: "Growth Charts", desc: "Monitor weight and height progress" },
  ];

  // **If user is not logged in, show marketing view**
  // **If user is not logged in, show marketing view**
if (!token) {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Baby Monitor</h1>
        <p className="home-subtitle">
          Track your baby's growth, feeding, sleeping, and health records all in one place.
        </p>
        <div className="cta-section" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            Log In
          </button>
          <button className="btn btn-secondary" onClick={() => navigate("/register")}>
            Register
          </button>
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

  // **If logged in, show baby profile + last activities**
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to Baby Monitor</h1>
        {baby && (
          <div className="baby-profile">
            <img src={baby.profileImage || "/default-baby.png"} alt={baby.fullName} className="baby-profile-img" />
            <div>
              <h2>{baby.fullName}</h2>
              <p>Age: {calculateAge(baby.dob)}</p>
            </div>
          </div>
        )}
        <div className="date-time-display">
          <div className="date-display">{formattedDate}</div>
          <div className="time-display">{formattedTime}</div>
        </div>
      </header>

      <main className="home-main">
        <h2 className="section-title">Last Recorded Activities</h2>
        <div className="activities-grid">
          <div className="activity-card">
            <h3>Last Feeding</h3>
            {lastFeeding ? (
              <p>
                {lastFeeding.food_type} — {lastFeeding.amount} <br />
                {new Date(lastFeeding.time).toLocaleString()}
              </p>
            ) : (
              <p>No feeding recorded yet</p>
            )}
          </div>

          <div className="activity-card">
            <h3>Last Sleep</h3>
            {lastSleep ? (
              <p>
                Start: {new Date(lastSleep.start_time).toLocaleString()} <br />
                End: {new Date(lastSleep.end_time).toLocaleString()} <br />
                Duration: {lastSleep.duration}
              </p>
            ) : (
              <p>No sleep recorded yet</p>
            )}
          </div>

          <div className="activity-card">
            <h3>Last Growth</h3>
            {lastGrowth ? (
              <p>
                Weight: {lastGrowth.weight} kg <br />
                Height: {lastGrowth.height} cm <br />
                {new Date(lastGrowth.time).toLocaleDateString()}
              </p>
            ) : (
              <p>No growth recorded yet</p>
            )}
          </div>
        </div>

        <div className="cta-section">
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
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
