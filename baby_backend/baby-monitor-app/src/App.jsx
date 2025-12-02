import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BabyProfile from "./pages/BabyProfile";
import Settings from "./pages/Settings";


import FeedTracker from "./components/FeedTracker";
import SleepTracker from "./components/SleepTracker";
import DiaperTracker from "./components/DiaperTracker";
import GrowthChart from "./components/GrowthChart";
import CheckUps from "./components/CheckUps";
import Allergies from "./components/Allergies";
import BathTimeTracker from "./components/BathTime";


import Navbar from "./components/NavBar";


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};


function AppWrapper() {
  const location = useLocation();
  const noNavbarPages = ["/login", "/register"];
  const hideNavbar = noNavbarPages.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <div className="app">
        <Routes>
        
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

         
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
