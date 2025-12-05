import React, { useEffect, useState } from "react";
import API from "../api/api";

function Settings() {
  const [settings, setSettings] = useState({
    username: "",
    fullName: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    notifications: true,
    theme: localStorage.getItem("theme") || "light",
  });
  const [isModified, setIsModified] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!token || !storedUser) {
      window.location.href = "/login";
      return;
    }

    setUserId(storedUser.id);

    API.get(`/settings/${storedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const data = res.data;
        setSettings({
          username: data.username,
          fullName: data.fullName || "",
          email: data.email,
          notifications: data.notifications,
          theme: data.theme || "light",
          oldPassword: "",
          newPassword: "",
        });
      })
      .catch(() => alert("Failed to load user profile"));
  }, []);

  useEffect(() => {
    document.body.className = settings.theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", settings.theme);
  }, [settings.theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsModified(true);
  };

  const handleThemeChange = (mode) => {
    setSettings((prev) => ({ ...prev, theme: mode }));
    setIsModified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first");
      return;
    }

    try {
      const response = await API.put(`/settings/${userId}`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Settings updated successfully!");
      setIsModified(false);
      setSettings((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user")),
        username: response.data.settings.username,
        email: response.data.settings.email,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update settings");
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

    try {
      await API.delete(`/users/delete/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Account deleted successfully");
      localStorage.clear();
      window.location.href = "/";
    } catch {
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={settings.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={settings.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              id="oldPassword"
              type="password"
              name="oldPassword"
              value={settings.oldPassword}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={settings.newPassword}
              onChange={handleChange}
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
            <button type="button" onClick={() => handleThemeChange("light")} className={settings.theme === "light" ? "active" : ""}>
              Light Mode
            </button>
            <button type="button" onClick={() => handleThemeChange("dark")} className={settings.theme === "dark" ? "active" : ""}>
              Dark Mode
            </button>
          </div>
        </div>

        <button type="submit" disabled={!isModified}>Save Changes</button>
      </form>

      <div className="settings-section danger-zone">
        <button onClick={handleDeleteAccount}>Delete Account</button>
      </div>

      <div className="settings-section logout-section">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Settings;
