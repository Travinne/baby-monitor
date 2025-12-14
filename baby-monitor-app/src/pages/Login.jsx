import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case "username":
        if (!value.trim()) newErrors.username = "Username is required";
        else delete newErrors.username;
        break;
      case "password":
        if (!value) newErrors.password = "Password is required";
        else if (value.length < 6)
          newErrors.password = "Password must be at least 6 characters";
        else delete newErrors.password;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });

    if (type !== "checkbox") validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    // validate before submit
    validateField("username", formData.username);
    validateField("password", formData.password);

    if (Object.keys(errors).length > 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await loginUser({
        username: formData.username,
        password: formData.password,
      });

      const { token, user } = res;

      if (formData.rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Invalid login credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <h2 className="login-title">Welcome Back</h2>
      <p className="auth-subtitle">
        Sign in to continue tracking your baby's journey
      </p>

      <form onSubmit={handleSubmit} className="login-form">
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
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        {errors.password && <p className="error-message">{errors.password}</p>}

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          Remember me
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <p className="register-link">
        Don’t have an account?{" "}
        <button type="button" onClick={() => navigate("/register")}>
          Register here
        </button>
      </p>
    </div>
  );
}
