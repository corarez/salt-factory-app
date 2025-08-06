import React, { useState, useEffect } from 'react';
import { Printer, FileDown, ChevronDown, ChevronUp, Edit, Trash2, X, PlusCircle } from 'lucide-react';
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

// Modal for adding or editing a sales entry
const SaleEntryModal = ({ isOpen, onClose, initialData, onSave, nextInvoiceIdForNew }) => {
  // State to manage form data, initialized with initialData or empty fields
  const [formData, setFormData] = useState(initialData || {
    buyerName: '',
    invoiceId: nextInvoiceIdForNew || '', // Use the passed prop for new entries
    date: new Date().toISOString().split('T')[0], // Default to current date
    items: [{ saltType: '', quantity: '', pricePerTon: '' }],
    truckDriverName: '', // New field
    truckNumber: '',     // New field
    truckDriverPhone: '',// New field
    oldDebt: '',         // New field
    total: 0             // Calculated field
  });
  const [error, setError] = useState(''); // State for validation errors

  // Effect to update form data when initialData changes (e.g., for editing)
  useEffect(() => {
    setFormData(initialData ? {
      ...initialData,
      // Ensure numerical fields are numbers for calculations, default to 0 if null/empty
      oldDebt: initialData.oldDebt !== null && initialData.oldDebt !== undefined ? parseFloat(initialData.oldDebt) : '',
      total: initialData.total !== null && initialData.total !== undefined ? parseFloat(initialData.total) : 0,
    } : {
      buyerName: '',
      invoiceId: nextInvoiceIdForNew || '', // Preserve for edit, use new for add
      date: new Date().toISOString().split('T')[0],
      items: [{ saltType: '', quantity: '', pricePerTon: '' }],
      truckDriverName: '',
      truckNumber: '',
      truckDriverPhone: '',
      oldDebt: '',
      total: 0
    });
    setError(''); // Clear errors on modal open/data change
  }, [initialData, nextInvoiceIdForNew]);

  // Handle changes for top-level form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes for individual items within the 'items' array
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = formData.items.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Add a new item row to the sales entry
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { saltType: '', quantity: '', pricePerTon: '' }]
    }));
  };

  // Remove an item row from the sales entry
  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation for main fields
    if (!formData.buyerName || !formData.invoiceId || !formData.date || !formData.truckDriverName || !formData.truckNumber || !formData.truckDriverPhone) {
      setError('Buyer Name, Invoice ID, Date, Truck Driver Name, Truck Number, and Phone are required.');
      return;
    }

    // Basic validation for each item
    for (const item of formData.items) {
      if (!item.saltType || !item.quantity || !item.pricePerTon) {
        setError('All sale items must have a Salt Type, Quantity, and Price Per Ton.');
        return;
      }
      if (parseFloat(item.quantity) <= 0 || parseFloat(item.pricePerTon) <= 0) {
        setError('Quantity and Price Per Ton must be positive numbers for all items.');
        return;
      }
    }

    // Calculate total price
    const totalItemsPrice = formData.items.reduce((total, item) => total + (parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0), 0);
    const oldDebtValue = parseFloat(formData.oldDebt) || 0;
    const finalTotal = totalItemsPrice + oldDebtValue;

    onSave({ ...formData, total: finalTotal });
    onClose(); // Close modal after saving
  };

  // Do not render if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'Edit Sale Entry' : 'Add New Sale Entry'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="buyerName" className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
              <input
                type="text"
                id="buyerName"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Rashid Group"
                required
              />
            </div>
            <div>
              <label htmlFor="invoiceId" className="block text-sm font-medium text-gray-700 mb-1">Invoice ID</label>
              <input
                type="text"
                id="invoiceId"
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., INV-1001"
                required
                readOnly={!!initialData} // Make read-only if editing existing data
              />
            </div>
            <div className="col-span-full">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            {/* New Fields for Truck Driver Details */}
            <div>
              <label htmlFor="truckDriverName" className="block text-sm font-medium text-gray-700 mb-1">Truck Driver Name</label>
              <input
                type="text"
                id="truckDriverName"
                name="truckDriverName"
                value={formData.truckDriverName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Ali Hassan"
                required
              />
            </div>
            <div>
              <label htmlFor="truckNumber" className="block text-sm font-medium text-gray-700 mb-1">Truck Number</label>
              <input
                type="text"
                id="truckNumber"
                name="truckNumber"
                value={formData.truckNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., 12345"
                required
              />
            </div>
            <div>
              <label htmlFor="truckDriverPhone" className="block text-sm font-medium text-gray-700 mb-1">Truck Driver Phone</label>
              <input
                type="text"
                id="truckDriverPhone"
                name="truckDriverPhone"
                value={formData.truckDriverPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., +9647701234567"
                required
              />
            </div>
            {/* Old Debt and Total */}
            <div>
              <label htmlFor="oldDebt" className="block text-sm font-medium text-gray-700 mb-1">Old Debt ($)</label>
              <input
                type="number"
                id="oldDebt"
                name="oldDebt"
                value={formData.oldDebt}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., 50 (optional)"
                min="0"
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Sale Items</h3>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2"> {/* Added scroll for many items */}
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Salt Type</label>
                  <input
                    type="text"
                    name="saltType"
                    value={item.saltType}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Fine"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (Ton)</label>
                  <input
                    type="number"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price/Ton ($)</label>
                  <input
                    type="number"
                    name="pricePerTon"
                    value={item.pricePerTon}
                    onChange={(e) => handleItemChange(index, e)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 100"
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
            + Add Another Item
          </button>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {initialData ? 'Update Sale' : 'Add Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Generic confirmation modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple info modal (e.g., for download functionality)
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


const SaltSold = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState({ day: '', month: '', year: '' });
  const [salesData, setSalesData] = useState([]); // Initialize with empty array, data will be fetched from backend
  const [nextInvoiceId, setNextInvoiceId] = useState('INV-0001'); // State for auto-generated invoice ID


  // State for modal visibility and data
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showSuccessInfoModal, setShowSuccessInfoModal] = useState(false);

  // Helper to calculate the next sequential invoice ID
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

  // --- Fetch initial data from backend on component mount ---
  useEffect(() => {
    const fetchSoldData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/sold`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setSalesData(fetchedData);
        setNextInvoiceId(calculateNextInvoiceId(fetchedData)); // Calculate next ID after fetching
      } catch (error) {
        console.error("Error fetching sold data:", error);
        setActionSuccessMessage(`Failed to load data: ${error.message}`);
        setShowSuccessInfoModal(true);
      }
    };

    fetchSoldData();
  }, []); // Empty dependency array means this runs only once on mount

  // --- Socket.IO for real-time updates ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('sold:added', (newEntry) => {
      setSalesData(prevData => {
        const updatedData = [...prevData, newEntry];
        setNextInvoiceId(calculateNextInvoiceId(updatedData)); // Update next ID on new entry
        return updatedData;
      });
    });

    socket.on('sold:updated', (updatedEntry) => {
      setSalesData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('sold:deleted', (deletedId) => {
      setSalesData(prevData => {
        const updatedData = prevData.filter(item => item.id !== deletedId);
        setNextInvoiceId(calculateNextInvoiceId(updatedData)); // Update next ID on deletion
        return updatedData;
      });
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // Filter sales data based on search and date filters
  const filteredData = salesData
    .filter((entry) =>
      entry.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      entry.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      entry.truckDriverName.toLowerCase().includes(search.toLowerCase()) || // Search by new field
      entry.truckNumber.toLowerCase().includes(search.toLowerCase()) ||     // Search by new field
      entry.truckDriverPhone.toLowerCase().includes(search.toLowerCase()) || // Search by new field
      entry.items.some(item => item.saltType.toLowerCase().includes(search.toLowerCase()))
    )
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      if (filter.year && entryDate.getFullYear() !== parseInt(filter.year)) return false;
      if (filter.month && (entryDate.getMonth() + 1) !== parseInt(filter.month)) return false;
      if (filter.day && entryDate.getDate() !== parseInt(filter.day)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending;

  // Toggle expansion of a sales entry card
  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate total amount for a list of items
  const getTotal = (items) =>
    items.reduce((total, item) => total + (parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0), 0);

  // Handle print functionality using html2canvas and jspdf
  const handlePrint = (id) => {
    const element = document.getElementById(`card-${id}`);
    if (!element) {
      console.error(`Element with ID 'card-${id}' not found for printing.`);
      return;
    }

    // Check if libraries are loaded globally
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      console.error('html2canvas or jspdf is not loaded. Please ensure their CDN scripts are included in your HTML.');
      setActionSuccessMessage('PDF generation libraries are not loaded. Please check the console for more details.');
      setShowSuccessInfoModal(true);
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
      pdf.save(`Salt_Sale_Invoice_${id}.pdf`);
    }).catch(error => {
      console.error("Error generating PDF:", error);
      setActionSuccessMessage("Failed to generate PDF. Please try again or check console for errors.");
      setShowSuccessInfoModal(true);
    });
  };

  // Handle saving an entry (add or edit)
  const handleSaveEntry = async (entryToSave) => {
    try {
      let response;
      let method;
      let url;

      if (editingEntry) {
        // Update existing entry
        method = 'PUT';
        url = `${API_BASE_URL}/sold/${editingEntry.id}`;
      } else {
        // Add new entry
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
      setActionSuccessMessage(`Sale record for Invoice ID "${entryToSave.invoiceId}" ${editingEntry ? 'updated' : 'added'} successfully!`);
      setShowSuccessInfoModal(true);

    } catch (error) {
      console.error("Error saving entry:", error);
      setActionSuccessMessage(`Failed to save record: ${error.message}`);
      setShowSuccessInfoModal(true);
    } finally {
      setEditingEntry(null);
      setShowEditModal(false);
    }
  };

  // Handle deletion confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sold/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage('Sale record deleted successfully!');
      setShowSuccessInfoModal(true);

    } catch (error) {
      console.error("Error deleting entry:", error);
      setActionSuccessMessage(`Failed to delete record: ${error.message}`);
      setShowSuccessInfoModal(true);
    } finally {
      setShowDeleteConfirmModal(false);
      setDeletingEntryId(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">🧾 Salt Sold Records</h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="Search by buyer, invoice, or salt type..."
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Day"
            className="px-4 py-2 border border-gray-300 rounded-xl w-24 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            maxLength={2}
            min="1"
            max="31"
            value={filter.day}
            onChange={(e) => setFilter({ ...filter, day: e.target.value })}
          />
          <input
            type="number"
            placeholder="Month"
            className="px-4 py-2 border border-gray-300 rounded-xl w-24 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            maxLength={2}
            min="1"
            max="12"
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value })}
          />
          <input
            type="number"
            placeholder="Year"
            className="px-4 py-2 border border-gray-300 rounded-xl w-28 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            maxLength={4}
            min="2000"
            max="2100"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          />
        </div>
        <button
          onClick={() => { setEditingEntry(null); setShowEditModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> Add New Sale
        </button>
      </div>

      <div className="space-y-6">
        {filteredData.length > 0 ? (
          filteredData.map((entry) => (
            <div
              key={entry.id}
              id={`card-${entry.id}`}
              className="bg-gradient-to-br from-white to-blue-50 shadow-xl border border-blue-100 rounded-3xl p-7 hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer pb-4 border-b border-blue-100"
                onClick={() => toggleExpanded(entry.id)}
              >
                <div>
                  <h2 className="text-3xl font-bold text-blue-800 mb-1 flex items-center gap-3">
                    {entry.buyerName}
                  </h2>
                  <p className="text-md text-gray-600">Invoice: <span className="font-semibold text-gray-800">{entry.invoiceId}</span> • Date: <span className="font-semibold text-gray-800">{entry.date}</span></p>
                  {/* Display new fields */}
                  <p className="text-sm text-gray-500">
                    Driver: <span className="font-medium">{entry.truckDriverName}</span> (#<span className="font-medium">{entry.truckNumber}</span>, <span className="font-medium">{entry.truckDriverPhone}</span>)
                  </p>
                  {entry.oldDebt > 0 && (
                    <p className="text-sm text-red-500 font-semibold">Old Debt: ${formatNumberForDisplay(entry.oldDebt)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); setShowEditModal(true); }}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-full border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingEntryId(entry.id); setShowDeleteConfirmModal(true); }}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-full border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrint(entry.id); }}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-full border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors shadow-sm"
                  >
                    <Printer size={16} /> Print
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDownloadInfoModal(true); }}
                    className="flex items-center gap-1 text-sm px-4 py-2 rounded-full border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors shadow-sm"
                  >
                    <FileDown size={16} /> Download
                  </button>
                  {expanded[entry.id] ? <ChevronUp size={20} className="text-gray-700" /> : <ChevronDown size={20} className="text-gray-700" />}
                </div>
              </div>

              {expanded[entry.id] && (
                <div className="mt-6">
                  <table className="w-full text-sm text-left border border-slate-300 rounded-xl overflow-hidden shadow-inner">
                    <thead className="bg-blue-200 text-blue-900 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 border-b border-slate-200">#</th>
                        <th className="px-5 py-3 border-b border-slate-200">Salt Type</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-right">Qty (Ton)</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-right">Price/Ton</th>
                        <th className="px-5 py-3 border-b border-slate-200 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.items.map((item, index) => (
                        <tr key={index} className="border-t border-slate-200 hover:bg-blue-50 transition-colors">
                          <td className="px-5 py-3">{index + 1}</td>
                          <td className="px-5 py-3 font-medium text-gray-800">{item.saltType}</td>
                          <td className="px-5 py-3 text-right">{formatNumberForDisplay(item.quantity)}</td>
                          <td className="px-5 py-3 text-right">${formatNumberForDisplay(item.pricePerTon)}</td>
                          <td className="px-5 py-3 font-bold text-green-700 text-right">
                            ${formatNumberForDisplay((parseFloat(item.quantity) || 0) * (parseFloat(item.pricePerTon) || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-right mt-6 text-2xl font-extrabold text-blue-700 bg-blue-100 px-6 py-3 rounded-xl border border-blue-200 shadow-md">
                    Total Sale: <span className="text-green-800">${formatNumberForDisplay(entry.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500 text-xl bg-white rounded-xl shadow-lg border border-gray-200">
            No sales records found matching your criteria.
          </div>
        )}
      </div>

      {/* Modals */}
      <SaleEntryModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
        nextInvoiceIdForNew={nextInvoiceId} // Pass the next auto-generated ID
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntryId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the record for ${salesData.find(e => e.id === deletingEntryId)?.buyerName || 'this entry'}? This action cannot be undone.`}
      />

      <InfoModal
        isOpen={showDownloadInfoModal}
        onClose={() => setShowDownloadInfoModal(false)}
        title="Download Functionality"
        message="The download feature is currently under development. You can use the 'Print' option to generate a PDF of the invoice."
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

export default SaltSold;
