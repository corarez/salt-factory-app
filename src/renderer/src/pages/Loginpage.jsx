import React, { useState } from 'react';
import { User, Lock, LogIn, X, Loader2 } from 'lucide-react';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';

const InfoModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  let bgColor = 'bg-blue-500';
  let textColor = 'text-blue-800';
  let borderColor = 'border-blue-200';

  if (type === 'success') {
    bgColor = 'bg-green-500';
    textColor = 'text-green-800';
    borderColor = 'border-green-200';
  } else if (type === 'error') {
    bgColor = 'bg-red-500';
    textColor = 'text-red-800';
    borderColor = 'border-red-200';
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100 border-t-4 ${borderColor}`}>
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
          className={`px-6 py-2 ${bgColor} text-white rounded-lg hover:${bgColor.replace('500', '600')} transition-colors shadow-md`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalType, setModalType] = useState('info');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setModalMessage('');
        setModalTitle('');
        setModalType('info');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful
                localStorage.setItem('user', JSON.stringify(data.user));
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
            } else {
                // Login failed (e.g., 401 Unauthorized)
                setModalTitle('Login Failed');
                setModalMessage(data.message || 'An unknown error occurred. Please try again.');
                setModalType('error');
                setShowModal(true);
            }
        } catch (error) {
            // Network error or server unreachable
            console.error("Login error:", error);
            setModalTitle('Login Error');
            setModalMessage('Could not connect to the server. Please check your internet connection or try again later.');
            setModalType('error');
            setShowModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-300 to-purple-400 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full animate-fadeInScale">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Welcome Back!</h1>
                    <p className="text-gray-600 text-lg">Sign in to continue to your account.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <User size={20} className="text-gray-400" />
                            </span>
                            <input
                                type="text"
                                id="username"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-lg"
                                placeholder="yourusername"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Lock size={20} className="text-gray-400" />
                            </span>
                            <input
                                type="password"
                                id="password"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-lg"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105 text-lg font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Logging In...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} /> Login
                            </>
                        )}
                    </button>
                </form>

                <InfoModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={modalTitle}
                    message={modalMessage}
                    type={modalType}
                />
            </div>

            <style jsx>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fadeInScale {
                    animation: fadeInScale 0.5s ease-out forwards;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
