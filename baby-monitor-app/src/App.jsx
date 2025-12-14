import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BabyProfile from "./pages/BabyProfile";
import Settings from "./pages/Settings";
import FeedTracker from "./pages/FeedTracker";
import SleepTracker from "./pages/SleepTracker";
import DiaperTracker from "./pages/DiaperTracker";
import GrowthChart from "./pages/GrowthChart";
import CheckUps from "./pages/CheckUps";
import Allergies from "./pages/Allergies";
import BathTimeTracker from "./pages/BathTime";

import Navbar from "./components/NavBar";

// Protected route: only for logged-in users
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

// Guest route: only for non-logged-in users
const GuestRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? <Navigate to="/home" replace /> : children;
};

// Wrapper to conditionally show Navbar
function AppWrapper() {
  const location = useLocation();
  const noNavbarPages = ["/login", "/register"];
  const hideNavbar = noNavbarPages.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="app">
        <Routes>
          {/* Public Home page */}
          <Route path="/" element={<Home />} />

          {/* Guest-only pages */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          {/* Protected pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/baby-profile"
            element={
              <ProtectedRoute>
                <BabyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed-tracker"
            element={
              <ProtectedRoute>
                <FeedTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sleep-tracker"
            element={
              <ProtectedRoute>
                <SleepTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diaper-tracker"
            element={
              <ProtectedRoute>
                <DiaperTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/growth-tracker"
            element={
              <ProtectedRoute>
                <GrowthChart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkups"
            element={
              <ProtectedRoute>
                <CheckUps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allergies"
            element={
              <ProtectedRoute>
                <Allergies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bath-time"
            element={
              <ProtectedRoute>
                <BathTimeTracker />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
