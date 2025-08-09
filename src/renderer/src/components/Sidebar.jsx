import React from 'react';
import { NavLink } from 'react-router-dom';
import { Truck, Factory, DollarSign, PieChart, Sliders, Package, Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { path: "/", label: "خوێی گەیشتوو", icon: Truck },
  { path: "/produced", label: "خوێی بەرهەمهاتوو", icon: Factory },
  { path: "/sold", label: "خوێی فرۆشراو", icon: Package },
  { path: "/spend", label: "خەرجی و داهات", icon: DollarSign },
  { path: "/analytics", label: "شیکاری", icon: PieChart },
  { path: "/settings", label: "ڕێکخستنەکان", icon: Sliders },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div dir="rtl">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-700 bg-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar for Desktop and Mobile Overlay */}
      <div
        className={`fixed inset-y-0 right-0 w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col py-6 px-4 z-40
          transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
          transition-transform duration-300 ease-in-out md:static md:h-screen md:flex-shrink-0`}
      >
        <h1 className="text-3xl font-extrabold text-blue-700 mb-8 text-center">
          خوێێ سه‌رده‌م
        </h1>
        <nav className="flex-grow">
          {links.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200
                hover:bg-blue-100 hover:text-blue-800 ${
                  isActive ? "bg-blue-200 font-semibold text-blue-900 shadow-sm" : "text-gray-600"
                }`
              }
              onClick={() => setIsOpen(false)} // Close sidebar on link click for mobile
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Sidebar;
