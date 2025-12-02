import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "username":
        if (value.length < 3)
          newErrors.username = "Username must be at least 3 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(value))
          newErrors.username =
            "Username can only contain letters, numbers, and underscores";
        else delete newErrors.username;
        break;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          newErrors.email = "Please enter a valid email address";
        else delete newErrors.email;
        break;
      case "password":
        if (value.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          newErrors.password =
            "Password must contain uppercase, lowercase, and a number";
        else delete newErrors.password;
        break;
      case "confirmPassword":
        if (value !== formData.password)
          newErrors.confirmPassword = "Passwords do not match";
        else delete newErrors.confirmPassword;
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    Object.keys(formData).forEach((key) =>
      validateField(key, formData[key])
    );

    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      alert("Please fix the errors before submitting");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ ...errors, confirmPassword: "Passwords do not match" });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await API.post("/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert("Registration successful! Welcome aboard!");
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">
          Join us to start tracking your baby's journey
        </p>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            className="input"
            required
          />
          {errors.username && (
            <span className="error-message">{errors.username}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={handleChange}
            className="input"
            required
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            className="input"
            required
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input"
            required
          />
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          className="btn auth-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Register"}
        </button>

        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <p className="auth-link">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="link-btn"
          >
            Login here
          </button>
        </p>

        <p className="terms">
          By signing up, you agree to our{" "}
          <a href="/terms" className="link">Terms</a> &{" "}
          <a href="/privacy" className="link">Privacy Policy</a>
        </p>
      </form>
    </div>
  );
}

export default Register;