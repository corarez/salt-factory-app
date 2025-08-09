import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle, X, Eye, CheckCircle, XCircle } from 'lucide-react';
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

const AddEditArrivalModal = ({ isOpen, onClose, initialData, onSave, currentUser }) => {
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    invoiceId: initialData.invoiceId.replace('INV-', '') // Remove 'INV-' for display
  } : {
    quantity: '',
    arrivedDate: new Date().toISOString().split('T')[0],
    pricePerTon: '',
    placeArrived: '',
    truckDriver: '',
    invoiceId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    senderName: '',
    feePerTon: '',
    status: 'Delivered',
    addedBy: currentUser?.username || ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData ? {
      ...initialData,
      invoiceId: initialData.invoiceId.replace('INV-', '')
    } : {
      quantity: '',
      arrivedDate: new Date().toISOString().split('T')[0],
      pricePerTon: '',
      placeArrived: '',
      truckDriver: '',
      invoiceId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      senderName: '',
      feePerTon: '',
      status: 'Delivered',
      addedBy: currentUser?.username || ''
    });
    setError('');
  }, [initialData, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.quantity || !formData.arrivedDate || !formData.pricePerTon || !formData.placeArrived || !formData.truckDriver || !formData.invoiceId || !formData.invoiceDate || !formData.senderName || !formData.feePerTon || !formData.addedBy) {
      setError('تکایە هەموو خانە پێویستەکان پڕبکەرەوە.');
      return;
    }

    if (isNaN(formData.invoiceId) || parseInt(formData.invoiceId) <= 0) {
      setError('ژمارەی وەسڵ دەبێت ژمارەیەکی دروست و پۆزەتیڤ بێت.');
      return;
    }

    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerTon = parseFloat(formData.pricePerTon) || 0;
    const feePerTon = parseFloat(formData.feePerTon) || 0;

    const totalFee = feePerTon * quantity;
    const totalTonPrice = pricePerTon * quantity;
    const totalPrice = totalFee + totalTonPrice;

    // Add 'INV-' prefix back before saving to backend if needed, or ensure backend handles raw number
    const finalInvoiceId = formData.invoiceId; // Assuming backend will store it as a number or handle formatting

    onSave({ ...formData, invoiceId: finalInvoiceId, totalFee, totalTonPrice, totalPrice });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'دەستکاریکردنی گەیشتنی خوێ' : 'زیادکردنی گەیشتنی خوێی نوێ'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {[
            { label: 'بڕ (تەن)', name: 'quantity', type: 'number', placeholder: 'بۆ نموونە، 20' },
            { label: 'بەرواری گەیشتن', name: 'arrivedDate', type: 'date' },
            { label: 'نرخ بۆ هەر تەنێک (IQD)', name: 'pricePerTon', type: 'number', placeholder: 'بۆ نموونە، 150' },
            { label: 'شوێنی گەیشتن', name: 'placeArrived', type: 'text', placeholder: 'بۆ نموونە، هەولێر' },
            { label: 'شۆفێری بارهەڵگر', name: 'truckDriver', type: 'text', placeholder: 'بۆ نموونە، کەمال عەلی' },
            { label: 'ژمارەی وەسڵ', name: 'invoiceId', type: 'number', placeholder: 'بۆ نموونە، 001', readOnly: !!initialData },
            { label: 'بەرواری وەسڵ', name: 'invoiceDate', type: 'date' },
            { label: 'ناوی نێرەر', name: 'senderName', type: 'text', placeholder: 'بۆ نموونە، کۆمپانیای خوێ' },
            { label: 'کرێ بۆ هەر تەنێک (IQD)', name: 'feePerTon', type: 'number', placeholder: 'بۆ نموونە، 10' },
          ].map(({ label, name, type, placeholder, readOnly }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''} text-right`}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required
                readOnly={readOnly}
              />
            </div>
          ))}
          <div className="col-span-full">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">دۆخ</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white text-right"
            >
              <option value="Delivered">گەیشتوو</option>
              <option value="In Progress">لە پێشڤەچووندا</option>
              <option value="Pending">چاوەڕوانکراو</option>
            </select>
          </div>
          <div className="col-span-full">
            <label htmlFor="addedBy" className="block text-sm font-medium text-gray-700 mb-1">زیادکراوە لەلایەن</label>
            <input
              type="text"
              id="addedBy"
              name="addedBy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-gray-100 cursor-not-allowed text-right"
              value={formData.addedBy}
              readOnly
            />
          </div>
          {error && <p className="col-span-full text-red-500 text-sm mt-2 text-right">{error}</p>}
          <div className="col-span-full flex justify-end gap-4 mt-6">
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
              {initialData ? 'نوێکردنەوەی گەیشتن' : 'زیادکردنی گەیشتن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ViewArrivalModal = ({ isOpen, onClose, entry }) => {
  if (!isOpen || !entry) return null;

  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">وردەکاری گەیشتن</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-gray-700 text-right">
          <div className="font-medium text-left">ID:</div><div className="font-semibold text-gray-900">{entry.id}</div>
          <div className="font-medium text-left">بڕ:</div><div>{formatNumberForDisplay(entry.quantity)} تەن</div>
          <div className="font-medium text-left">بەرواری گەیشتن:</div><div>{entry.arrivedDate}</div>
          <div className="font-medium text-left">نرخ بۆ هەر تەنێک:</div><div>{formatNumberForDisplay(entry.pricePerTon)} IQD</div>
          <div className="font-medium text-left">شوێنی گەیشتن:</div><div>{entry.placeArrived}</div>
          <div className="font-medium text-left">شۆفێری بارهەڵگر:</div><div>{entry.truckDriver}</div>
          <div className="font-medium text-left">ژمارەی وەسڵ:</div><div>{entry.invoiceId}</div>
          <div className="font-medium text-left">بەرواری وەسڵ:</div><div>{entry.invoiceDate}</div>
          <div className="font-medium text-left">ناوی نێرەر:</div><div>{entry.senderName}</div>
          <div className="font-medium text-left">کرێ بۆ هەر تەنێک:</div><div>{formatNumberForDisplay(entry.feePerTon)} IQD</div>
          <div className="font-medium text-left">کۆی گشتی کرێ:</div><div>{formatNumberForDisplay(entry.totalFee)} IQD</div>
          <div className="font-medium text-left">کۆی گشتی نرخی تەن:</div><div>{formatNumberForDisplay(entry.totalTonPrice)} IQD</div>
          <div className="font-medium text-xl col-span-2 mt-2 text-left">کۆی گشتی نرخ: <span className="font-bold text-blue-600">{formatNumberForDisplay(entry.totalPrice)} IQD</span></div>
          <div className="font-medium text-left">دۆخ:</div>
          <div className="col-span-1 text-left">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              entry.status === 'Delivered'
                ? 'bg-green-100 text-green-700'
                : entry.status === 'In Progress'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {entry.status === 'Delivered' ? 'گەیشتوو' : entry.status === 'In Progress' ? 'لە پێشڤەچووندا' : 'چاوەڕوانکراو'}
            </span>
          </div>
          <div className="font-medium text-left">زیادکراوە لەلایەن:</div><div>{entry.addedBy}</div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};

const Arrived = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
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
    const fetchArrivedData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/arrived`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error("هەڵە لە وەرگرتنی داتای گەیشتوو:", error);
        showToast(`هەڵە لە بارکردنی داتا: ${error.message}`, 'error');
      }
    };

    fetchArrivedData();

    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("هەڵە لە شیکردنەوەی بەکارهێنەر لە LocalStorage:", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('arrived:added', (newEntry) => {
      setData(prevData => [...prevData, newEntry]);
    });

    socket.on('arrived:updated', (updatedEntry) => {
      setData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('arrived:deleted', (deletedId) => {
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
        url = `${API_BASE_URL}/arrived/${editingEntry.id}`;
      } else {
        method = 'POST';
        url = `${API_BASE_URL}/arrived`;
        entryToSave.addedBy = currentUser?.username || 'نادیار';
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
      showToast(`تۆماری گەیشتن بۆ ژمارەی وەسڵ "${entryToSave.invoiceId}" ${editingEntry ? 'نوێکرایەوە' : 'زیادکرا'} بە سەرکەوتوویی!`, 'success');

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
      const response = await fetch(`${API_BASE_URL}/arrived/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast('تۆماری گەیشتن بە سەرکەوتوویی سڕایەوە!', 'success');

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
      (item.placeArrived.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceId.toString().includes(search.toLowerCase()) || // Search by number
      item.truckDriver.toLowerCase().includes(search.toLowerCase()) ||
      item.senderName.toLowerCase().includes(search.toLowerCase()) ||
      item.status.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDate || item.arrivedDate.startsWith(filterDate))
  ).sort((a, b) => new Date(b.arrivedDate) - new Date(a.arrivedDate));

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        🧂 تۆمارەکانی گەیشتنی خوێ
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="گەڕان بەپێی شوێن، ژمارەی وەسڵ، شۆفێر، نێرەر، یان دۆخ"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-96 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <button
          onClick={() => { setEditingEntry(null); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> زیادکردنی گەیشتنی نوێ
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-right text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 text-right">ID</th>
              <th className="px-5 py-3 text-right">بڕ</th>
              <th className="px-5 py-3 text-right">بەرواری گەیشتن</th>
              <th className="px-5 py-3 text-right">نرخ/تەن</th>
              <th className="px-5 py-3 text-right">شوێن</th>
              <th className="px-5 py-3 text-right">شۆفێر</th>
              <th className="px-5 py-3 text-right">ژمارەی وەسڵ</th>
              <th className="px-5 py-3 text-right">بەرواری وەسڵ</th>
              <th className="px-5 py-3 text-right">نێرەر</th>
              <th className="px-5 py-3 text-right">کرێ/تەن</th>
              <th className="px-5 py-3 text-right">کۆی گشتی کرێ</th>
              <th className="px-5 py-3 text-right">کۆی گشتی نرخی تەن</th>
              <th className="px-5 py-3 text-right">کۆی گشتی نرخ</th>
              <th className="px-5 py-3 text-right">دۆخ</th>
              <th className="px-5 py-3 text-right">زیادکراوە لەلایەن</th>
              <th className="px-5 py-3 text-center">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.quantity)}</td>
                  <td className="px-5 py-3">{item.arrivedDate}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.pricePerTon)} IQD</td>
                  <td className="px-5 py-3">{item.placeArrived}</td>
                  <td className="px-5 py-3">{item.truckDriver}</td>
                  <td className="px-5 py-3">{item.invoiceId}</td>
                  <td className="px-5 py-3">{item.invoiceDate}</td>
                  <td className="px-5 py-3">{item.senderName}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.feePerTon)} IQD</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.totalFee)} IQD</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.totalTonPrice)} IQD</td>
                  <td className="px-5 py-3 font-bold text-blue-600">{formatNumberForDisplay(item.totalPrice)} IQD</td>
                  <td className="px-5 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Delivered'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : item.status === 'Pending'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {item.status === 'Delivered' ? 'گەیشتوو' : item.status === 'In Progress' ? 'لە پێشڤەچووندا' : 'چاوەڕوانکراو'}
                    </span>
                  </td>
                  <td className="px-5 py-3">{item.addedBy}</td>
                  <td className="px-5 py-3 flex gap-3 justify-center">
                    <Eye
                      size={18}
                      className="cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
                      onClick={() => { setViewingEntry(item); setShowViewModal(true); }}
                    />
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
                <td colSpan="16" className="px-5 py-8 text-center text-gray-500 text-lg">
                  هیچ تۆمارێک نەدۆزرایەوە. هەوڵبدە گەڕان یان فلتەرەکانت بگۆڕیت.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddEditArrivalModal
        isOpen={showAddEditModal}
        onClose={() => { setShowAddEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
        currentUser={currentUser}
      />

      <ViewArrivalModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewingEntry(null); }}
        entry={viewingEntry}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntryId(null); }}
        onConfirm={handleDeleteConfirm}
        title="پشتڕاستکردنەوەی سڕینەوە"
        message={`دڵنیایت دەتەوێت تۆماری گەیشتن بۆ ژمارەی وەسڵ "${data.find(d => d.id === deletingEntryId)?.invoiceId || 'ئەم تۆمارە'}" بسڕیتەوە؟ ئەم کردارە ناتوانرێت هەڵبوەشێنرێتەوە.`}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default Arrived;
