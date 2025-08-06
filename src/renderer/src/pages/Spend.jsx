import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Printer, Download, X, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { io } from 'socket.io-client'; // Import Socket.IO client

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000'; // Socket.IO server URL

// Helper function to format numbers for display (remove .00 if integer)
const formatNumberForDisplay = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const parsedNum = parseFloat(num);
  if (parsedNum % 1 === 0) {
    return parsedNum.toString();
  }
  return parsedNum.toFixed(2); // Keep 2 decimal places for floats
};

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

// Modal for adding or editing a Spend/Earning entry
const AddEditTransactionModal = ({ isOpen, onClose, initialData, onSave, type }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    price: '',
    note: '',
    date: new Date().toISOString().split('T')[0], // Default to current date
    type: type // 'spend' or 'earning'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData || {
      title: '',
      price: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
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

    // Basic validation
    if (!formData.title || !formData.price || !formData.date) {
      setError('Title, Price, and Date are required.');
      return;
    }
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const modalTitle = initialData
    ? `Edit ${formData.type === 'spend' ? 'Expense' : 'Income'}`
    : `Add New ${type === 'spend' ? 'Expense' : 'Income'}`;
  const buttonText = initialData ? 'Update Record' : 'Add Record';
  const headerColor = type === 'spend' ? 'text-red-700' : 'text-green-700';
  const buttonColor = type === 'spend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className={`text-3xl font-extrabold ${headerColor} mb-6 text-center`}>
          {modalTitle}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              value={formData.title}
              onChange={handleChange}
              placeholder={type === 'spend' ? 'e.g., Office Supplies' : 'e.g., Salt Sale'}
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 150"
              min="0"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              id="note"
              name="note"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm resize-y"
              value={formData.note}
              onChange={handleChange}
              placeholder="e.g., Monthly stationery purchase"
              rows="3"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 ${buttonColor} text-white rounded-lg transition-colors shadow-md`}
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const Spend = () => {
  const [spendData, setSpendData] = useState([]); // Initialize with empty array
  const [earningData, setEarningData] = useState([]); // Initialize with empty array
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalType, setModalType] = useState('spend'); // 'spend' or 'earning'
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null); // Stores the full entry for deletion message
  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showSuccessInfoModal, setShowSuccessInfoModal] = useState(false);

  // --- Fetch initial data from backend on component mount ---
  useEffect(() => {
    const fetchTransactionsData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        // Separate fetched data into spend and earning
        setSpendData(fetchedData.filter(item => item.type === 'spend'));
        setEarningData(fetchedData.filter(item => item.type === 'earning'));
      } catch (error) {
        console.error("Error fetching transactions data:", error);
        setActionSuccessMessage(`Failed to load data: ${error.message}`);
        setShowSuccessInfoModal(true);
      }
    };

    fetchTransactionsData();
  }, []); // Empty dependency array means this runs only once on mount

  // --- Socket.IO for real-time updates ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('transactions:added', (newEntry) => {
      if (newEntry.type === 'spend') {
        setSpendData(prevData => [...prevData, newEntry]);
      } else {
        setEarningData(prevData => [...prevData, newEntry]);
      }
    });

    socket.on('transactions:updated', (updatedEntry) => {
      if (updatedEntry.type === 'spend') {
        setSpendData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
      } else {
        setEarningData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
      }
    });

    socket.on('transactions:deleted', (deletedId) => {
      // Since the deleted event only sends ID, we need to check both arrays
      setSpendData(prevData => prevData.filter(item => item.id !== deletedId));
      setEarningData(prevData => prevData.filter(item => item.id !== deletedId));
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);


  // Calculate totals
  const totalSpend = spendData.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const totalEarning = earningData.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);
  const netBalance = totalEarning - totalSpend;

  // Handlers for Add/Edit/Save
  const handleSaveEntry = async (entryToSave) => {
    try {
      let response;
      let method;
      let url;

      if (entryToSave.id) { // Editing existing entry
        method = 'PUT';
        url = `${API_BASE_URL}/transactions/${entryToSave.id}`;
      } else { // Adding new entry
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

      const result = await response.json(); // Backend sends back the new/updated entry
      setActionSuccessMessage(`${entryToSave.type === 'spend' ? 'Expense' : 'Income'} record "${entryToSave.title}" ${entryToSave.id ? 'updated' : 'added'} successfully!`);
      setShowSuccessInfoModal(true);

    } catch (error) {
      console.error("Error saving entry:", error);
      setActionSuccessMessage(`Failed to save record: ${error.message}`);
      setShowSuccessInfoModal(true);
    } finally {
      setShowAddEditModal(false);
      setEditingEntry(null);
    }
  };

  // Handler for Delete Confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${deletingEntry.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage(`${deletingEntry.type === 'spend' ? 'Expense' : 'Income'} record "${deletingEntry.title}" deleted successfully!`);
      setShowSuccessInfoModal(true);

    } catch (error) {
      console.error("Error deleting entry:", error);
      setActionSuccessMessage(`Failed to delete record: ${error.message}`);
      setShowSuccessInfoModal(true);
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntry(null);
    }
  };

  // Handler for Print (using window.print())
  const handlePrint = () => {
    window.print();
  };

  // Handler for Download (using InfoModal as placeholder)
  const handleDownload = () => {
    setShowDownloadInfoModal(true);
  };

  // Filter combined data based on search and date
  const combinedFilteredData = [...spendData, ...earningData].filter(
    (item) =>
      (item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.note.toLowerCase().includes(search.toLowerCase()) ||
      item.date.includes(filterDate))
  ).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        <DollarSign size={40} className="text-blue-600" /> Spend & Earning
      </h1>

      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-red-500">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Expenses</h2>
          <p className="text-4xl font-bold text-red-600">${formatNumberForDisplay(totalSpend)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 border-green-500">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Income</h2>
          <p className="text-4xl font-bold text-green-600">${formatNumberForDisplay(totalEarning)}</p>
        </div>
        <div className={`bg-white rounded-2xl shadow-lg p-6 text-center border-b-4 ${netBalance >= 0 ? 'border-blue-500' : 'border-gray-500'}`}>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Net Balance</h2>
          <p className={`text-4xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-gray-600'}`}>${formatNumberForDisplay(netBalance)}</p>
        </div>
      </div>

      {/* Search and Add Buttons */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="Search by title, note, or date"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-5 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <button
          onClick={() => { setEditingEntry(null); setModalType('earning'); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> Add Income
        </button>
        <button
          onClick={() => { setEditingEntry(null); setModalType('spend'); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> Add Expense
        </button>
      </div>

      {/* Combined Transactions Table */}
      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {combinedFilteredData.length > 0 ? (
              combinedFilteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3">
                    <span className={`flex items-center gap-1 font-semibold ${item.type === 'spend' ? 'text-red-600' : 'text-green-600'}`}>
                      {item.type === 'spend' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      {item.type === 'spend' ? 'Expense' : 'Income'}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{item.title}</td>
                  <td className={`px-5 py-3 font-bold ${item.type === 'spend' ? 'text-red-600' : 'text-green-600'}`}>
                    ${formatNumberForDisplay(item.price)}
                  </td>
                  <td className="px-5 py-3">{item.date}</td>
                  <td className="px-5 py-3 max-w-xs truncate">{item.note}</td>
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
                  No transactions found. Add a new expense or income record.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
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
        title="Confirm Deletion"
        message={`Are you sure you want to delete the ${deletingEntry?.type === 'spend' ? 'expense' : 'income'} record for "${deletingEntry?.title}" priced at $${formatNumberForDisplay(deletingEntry?.price) || ''}? This action cannot be undone.`}
        confirmColor={deletingEntry?.type === 'spend' ? 'bg-red-600' : 'bg-green-600'}
      />

      <InfoModal
        isOpen={showDownloadInfoModal}
        onClose={() => setShowDownloadInfoModal(false)}
        title="Download Functionality"
        message="The download feature is currently under development. You can use the 'Print' option to generate a printable view."
      />

      <InfoModal
        isOpen={showSuccessInfoModal}
        onClose={() => setShowSuccessInfoModal(false)}
        title="Action Complete"
        message={actionSuccessMessage}
      />
    </div>
  );
};

export default Spend;
