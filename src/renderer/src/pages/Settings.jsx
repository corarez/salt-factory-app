import React, { useState, useEffect } from 'react';
import { LogOut, Power, UserPlus, Save, Lock, Wifi, User, Settings, X, KeyRound, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  let bgColor = 'bg-blue-500';
  let icon = null;
  let title = '';

  if (type === 'success') {
    bgColor = 'bg-green-500';
    icon = <CheckCircle size={20} className="text-white" />;
    title = 'سەرکەوتوو بوو!';
  } else if (type === 'error') {
    bgColor = 'bg-red-500';
    icon = <XCircle size={20} className="text-white" />;
    title = 'هەڵە ڕوویدا!';
  } else {
    icon = <X size={20} className="text-white" />;
    title = 'زانیاری';
  }

  return (
    <div
      dir="rtl"
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-lg shadow-lg text-white transform transition-transform duration-300 ease-out ${bgColor}`}
      style={{ animation: 'slideInRight 0.5s forwards' }}
    >
      {icon}
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={onClose} className="mr-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
        <X size={20} />
      </button>
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'پشتڕاستکردنەوە', confirmColor = 'bg-red-600' }) => {
  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            هەڵوەشاندنەوە
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

const AdminEditAddModal = ({ isOpen, onClose, initialAdminData, onSaveAdmin }) => {
  const [formData, setFormData] = useState(initialAdminData || { username: '', role: 'user' });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialAdminData || { username: '', role: 'user' });
    setError('');
  }, [initialAdminData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username) {
      setError('ناوی بەکارهێنەر پێویستە.');
      return;
    }
    onSaveAdmin(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialAdminData ? 'دەستکاریکردنی بەکارهێنەر' : 'زیادکردنی بەکارهێنەری نوێ'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">ناوی بەکارهێنەر</label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.username}
              onChange={handleChange}
              placeholder="بۆ نموونە، ئەحمەد"
              required
              readOnly={!!initialAdminData}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">ڕۆڵ</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white text-right"
            >
              <option value="admin">ئەدمن</option>
              <option value="user">بەکارهێنەر</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-right">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {initialAdminData ? 'نوێکردنەوەی بەکارهێنەر' : 'زیادکردنی بەکارهێنەر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordChangeModal = ({ isOpen, onClose, onSavePassword, adminId, adminName }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('وشەی نهێنی دەبێت لانیکەم 6 پیت بێت.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('وشەی نهێنی و پشتڕاستکردنەوەی وشەی نهێنی یەکناگرنەوە.');
      return;
    }
    onSavePassword(adminId, newPassword);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">گۆڕینی وشەی نهێنی بۆ {adminName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">وشەی نهێنی نوێ</label>
            <input
              type="password"
              id="newPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">پشتڕاستکردنەوەی وشەی نهێنی نوێ</label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2 text-right">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              گۆڕینی وشەی نهێنی
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SettingsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [showAdminActionModal, setShowAdminActionModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeAdminId, setPasswordChangeAdminId] = useState(null);
  const [passwordChangeAdminName, setPasswordChangeAdminName] = useState('');
  const [showShutdownConfirm, setShowShutdownConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const showToast = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 5000);
  };

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admins`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAdmins(data);
      } catch (error) {
        console.error("هەڵە لە وەرگرتنی ئەدمنەکان:", error);
        showToast(`هەڵە لە بارکردنی داتای ئەدمن: ${error.message}`, 'error');
      }
    };

    fetchAdmins();

    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("هەڵە لە شیکردنەوەی بەکارهێنەر لە LocalStorage:", e);
        localStorage.removeItem('user');
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('admin:added', (newAdmin) => {
      setAdmins(prev => [...prev, newAdmin]);
    });

    socket.on('admin:updated', (updatedAdmin) => {
      setAdmins(prev => prev.map(admin => admin.id === updatedAdmin.id ? updatedAdmin : admin));
    });

    socket.on('admin:deleted', (deletedId) => {
      setAdmins(prev => prev.filter(admin => admin.id !== deletedId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSaveAdmin = async (adminToSave) => {
    try {
      let response;
      let method;
      let url;

      if (editingAdmin) {
        method = 'PUT';
        url = `${API_BASE_URL}/admins/${editingAdmin.id}`;
      } else {
        method = 'POST';
        url = `${API_BASE_URL}/admins`;
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showToast(`بەکارهێنەر "${adminToSave.username}" ${editingAdmin ? 'نوێکرایەوە' : 'زیادکرا'} بە سەرکەوتوویی!`, 'success');

    } catch (error) {
      console.error("هەڵە لە پاشەکەوتکردنی ئەدمن:", error);
      showToast(`نەتوانرا ئەدمن پاشەکەوت بکرێت: ${error.message}`, 'error');
    } finally {
      setShowAdminActionModal(false);
      setEditingAdmin(null);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admins/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast('بەکارهێنەر بە سەرکەوتوویی سڕایەوە!', 'success');

    } catch (error) {
      console.error("هەڵە لە سڕینەوەی ئەدمن:", error);
      showToast(`نەتوانرا ئەدمن بسڕدرێتەوە: ${error.message}`, 'error');
    }
  };

  const handleSavePassword = async (adminId, newPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admins/${adminId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast('وشەی نهێنی بە سەرکەوتوویی گۆڕدرا!', 'success');

    } catch (error) {
      console.error("هەڵە لە گۆڕینی وشەی نهێنی:", error);
      showToast(`نەتوانرا وشەی نهێنی بگۆڕدرێت: ${error.message}`, 'error');
    } finally {
      setShowPasswordModal(false);
      setPasswordChangeAdminId(null);
      setPasswordChangeAdminName('');
    }
  };

  const handleShutdownApp = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shutdown`, { method: 'POST' });
      if (response.ok) {
        showToast('ئەپلیکەیشن داخرا.', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("هەڵە لە داخستنی ئەپلیکەیشن:", error);
      showToast(`نەتوانرا ئەپلیکەیشن دابخرێت: ${error.message}`, 'error');
    } finally {
      setShowShutdownConfirm(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    showToast('بە سەرکەوتوویی چوونە دەرەوە.', 'success');
    // Redirect to login page or refresh
    window.location.reload();
  };

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        <Settings size={40} className="text-blue-600" /> ڕێکخستنەکان
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-blue-500">
          <div className={`text-5xl mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center ${isOnline ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <Wifi size={48} />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">دۆخی پەیوەندی</h2>
          <p className={`text-4xl font-bold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'سەرکەوتوو' : 'دابڕاو'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isOnline ? 'پەیوەستیت بە سێرڤەرەوە هەیە.' : 'پەیوەست نیت بە سێرڤەرەوە.'}
          </p>
        </div>

        {/* User Management Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-indigo-500">
          <div className="text-5xl mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center bg-indigo-100 text-indigo-600">
            <User size={48} />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">بەڕێوەبردنی بەکارهێنەر</h2>
          <p className="text-lg text-gray-600 mb-4">بەکارهێنەرانی ئێستا: {admins.length}</p>
          <button
            onClick={() => { setEditingAdmin(null); setShowAdminActionModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg transform hover:scale-105 w-full"
          >
            <UserPlus size={20} /> زیادکردنی بەکارهێنەر
          </button>
        </div>

        {/* Application Control Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-gray-800">
          <div className="text-5xl mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center bg-gray-200 text-gray-800">
            <Power size={48} />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">کۆنترۆڵی ئەپلیکەیشن</h2>
          <p className="text-lg text-gray-600 mb-4">داخستن یان چوونە دەرەوە لە سیستەم.</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowShutdownConfirm(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-800 text-white hover:bg-gray-900 transition-all duration-300 shadow-lg transform hover:scale-105 w-full"
            >
              <Power size={20} /> داخستنی ئەپلیکەیشن
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-600 text-white hover:bg-gray-700 transition-all duration-300 shadow-lg transform hover:scale-105 w-full"
            >
              <LogOut size={20} /> چوونە دەرەوە
            </button>
          </div>
        </div>
      </div>

      {/* Admin List Section */}
      <div className="mt-12 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
          <User size={30} className="text-indigo-600" /> لیستی بەکارهێنەران
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-right text-gray-700">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 text-right">ID</th>
                <th className="px-5 py-3 text-right">ناوی بەکارهێنەر</th>
                <th className="px-5 py-3 text-right">ڕۆڵ</th>
                <th className="px-5 py-3 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.length > 0 ? (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-5 py-3 font-semibold text-gray-900">{admin.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-800">{admin.username}</td>
                    <td className="px-5 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {admin.role === 'admin' ? 'ئەدمن' : 'بەکارهێنەر'}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-3 justify-center">
                      <Edit
                        size={18}
                        className="cursor-pointer text-gray-500 hover:text-indigo-600 transition-colors"
                        onClick={() => { setEditingAdmin(admin); setShowAdminActionModal(true); }}
                      />
                      <KeyRound
                        size={18}
                        className="cursor-pointer text-gray-500 hover:text-yellow-600 transition-colors"
                        onClick={() => { setPasswordChangeAdminId(admin.id); setPasswordChangeAdminName(admin.username); setShowPasswordModal(true); }}
                      />
                      {currentUser && currentUser.username !== admin.username && (
                        <Trash2
                          size={18}
                          className="cursor-pointer text-gray-500 hover:text-red-600 transition-colors"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-gray-500 text-lg">
                    هیچ بەکارهێنەرێک نەدۆزرایەوە.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        title="پشتڕاستکردنەوەی داخستن"
        message="دڵنیایت دەتەوێت ئەپلیکەیشنەکە دابخەیت؟ ئەمە هەموو دانیشتنە چالاکەکان دادەخات."
        confirmText="داخستن"
        confirmColor="bg-gray-800"
      />

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="پشتڕاستکردنەوەی چوونە دەرەوە"
        message="دڵنیایت دەتەوێت بچیتە دەرەوە؟ پێویستە دووبارە بچیتە ژوورەوە بۆ دەستڕاگەیشتن بە ئەپلیکەیشنەکە."
        confirmText="چوونە دەرەوە"
        confirmColor="bg-gray-600"
      />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default SettingsPage;
