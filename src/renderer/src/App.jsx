import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Arrived from "./pages/Arrived";
import Produced from "./pages/Produced";
import Sold from "./pages/Sold";
import Spend from "./pages/Spend";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/LoginPage";

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        JSON.parse(user);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Invalid user data in localStorage, logging out.", e);
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>; // or a spinner component
  }

  return (
    <div dir="rtl" className="flex min-h-screen">
      {isLoggedIn && <Sidebar onLogout={handleLogout} />}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="p-0">
          <Routes>
            <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/" element={isLoggedIn ? <Arrived /> : <Navigate to="/login" />} />
            <Route path="/produced" element={isLoggedIn ? <Produced /> : <Navigate to="/login" />} />
            <Route path="/sold" element={isLoggedIn ? <Sold /> : <Navigate to="/login" />} />
            <Route path="/spend" element={isLoggedIn ? <Spend /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={isLoggedIn ? <Analytics /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={isLoggedIn ? <Navigate to="/" /> : <Navigate to="/login" />} />
          </Routes>
        </div>
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
