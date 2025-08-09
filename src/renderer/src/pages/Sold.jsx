import React, { useState, useEffect, useCallback } from 'react';
import { Printer, FileDown, ChevronDown, ChevronUp, Edit, Trash2, X, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import logo from "./../../../../resources/logo.png"
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  return parsedNum % 1 === 0 ? parsedNum.toString() : parsedNum.toFixed(2);
};

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const config = {
    success: { bgColor: 'bg-green-500', icon: <CheckCircle size={20} />, title: 'سەرکەوتوو بوو!' },
    error: { bgColor: 'bg-red-500', icon: <XCircle size={20} />, title: 'هەڵە ڕووida!' },
    info: { bgColor: 'bg-blue-500', icon: <X size={20} />, title: 'زانیاری' },
  };

  const { bgColor, icon, title } = config[type] || config.info;

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
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const SaleEntryModal = ({ isOpen, onClose, initialData, onSave, nextInvoiceIdForNew }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData ? {
      ...initialData,
      invoiceId: initialData.invoiceId.replace('INV-', ''),
      oldDebt: parseFloat(initialData.oldDebt) || '',
      total: parseFloat(initialData.total) || 0,
    } : {
      buyerName: '',
      invoiceId: nextInvoiceIdForNew.replace('INV-', '') || '',
      date: new Date().toISOString().split('T')[0],
      items: [{ saltType: '', quantity: '', pricePerTon: '' }],
      truckDriverName: '',
      truckNumber: '',
      truckDriverPhone: '',
      receiverName: '',
      oldDebt: '',
      total: 0
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
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
    setError('');

    const requiredFields = ['buyerName', 'invoiceId', 'date', 'truckDriverName', 'truckNumber', 'truckDriverPhone'];
    if (requiredFields.some(field => !formData[field])) {
      setError('هەموو خانە پێویستەکان پڕبکەرەوە.');
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
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2">
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'دەستکاریکردنی تۆماری فرۆش' : 'زیادکردنی تۆماری فرۆشی نوێ'}
        </h2>
        <form onSubmit={validateAndSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="ناوی کڕیار" id="buyerName" name="buyerName" value={formData.buyerName} onChange={handleChange} placeholder="بۆ نموونە، گرووپی ڕەشید" required />
            <InputField label="ژمارەی وەسڵ" id="invoiceId" name="invoiceId" value={formData.invoiceId} onChange={handleChange} placeholder="بۆ نموونە، 1001" type="number" readOnly />
            <div className="col-span-full">
              <InputField label="بەروار" id="date" name="date" value={formData.date} onChange={handleChange} type="date" required />
            </div>
            <InputField label="ناوی شۆفێری بارهەڵگر" id="truckDriverName" name="truckDriverName" value={formData.truckDriverName} onChange={handleChange} placeholder="بۆ نموونە، عەلی حەسەن" required />
            <InputField label="ژمارەی بارهەڵگر" id="truckNumber" name="truckNumber" value={formData.truckNumber} onChange={handleChange} placeholder="بۆ نموونە، 12345" required />
            <InputField label="ناوی وەرگر" id="receiverName" name="receiverName" value={formData.receiverName} onChange={handleChange} placeholder="بۆ نموونە، عومەر ئەحمەد" />
            <InputField label="ژمارەی تەلەفۆنی شۆفێری بارهەڵگر" id="truckDriverPhone" name="truckDriverPhone" value={formData.truckDriverPhone} onChange={handleChange} placeholder="بۆ نموونە، 07701234567" required />
            <InputField label="قەرزی کۆن (IQD)" id="oldDebt" name="oldDebt" value={formData.oldDebt} onChange={handleChange} placeholder="بۆ نموونە، 50 (ئارەزوومەندانە)" type="number" min="0" />
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">کاڵاکانی فرۆش</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {formData.items?.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <ItemInputField label="جۆری خوێ" name="saltType" value={item.saltType} onChange={(e) => handleItemChange(index, e)} placeholder="بۆ نموونە، ورد" required />
                <ItemInputField label="بڕ (تەن)" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} placeholder="بۆ نموونە، 5" type="number" min="0" required />
                <ItemInputField label="نرخ/تەن (IQD)" name="pricePerTon" value={item.pricePerTon} onChange={(e) => handleItemChange(index, e)} placeholder="بۆ نموونە، 100" type="number" min="0" required />
                <div className="flex items-end justify-center">
                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:text-red-700 transition-colors rounded-md">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-semibold mt-4">
            + زیادکردنی کاڵایەکی تر
          </button>

          {error && <p className="text-red-500 text-sm mt-2 text-right">{error}</p>}

          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm">
              هەڵوەشاندنەوە
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
              {initialData ? 'نوێکردنەوەی فرۆش' : 'زیادکردنی فرۆش'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={id}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right ${props.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      {...props}
    />
  </div>
);

const ItemInputField = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    <input
      className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-right"
      {...props}
    />
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div dir="rtl" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm">
            هەڵوەشاندنەوە
          </button>
          <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md">
            سڕینەوە
          </button>
        </div>
      </div>
    </div>
  );
};

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
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>فاتورة - ${invoiceData.invoiceId}</title>
  <style>
    /* General Styles & Body */
    * {
      box-sizing: border-box;
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      color: #2c3e50; /* Darker text for readability */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      padding: 40px;
      width: 210mm; /* A4 width */
      height: 297mm; /* A4 height */
      background: #ffffff;
      direction: rtl;
      font-size: 14px;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      min-height: 100vh; /* Ensure body takes full viewport height for sticky footer */
    }

    .container {
      width: 100%;
      flex-grow: 1; /* Allows main content to expand */
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Pushes footer to bottom */
    }

    /* Header Section */
    .invoice-header {
      display: flex;
      justify-content: space-between; /* Distributes items with space between */
      align-items: center; /* Vertically aligns items */
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 4px solid #0056b3; /* Stronger border for impact */
    }
    .invoice-header .company-info {
      flex: 1; /* Takes available space */
      text-align: right;
      padding-left: 20px; /* Space from logo */
    }
    .invoice-header .company-info h1 {
      font-size: 32px;
      color: #0056b3; /* Primary blue */
      margin-bottom: 8px;
      font-weight: 800; /* Extra bold for impact */
    }
    .invoice-header .company-info h2 {
      font-size: 24px;
      color: #0056b3;
      margin-top: 15px;
      font-weight: 700;
    }
    .invoice-header .company-info p {
      font-size: 13px;
      color: #555;
      line-height: 1.4;
      margin-top: 5px;
    }
    .invoice-header .logo-container {
      text-align: left;
      flex-shrink: 0; /* Prevent shrinking */
      margin-right: 20px; /* Adjusted margin for RTL layout */
      display: flex; /* Make logo-container a flex container */
      flex-direction: column; /* Stack image and contact info vertically */
      align-items: flex-start; /* Align contents to the start (left in RTL) */
    }
    .invoice-header .logo-container img {
      width: 140px;
      height: 140px;
      object-fit: contain;
      border: 4px solid #0056b3; /* Bold border */
      padding: 10px;
      border-radius: 50%; /* Circular logo */
      background: #ecf0f1; /* Light grey background */
      box-shadow: 0 5px 15px rgba(0,0,0,0.1); /* Subtle shadow */
      margin-bottom: 10px; /* Space between logo and numbers */
    }
    .contact-info {
      display: flex; /* Make it a flex container */
      flex-direction: column; /* Stack items vertically */
      align-items: flex-start; /* Align items to the start (left in RTL) */
      gap: 5px; /* Reduce gap between numbers for tighter look */
      font-size: 14px;
      font-weight: bold;
      color: #0056b3;
    }

    /* Invoice Details Section (Card) */
    .invoice-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #eaf2f8; /* Light blue background */
      border-right: 4px solid #0056b3; /* Slightly thinner accent border */
      padding: 15px 25px; /* Reduced padding */
      margin-bottom: 25px; /* Reduced margin */
      border-radius: 8px; /* Slightly rounded corners */
      box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Softer shadow */
    }
    .invoice-details h3 {
      font-size: 18px; /* Slightly smaller font */
      color: #0056b3;
      font-weight: 700;
    }
    .invoice-details .info-group p {
      font-weight: bold;
      font-size: 14px; /* Slightly smaller font */
      color: #333;
    }
    .invoice-details .info-group strong {
      color: #0056b3;
      font-weight: 800;
    }

    /* Table Styles */
    table {
      width: 100%;
      border-collapse: collapse; /* Collapses borders as requested */
      margin-bottom: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05); /* Soft shadow for table */
    }
    th, td {
      border: 1px solid #cce0f0; /* Lighter border for clean look */
      padding: 15px; /* Standard padding for table data */
      text-align: center;
    }
    thead th {
      background-color: #0056b3; /* Primary blue for header */
      color: #fff;
      font-weight: bold;
      text-align: center;
      padding: 0; /* No padding for th, as requested */
      line-height: 2.8; /* Vertically centers text in collapsed header */
      text-transform: uppercase;
      font-size: 15px;
      letter-spacing: 0.5px;
    }
    tbody tr:nth-child(even) {
      background-color: #f8fbfd; /* Very light alternative row color */
    }
    tbody td {
      font-weight: 500;
      color: #34495e;
    }

    /* Totals Box */
    .totals-box {
      width: 45%; /* Wider box for totals */
      margin-right: 0;
      margin-left: auto; /* Aligns to the left in RTL */
      border: 3px solid #0056b3; /* Bold border */
      border-radius: 12px; /* More rounded corners */
      overflow: hidden;
      margin-bottom: 40px;
      background: #ffffff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .totals-box p {
      display: flex;
      justify-content: space-between;
      padding: 15px 25px;
      font-weight: bold;
      border-bottom: 1px solid #e0e6eb; /* Lighter separator */
      color: #34495e;
    }
    .totals-box p:last-child {
      border-bottom: none;
      background: #0056b3; /* Striking final total background */
      color: #fff;
      font-size: 18px;
      font-weight: 900; /* Extra bold for total */
    }
    .totals-box p strong {
      color: inherit; /* Inherit color from parent */
    }

    /* Driver Details (Card) */
    .driver-details {
      background: #eaf2f8; /* Matches invoice details background */
      border-right: 4px solid #0056b3; /* Slightly thinner accent border */
      padding: 15px 25px; /* Reduced padding */
      margin-bottom: 50px; /* Reduced margin */
      font-size: 14px; /* Slightly smaller font */
      line-height: 1.8; /* Adjusted line height */
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* Softer shadow */
    }
    .driver-details strong {
      color: #0056b3;
      font-weight: 700;
    }

    /* Signatures Section */
    .signatures {
      display: flex;
      justify-content: space-around;
      text-align: center;
      padding-top: 25px;
      border-top: 2px dashed #aab7c0; /* Dashed line for subtle separation */
      margin-top: auto; /* Pushes signatures to the bottom of the container */
    }
    .signatures .sig-box {
      width: 30%; /* Slightly wider signature boxes */
      padding-top: 15px;
    }
    .signatures .sig-box p {
      font-weight: bold;
      color: #0056b3;
      border-top: 1px solid #0056b3; /* Line above name */
      padding-top: 8px;
      font-size: 14px;
    }

    /* Print adjustments */
    @media print {
      body {
        margin: 0;
        box-shadow: none;
        width: auto;
        height: auto;
      }
      .signatures {
        position: relative;
        bottom: auto;
        left: auto;
        right: auto;
        margin-top: 40px;
        page-break-inside: avoid; /* Avoid breaking signatures across pages */
      }
      .container {
        display: block; /* Remove flexbox behavior for print layout */
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="main-content">
      <div class="invoice-header">
        <div class="logo-container">
          <img src="${window.location.origin}${logo}" alt="Company Logo" />
          <div class="contact-info">
            <span>٠٧٥٠ ٢٤٦ ٦٧٣٩</span>
            <span>٠٧٧٠ ١٤٧ ١٨٣٨</span>
            <span>٠٧٧٦ ٦٩١ ١١٩٨</span>
          </div>
        </div>
        <div class="company-info">
          <h1>معمل ملح سردم</h1>
          <p>الأنتاج افضل نوعیه‌</p>
          <p>الأعنوان / السلیمانیة / ناحیة التكیة / المنطقه‌ الصناعیة</p>
          <br>
          <h2>كارگەی خوێی سەردەم</h2>
          <p>بۆ به‌رهه‌مهێنانی باشترین جۆری خوێی خۆراكی و پیشه‌سازی</p>
          <p>ناونیشان / سلێمانی / ناجییه‌ی ته‌كیه‌ / ناوچه‌ی پیشه‌سازی</p>
        </div>
      </div>
  
      <div class="invoice-details">
        <div class="info-group">
          <p><strong>:ناوی کڕیار</strong> ${invoiceData.buyerName}</p>
        </div>
        <div class="info-group">
          <p><strong>به‌روار :</strong> ${invoiceData.date}</p>
          <p><strong>ژماره‌ی پسووله‌ :</strong> ${invoiceData.invoiceId}</p>
        </div>
      </div>
  
      <table>
        <thead>
          <tr>
            <th>ز</th>
            <th>جۆری خوێ</th>
            <th>بڕ (تۆن)</th>
            <th>نرخی ته‌ن</th>
            <th>كۆی گشتی</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
  
      <div class="totals-box">
        <p><span>كۆی گشتی پسووله‌:</span> <strong>${formatNumberForDisplay(totalItemsPrice)} IQD</strong></p>
        ${invoiceData.oldDebt > 0 ? `<p><span>قه‌رزی گۆن :</span> <strong>${formatNumberForDisplay(oldDebtValue)} IQD</strong></p>` : ''}
        <p><span>كۆی گشتی:</span> <strong>${formatNumberForDisplay(totalDue)} IQD</strong></p>
      </div>
  
      <div class="driver-details">
        <p><strong>ناوی شۆفێر:</strong> ${invoiceData.truckDriverName}</p>
        <p><strong>ژماره‌ی شۆفێر:</strong> ${invoiceData.truckDriverPhone}</p>
        <p><strong>ژماره‌ی بارهه‌ڵگر :</strong> ${invoiceData.truckNumber}</p>
      </div>
    </div>
    
    <div class="signatures">
      <div class="sig-box">
        <p>به‌رێوبه‌ر / ناوی به‌ڕێوبه‌ر</p>
      </div>
      <div class="sig-box">
        <p>ب.كارگێڕی / سامان ممند شریف</p>
      </div>
      <div class="sig-box">
        <p>وه‌رگر / ${invoiceData.receiverName || 'نیه‌'}</p>
      </div>
    </div>
  </div>
</body>
</html>

  `;
};

const Sold = () => {
  const [soldData, setsoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [nextInvoiceId, setNextInvoiceId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const fetchsoldData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/sold`);
      if (!response.ok) {
        throw new Error('Failed to fetch sold data');
      }
      const data = await response.json();
      setsoldData(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setToast({ message: 'هەڵە لە وەرگرتنی زانیاری فرۆش.', type: 'error' });
    }
  }, []);

  const fetchNextInvoiceId = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/next-invoice-id`);
      if (!response.ok) {
        throw new Error('Failed to fetch next invoice ID');
      }
      const data = await response.json();
      setNextInvoiceId(data.nextInvoiceId);
    } catch (err) {
      console.error(err);
      setToast({ message: 'هەڵە لە وەرگرتنی ژمارەی وەسڵی داهاتوو.', type: 'error' });
    }
  }, []);

  useEffect(() => {
    fetchsoldData();
    fetchNextInvoiceId();

    const socket = io(SOCKET_URL);
    // Listen for the generic 'sold-updated' event from the backend
    socket.on('sold-updated', () => {
      fetchsoldData();
      fetchNextInvoiceId();
      setToast({ message: 'زانیاری فرۆش نوێکرایەوە.', type: 'info' });
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchsoldData, fetchNextInvoiceId]);

  const handleSaveEntry = async (entry) => {
    try {
      const method = entry.id ? 'PUT' : 'POST';
      const url = entry.id ? `${API_BASE_URL}/sold/${entry.id}` : `${API_BASE_URL}/sold`;
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save entry');
      }
      setToast({ message: 'تۆماری فرۆش بە سەرکەوتوویی تۆمارکرا.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'هەڵەیەک لە کاتی تۆمارکردنی تۆماری فرۆش ڕوویدا.', type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sold/${deletingEntryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete entry');
      }
      setToast({ message: 'تۆماری فرۆش بە سەرکەوتوویی سڕایەوە.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'هەڵەیەک لە کاتی سڕینەوەی تۆماری فرۆش ڕوویدا.', type: 'error' });
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntryId(null);
    }
  };

  const handleInvoiceAction = (entryId, type) => {
    const entry = soldData.find(e => e.id === entryId);
    if (!entry) {
      setToast({ message: 'تۆمارەکە نەدۆزرایەوە.', type: 'error' });
      return;
    }
    const invoiceHtml = generateInvoiceHtml(entry);
    
    // Check if running in an Electron environment
    if (window.electronAPI) {
      if (type === 'print') {
        window.electronAPI.printInvoice(invoiceHtml);
      }
      return;
    }

    // Fallback for web environment: Use an invisible iframe for printing
    if (type === 'print') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none'; // Make the iframe invisible
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(invoiceHtml);
      iframe.contentWindow.document.close();
      
      // Wait for the iframe's content to load before printing
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Remove the iframe after a short delay to allow printing to initiate
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 500); 
      };

    } else if (type === 'download') {
      const blob = new Blob([invoiceHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${entry.invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openNewEntryModal = () => {
    setEditingEntry(null);
    setShowEditModal(true);
  };

  if (loading) return <div className="text-center py-10 text-gray-500 text-lg">بارکردن...</div>;
  if (error) return <div className="text-center py-10 text-red-500 text-lg">هەڵە: {error}</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 dir="rtl" className="text-4xl font-extrabold text-blue-900 mb-6 text-center md:text-right">
          تۆمارەکانی فرۆش
        </h1>
        <div dir="rtl" className="flex justify-end mb-6">
          <button
            onClick={openNewEntryModal}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
          >
            <PlusCircle size={20} />
            زیادکردنی تۆماری نوێ
          </button>
        </div>

        {soldData.length > 0 ? (
          soldData.map(entry => (
            <div key={entry.id} className="bg-white shadow-xl border border-blue-100 rounded-xl p-4 mb-4 hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-sm">
              <div dir="rtl" className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer pb-2 border-b border-blue-100" onClick={() => toggleExpanded(entry.id)}>
                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-blue-800 mb-1 flex items-center gap-1">
                    {entry.buyerName}
                  </h2>
                  <p className="text-xs text-gray-600">
                    وەسڵ: <span className="font-semibold text-gray-800">{entry.invoiceId}</span> • بەروار: <span className="font-semibold text-gray-800">{entry.date}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    شۆفێر: <span className="font-medium">{entry.truckDriverName}</span> (#<span className="font-medium">{entry.truckNumber}</span>, <span className="font-medium">{entry.truckDriverPhone}</span>)
                  </p>
                  {entry.receiverName && (
                    <p className="text-xs text-gray-500">
                      وەرگر: <span className="font-medium">{entry.receiverName}</span>
                    </p>
                  )}
                  {entry.oldDebt > 0 && (
                    <p className="text-xs text-red-500 font-semibold">
                      قەرزی کۆن: {formatNumberForDisplay(entry.oldDebt)} IQD
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2 sm:mt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setShowEditModal(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors text-xs font-semibold"
                  >
                    <Edit size={12} /> دەستکاری
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingEntryId(entry.id); setShowDeleteConfirmModal(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-xs font-semibold"
                  >
                    <Trash2 size={12} /> سڕینەوە
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInvoiceAction(entry.id, 'print'); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors text-xs font-semibold"
                  >
                    <Printer size={12} /> چاپ
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInvoiceAction(entry.id, 'download'); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors text-xs font-semibold"
                  >
                    <FileDown size={12} /> داگرتن
                  </button>
                  {expanded[entry.id] ? (
                    <ChevronUp size={14} className="text-gray-700" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-700" />
                  )}
                </div>
              </div>
              {expanded[entry.id] && (
                <div dir="rtl" className="mt-2 text-xs">
                  <table className="w-full text-right table-auto border-collapse mt-2">
                    <thead>
                      <tr className="bg-blue-100 text-blue-800">
                        <th className="p-2 border border-blue-200">ID</th>
                        <th className="p-2 border border-blue-200">جۆری خوێ</th>
                        <th className="p-2 border border-blue-200">بڕ (تەن)</th>
                        <th className="p-2 border border-blue-200">نرخ/تەن</th>
                        <th className="p-2 border border-blue-200">کۆی گشتی (IQD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.items.map((item, index) => (
                        <tr key={index} className="odd:bg-white even:bg-blue-50">
                          <td className="p-2 border border-blue-200">{index + 1}</td>
                          <td className="p-2 border border-blue-200">{item.saltType}</td>
                          <td className="p-2 border border-blue-200">{formatNumberForDisplay(item.quantity)}</td>
                          <td className="p-2 border border-blue-200">{formatNumberForDisplay(item.pricePerTon)} IQD</td>
                          <td className="p-2 border border-blue-200">{formatNumberForDisplay((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0))} IQD</td>
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
          <div dir="rtl" className="text-center py-6 text-gray-500 text-sm bg-white rounded-xl shadow-lg border border-gray-200">
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
        message={`دڵنیایت دەتەوێت تۆماری فرۆش بۆ ${soldData.find(e => e.id === deletingEntryId)?.buyerName || 'ئەم تۆمارە'} بسڕیتەوە؟ ئەم کردارە ناتوانرێت هەڵوەشێنرێتەوە.`}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <style jsx>{`
        .action-button-enhanced {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease-in-out;
          font-weight: 500;
          font-size: 0.75rem; /* 12px */
          line-height: 1rem; /* 16px */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .action-button-enhanced:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        }
        .invoice-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .invoice-card {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Sold;
