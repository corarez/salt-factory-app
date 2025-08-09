import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Printer, Download, X, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
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

const AddEditTransactionModal = ({ isOpen, onClose, initialData, onSave, type }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: type
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData || {
      title: '',
      price: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: type
    });
    setError('');
  }, [initialData, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.price || !formData.date) {
      setError('ناونیشان، نرخ، و بەروار پێویستن.');
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      setError('نرخ دەبێت ژمارەیەکی پۆزەتیڤ بێت.');
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
          {initialData ? (type === 'spend' ? 'دەستکاریکردنی خەرجی' : 'دەستکاریکردنی داهات') : (type === 'spend' ? 'زیادکردنی خەرجی نوێ' : 'زیادکردنی داهاتی نوێ')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">ناونیشان</label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.title}
              onChange={handleChange}
              placeholder={type === 'spend' ? 'بۆ نموونە، کرێی کارەبا' : 'بۆ نموونە، فرۆشی خوێ'}
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">نرخ (IQD)</label>
            <input
              type="number"
              id="price"
              name="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-right"
              value={formData.price}
              onChange={handleChange}
              placeholder="بۆ نموونە، 15000"
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">وەسف (ئارەزوومەندانە)</label>
            <textarea
              id="description"
              name="description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm resize-y text-right"
              value={formData.description}
              onChange={handleChange}
              placeholder={type === 'spend' ? 'بۆ نموونە، کرێی مانگانەی کارەبا' : 'بۆ نموونە، فرۆشی 10 تەن خوێ'}
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
              className={`px-6 py-2 ${type === 'spend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors shadow-md`}
            >
              {initialData ? 'نوێکردنەوەی تۆمار' : 'زیادکردنی تۆمار'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Spend = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalType, setModalType] = useState('spend'); // 'spend' or 'earning'
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);
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
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error("هەڵە لە وەرگرتنی داتای مامەڵەکان:", error);
        showToast(`هەڵە لە بارکردنی داتا: ${error.message}`, 'error');
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('transactions:added', (newEntry) => {
      setData(prevData => [...prevData, newEntry]);
    });

    socket.on('transactions:updated', (updatedEntry) => {
      setData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('transactions:deleted', (deletedId) => {
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
        url = `${API_BASE_URL}/transactions/${editingEntry.id}`;
      } else {
        method = 'POST';
        url = `${API_BASE_URL}/transactions`;
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
      showToast(`تۆماری ${entryToSave.type === 'spend' ? 'خەرجی' : 'داهات'} بۆ "${entryToSave.title}" ${editingEntry ? 'نوێکرایەوە' : 'زیادکرا'} بە سەرکەوتوویی!`, 'success');

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
      const response = await fetch(`${API_BASE_URL}/transactions/${deletingEntry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast(`تۆماری ${deletingEntry.type === 'spend' ? 'خەرجی' : 'داهات'} بە سەرکەوتوویی سڕایەوە!`, 'success');

    } catch (error) {
      console.error("هەڵە لە سڕینەوەی تۆمار:", error);
      showToast(`نەتوانرا تۆمار بسڕدرێتەوە: ${error.message}`, 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntry(null);
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
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDate || item.date.startsWith(filterDate)) &&
      (filterType === 'all' || item.type === filterType)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalExpenses = filteredData.filter(item => item.type === 'spend').reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalIncome = filteredData.filter(item => item.type === 'earning').reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        💸 تۆمارەکانی خەرجی و داهات
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="گەڕان بەپێی ناونیشان یان وەسف..."
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <select
          className="px-5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm bg-white text-right"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">هەموو</option>
          <option value="spend">خەرجییەکان</option>
          <option value="earning">داهاتەکان</option>
        </select>
        <button
          onClick={() => { setEditingEntry(null); setModalType('spend'); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <TrendingDown size={20} /> زیادکردنی خەرجی
        </button>
        <button
          onClick={() => { setEditingEntry(null); setModalType('earning'); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <TrendingUp size={20} /> زیادکردنی داهات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">کۆی گشتی خەرجییەکان</h2>
          <p className="text-4xl font-bold text-red-600">{formatNumberForDisplay(totalExpenses)} IQD</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">کۆی گشتی داهات</h2>
          <p className="text-4xl font-bold text-green-600">{formatNumberForDisplay(totalIncome)} IQD</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-blue-600">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">باڵانسی پوخت</h2>
          <p className={`text-4xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-gray-500'}`}>{formatNumberForDisplay(netBalance)} IQD</p>
        </div>
      </div>

      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-right text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-right">ID</th>
              <th className="px-5 py-3 text-right">ناونیشان</th>
              <th className="px-5 py-3 text-right">نرخ (IQD)</th>
              <th className="px-5 py-3 text-right">بەروار</th>
              <th className="px-5 py-3 text-right">جۆر</th>
              <th className="px-5 py-3 text-right">وەسف</th>
              <th className="px-5 py-3 text-center">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{item.title}</td>
                  <td className={`px-5 py-3 font-bold ${item.type === 'spend' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumberForDisplay(item.price)} IQD
                  </td>
                  <td className="px-5 py-3">{item.date}</td>
                  <td className="px-5 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.type === 'spend'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.type === 'spend' ? 'خەرجی' : 'داهات'}
                    </span>
                  </td>
                  <td className="px-5 py-3 max-w-xs truncate">{item.description}</td>
                  <td className="px-5 py-3 flex gap-3 justify-center">
                    <Edit
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-indigo-600 transition-colors"
                      onClick={() => { setEditingEntry(item); setModalType(item.type); setShowAddEditModal(true); }}
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
                      onClick={() => { setDeletingEntry(item); setShowDeleteConfirmModal(true); }}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-gray-500 text-lg">
                  هیچ تۆمارێک نەدۆزرایەوە. هەوڵبدە گەڕان یان فلتەرەکانت بگۆڕیت.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddEditTransactionModal
        isOpen={showAddEditModal}
        onClose={() => { setShowAddEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
        type={modalType}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntry(null); }}
        onConfirm={handleDeleteConfirm}
        title="پشتڕاستکردنەوەی سڕینەوە"
        message={`دڵنیایت دەتەوێت تۆماری ${deletingEntry?.type === 'spend' ? 'خەرجی' : 'داهات'} بۆ "${deletingEntry?.title}" بە نرخی ${formatNumberForDisplay(deletingEntry?.price) || ''} IQD بسڕیتەوە؟ ئەم کردارە ناتوانرێت هەڵبوەشێنرێتەوە.`}
        confirmColor={deletingEntry?.type === 'spend' ? 'bg-red-600' : 'bg-green-600'}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default Spend;
