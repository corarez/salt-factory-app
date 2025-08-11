import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Arrived from "./pages/Arrived";
import Produced from "./pages/Produced";
import Sold from "./pages/Sold";
import Spend from "./pages/Spend";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import LoginPage from "./pages/LoginPage";
import Titlebar from "./components/Titlebar";

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    setIsLoggedIn(!!storedUser);
  }, []);

  const handleLoginSuccess = (userData) => {
    sessionStorage.setItem("user", JSON.stringify(userData || { ok: true }));
    setIsLoggedIn(true);
    navigate("/");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  if (isLoggedIn === null) return null;

  return (
    <div dir="rtl" className="flex min-h-screen pt-9">
      <Titlebar title="Salt Factory" />
      {isLoggedIn && <Sidebar onLogout={handleLogout} />}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="p-0">
          <Routes>
            <Route
              path="/login"
              element={
                isLoggedIn ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
              }
            />
            <Route path="/" element={isLoggedIn ? <Arrived /> : <Navigate to="/login" />} />
            <Route path="/produced" element={isLoggedIn ? <Produced /> : <Navigate to="/login" />} />
            <Route path="/sold" element={isLoggedIn ? <Sold /> : <Navigate to="/login" />} />
            <Route path="/spend" element={isLoggedIn ? <Spend /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={isLoggedIn ? <Analytics /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AppContent;
