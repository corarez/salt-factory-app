import React, { useState, useEffect } from 'react';
import { LogOut, Power, UserPlus, Save, Lock, Wifi, User, Settings, X, KeyRound, Trash2, Edit } from 'lucide-react';
import { io } from 'socket.io-client'; // Import Socket.IO client

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000'; // Socket.IO server URL

// Generic Confirmation Modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'bg-red-600' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 ${confirmColor} text-white rounded-lg hover:${confirmColor.replace('600', '700')} transition-colors shadow-md`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple Info/Alert Modal
const InfoModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Password Change Modal - now receives adminId to specify which admin's password is being changed
const PasswordChangeModal = ({ isOpen, onClose, onSavePassword, adminId, adminName }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    onSavePassword(adminId, currentPassword, newPassword);
    onClose();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Change Password for {adminName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Edit/Add Modal
const AdminEditAddModal = ({ isOpen, onClose, initialAdminData, onSaveAdmin }) => {
  const [formData, setFormData] = useState(initialAdminData || {
    fullName: '', // Changed from 'name' to 'fullName' to match backend
    username: '',
    role: 'Viewer', // Default role for new admins
    password: '' // For new admin creation, or placeholder for existing
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialAdminData ? {
      ...initialAdminData,
      password: '' // Don't pre-fill password for security when editing
    } : {
      fullName: '',
      username: '',
      role: 'Viewer',
      password: ''
    });
    setError(''); // Clear error on modal open/data change
  }, [initialAdminData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName || !formData.username || !formData.role) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!initialAdminData && !formData.password) { // Password required only for new admin
      setError('Password is required for new admin.');
      return;
    }
    if (!initialAdminData && formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    onSaveAdmin(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialAdminData ? `Edit Admin: ${initialAdminData.fullName}` : 'Add New Admin'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="adminFullName"
              name="fullName" // Changed name to 'fullName'
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g., Jane Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="adminUsername"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g., janedoe"
              required
            />
          </div>
          <div>
            <label htmlFor="adminRole" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              id="adminRole"
              name="role"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="Viewer">Viewer</option> {/* Default role */}
              <option value="Moderator">Moderator</option>
              <option value="Super Admin">Super Admin</option>
            </select>
          </div>
          {!initialAdminData && ( // Password field only for adding new admin
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
              <input
                type="password"
                id="adminPassword"
                name="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={formData.password}
                onChange={handleChange}
                placeholder="Set initial password"
                required
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {initialAdminData ? 'Update Admin' : 'Add Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SettingsPage = () => {
  // Admin Management State - now fetched from backend
  const [admins, setAdmins] = useState([]);

  // Network Settings State (still local as no backend endpoint for this)
  const [ipv4, setIpv4] = useState('192.168.1.1');

  // Modal States
  const [showIpv4SaveModal, setShowIpv4SaveModal] = useState(false);
  const [showAdminActionModal, setShowAdminActionModal] = useState(false); // For add/edit admin
  const [editingAdmin, setEditingAdmin] = useState(null); // Holds admin data for editing
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeAdminId, setPasswordChangeAdminId] = useState(null);
  const [passwordChangeAdminName, setPasswordChangeAdminName] = useState('');
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false); // For general info/errors

  // --- Fetch Admin Data from Backend ---
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admins`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedAdmins = await response.json();
        setAdmins(fetchedAdmins);
      } catch (error) {
        console.error("Error fetching admins data:", error);
        setActionSuccessMessage(`Failed to load admin data: ${error.message}`);
        setShowInfoModal(true);
      }
    };

    fetchAdmins();
  }, []); // Fetch admins once on component mount

  // --- Socket.IO for Real-time Admin Updates ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('admins:added', (newAdmin) => {
      setAdmins(prevAdmins => [...prevAdmins, newAdmin]);
    });

    socket.on('admins:updated', (updatedAdmin) => {
      setAdmins(prevAdmins => prevAdmins.map(admin => admin.id === updatedAdmin.id ? updatedAdmin : admin));
    });

    socket.on('admins:deleted', (deletedId) => {
      setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== deletedId));
    });

    socket.on('admins:passwordUpdated', ({ id }) => {
      // No direct UI update needed for password change, just confirmation
      console.log(`Password updated for admin ID: ${id}`);
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);


  // Handlers for Admin Management
  const handleSaveAdmin = async (adminData) => {
    try {
      let response;
      let method;
      let url;

      if (adminData.id) { // Editing existing admin
        method = 'PUT';
        url = `${API_BASE_URL}/admins/${adminData.id}`;
      } else { // Adding new admin
        method = 'POST';
        url = `${API_BASE_URL}/admins`;
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Backend sends back the new/updated admin
      setActionSuccessMessage(`Admin "${adminData.fullName}" ${adminData.id ? 'updated' : 'added'} successfully!`);
      setShowInfoModal(true);

    } catch (error) {
      console.error("Error saving admin:", error);
      setActionSuccessMessage(`Failed to save admin: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setShowAdminActionModal(false);
      setEditingAdmin(null);
    }
  };

  const handleDeleteAdminConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admins/${deletingAdmin.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage(`Admin "${deletingAdmin.fullName}" deleted successfully!`);
      setShowInfoModal(true);

    } catch (error) {
      console.error("Error deleting admin:", error);
      setActionSuccessMessage(`Failed to delete admin: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingAdmin(null);
    }
  };

  const [deletingAdmin, setDeletingAdmin] = useState(null); // State to hold admin to be deleted

  const handleOpenDeleteAdmin = (admin) => {
    setDeletingAdmin(admin);
    setShowDeleteConfirmModal(true);
  };

  const handleOpenEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setShowAdminActionModal(true);
  };

  const handleOpenAddAdmin = () => {
    setEditingAdmin(null); // Ensure no initial data for adding
    setShowAdminActionModal(true);
  };

  // Handlers for Security (Password Change)
  const handleSavePassword = async (adminId, currentPassword, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admins/${adminId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage(`Password for "${admins.find(a => a.id === adminId)?.fullName}" updated successfully!`);
      setShowInfoModal(true);

    } catch (error) {
      console.error("Error changing password:", error);
      setActionSuccessMessage(`Failed to change password: ${error.message}`);
      setShowInfoModal(true);
    } finally {
      setShowPasswordModal(false);
    }
  };

  // Handlers for Network Settings (kept local as no backend endpoint for this)
  const validateIPv4 = (ip) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  const handleSaveIpv4 = () => {
    if (!validateIPv4(ipv4)) {
      setActionSuccessMessage('Invalid IPv4 Address. Please enter a valid format (e.g., 192.168.1.1).');
      setShowInfoModal(true);
      return;
    }
    console.log(`IPv4 Address Saved: ${ipv4}`);
    setActionSuccessMessage('IPv4 Address saved successfully!');
    setShowInfoModal(true);
  };

  // Handlers for Shutdown & Logout (kept local/mocked as they are system-level actions)
  const handleShutdownApp = () => {
    console.log('Shutting down application...');
    // In a real app, this would trigger a backend process to shut down the server
    setShowShutdownConfirm(false);
    setActionSuccessMessage('Application is shutting down. Goodbye!');
    setShowInfoModal(true);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // In a real app, this would clear user session (e.g., remove token from localStorage)
    setShowLogoutConfirm(false);
    setActionSuccessMessage('You have been logged out.');
    setShowInfoModal(true);
    // Optionally redirect to login page: window.location.href = '/login';
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-5xl font-extrabold text-gray-900 mb-12 text-center flex items-center justify-center gap-4">
        <Settings size={48} className="text-blue-600" /> App Settings
      </h1>

      {/* Admin Management - Consolidated Section */}
      <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8 mb-10 border border-purple-100 transform hover:scale-[1.005] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-purple-700 flex items-center gap-3">
          <UserPlus size={28} /> Admin Management
        </h2>

        {/* Add New Admin Button */}
        <div className="text-right">
          <button
            onClick={handleOpenAddAdmin}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            <UserPlus size={20} /> Add New Admin
          </button>
        </div>

        {/* Current Admins List */}
        {admins.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Admins</h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-inner">
              {admins.map(admin => (
                <div key={admin.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-gray-200 last:border-b-0 gap-3 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-bold text-lg">{admin.fullName}</span> {/* Changed to fullName */}
                    <span className="text-gray-600 text-sm">@{admin.username} • {admin.role}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditAdmin(admin)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full bg-blue-50 hover:bg-blue-100"
                      title="Edit Admin"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setPasswordChangeAdminId(admin.id);
                        setPasswordChangeAdminName(admin.fullName); // Pass fullName
                        setShowPasswordModal(true);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full bg-red-50 hover:bg-red-100"
                      title="Change Password"
                    >
                      <KeyRound size={20} />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteAdmin(admin)}
                      className="text-gray-500 hover:text-red-700 transition-colors p-2 rounded-full bg-gray-100 hover:bg-red-100"
                      title="Delete Admin"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-lg">
            No admin accounts found. Click "Add New Admin" to get started.
          </div>
        )}
      </div>

      {/* IPv4 Settings */}
      <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6 mb-10 border border-green-100 transform hover:scale-[1.005] transition-transform duration-300">
        <h2 className="text-3xl font-bold text-green-700 flex items-center gap-3">
          <Wifi size={28} /> Network Settings
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Enter IPv4 Address (e.g., 192.168.1.1)"
            className="px-5 py-3 border border-gray-300 rounded-xl w-full md:flex-grow focus:ring-green-500 focus:border-green-500 transition-colors shadow-sm"
            value={ipv4}
            onChange={(e) => setIpv4(e.target.value)}
          />
          <button
            onClick={handleSaveIpv4}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 w-full md:w-auto justify-center"
          >
            <Save size={20} /> Save IPv4
          </button>
        </div>
      </div>

      {/* Shutdown & Logout */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 mt-12">
        <button
          onClick={() => setShowShutdownConfirm(true)}
          className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 text-lg font-semibold"
        >
          <Power size={24} /> Shutdown App
        </button>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-105 text-lg font-semibold"
        >
          <LogOut size={24} /> Logout
        </button>
      </div>

      {/* Modals */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Action Complete"
        message={actionSuccessMessage}
      />

      <AdminEditAddModal
        isOpen={showAdminActionModal}
        onClose={() => setShowAdminActionModal(false)}
        initialAdminData={editingAdmin}
        onSaveAdmin={handleSaveAdmin}
      />

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSavePassword={handleSavePassword}
        adminId={passwordChangeAdminId}
        adminName={passwordChangeAdminName}
      />

      <ConfirmationModal
        isOpen={showShutdownConfirm}
        onClose={() => setShowShutdownConfirm(false)}
        onConfirm={handleShutdownApp}
        title="Confirm Shutdown"
        message="Are you sure you want to shut down the application? This will close all active sessions."
        confirmText="Shut Down"
        confirmColor="bg-gray-800"
      />

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to sign in again to access the application."
        confirmText="Log Out"
        confirmColor="bg-gray-600"
      />
    </div>
  );
};

export default SettingsPage;
