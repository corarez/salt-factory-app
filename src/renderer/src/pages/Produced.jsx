import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle, X, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  if (parsedNum % 1 === 0) {
    return parsedNum.toString();
  }
  return parsedNum.toFixed(2);
};

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

const AddEditProducedModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState(initialData || {
    saltType: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData || {
      saltType: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setError('');
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.saltType || !formData.quantity || !formData.date) {
      setError('جۆری خوێ، بڕ، و بەروار پێویستن.');
      return;
    }
    if (parseFloat(formData.quantity) <= 0) {
      setError('بڕ دەبێت ژمارەیەکی پۆزەتیڤ بێت.');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'دەستکاریکردنی خوێی بەرهەمهاتوو' : 'زیادکردنی خوێی بەرهەمهاتووی نوێ'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {initialData && ( // Display ID field only for existing data, read-only
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                id="id"
                name="id"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-gray-100 cursor-not-allowed text-right"
                value={formData.id}
                readOnly
              />
            </div>
          )}
          <div>
            <label htmlFor="saltType" className="block text-sm font-medium text-gray-700 mb-1">جۆری خوێ</label>
            <input
              type="text"
              id="saltType"
              name="saltType"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.saltType}
              onChange={handleChange}
              placeholder="بۆ نموونە، پاڵاوتراو، پیشەسازی"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">بڕ (تەن)</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="بۆ نموونە، 12"
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">بەروار</label>
            <input
              type="date"
              id="date"
              name="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">تێبینی</label>
            <textarea
              id="note"
              name="note"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm resize-y text-right"
              value={formData.note}
              onChange={handleChange}
              placeholder="بۆ نموونە، شیفتی بەیانی، پشکنینی کوالیتی تێپەڕی"
              rows="3"
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
              {initialData ? 'نوێکردنەوەی تۆمار' : 'زیادکردنی تۆمار'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SaltProduced = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
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
    const fetchProducedData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/produced`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error("هەڵە لە وەرگرتنی داتای بەرهەمهاتوو:", error);
        showToast(`هەڵە لە بارکردنی داتا: ${error.message}`, 'error');
      }
    };

    fetchProducedData();
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('produced:added', (newEntry) => {
      setData(prevData => [...prevData, newEntry]);
    });

    socket.on('produced:updated', (updatedEntry) => {
      setData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('produced:deleted', (deletedId) => {
      setData(prevData => prevData.filter(item => item.id !== deletedId));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSaveEntry = async (entryToSave) => {
    try {
      let response;
      let method;
      let url;

      if (editingEntry) {
        method = 'PUT';
        url = `${API_BASE_URL}/produced/${editingEntry.id}`;
      } else {
        method = 'POST';
        url = `${API_BASE_URL}/produced`;
      }

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      showToast(`تۆماری بەرهەمهێنان بۆ "${entryToSave.saltType}" ${editingEntry ? 'نوێکرایەوە' : 'زیادکرا'} بە سەرکەوتوویی!`, 'success');

    } catch (error) {
      console.error("هەڵە لە پاشەکەوتکردنی تۆمار:", error);
      showToast(`نەتوانرا تۆمار پاشەکەوت بکرێت: ${error.message}`, 'error');
    } finally {
      setShowAddEditModal(false);
      setEditingEntry(null);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/produced/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast('تۆماری بەرهەمهێنان بە سەرکەوتوویی سڕایەوە!', 'success');

    } catch (error) {
      console.error("هەڵە لە سڕینەوەی تۆمار:", error);
      showToast(`نەتوانرا تۆمار بسڕدرێتەوە: ${error.message}`, 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntryId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showToast('تایبەتمەندی داگرتن لەژێر گەشەپێداندایە. تکایە لە ئێستادا بژاردەی چاپکردن بەکاربهێنە.', 'info');
  };

  const filteredData = data.filter(
    (item) =>
      item.saltType.toLowerCase().includes(search.toLowerCase()) ||
      item.note.toLowerCase().includes(search.toLowerCase()) ||
      item.date.includes(search)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        🏭 تۆمارەکانی خوێی بەرهەمهاتوو
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="گەڕان بەپێی جۆری خوێ، تێبینی، یان بەروار"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => { setEditingEntry(null); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> زیادکردنی بەرهەمهێنانی نوێ
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-right text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-right">ID</th>
              <th className="px-5 py-3 text-right">جۆری خوێ</th>
              <th className="px-5 py-3 text-right">بڕ (تەن)</th>
              <th className="px-5 py-3 text-right">بەروار</th>
              <th className="px-5 py-3 text-right">تێبینی</th>
              <th className="px-5 py-3 text-center">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{item.saltType}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.quantity)}</td>
                  <td className="px-5 py-3">{item.date}</td>
                  <td className="px-5 py-3 max-w-xs truncate">{item.note}</td>
                  <td className="px-5 py-3 flex gap-3 justify-center">
                    <Edit
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-indigo-600 transition-colors"
                      onClick={() => { setEditingEntry(item); setShowAddEditModal(true); }}
                    />
                    <Printer
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-purple-600 transition-colors"
                      onClick={() => handlePrint()}
                    />
                    <Download
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-green-600 transition-colors"
                      onClick={() => handleDownload()}
                    />
                    <Trash2
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-red-600 transition-colors"
                      onClick={() => { setDeletingEntryId(item.id); setShowDeleteConfirmModal(true); }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-gray-500 text-lg">
                  هیچ تۆمارێک نەدۆزرایەوە. هەوڵبدە گەڕانەکەت بگۆڕیت.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddEditProducedModal
        isOpen={showAddEditModal}
        onClose={() => { setShowAddEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntryId(null); }}
        onConfirm={handleDeleteConfirm}
        title="پشتڕاستکردنەوەی سڕینەوە"
        message={`دڵنیایت دەتەوێت تۆماری بەرهەمهێنان بۆ "${data.find(d => d.id === deletingEntryId)?.saltType || 'ئەم تۆمارە'}" لە ${data.find(d => d.id === deletingEntryId)?.date || ''} بسڕیتەوە؟ ئەم کردارە ناتوانرێت هەڵبوەشێنرێتەوە.`}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default SaltProduced;
