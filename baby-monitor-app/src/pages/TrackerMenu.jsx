import React from "react";
import { Link } from "react-router-dom";

function TrackerMenu() {
  const trackers = [
    { to: "/feed-tracker", icon: "🍼", label: "Feeding" },
    { to: "/sleep-tracker", icon: "😴", label: "Sleep" },
    { to: "/diaper-tracker", icon: "🚼", label: "Diapers" },
    { to: "/growth-tracker", icon: "📊", label: "Growth" },
    { to: "/checkups", icon: "💉", label: "Checkups" },
    { to: "/allergies", icon: "⚠️", label: "Allergies" },
    { to: "/bath-time", icon: "🛁", label: "Bath Time" },
  ];

  return (
    <div className="tracker-menu">
      {trackers.map(({ to, icon, label }) => (
        <Link key={to} to={to}>
          <span style={{ fontSize: '2.5rem' }}>{icon}</span>
          <p>{label}</p>
        </Link>
      ))}
    </div>
  );
}

export default TrackerMenu;