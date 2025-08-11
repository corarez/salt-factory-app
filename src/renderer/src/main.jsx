import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import AppContent from "./App";
import "./assets/main.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <AppContent />
    </HashRouter>
  </React.StrictMode>
);
