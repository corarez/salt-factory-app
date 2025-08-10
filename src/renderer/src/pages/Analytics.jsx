import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Factory, Truck, Package,
  Calendar, Download, Printer, X, BarChart2, Filter, CheckCircle, XCircle
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = window.electronAPI
  ? `http://${window.electronAPI.SERVER_HOST}:${window.electronAPI.SERVER_PORT}/api`
  : 'http://192.168.100.210:5000/api';
const SOCKET_URL = window.electronAPI
  ? `http://${window.electronAPI.SERVER_HOST}:${window.electronAPI.SERVER_PORT}`
  : 'http://192.168.100.210:5000';

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

const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: parsedNum % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(parsedNum);
};

const Analytics = () => {
  const [allArrivedData, setAllArrivedData] = useState([]);
  const [allProducedData, setAllProducedData] = useState([]);
  const [allSoldData, setAllSoldData] = useState([]);
  const [allTransactionsData, setAllTransactionsData] = useState([]);

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
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
    const today = new Date();
    setFilterYear(today.getFullYear().toString());
    setFilterMonth((today.getMonth() + 1).toString().padStart(2, '0'));
    setFilterDay(today.getDate().toString().padStart(2, '0'));
  }, []);

  useEffect(() => {
    const fetchData = async (url, setData, errorMessage) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error(errorMessage, error);
        showToast(`${errorMessage}: ${error.message}`, 'error');
      }
    };

    fetchData(`${API_BASE_URL}/arrived`, setAllArrivedData, "هەڵە لە وەرگرتنی داتای گەیشتوو");
    fetchData(`${API_BASE_URL}/produced`, setAllProducedData, "هەڵە لە وەرگرتنی داتای بەرهەمهاتوو");
    fetchData(`${API_BASE_URL}/sold`, setAllSoldData, "هەڵە لە وەرگرتنی داتای فرۆشراو");
    fetchData(`${API_BASE_URL}/transactions`, setAllTransactionsData, "هەڵە لە وەرگرتنی داتاي مامەڵەکان");
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('arrived:added', (newEntry) => setAllArrivedData(prev => [...prev, newEntry]));
    socket.on('arrived:updated', (updatedEntry) => setAllArrivedData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('arrived:deleted', (deletedId) => setAllArrivedData(prev => prev.filter(item => item.id !== deletedId)));

    socket.on('produced:added', (newEntry) => setAllProducedData(prev => [...prev, newEntry]));
    socket.on('produced:updated', (updatedEntry) => setAllProducedData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('produced:deleted', (deletedId) => setAllProducedData(prev => prev.filter(item => item.id !== deletedId)));

    socket.on('sold:added', (newEntry) => setAllSoldData(prev => [...prev, newEntry]));
    socket.on('sold:updated', (updatedEntry) => setAllSoldData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('sold:deleted', (deletedId) => setAllSoldData(prev => prev.filter(item => item.id !== deletedId)));

    socket.on('transactions:added', (newEntry) => setAllTransactionsData(prev => [...prev, newEntry]));
    socket.on('transactions:updated', (updatedEntry) => setAllTransactionsData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('transactions:deleted', (deletedId) => setAllTransactionsData(prev => prev.filter(item => item.id !== deletedId)));

    return () => {
      socket.disconnect();
    };
  }, []);

  const applyDateFilter = (data, dateField) => {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const yearMatch = !filterYear || itemDate.getFullYear().toString() === filterYear;
      const monthMatch = !filterMonth || (itemDate.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
      const dayMatch = !filterDay || itemDate.getDate().toString().padStart(2, '0') === filterDay;
      return yearMatch && monthMatch && dayMatch;
    });
  };

  const filteredArrivedData = applyDateFilter(allArrivedData, 'arrivedDate');
  const filteredProducedData = applyDateFilter(allProducedData, 'date');
  const filteredSoldData = applyDateFilter(allSoldData, 'date');
  const filteredTransactionsData = applyDateFilter(allTransactionsData, 'date');

  const totalArrivedQuantity = filteredArrivedData.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
  const totalArrivedValue = filteredArrivedData.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);

  const totalProducedQuantity = filteredProducedData.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

  const totalSoldQuantity = filteredSoldData.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => itemSum + parseFloat(item.quantity || 0), 0), 0
  );
  const totalSoldValue = filteredSoldData.reduce((sum, sale) =>
    sum + sale.items.reduce((itemSum, item) => itemSum + (parseFloat(item.quantity || 0) * parseFloat(item.pricePerTon || 0)), 0), 0
  );

  const totalExpenses = filteredTransactionsData.filter(t => t.type === 'spend').reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalIncome = filteredTransactionsData.filter(t => t.type === 'earning').reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const generateTableHtml = (data, type) => {
    const generateDate = new Date().toLocaleString('ku-IQ', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    let headers = '';
    let rows = '';
    let title = '';
    let summaryHtml = '';

    if (type === 'arrived') {
      title = 'تۆمارەکانی خوێی گەیشتوو';
      headers = `
        <tr>
          <th>ID</th>
          <th>بڕ (تەن)</th>
          <th>بەرواری گەیشتن</th>
          <th>نرخ/تەن (IQD)</th>
          <th>شوێن</th>
          <th>شۆفێر</th>
          <th>ژمارەی وەسڵ</th>
          <th>بەرواری وەسڵ</th>
          <th>نێرەر</th>
          <th>کرێ/تەن (IQD)</th>
          <th>کۆی گشتی کرێ (IQD)</th>
          <th>کۆی گشتی نرخی تەن (IQD)</th>
          <th>کۆی گشتی نرخ (IQD)</th>
          <th>دۆخ</th>
          <th>زیادکراوە لەلایەن</th>
        </tr>
      `;
      rows = data.map(item => `
        <tr>
          <td>${item.id}</td>
          <td>${formatNumberForDisplay(item.quantity)}</td>
          <td>${item.arrivedDate}</td>
          <td>${formatNumberForDisplay(item.pricePerTon)}</td>
          <td>${item.placeArrived}</td>
          <td>${item.truckDriver}</td>
          <td>${item.invoiceId}</td>
          <td>${item.invoiceDate}</td>
          <td>${item.senderName}</td>
          <td>${formatNumberForDisplay(item.feePerTon)}</td>
          <td>${formatNumberForDisplay(item.totalFee)}</td>
          <td>${formatNumberForDisplay(item.totalTonPrice)}</td>
          <td>${formatNumberForDisplay(item.totalPrice)}</td>
          <td>${item.status}</td>
          <td>${item.addedBy}</td>
        </tr>
      `).join('');
      summaryHtml = `
        <div class="summary">
          <p><strong>کۆی گشتی بڕی گەیشتوو:</strong> ${formatNumberForDisplay(totalArrivedQuantity)} تەن</p>
          <p><strong>کۆی گشتی نرخی گەیشتوو:</strong> ${formatNumberForDisplay(totalArrivedValue)} IQD</p>
        </div>
      `;
    } else if (type === 'produced') {
      title = 'تۆمارەکانی خوێی بەرهەمهاتوو';
      headers = `
        <tr>
          <th>ID</th>
          <th>جۆری خوێ</th>
          <th>بڕ (تەن)</th>
          <th>بەروار</th>
          <th>تێبینی</th>
          <th>زیادکراوە لەلایەن</th>
        </tr>
      `;
      rows = data.map(item => `
        <tr>
          <td>${item.id}</td>
          <td>${item.saltType}</td>
          <td>${formatNumberForDisplay(item.quantity)}</td>
          <td>${item.date}</td>
          <td>${item.note || 'نییە'}</td>
          <td>${item.addedBy || 'نادیار'}</td>
        </tr>
      `).join('');
      summaryHtml = `
        <div class="summary">
          <p><strong>کۆی گشتی خوێی بەرهەمهاتوو:</strong> ${formatNumberForDisplay(totalProducedQuantity)} تەن</p>
        </div>
      `;
    } else if (type === 'sold') {
      title = 'تۆمارەکانی خوێی فرۆشراو';
      headers = `
        <tr>
          <th>ID</th>
          <th>ناوی کڕیار</th>
          <th>ژمارەی وەسڵ</th>
          <th>بەروار</th>
          <th>کۆی گشتی (IQD)</th>
          <th>ناوی شۆفێر</th>
          <th>ژمارەی بارهەڵگر</th>
          <th>ژمارەی تەلەفۆنی شۆفێر</th>
          <th>ناوی وەرگر</th>
          <th>قەرزی کۆن (IQD)</th>
          <th>کاڵاکان</th>
        </tr>
      `;
      rows = data.map(sale => `
        <tr>
          <td>${sale.id}</td>
          <td>${sale.buyerName}</td>
          <td>${sale.invoiceId}</td>
          <td>${sale.date}</td>
          <td>${formatNumberForDisplay(sale.total)}</td>
          <td>${sale.truckDriverName}</td>
          <td>${sale.truckNumber}</td>
          <td>${sale.truckDriverPhone}</td>
          <td>${sale.receiverName || 'نییە'}</td>
          <td>${formatNumberForDisplay(sale.oldDebt)}</td>
          <td>
            <table class="nested-items-table">
              <thead>
                <tr>
                  <th>جۆری خوێ</th>
                  <th>بڕ (تەن)</th>
                  <th>نرخ/تەن (IQD)</th>
                  <th>کۆی گشتی (IQD)</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items.map(item => `
                  <tr>
                    <td>${item.saltType}</td>
                    <td>${formatNumberForDisplay(item.quantity)}</td>
                    <td>${formatNumberForDisplay(item.pricePerTon)}</td>
                    <td>${formatNumberForDisplay((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>
        </tr>
      `).join('');
      summaryHtml = `
        <div class="summary">
          <p><strong>کۆی گشتی خوێی فرۆشراو:</strong> ${formatNumberForDisplay(totalSoldQuantity)} تەن</p>
          <p><strong>کۆی گشتی نرخی فرۆشراو:</strong> ${formatNumberForDisplay(totalSoldValue)} IQD</p>
        </div>
      `;
    } else if (type === 'transactions') {
      title = 'تۆمارەکانی خەرجی و داهات';
      headers = `
        <tr>
          <th>ID</th>
          <th>ناونیشان</th>
          <th>نرخ (IQD)</th>
          <th>بەروار</th>
          <th>جۆر</th>
          <th>وەسف</th>
          <th>زیادکراوە لەلایەن</th>
        </tr>
      `;
      rows = data.map(item => `
        <tr>
          <td>${item.id}</td>
          <td>${item.title}</td>
          <td style="color: ${item.type === 'spend' ? '#dc2626' : '#16a34a'}; font-weight: bold;">${formatNumberForDisplay(item.price)} IQD</td>
          <td>${item.date}</td>
          <td>${item.type === 'spend' ? 'خەرجی' : 'داهات'}</td>
          <td>${item.note || 'نییە'}</td>
          <td>${item.addedBy || 'نادیار'}</td>
        </tr>
      `).join('');
      summaryHtml = `
        <div class="summary">
          <p><strong>کۆی گشتی خەرجییەکان:</strong> <span style="color: #dc2626; font-weight: bold;">${formatNumberForDisplay(totalExpenses)} IQD</span></p>
          <p><strong>کۆی گشتی داهات:</strong> <span style="color: #16a34a; font-weight: bold;">${formatNumberForDisplay(totalIncome)} IQD</span></p>
          <p><strong>باڵانسی پوخت:</strong> <span style="color: ${netBalance >= 0 ? '#0056b3' : '#dc2626'}; font-weight: bold;">${formatNumberForDisplay(netBalance)} IQD</span></p>
        </div>
      `;
    }

    const filterText = (filterYear || filterMonth || filterDay) ?
      `فلتەر: ساڵ: ${filterYear || 'هەموو'}، مانگ: ${filterMonth || 'هەموو'}، ڕۆژ: ${filterDay || 'هەموو'}` :
      'فلتەر: هەموو بەروارەکان';

    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
          <style>
              @page {
                  size: A4 portrait;
                  margin: 15mm;
              }
              body {
                  font-family: 'Noto Sans Arabic', sans-serif; /* Changed font to Noto Sans Arabic for better Kurdish support */
                  margin: 0;
                  padding: 0;
                  color: #2c3e50; /* Darker text for better contrast */
                  line-height: 1.8; /* Increased line height for readability */
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
              }
              .container {
                  width: 100%;
                  margin: 0 auto;
                  padding: 0;
              }
              .report-title {
                  text-align: center;
                  margin-bottom: 30px;
                  font-size: 28pt; /* Larger title */
                  color: #1a5276; /* Deeper blue for title */
                  font-weight: 700;
                  border-bottom: 3px solid #1a5276; /* Thicker border */
                  padding-bottom: 20px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
              }
              .report-details {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 25px;
                  font-size: 11pt;
                  padding: 10px 0;
                  border-bottom: 1px dashed #ccc; /* Dashed border */
                  color: #555;
              }
              .report-details div {
                  flex: 1;
                  text-align: right;
                  padding-right: 10px;
              }
              .report-details div:last-child {
                  text-align: left;
                  padding-left: 10px;
                  padding-right: 0;
              }
              .report-details strong {
                  color: #1a5276;
                  font-weight: 700;
              }

              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                  page-break-inside: auto;
                  box-shadow: 0 4px 8px rgba(0,0,0,0.05); /* Subtle shadow */
              }
              thead {
                  display: table-header-group;
              }
              tr {
                  page-break-inside: avoid;
                  page-break-after: auto;
              }
              th, td {
                  padding: 12px 15px; /* More padding */
                  border: 1px solid #e0e0e0; /* Lighter borders */
                  text-align: center;
                  font-size: 10pt; /* Slightly larger font */
                  vertical-align: middle; /* Center vertical alignment */
              }
              th {
                  background-color: #f0f4f7; /* Light blue-gray background */
                  font-weight: 700;
                  color: #34495e; /* Darker header text */
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              tbody tr:nth-child(even) {
                  background-color: #f8f8f8; /* Lighter alternating row background */
              }
              tbody tr:hover {
                background-color: #f1f1f1; /* Hover effect for visual clarity if viewed digitally */
              }
              
              .nested-items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 5px 0;
              }
              .nested-items-table th, .nested-items-table td {
                  padding: 8px 10px; /* Adjusted padding */
                  font-size: 9pt; /* Adjusted font size */
                  border: 1px solid #f0f0f0; /* Even lighter border */
                  background-color: #ffffff;
              }
              .nested-items-table thead th {
                  background-color: #eaf1f6; /* Slightly different header for nested table */
                  color: #4a6572;
                  font-weight: 600;
              }
              .nested-items-table tbody tr:nth-child(even) {
                  background-color: #fdfdfd;
              }

              .summary {
                  margin-top: 40px;
                  padding-top: 25px;
                  border-top: 3px solid #1a5276; /* Matching title border */
                  font-size: 12pt;
                  text-align: right;
                  background-color: #eaf1f6; /* Light background for summary */
                  padding: 20px;
                  border-radius: 8px; /* Rounded corners for summary box */
                  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
              }
              .summary p {
                  margin-bottom: 10px;
                  display: flex; /* For aligning text and value */
                  justify-content: space-between; /* To push value to the left in RTL */
                  padding: 5px 0;
                  border-bottom: 1px solid #dcdcdc; /* Separator for each summary line */
              }
              .summary p:last-child {
                  border-bottom: none;
              }
              .summary strong {
                  color: #1a5276;
                  font-size: 13pt;
                  flex-grow: 1; /* Allow strong text to take space */
                  text-align: right;
                  padding-right: 10px;
              }
              .summary span {
                text-align: left; /* Align value to the left in RTL */
                padding-left: 10px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1 class="report-title">${title}</h1>

              <div class="report-details">
                  <div>
                      <strong>بەرواری دروستکردنی ڕاپۆرت:</strong> ${generateDate}
                  </div>
                  <div>
                      <strong>${filterText}</strong>
                  </div>
              </div>

              <table>
                  <thead>
                      ${headers}
                  </thead>
                  <tbody>
                      ${rows}
                  </tbody>
              </table>
              ${summaryHtml}
          </div>
      </body>
      </html>
    `;
  };

  const handlePrintData = (data, type, title) => {
    const printHtml = generateTableHtml(data, type);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  const handleDownloadData = (data, type, title) => {
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast('کتێبخانەکانی دروستکردنی PDF بار نەکراون. تکایە دڵنیابە لەوەی سکریپتەکانی CDN لە HTMLەکەتدا هەن.', 'error');
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = generateTableHtml(data, type);
    document.body.appendChild(tempDiv);

    setTimeout(() => {
      window.html2canvas(tempDiv, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: 'a4'
        });

        const imgWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
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
        const dateFilterText = `${filterYear || 'All'}-${filterMonth || 'All'}-${filterDay || 'All'}`;
        pdf.save(`${title.replace(/\s/g, '_')}_${dateFilterText}.pdf`);
      }).catch(error => {
        console.error("هەڵە لە دروستکردنی PDF:", error);
        showToast("هەڵە لە دروستکردنی PDF. تکایە دووبارە هەوڵبدەوە یان بڕوانە کۆنسۆڵ بۆ هەڵەکان.", 'error');
      }).finally(() => {
        document.body.removeChild(tempDiv);
      });
    }, 100);
  };

  const AnalyticsCard = ({ id, title, value, unit, icon: Icon, color, secondaryValue, secondaryUnit, onPrint, onDownload }) => (
    <div id={id} className={`bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 ${color} transform hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between`}>
      <div>
        <div className={`text-5xl mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center ${color.replace('border-b-4 border-', 'bg-opacity-10 text-')}`}>
          <Icon size={48} />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}{unit}</p>
        {secondaryValue !== undefined && (
          <p className="text-lg text-gray-600">({formatNumberForDisplay(secondaryValue)}{secondaryUnit === '$' ? ' IQD' : secondaryUnit})</p>
        )}
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onPrint}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
          title="چاپکردنی داتای کارت"
        >
          <Printer size={18} /> چاپکردن
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
          title="داگرتنی داتای کارت"
        >
          <Download size={18} /> داگرتن
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        <BarChart2 size={40} className="text-blue-600" /> شیکاری بازرگانی
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-10 items-center justify-center bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 ml-4">
          <Filter size={24} className="text-gray-500" /> فلتەرکردن بەپێی بەروار:
        </h2>
        <input
          type="number"
          placeholder="ساڵ (بۆ نموونە، 2025)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          min="2000"
          max="2100"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="مانگ (بۆ نموونە، 08)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          min="1"
          max="12"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <input
          type="number"
          placeholder="ڕۆژ (بۆ نموونە، 05)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm text-right"
          min="1"
          max="31"
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        />
        <button
          onClick={() => {
            setFilterYear('');
            setFilterMonth('');
            setFilterDay('');
          }}
          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 shadow-sm"
        >
          <X size={20} /> پاککردنەوەی فلتەرەکان
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnalyticsCard
          id="card-total-arrived"
          title="کۆی گشتی خوێی گەیشتوو"
          value={formatNumberForDisplay(totalArrivedQuantity)}
          unit=" تەن"
          secondaryValue={totalArrivedValue}
          secondaryUnit="IQD"
          icon={Truck}
          color="border-blue-500"
          onPrint={() => handlePrintData(filteredArrivedData, 'arrived', 'کۆی گشتی خوێی گەیشتوو')}
          onDownload={() => handleDownloadData(filteredArrivedData, 'arrived', 'کۆی گشتی خوێی گەیشتوو')}
        />
        <AnalyticsCard
          id="card-total-produced"
          title="کۆی گشتی خوێی بەرهەمهاتوو"
          value={formatNumberForDisplay(totalProducedQuantity)}
          unit=" تەن"
          icon={Factory}
          color="border-yellow-500"
          onPrint={() => handlePrintData(filteredProducedData, 'produced', 'کۆی گشتی خوێی بەرهەمهاتوو')}
          onDownload={() => handleDownloadData(filteredProducedData, 'produced', 'کۆی گشتی خوێی بەرهەمهاتوو')}
        />
        <AnalyticsCard
          id="card-total-sold"
          title="کۆی گشتی خوێی فرۆشراو"
          value={formatNumberForDisplay(totalSoldQuantity)}
          unit=" تەن"
          secondaryValue={totalSoldValue}
          secondaryUnit="IQD"
          icon={Package}
          color="border-purple-500"
          onPrint={() => handlePrintData(filteredSoldData, 'sold', 'کۆی گشتی خوێی فرۆشراو')}
          onDownload={() => handleDownloadData(filteredSoldData, 'sold', 'کۆی گشتی خوێی فرۆشراو')}
        />
        <AnalyticsCard
          id="card-total-expenses"
          title="کۆی گشتی خەرجییەکان"
          value={formatNumberForDisplay(totalExpenses)}
          unit=" IQD"
          icon={TrendingDown}
          color="border-red-500"
          onPrint={() => handlePrintData(filteredTransactionsData.filter(t => t.type === 'spend'), 'transactions', 'کۆی گشتی خەرجییەکان')}
          onDownload={() => handleDownloadData(filteredTransactionsData.filter(t => t.type === 'spend'), 'transactions', 'کۆی گشتی خەرجییەکان')}
        />
        <AnalyticsCard
          id="card-total-income"
          title="کۆی گشتی داهات"
          value={formatNumberForDisplay(totalIncome)}
          unit=" IQD"
          icon={TrendingUp}
          color="border-green-500"
          onPrint={() => handlePrintData(filteredTransactionsData.filter(t => t.type === 'earning'), 'transactions', 'کۆی گشتی داهات')}
          onDownload={() => handleDownloadData(filteredTransactionsData.filter(t => t.type === 'earning'), 'transactions', 'کۆی گشتی داهات')}
        />
        <AnalyticsCard
          id="card-net-balance"
          title="باڵانسی پوخت"
          value={formatNumberForDisplay(netBalance)}
          unit=" IQD"
          icon={DollarSign}
          color={netBalance >= 0 ? 'border-blue-600' : 'border-gray-500'}
          onPrint={() => handlePrintData(filteredTransactionsData, 'transactions', 'باڵانسی پوخت')}
          onDownload={() => handleDownloadData(filteredTransactionsData, 'transactions', 'باڵانسی پوخت')}
        />
      </div>

      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage('')}
      />
    </div>
  );
};

export default Analytics;
