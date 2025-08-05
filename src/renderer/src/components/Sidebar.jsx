import { NavLink } from "react-router-dom";
import { Truck, Factory, DollarSign, PieChart, Sliders, Package } from "lucide-react";

const links = [
  { path: "/", label: "Salt Arrived", icon: Truck },
  { path: "/produced", label: "Salt Produced", icon: Factory },
  { path: "/sold", label: "Salt Sold", icon: Package },
  { path: "/spend", label: "Spend", icon: DollarSign },
  { path: "/analytics", label: "Analytics", icon: PieChart },
  { path: "/settings", label: "Settings", icon: Sliders },
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-white h-screen shadow-md border-r flex flex-col py-6 px-4">
      <h1 className="text-2xl font-bold text-blue-700 mb-8">Salt Factory</h1>
      {links.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all hover:bg-blue-100 ${
              isActive ? "bg-blue-200 font-semibold text-blue-900" : "text-gray-600"
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
