import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsChecking(false);
      setIsAuth(false);
      return;
    }

    try {

      const { exp } = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;

      if (exp && exp < now) {
        localStorage.removeItem("token");
        setIsAuth(false);
      } else {
        setIsAuth(true);
      }
    } catch {
    
      localStorage.removeItem("token");
      setIsAuth(false);
    }

    setIsChecking(false);
  }, []);

  if (isChecking) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
