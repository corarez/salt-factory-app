import React, { useState, useEffect, useCallback } from 'react';
import { Printer, FileDown, ChevronDown, ChevronUp, Edit, Trash2, X, PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import logo from "./../../../../resources/logo.png"


const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parsedNum);
};

const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  const config = {
    success: { bgColor: 'bg-green-500', icon: <CheckCircle size={20} />, title: 'سەرکەوتوو بوو!' },
    error: { bgColor: 'bg-red-500', icon: <XCircle size={20} />, title: 'هەڵە ڕوویدا!' },
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
        <p className="text-base">{message}</p>
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
    const finalTotal = totalItemsPrice - oldDebtValue;
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

          {error && <p className="text-red-500 text-base mt-2 text-right">{error}</p>}

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
    <label htmlFor={id} className="block text-base font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={id}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors text-right ${props.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      {...props}
    />
  </div>
);

const ItemInputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <input
      className="w-full px-3 py-1 border border-gray-300 rounded-md text-base focus:ring-blue-500 focus:border-blue-500 text-right"
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
        <p className="text-gray-700 mb-6 text-base">{message}</p>
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
  const totalDue = totalItemsPrice - oldDebtValue;
  return `
   <!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة - ${invoiceData.invoiceId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Removed @font-face rule for local font file as it may not be accessible in this environment. */
        /* Relying on Google Fonts for Ubuntu via the <link> tag. */

        * {
            box-sizing: border-box;
            font-family: 'Ubuntu', 'Arial', sans-serif; /* Prioritize Ubuntu from Google Fonts, with Arial as fallback */
            margin: 0;
            padding: 0;
            color: #2c3e50;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            position: relative;
            padding: 10px;
            width: 210mm; /* Explicit A4 width */
            height: 100vh; /* Set height to 100vh for display */
            background: #ffffff;
            direction: rtl;
            font-size: 16px;
            line-height: 1.6;
            display: flex;
            flex-direction: column;
        }
        .container {
            width: 100%;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 3px solid #007bff;
        }
        .header-section {
            flex: 1;
        }
        .header-section.company-info-arabic {
            text-align: right;
            padding-right: 5px;
        }
        .header-section.company-info-kurdish {
            text-align: left;
            padding-left: 5px;
        }
        .header-section.logo-center {
            text-align: center;
            flex-shrink: 0;
            padding: 0 10px;
        }
        .invoice-header h1 {
            font-size: 28px;
            color: #007bff;
            margin-bottom: 5px;
            font-weight: 800;
        }
        .invoice-header h2 {
            font-size: 20px;
            color: #007bff;
            margin-top: 10px;
            font-weight: 700;
        }
        .invoice-header p {
            font-size: 14px;
            color: #555;
            line-height: 1.4;
            margin-top: 3px;
        }
        .header-section.logo-center img {
            width: 130px;
            height: 130px;
            object-fit: contain;
            border: 3px solid #007bff;
            padding: 5px;
            border-radius: 50%;
            background: rgba(0, 123, 255, 0.15);
            box-shadow: 0 4px 10px rgba(0,0,0,.1);
        }

        .contact-numbers-flex {
            display: flex;
            justify-content: space-around;
            margin-bottom: 10px;
            font-size: 15px;
            font-weight: 700;
            color: #007bff;
            padding: 5px 0;
            border-bottom: 1px dashed #ccc;
        }
        .contact-numbers-flex span {
            padding: 0 5px;
            direction: ltr; /* Force left-to-right direction for numbers */
            unicode-bidi: isolate; /* Isolate this element from parent's direction */
        }

        .invoice-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #e9f5ff;
            border-right: 4px solid #007bff;
            padding: 10px 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,.05);
        }
        .invoice-details .info-group p {
            font-weight: 700;
            font-size: 16px;
            color: #333;
        }
        .invoice-details .info-group strong {
            color: #007bff;
            font-weight: 800;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,.05);
            border-radius: 8px;
            overflow: hidden;
        }
        th, td {
            padding: 8px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        thead th {
            background-color: #007bff;
            color: #fff;
            font-weight: 700;
            text-align: center;
            line-height: 1.8;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: .5px;
        }
        tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tbody td {
            font-weight: 500;
            color: #34495e;
        }

        .totals-box {
            width: 40%;
            margin-right: 0;
            margin-left: auto;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 20px;
            background: #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        .totals-box p {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            font-weight: 700;
            border-bottom: 1px solid #e9ecef;
            color: #555;
            font-size: 16px;
        }
        .totals-box p:last-child {
            border-bottom: none;
            background: #007bff;
            color: #fff;
            font-size: 18px;
            font-weight: 900;
        }
        .totals-box p strong {
            color: inherit;
        }

        .driver-details {
            background: #e9f5ff;
            border-right: 4px solid #007bff;
            padding: 10px 15px;
            margin-bottom: 20px;
            font-size: 16px;
            line-height: 1.8;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,.05);
        }
        .driver-details strong {
            color: #007bff;
            font-weight: 700;
        }

        .signatures {
            display: flex;
            justify-content: space-around;
            text-align: center;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            margin-top: auto;
        }
        .signatures .sig-box {
            width: 30%;
            padding-top: 15px;
        }
        .signatures .sig-box p {
            font-weight: 700;
            color: #555;
            border-top: 1px solid #555;
            padding-top: 8px;
            font-size: 16px;
        }

        @media print {
            html, body {
                height: 100%; /* Ensure A4 height for printing */
                width: 100%; /* Ensure A4 width for printing */
                overflow: hidden;
            }
            body {
                margin: 0;
                box-shadow: none;
                padding: 10px;
            }
            .signatures {
                position: relative;
                margin-top: 20px;
                page-break-before: auto;
                page-break-inside: avoid;
            }
            .container {
                display: flex;
                height: 100%;
            }
            .main-content {
                flex-grow: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-content">
            <div class="invoice-header">
             <div class="header-section company-info-kurdish">
                    <h2>كارگەی خوێی سەردەم</h2>
                    <p>بۆ به‌رهه‌مهێنانی باشترین جۆری خوێی خۆراكی و پیشه‌سازی</p>
                    <p>ناونیشان / سلێمانی / ناجییه‌ی ته‌كیه‌ / ناوچه‌ی پیشه‌سازی</p>
                </div>
                  <div class="header-section logo-center">
                    <img src="${window.location.origin}${logo}" alt="Company Logo" />
                </div>
                <div class="header-section company-info-arabic">
                    <h1>معمل ملح سردم</h1>
                    <p>للأنتاج افضل نوعیة الملح لغذاء ولصناعة</p>
                    <p>الأعنوان / السلیمانیة / ناحیة التكیة / المنطقه‌ الصناعیة</p>
                </div>
              
               
            </div>
            <div class="contact-numbers-flex">
                <span>0770 157 7927</span>
                <span>0750 157 7927</span>
                <span>0770 147 1838</span>
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
                <p>به‌رێوبه‌ر / صفاءالدین صالح حمه‌</p>
            </div>
            <div class="sig-box">
                <p>ب.كارگێڕی / سامان ممند شریف</p>
            </div>
            <div class="sig-box">
                <p>وه‌رگر / ${invoiceData.receiverName || 'نيە'}</p>
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
            <div key={entry.id} className="bg-white shadow-xl border border-blue-100 rounded-xl p-4 mb-4 hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 text-base">
              <div dir="rtl" className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer pb-2 border-b border-blue-100" onClick={() => toggleExpanded(entry.id)}>
                <div className="flex-grow">
                  <h2 className="text-lg font-bold text-blue-800 mb-1 flex items-center gap-1">
                    {entry.buyerName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    وەسڵ: <span className="font-semibold text-gray-800">{entry.invoiceId}</span> • بەروار: <span className="font-semibold text-gray-800">{entry.date}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    شۆفێر: <span className="font-medium">{entry.truckDriverName}</span> (#<span className="font-medium">{entry.truckNumber}</span>, <span className="font-medium">{entry.truckDriverPhone}</span>)
                  </p>
                  {entry.receiverName && (
                    <p className="text-sm text-gray-500">
                      وەرگر: <span className="font-medium">{entry.receiverName}</span>
                    </p>
                  )}
                  {entry.oldDebt > 0 && (
                    <p className="text-sm text-red-500 font-semibold">
                      قەرزی کۆن: {formatNumberForDisplay(entry.oldDebt)} IQD
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-2 sm:mt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setShowEditModal(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors text-sm font-semibold"
                  >
                    <Edit size={12} /> دەستکاری
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingEntryId(entry.id); setShowDeleteConfirmModal(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-sm font-semibold"
                  >
                    <Trash2 size={12} /> سڕینەوە
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInvoiceAction(entry.id, 'print'); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors text-sm font-semibold"
                  >
                    <Printer size={12} /> چاپ
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInvoiceAction(entry.id, 'download'); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors text-sm font-semibold"
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
            {entry?.id && expanded[entry.id] && (
  <div dir="rtl" className="mt-2 text-sm">
    {Array.isArray(entry?.items) && entry.items.length > 0 ? (
      <>
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
            {(entry?.items ?? []).map((item, index) => {
              const qty = parseFloat(item?.quantity) || 0
              const ppt = parseFloat(item?.pricePerTon) || 0
              return (
                <tr key={index} className="odd:bg-white even:bg-blue-50">
                  <td className="p-2 border border-blue-200">{index + 1}</td>
                  <td className="p-2 border border-blue-200">{item?.saltType ?? '-'}</td>
                  <td className="p-2 border border-blue-200">{formatNumberForDisplay(qty)}</td>
                  <td className="p-2 border border-blue-200">{formatNumberForDisplay(ppt)} IQD</td>
                  <td className="p-2 border border-blue-200">{formatNumberForDisplay(qty * ppt)} IQD</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(() => {
          const items = entry?.items ?? []
          const calcTotal = items.reduce((sum, it) => {
            const q = parseFloat(it?.quantity) || 0
            const p = parseFloat(it?.pricePerTon) || 0
            return sum + q * p
          }, 0)
          const total = typeof entry?.total === 'number' ? entry.total : calcTotal
          return (
            <div className="text-right mt-2 text-base font-extrabold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 shadow-md">
              کۆی گشتی فرۆش: <span className="text-green-800">{formatNumberForDisplay(total)} IQD</span>
            </div>
          )
        })()}
      </>
    ) : (
      <div className="mt-2 p-3 rounded-md border border-blue-200 bg-blue-50 text-blue-800">
        هیچ دانەیەک بۆ ئەم کڕیارە نییە.
      </div>
    )}
  </div>
)}

            </div>
          ))
        ) : (
          <div dir="rtl" className="text-center py-6 text-gray-500 text-base bg-white rounded-xl shadow-lg border border-gray-200">
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