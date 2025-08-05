import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Arrived from "./pages/Arrived";
import Produced from "./pages/Produced";
import Sold from "./pages/Sold";
import Spend from "./pages/Spend";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 bg-gray-100 min-h-screen">
          <Routes>
            <Route path="/" element={<Arrived />} />
            <Route path="/produced" element={<Produced />} />
            <Route path="/sold" element={<Sold />} />
            <Route path="/spend" element={<Spend />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
