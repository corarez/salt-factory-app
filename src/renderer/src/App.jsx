import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Arrived from "./pages/Arrived";
import Produced from "./pages/Produced";
import Sold from "./pages/Sold";
import Spend from "./pages/Spend";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/LoginPage"; // Assuming LoginPage is in the pages directory

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check localStorage on initial load to maintain login session
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        JSON.parse(user); // Just check if it's valid JSON
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Invalid user data in localStorage, logging out.", e);
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      }
    }
  }, []);

  // Function to handle successful login from LoginPage
  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    // Navigate to the dashboard (or any desired default route after login)
    navigate('/');
  };

  // Function to handle logout (can be called from Sidebar or any other component)
  const handleLogout = () => {
    localStorage.removeItem('user'); // Clear user data from localStorage
    setIsLoggedIn(false); // Update login state
    navigate('/login'); // Redirect to login page after logout
  };

  return (
    <div className="flex">
      {/* Sidebar is only visible if the user is logged in */}
      {isLoggedIn && <Sidebar onLogout={handleLogout} />}
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        <Routes>
          {/* Public route for login page */}
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />

          {/* Protected routes - only accessible if logged in */}
          <Route path="/" element={isLoggedIn ? <Arrived /> : <Navigate to="/login" />} />
          <Route path="/produced" element={isLoggedIn ? <Produced /> : <Navigate to="/login" />} />
          <Route path="/sold" element={isLoggedIn ? <Sold /> : <Navigate to="/login" />} />
          <Route path="/spend" element={isLoggedIn ? <Spend /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={isLoggedIn ? <Analytics /> : <Navigate to="/login" />} />
          <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" />} />

          {/* Optional: A catch-all route for 404 or redirect to home if logged in */}
          <Route path="*" element={isLoggedIn ? <Navigate to="/" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
