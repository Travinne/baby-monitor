import React, { useEffect, useState } from "react";

function Settings() {
  const [settings, setSettings] = useState({
    fullName: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    notifications: true,
    theme: localStorage.getItem("theme") || "light"
  });

  const [errors, setErrors] = useState({});
  const [isModified, setIsModified] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

  fetch(`http://127.0.0.1:5000/api/settings/${userId}`,{
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          fullName: data.full_name || "",
          email: data.email || "",
          notifications: true,
          theme: localStorage.getItem("theme") || "light",
          oldPassword: "",
          newPassword: ""
        });
        setUserId(data.id);
      })
      .catch(() => alert("Failed to load user profile"));
  }, []);

  useEffect(() => {
    document.body.className = settings.theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", settings.theme);
  }, [settings.theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setIsModified(true);
  };

  const handleThemeChange = (mode) => {
    setSettings(prev => ({ ...prev, theme: mode }));
    setIsModified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const response = await fetch(`http://127.0.0.1:5000/api/settings/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Settings updated successfully!");
      setIsModified(false);
      setSettings(prev => ({ ...prev, oldPassword: "", newPassword: "" }));
    } else {
      alert(data.error || "Failed to update settings");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("Type DELETE to confirm account deletion:");
    if (confirmation !== "DELETE") return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    const response = await fetch(`http://127.0.0.1:5000/api/users/delete/${userId}`,{
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      alert("Account deleted successfully");
      localStorage.clear();
      window.location.href = "/";
    } else {
      alert("Failed to delete account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Logged out successfully!");
    window.location.href = "/login";
  };

  return (
    <div className="container">
      <div className="settings-header">
        <h2 className="title">Account Settings</h2>
        {isModified && <span className="unsaved-badge">Unsaved changes</span>}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Profile Information</h3>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              className="input"
              value={settings.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              className="input"
              value={settings.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              type="password"
              name="oldPassword"
              className="input"
              value={settings.oldPassword}
              onChange={handleChange}
              placeholder="Enter your current password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              className="input"
              value={settings.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Preferences</h3>
          <label>
            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
            Enable Notifications
          </label>

          <div className="theme-toggle">
            <button
              type="button"
              className={`btn-theme ${settings.theme === "light" ? "activate-theme" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              Light Mode
            </button>
            <button
              type="button"
              className={`btn-theme ${settings.theme === "dark" ? "activate-theme" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              Dark Mode
            </button>
          </div>
        </div>

        <button type="submit" className="btn save-btn" disabled={!isModified}>
          Save Changes
        </button>
      </form>

      <div className="settings-section danger-zone">
        <h3>Danger Zone</h3>
        <button className="btn delete-btn" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>

      <div className="settings-section logout-section">
        <button className="btn remove-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
export default Settings;