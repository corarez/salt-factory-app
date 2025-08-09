import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Factory, Truck, Package,
  Calendar, Download, Printer, X, BarChart2, Filter, CheckCircle, XCircle
} from 'lucide-react';
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

const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  if (parsedNum % 1 === 0) {
    return parsedNum.toString();
  }
  return parsedNum.toFixed(2);
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
    fetchData(`${API_BASE_URL}/transactions`, setAllTransactionsData, "هەڵە لە وەرگرتنی داتای مامەڵەکان");
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

  const handlePrintCard = (cardId, title) => {
    const element = document.getElementById(cardId);
    if (!element) {
      console.error(`Element with ID '${cardId}' not found for printing.`);
      return;
    }

    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast('کتێبخانەکانی دروستکردنی PDF بار نەکراون. تکایە دڵنیابە لەوەی سکریپتەکانی CDN لە HTMLەکەتدا هەن.', 'error');
      return;
    }

    window.html2canvas(element, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgWidth = 595;
      const pageHeight = 842;
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
      const dateFilterText = `${filterYear || 'هەموو'}-${filterMonth || 'هەموو'}-${filterDay || 'هەموو'}`;
      pdf.save(`${title.replace(/\s/g, '_')}_${dateFilterText}.pdf`);
    }).catch(error => {
      console.error("هەڵە لە دروستکردنی PDF:", error);
      showToast("هەڵە لە دروستکردنی PDF. تکایە دووبارە هەوڵبدەوە یان بڕوانە کۆنسۆڵ بۆ هەڵەکان.", 'error');
    });
  };

  const handleDownloadCard = (cardId, title) => {
    showToast(`تایبەتمەندی داگرتن بۆ "${title}" لەژێر گەشەپێداندایە. تکایە لە ئێستادا بژاردەی چاپکردن بەکاربهێنە.`, 'info');
  };

  const AnalyticsCard = ({ id, title, value, unit, icon: Icon, color, secondaryValue, secondaryUnit }) => (
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
          onClick={() => handlePrintCard(id, title)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
          title="چاپکردنی داتای کارت"
        >
          <Printer size={18} /> چاپکردن
        </button>
        <button
          onClick={() => handleDownloadCard(id, title)}
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
        />
        <AnalyticsCard
          id="card-total-produced"
          title="کۆی گشتی خوێی بەرهەمهاتوو"
          value={formatNumberForDisplay(totalProducedQuantity)}
          unit=" تەن"
          icon={Factory}
          color="border-yellow-500"
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
        />
        <AnalyticsCard
          id="card-total-expenses"
          title="کۆی گشتی خەرجییەکان"
          value={formatNumberForDisplay(totalExpenses)}
          unit=" IQD"
          icon={TrendingDown}
          color="border-red-500"
        />
        <AnalyticsCard
          id="card-total-income"
          title="کۆی گشتی داهات"
          value={formatNumberForDisplay(totalIncome)}
          unit=" IQD"
          icon={TrendingUp}
          color="border-green-500"
        />
        <AnalyticsCard
          id="card-net-balance"
          title="باڵانسی پوخت"
          value={formatNumberForDisplay(netBalance)}
          unit=" IQD"
          icon={DollarSign}
          color={netBalance >= 0 ? 'border-blue-600' : 'border-gray-500'}
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
