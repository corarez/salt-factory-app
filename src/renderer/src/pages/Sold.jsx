import React, { useState, useEffect } from 'react';
import { Printer, FileDown, ChevronDown, ChevronUp, Edit, Trash2, X, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
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

const SaleEntryModal = ({ isOpen, onClose, initialData, onSave, nextInvoiceIdForNew }) => {
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    invoiceId: initialData.invoiceId.replace('INV-', ''),
    oldDebt: initialData.oldDebt !== null && initialData.oldDebt !== undefined ? parseFloat(initialData.oldDebt) : '',
    total: initialData.total !== null && initialData.total !== undefined ? parseFloat(initialData.total) : 0,
  } : {
    buyerName: '',
    invoiceId: nextInvoiceIdForNew.replace('INV-', '') || '',
    date: new Date().toISOString().split('T')[0],
    items: [{ saltType: '', quantity: '', pricePerTon: '' }],
    truckDriverName: '',
    truckNumber: '',
    truckDriverPhone: '',
    oldDebt: '',
    total: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData ? {
      ...initialData,
      invoiceId: initialData.invoiceId.replace('INV-', ''),
      oldDebt: initialData.oldDebt !== null && initialData.oldDebt !== undefined ? parseFloat(initialData.oldDebt) : '',
      total: initialData.total !== null && initialData.total !== undefined ? parseFloat(initialData.total) : 0,
    } : {
      buyerName: '',
      invoiceId: nextInvoiceIdForNew.replace('INV-', '') || '',
      date: new Date().toISOString().split('T')[0],
      items: [{ saltType: '', quantity: '', pricePerTon: '' }],
      truckDriverName: '',
      truckNumber: '',
      truckDriverPhone: '',
    });
    setError('');
  }, [initialData, nextInvoiceIdForNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = formData.items.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { saltType: '', quantity: '', pricePerTon: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.buyerName || !formData.invoiceId || !formData.date || !formData.truckDriverName || !formData.truckNumber || !formData.truckDriverPhone) {
      setError('ناوی کڕیار، ژمارەی وەسڵ، بەروار، ناوی شۆفێری بارهەڵگر، ژمارەی بارهەڵگر، و ژمارەی تەلەفۆنی شۆفێری بارهەڵگر پێویستن.');
      return;
    }

    if (isNaN(formData.invoiceId) || parseInt(formData.invoiceId) <= 0) {
      setError('ژمارەی وەسڵ دەبێت ژمارەیەکی دروست و پۆزەتیڤ بێت.');
      return;
    }

    for (const item of formData.items) {
      if (!item.saltType || !item.quantity || !item.pricePerTon) {
        setError('هەموو کاڵاکانی فرۆش دەبێت جۆری خوێ، بڕ، و نرخ بۆ هەر تەنێکیان هەبێت.');
        return;
      }
      if (parseFloat(item.quantity) <= 0 || parseFloat(item.pricePerTon) <= 0) {
        setError('بڕ و نرخ بۆ هەر تەنێک دەبێت ژمارەی پۆزەتیڤ بن بۆ هەموو کاڵاکان.');
        return;
      }
    }

    const totalItemsPrice = formData.items.reduce((total, item) => total + (parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0), 0);
    const oldDebtValue = parseFloat(formData.oldDebt) || 0;
    const finalTotal = totalItemsPrice + oldDebtValue;

    const finalInvoiceId = `INV-${String(formData.invoiceId).padStart(4, '0')}`;

    onSave({ ...formData, invoiceId: finalInvoiceId, total: finalTotal });
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
          {initialData ? 'دەستکاریکردنی تۆماری فرۆش' : 'زیادکردنی تۆماری فرۆشی نوێ'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-1">ناوی کڕیار</label>
              <input
                type="text"
                id="buyerName"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                placeholder="بۆ نموونە، گرووپی ڕەشید"
                required
              />
            </div>
            <div>
              <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 mb-1">ژمارەی وەسڵ</label>
              <input
                type="number"
                id="invoiceId"
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-100 cursor-not-allowed text-right"
                placeholder="بۆ نموونە، 1001"
                required
                readOnly={true}
              />
            </div>
            <div className="col-span-full">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">بەروار</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                required
              />
            </div>
            <div>
              <label htmlFor="truckDriverName" className="block text-sm font-medium text-gray-700 mb-1">ناوی شۆفێری بارهەڵگر</label>
              <input
                type="text"
                id="truckDriverName"
                name="truckDriverName"
                value={formData.truckDriverName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                placeholder="بۆ نموونە، عەلی حەسەن"
                required
              />
            </div>
            <div>
              <label htmlFor="truckNumber" className="block text-sm font-medium text-gray-700 mb-1">ژمارەی بارهەڵگر</label>
              <input
                type="text"
                id="truckNumber"
                name="truckNumber"
                value={formData.truckNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                placeholder="بۆ نموونە، 12345"
                required
              />
            </div>
            <div>
              <label htmlFor="truckDriverPhone" className="block text-sm font-medium text-gray-700 mb-1">ژمارەی تەلەفۆنی شۆفێری بارهەڵگر</label>
              <input
                type="text"
                id="truckDriverPhone"
                name="truckDriverPhone"
                value={formData.truckDriverPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                placeholder="بۆ نموونە، 07701234567"
                required
              />
            </div>
            <div>
              <label htmlFor="oldDebt" className="block text-sm font-medium text-gray-700 mb-1">قەرزی کۆن (IQD)</label>
              <input
                type="number"
                id="oldDebt"
                name="oldDebt"
                value={formData.oldDebt}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right"
                placeholder="بۆ نموونە، 50 (ئارەزوومەندانە)"
                min="0"
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">کاڵاکانی فرۆش</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">جۆری خوێ</label>
                  <input
                    type="text"
                    name="saltType"
                    value={item.saltType}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="بۆ نموونە، ورد"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">بڕ (تەن)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="بۆ نموونە، 5"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">نرخ/تەن (IQD)</label>
                  <input
                    type="number"
                    name="pricePerTon"
                    value={item.pricePerTon}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                    placeholder="بۆ نموونە، 100"
                    min="0"
                    required
                  />
                </div>
                <div className="flex items-end justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors rounded-md"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-semibold mt-4"
          >
            + زیادکردنی کاڵایەکی تر
          </button>

          {error && <p className="text-red-500 text-sm mt-2 text-right">{error}</p>}

          <div className="flex justify-end gap-4 mt-8">
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
              {initialData ? 'نوێکردنەوەی فرۆش' : 'زیادکردنی فرۆش'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            سڕینەوە
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate the full HTML content for the invoice
const generateInvoiceHtml = (invoiceData) => {
  const itemsHtml = invoiceData.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.saltType}</td>
      <td>${formatNumberForDisplay(item.quantity)}</td>
      <td>${formatNumberForDisplay(item.pricePerTon)} IQD</td>
      <td>${formatNumberForDisplay((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0))} IQD</td>
    </tr>
  `).join('');

  const totalItemsPrice = invoiceData.items.reduce((total, item) => total + (parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0), 0);
  const oldDebtValue = parseFloat(invoiceData.oldDebt) || 0;
  const totalDue = totalItemsPrice + oldDebtValue;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Invoice - ${invoiceData.invoiceId}</title>
      <style>
        * {
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          color: #000; /* Ensure text is black */
          -webkit-print-color-adjust: exact; /* Force printing of backgrounds and colors */
          print-color-adjust: exact;
        }

        body {
          padding: 30px;
          width: 210mm; /* A4 width */
          height: 297mm; /* A4 height */
          background: white;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .header .side {
          width: 30%;
          font-size: 14px;
          text-align: center;
        }

        .header .logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
        }

        .description {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 16px;
          text-align: center;
        }

        .sub-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 14px;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 5px 0;
          margin-bottom: 16px;
        }

        .info {
          font-size: 14px;
          margin-bottom: 16px;
        }

        .info p {
          margin-bottom: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        table, th, td {
          border: 1px solid #000;
        }

        th, td {
          padding: 8px;
          text-align: center;
        }

        .table-footer {
          margin-bottom: 40px;
          width: 100%;
          border-collapse: collapse;
        }

        .table-footer tr:first-child td {
          border-top: 1px solid #000;
        }

        .table-footer td {
          text-align: right;
          padding: 6px 12px;
          font-weight: bold;
          border: none;
        }
        .table-footer td:first-child {
            text-align: left;
        }


        .signatures {
          display: flex;
          justify-content: space-between;
          position: absolute;
          bottom: 40px;
          left: 30px;
          right: 30px;
          font-size: 14px;
          text-align: center;
          width: calc(100% - 60px);
        }

        .signatures .sig {
          width: 30%;
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="side">
          <h2>كارگەی خوێی سەردەم</h2>
          <p>بۆ بەرهەمهێنانی باشترین جۆری خوێی خۆراكی و پیشەسازی</p>
          <p>ناونیشان / سلێمانی / ناجییەی تەكیە / ناوچەی پیشەسازی</p>
        </div>
        <div>
          <img class="logo" src="https://placehold.co/100x100/E0E7FF/4338CA?text=Logo" alt="Company Logo" />
        </div>

        <div class="side" style="text-align: right;">
          <h2>Invoice</h2>
          <p>Date: ${invoiceData.date}</p>
          <p>Invoice ID: ${invoiceData.invoiceId}</p>
        </div>
      </div>

      <div class="description">
        <div>
          <strong>Buyer Details:</strong><br/>
          Name: ${invoiceData.buyerName}<br/>
          Truck Driver: ${invoiceData.truckDriverName}<br/>
          Truck No: ${invoiceData.truckNumber}<br/>
          Driver Phone: ${invoiceData.truckDriverPhone}
        </div>
        <div>
          <strong>Seller Details:</strong><br/>
          Model Salt Factory<br/>
          Sulaymaniyah, Iraq<br/>
          Phone: 07701234567
        </div>
      </div>

      <div class="sub-header">
        <div style="width: 100%; text-align: center;">Item Details</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Salt Type</th>
            <th>Quantity (Tons)</th>
            <th>Price/Ton</th>
            <th>Amount (IQD)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <table class="table-footer">
        <tr>
          <td>Total Invoice: ${formatNumberForDisplay(totalItemsPrice)} IQD</td>
        </tr>
        ${invoiceData.oldDebt > 0 ? `
        <tr>
          <td>Old Debt: ${formatNumberForDisplay(oldDebtValue)} IQD</td>
        </tr>
        ` : ''}
        <tr>
          <td>Total Due: ${formatNumberForDisplay(totalDue)} IQD</td>
        </tr>
      </table>

      <div class="signatures">
        <div class="sig">
          <p>_______________________</p>
          <p>Owner of Company</p>
        </div>
        <div class="sig">
          <p>_______________________</p>
          <p>Receiver Signature</p>
        </div>
        <div class="sig">
          <p>_______________________</p>
          <p>Accountant / Manager</p>
        </div>
      </div>

    </body>
    </html>
  `;
};


const SaltSold = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState({ day: '', month: '', year: '' });
  const [salesData, setSalesData] = useState([]);
  const [nextInvoiceId, setNextInvoiceId] = useState('INV-0001');

  const [showEditModal, setShowEditModal] = useState(false);
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

  const calculateNextInvoiceId = (currentSalesData) => {
    if (currentSalesData.length === 0) {
      return 'INV-0001';
    }
    const maxIdNum = currentSalesData.reduce((max, entry) => {
      const match = entry.invoiceId.match(/INV-(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    const nextNum = maxIdNum + 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  };

  useEffect(() => {
    const fetchSoldData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/sold`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setSalesData(fetchedData);
        setNextInvoiceId(calculateNextInvoiceId(fetchedData));
      } catch (error) {
        console.error("هەڵە لە وەرگرتنی داتای فرۆشراو:", error);
        showToast(`هەڵە لە بارکردنی داتا: ${error.message}`, 'error');
      }
    };

    fetchSoldData();
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('sold:added', (newEntry) => {
      setSalesData(prevData => {
        const updatedData = [...prevData, newEntry];
        setNextInvoiceId(calculateNextInvoiceId(updatedData));
        return updatedData;
      });
    });

    socket.on('sold:updated', (updatedEntry) => {
      setSalesData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('sold:deleted', (deletedId) => {
      setSalesData(prevData => {
        const updatedData = prevData.filter(item => item.id !== deletedId);
        setNextInvoiceId(calculateNextInvoiceId(updatedData));
        return updatedData;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredData = salesData
    .filter((entry) =>
      entry.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      entry.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      entry.truckDriverName.toLowerCase().includes(search.toLowerCase()) ||
      entry.truckNumber.toLowerCase().includes(search.toLowerCase()) ||
      entry.truckDriverPhone.toLowerCase().includes(search.toLowerCase()) ||
      entry.items.some(item => item.saltType.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      if (filter.year && entryDate.getFullYear() !== parseInt(filter.year)) return false;
      if (filter.month && (entryDate.getMonth() + 1) !== parseInt(filter.month)) return false;
      if (filter.day && entryDate.getDate() !== parseInt(filter.day)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadPdf = (id) => {
    const invoiceData = salesData.find(entry => entry.id === id);
    if (!invoiceData) {
      showToast('Invoice data not found for PDF generation.', 'error');
      return;
    }

    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast('PDF generation libraries are not loaded. Please ensure their CDN scripts are included in your HTML.', 'error');
      return;
    }

    const invoiceHtml = generateInvoiceHtml(invoiceData);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = invoiceHtml;
    document.body.appendChild(tempDiv); // Append to body to render for html2canvas

    window.html2canvas(tempDiv.querySelector('body > div'), { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm', // Change unit to millimeters for A4
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Salt_Sale_Invoice_${id}.pdf`);
    }).catch(error => {
      console.error("هەڵە لە دروستکردنی PDF:", error);
      showToast("هەڵە لە دروستکردنی PDF. تکایە دووبارە هەوڵبدەوە یان بڕوانە کۆنسۆڵ بۆ هەڵەکان.", 'error');
    }).finally(() => {
      document.body.removeChild(tempDiv); // Clean up
    });
  };

  const handleLivePrint = (id) => {
    const invoiceData = salesData.find(entry => entry.id === id);
    if (!invoiceData) {
      showToast('Invoice data not found for printing.', 'error');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Could not open print window. Please allow pop-ups for this site.', 'error');
      return;
    }

    const invoiceHtml = generateInvoiceHtml(invoiceData);

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };


  const handleSaveEntry = async (entryToSave) => {
    try {
      let response;
      let method;
      let url;

      if (editingEntry) {
        method = 'PUT';
        url = `${API_BASE_URL}/sold/${editingEntry.id}`;
      } else {
        method = 'POST';
        url = `${API_BASE_URL}/sold`;
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
      showToast(`تۆماری فرۆش بۆ ژمارەی وەسڵ "${entryToSave.invoiceId}" ${editingEntry ? 'نوێکرایەوە' : 'زیادکرا'} بە سەرکەوتوویی!`, 'success');

    } catch (error) {
      console.error("هەڵە لە پاشەکەوتکردنی تۆمار:", error);
      showToast(`نەتوانرا تۆمار پاشەکەوت بکرێت: ${error.message}`, 'error');
    } finally {
      setEditingEntry(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sold/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      showToast('تۆماری فرۆش بە سەرکەوتوویی سڕایەوە!', 'success');

    } catch (error) {
      console.error("هەڵە لە سڕینەوەی تۆمار:", error);
      showToast(`نەتوانرا تۆمار بسڕدرێتەوە: ${error.message}`, 'error');
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntryId(null);
    }
  };

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">🧾 تۆمارەکانی خوێی فرۆشراو</h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-3 mb-6 items-center justify-center">
        <input
          type="text"
          placeholder="گەڕان بەپێی کڕیار، ژمارەی وەسڵ، یان جۆری خوێ..."
          className="px-4 py-1.5 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="ڕۆژ"
            className="px-3 py-1.5 border border-gray-300 rounded-lg w-20 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right text-sm"
            maxLength={2}
            min="1"
            max="31"
            value={filter.day}
            onChange={(e) => setFilter({ ...filter, day: e.target.value })}
          />
          <input
            type="number"
            placeholder="مانگ"
            className="px-3 py-1.5 border border-gray-300 rounded-lg w-20 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right text-sm"
            maxLength={2}
            min="1"
            max="12"
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
          />
          <input
            type="number"
            placeholder="ساڵ"
            className="px-3 py-1.5 border border-gray-300 rounded-lg w-24 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right text-sm"
            maxLength={4}
            min="2000"
            max="2100"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          />
        </div>
        <button
          onClick={() => { setEditingEntry(null); setShowEditModal(true); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md transform hover:scale-105 text-sm"
        >
          <PlusCircle size={16} /> زیادکردنی فرۆشی نوێ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredData.length > 0 ? (
          filteredData.map((entry) => (
            <div
              key={entry.id}
              id={`card-${entry.id}`}
              className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-100 rounded-xl p-2 hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-xs invoice-card"
            >
              {/* Visible card content */}
              <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer pb-1 border-b border-blue-100"
                onClick={() => toggleExpanded(entry.id)}
              >
                <div className="flex-grow">
                  <h2 className="text-sm font-bold text-blue-800 mb-0.5 flex items-center gap-1">
                    {entry.buyerName}
                  </h2>
                  <p className="text-xs text-gray-600">وەسڵ: <span className="font-semibold text-gray-800">{entry.invoiceId}</span> • بەروار: <span className="font-semibold text-gray-800">{entry.date}</span></p>
                  <p className="text-xs text-gray-500">
                    شۆفێر: <span className="font-medium">{entry.truckDriverName}</span> (#<span className="font-medium">{entry.truckNumber}</span>, <span className="font-medium">{entry.truckDriverPhone}</span>)
                  </p>
                  {entry.oldDebt > 0 && (
                    <p className="text-xs text-red-500 font-semibold">قەرزی کۆن: {formatNumberForDisplay(entry.oldDebt)} IQD</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 mt-1 sm:mt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setShowEditModal(true); }}
                    className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
                  >
                    <Edit size={12} /> دەستکاری
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingEntryId(entry.id); setShowDeleteConfirmModal(true); }}
                    className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded-full border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <Trash2 size={12} /> سڕینەوە
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLivePrint(entry.id); }}
                    className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded-full border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors shadow-sm"
                  >
                    <Printer size={12} /> چاپ
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadPdf(entry.id); }}
                    className="flex items-center gap-0.5 text-xs px-1 py-0.5 rounded-full border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
                  >
                    <FileDown size={12} /> داگرتن
                  </button>
                  {expanded[entry.id] ? <ChevronUp size={14} className="text-gray-700" /> : <ChevronDown size={14} className="text-gray-700" />}
                </div>
              </div>

              {expanded[entry.id] && (
                <div className="mt-1">
                  <table className="w-full text-xs text-right border border-slate-300 rounded-lg overflow-hidden shadow-inner">
                    <thead className="bg-blue-200 text-blue-900 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-1.5 py-1 border-b border-slate-200">#</th>
                        <th className="px-1.5 py-1 border-b border-slate-200">جۆری خوێ</th>
                        <th className="px-1.5 py-1 border-b border-slate-200 text-right">بڕ (تەن)</th>
                        <th className="px-1.5 py-1 border-b border-slate-200 text-right">نرخ/تەن</th>
                        <th className="px-1.5 py-1 border-b border-slate-200 text-right">بڕی پارە</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.items.map((item, index) => (
                        <tr key={index} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                          <td className="px-1.5 py-1">{index + 1}</td>
                          <td className="px-1.5 py-1 font-medium text-gray-800">{item.saltType}</td>
                          <td className="px-1.5 py-1 text-right">{formatNumberForDisplay(item.quantity)}</td>
                          <td className="px-1.5 py-1 text-right">{formatNumberForDisplay(item.pricePerTon)} IQD</td>
                          <td className="px-1.5 py-1 font-bold text-green-700 text-right">
                            {formatNumberForDisplay((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0))} IQD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right mt-2 text-sm font-extrabold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 shadow-md">
                    کۆی گشتی فرۆش: <span className="text-green-800">{formatNumberForDisplay(entry.total)} IQD</span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm bg-white rounded-xl shadow-lg border border-gray-200">
            هیچ تۆمارێکی فرۆش نەدۆزرایەوە بەپێی پێوەرەکانت.
          </div>
        )}
      </div>

      <SaleEntryModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
        nextInvoiceIdForNew={nextInvoiceId}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntryId(null); }}
        onConfirm={handleDeleteConfirm}
        title="پشتڕاستکردنەوەی سڕینەوە"
        message={`دڵنیایت دەتەوێت تۆماری فرۆش بۆ ${salesData.find(e => e.id === deletingEntryId)?.buyerName || 'ئەم تۆمارە'} بسڕیتەوە؟ ئەم کردارە ناتوانرێت هەڵوەشێنرێتەوە.`}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default SaltSold;
