import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const hiddenPaths = ["/", "/dashboard"];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <button
      onClick={handleBack}
      className="back-button"
      aria-label="Go back to previous page"
    >
      ← Back
    </button>
  );
}

export default BackButton;