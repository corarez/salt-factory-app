import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Factory, Truck, Package,
  Calendar, Download, Printer, X, BarChart2, Filter
} from 'lucide-react';
import { io } from 'socket.io-client'; // Import Socket.IO client

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000'; // Socket.IO server URL

// Generic Confirmation Modal (reused from other components)
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'bg-red-600' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
          >
            Cancel
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

// Simple Info/Alert Modal (reused from other components)
const InfoModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 relative text-center transform transition-all duration-300 scale-100 opacity-100">
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const Analytics = () => {
  // --- State for Data from Backend ---
  const [allArrivedData, setAllArrivedData] = useState([]);
  const [allProducedData, setAllProducedData] = useState([]);
  const [allSoldData, setAllSoldData] = useState([]);
  const [allTransactionsData, setAllTransactionsData] = useState([]);

  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false); // For general info/errors

  // Initialize filters to current date on component mount
  useEffect(() => {
    const today = new Date();
    setFilterYear(today.getFullYear().toString());
    setFilterMonth((today.getMonth() + 1).toString().padStart(2, '0'));
    setFilterDay(today.getDate().toString().padStart(2, '0'));
  }, []);

  // --- Fetch Data from Backend ---
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
        setActionSuccessMessage(`${errorMessage}: ${error.message}`);
        setShowInfoModal(true);
      }
    };

    fetchData(`${API_BASE_URL}/arrived`, setAllArrivedData, "Error fetching arrived data");
    fetchData(`${API_BASE_URL}/produced`, setAllProducedData, "Error fetching produced data");
    fetchData(`${API_BASE_URL}/sold`, setAllSoldData, "Error fetching sold data");
    fetchData(`${API_BASE_URL}/transactions`, setAllTransactionsData, "Error fetching transactions data");
  }, []); // Fetch all data once on component mount

  // --- Socket.IO for Real-time Updates ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    // Arrived data updates
    socket.on('arrived:added', (newEntry) => setAllArrivedData(prev => [...prev, newEntry]));
    socket.on('arrived:updated', (updatedEntry) => setAllArrivedData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('arrived:deleted', (deletedId) => setAllArrivedData(prev => prev.filter(item => item.id !== deletedId)));

    // Produced data updates
    socket.on('produced:added', (newEntry) => setAllProducedData(prev => [...prev, newEntry]));
    socket.on('produced:updated', (updatedEntry) => setAllProducedData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('produced:deleted', (deletedId) => setAllProducedData(prev => prev.filter(item => item.id !== deletedId)));

    // Sold data updates
    socket.on('sold:added', (newEntry) => setAllSoldData(prev => [...prev, newEntry]));
    socket.on('sold:updated', (updatedEntry) => setAllSoldData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('sold:deleted', (deletedId) => setAllSoldData(prev => prev.filter(item => item.id !== deletedId)));

    // Transactions data updates
    socket.on('transactions:added', (newEntry) => setAllTransactionsData(prev => [...prev, newEntry]));
    socket.on('transactions:updated', (updatedEntry) => setAllTransactionsData(prev => prev.map(item => item.id === updatedEntry.id ? updatedEntry : item)));
    socket.on('transactions:deleted', (deletedId) => setAllTransactionsData(prev => prev.filter(item => item.id !== deletedId)));


    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);


  // --- Filtering Logic ---
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

  // --- Calculations ---
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

  // --- Print/Download Handlers ---
  const handlePrintCard = (cardId, title) => {
    const element = document.getElementById(cardId);
    if (!element) {
      console.error(`Element with ID '${cardId}' not found for printing.`);
      return;
    }

    // Ensure html2canvas and jspdf are available globally
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      setActionSuccessMessage('PDF generation libraries are not loaded. Please ensure their CDN scripts are included in your HTML.');
      setShowInfoModal(true);
      return;
    }

    window.html2canvas(element, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgWidth = 595; // A4 width in px at 72dpi
      const pageHeight = 842; // A4 height in px at 72dpi
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
      console.error("Error generating PDF:", error);
      setActionSuccessMessage("Failed to generate PDF. Please try again or check console for errors.");
      setShowInfoModal(true);
    });
  };

  const handleDownloadCard = (cardId, title) => {
    setActionSuccessMessage(`Download functionality for "${title}" is under development. Please use the print option for now.`);
    setShowDownloadInfoModal(true);
  };

  // Helper component for an analytics card
  const AnalyticsCard = ({ id, title, value, unit, icon: Icon, color, secondaryValue, secondaryUnit }) => (
    <div id={id} className={`bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 ${color} transform hover:scale-[1.01] transition-transform duration-300 flex flex-col justify-between`}>
      <div>
        <div className={`text-5xl mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center ${color.replace('border-b-4 border-', 'bg-opacity-10 text-')}`}>
          <Icon size={48} />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-4xl font-bold text-gray-900 mb-2">{value}{unit}</p>
        {secondaryValue !== undefined && (
          <p className="text-lg text-gray-600">({secondaryValue}{secondaryUnit})</p>
        )}
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => handlePrintCard(id, title)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-sm"
          title="Print Card Data"
        >
          <Printer size={18} /> Print
        </button>
        <button
          onClick={() => handleDownloadCard(id, title)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
          title="Download Card Data"
        >
          <Download size={18} /> Download
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        <BarChart2 size={40} className="text-blue-600" /> Business Analytics
      </h1>

      {/* Date Filter Section */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-10 items-center justify-center bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mr-4">
          <Filter size={24} className="text-gray-500" /> Filter by Date:
        </h2>
        <input
          type="number"
          placeholder="Year (e.g., 2025)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          min="2000"
          max="2100"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        />
        <input
          type="number"
          placeholder="Month (e.g., 08)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          min="1"
          max="12"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <input
          type="number"
          placeholder="Day (e.g., 05)"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-36 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
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
          <X size={20} /> Clear Filters
        </button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnalyticsCard
          id="card-total-arrived"
          title="Total Salt Arrived"
          value={totalArrivedQuantity.toFixed(0)}
          unit=" Tons"
          secondaryValue={totalArrivedValue.toFixed(2)}
          secondaryUnit="$"
          icon={Truck}
          color="border-blue-500"
        />
        <AnalyticsCard
          id="card-total-produced"
          title="Total Salt Produced"
          value={totalProducedQuantity.toFixed(0)}
          unit=" Tons"
          icon={Factory}
          color="border-yellow-500"
        />
        <AnalyticsCard
          id="card-total-sold"
          title="Total Salt Sold"
          value={totalSoldQuantity.toFixed(0)}
          unit=" Tons"
          secondaryValue={totalSoldValue.toFixed(2)}
          secondaryUnit="$"
          icon={Package}
          color="border-purple-500"
        />
        <AnalyticsCard
          id="card-total-expenses"
          title="Total Expenses"
          value={totalExpenses.toFixed(2)}
          unit="$"
          icon={TrendingDown}
          color="border-red-500"
        />
        <AnalyticsCard
          id="card-total-income"
          title="Total Income"
          value={totalIncome.toFixed(2)}
          unit="$"
          icon={TrendingUp}
          color="border-green-500"
        />
        <AnalyticsCard
          id="card-net-balance"
          title="Net Balance"
          value={netBalance.toFixed(2)}
          unit="$"
          icon={DollarSign}
          color={netBalance >= 0 ? 'border-blue-600' : 'border-gray-500'}
        />
      </div>

      {/* Modals */}
      <InfoModal
        isOpen={showDownloadInfoModal}
        onClose={() => setShowDownloadInfoModal(false)}
        title="Download Functionality"
        message="The download feature for individual cards is currently under development. You can use the 'Print' option to generate a printable view."
      />

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Information"
        message={actionSuccessMessage}
      />
    </div>
  );
};

export default Analytics;
