import React, { useState, useEffect } from "react";
import TrackerMenu from "./TrackerMenu";

function Dashboard() {
  const [babyData, setBabyData] = useState(null);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const savedBaby = localStorage.getItem("baby");
    if (savedBaby) {
      setBabyData(JSON.parse(savedBaby));
    }

    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                        (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 1) {
      const days = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
      return `${days} days old`;
    } else if (ageInMonths < 12) {
      return `${ageInMonths} months old`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const months = ageInMonths % 12;
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''} old`;
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1 className="title">{greeting}!</h1>
          {babyData && babyData.fullName && (
            <div className="baby-info-card">
              <div className="baby-quick-info">
                {babyData.photo && (
                  <img 
                    src={babyData.photo} 
                    alt={babyData.fullName} 
                    className="baby-avatar"
                  />
                )}
                <div className="baby-details">
                  <h2>{babyData.fullName}</h2>
                  {babyData.dob && (
                    <p className="baby-age">{calculateAge(babyData.dob)}</p>
                  )}
                  {babyData.weight && babyData.height && (
                    <p className="baby-stats">
                      Weight: {babyData.weight}kg | Height: {babyData.height}cm
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {!babyData?.fullName && (
            <div className="no-baby-card">
              <p>No baby profile found. Please create one to get started!</p>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="history-title">Quick Actions</h2>
        <TrackerMenu />
      </div>
    </div>
  );
}

export default Dashboard;