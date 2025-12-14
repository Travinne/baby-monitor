import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSettings, updateSettings } from "../api/settings.js";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    username: "",
    fullName: "",
    email: "",
    notifications: true,
    theme: localStorage.getItem("theme") || "light",
    oldPassword: "",
    newPassword: "",
    rememberMe: true,
  });
  const [isModified, setIsModified] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUserId(storedUser.id);

    getSettings(storedUser.id)
      .then((data) => {
        setSettings((prev) => ({
          ...prev,
          username: data.username,
          fullName: data.fullName || "",
          email: data.email,
          notifications: data.notifications,
          theme: data.theme || "light",
        }));
      })
      .catch(() => alert("Failed to load user settings"));
  }, [navigate]);

  useEffect(() => {
    document.body.className = settings.theme === "dark" ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", settings.theme);
  }, [settings.theme]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setIsModified(true);
  };

  const handleThemeChange = (mode) => {
    setSettings((prev) => ({ ...prev, theme: mode }));
    setIsModified(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert("User not found");

    try {
      const payload = { ...settings };
      if (!showPasswordForm) {
        delete payload.oldPassword;
        delete payload.newPassword;
      }

      const updated = await updateSettings(userId, payload);

      alert("Settings updated successfully!");
      setIsModified(false);
      setSettings((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));

      const updatedUser = {
        ...JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")),
        username: updated.username,
        email: updated.email,
      };

      if (settings.rememberMe) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update settings");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("Type DELETE to confirm account deletion:");
    if (confirmation !== "DELETE") return;

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/users/delete/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      alert("Account deleted successfully");
      localStorage.clear();
      sessionStorage.clear();
      navigate("/");
    } catch {
      alert("Failed to delete account");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    alert("Logged out successfully!");
    navigate("/login");
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
            <input id="username" type="text" name="username" value={settings.username} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" name="fullName" value={settings.fullName} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" name="email" value={settings.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <button type="button" className="btn change-password-btn" onClick={() => setShowPasswordForm(!showPasswordForm)}>
              {showPasswordForm ? "Cancel Password Change" : "Change Password"}
            </button>
          </div>

          {showPasswordForm && (
            <>
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input id="oldPassword" type="password" name="oldPassword" value={settings.oldPassword} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input id="newPassword" type="password" name="newPassword" value={settings.newPassword} onChange={handleChange} />
              </div>
            </>
          )}
        </div>

        <div className="settings-section">
          <h3>Preferences</h3>
          <label>
            <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} />
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
