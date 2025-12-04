import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setErrorMsg("Please fix the errors before submitting.");
      return;
    }

    try {

      const res = await API.post("/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword, 
      });

   
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));


      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Create Account</h2>

        {errorMsg && <p className="error-message">{errorMsg}</p>}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        {errors.username && <p className="error-message">{errors.username}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        {errors.email && <p className="error-message">{errors.email}</p>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {errors.password && <p className="error-message">{errors.password}</p>}

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {errors.confirmPassword && (
          <p className="error-message">{errors.confirmPassword}</p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Register"}
        </button>
      </form>
    </div>
  );
}

export default Register;
