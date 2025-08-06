import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle, X ,Eye } from 'lucide-react';
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


// Generic Confirmation Modal (reused from SettingsPage)
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

// Simple Info/Alert Modal (reused from SettingsPage)
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

// Modal for adding or editing an arrival entry
const AddEditArrivalModal = ({ isOpen, onClose, initialData, onSave, currentUser }) => {
  const [formData, setFormData] = useState(initialData || {
    quantity: '',
    arrivedDate: new Date().toISOString().split('T')[0], // Default to current date
    pricePerTon: '',
    placeArrived: '',
    truckDriver: '',
    invoiceId: '',
    invoiceDate: new Date().toISOString().split('T')[0], // Default to current date
    senderName: '',
    feePerTon: '',
    status: 'Delivered',
    addedBy: currentUser?.username || '' // Auto-fill with current user's username
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData || {
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

    // Basic validation
    if (!formData.quantity || !formData.arrivedDate || !formData.pricePerTon || !formData.placeArrived || !formData.truckDriver || !formData.invoiceId || !formData.invoiceDate || !formData.senderName || !formData.feePerTon || !formData.addedBy) {
      setError('Please fill in all required fields.');
      return;
    }

    // Calculate totals
    const quantity = parseFloat(formData.quantity) || 0;
    const pricePerTon = parseFloat(formData.pricePerTon) || 0;
    const feePerTon = parseFloat(formData.feePerTon) || 0;

    const totalFee = feePerTon * quantity;
    const totalTonPrice = pricePerTon * quantity;
    const totalPrice = totalFee + totalTonPrice;

    onSave({ ...formData, totalFee, totalTonPrice, totalPrice });
    onClose();
  };

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
          {initialData ? 'Edit Salt Arrival' : 'Add New Salt Arrival'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {[
            { label: 'Quantity (Tons)', name: 'quantity', type: 'number', placeholder: 'e.g., 20' },
            { label: 'Arrived Date', name: 'arrivedDate', type: 'date' },
            { label: 'Price Per Ton ($)', name: 'pricePerTon', type: 'number', placeholder: 'e.g., 150' },
            { label: 'Place Arrived', name: 'placeArrived', type: 'text', placeholder: 'e.g., Erbil' },
            { label: 'Truck Driver', name: 'truckDriver', type: 'text', placeholder: 'e.g., Kamal Ali' },
            { label: 'Invoice ID', name: 'invoiceId', type: 'text', placeholder: 'e.g., INV-001' },
            { label: 'Invoice Date', name: 'invoiceDate', type: 'date' },
            { label: 'Sender Name', name: 'senderName', type: 'text', placeholder: 'e.g., Salt Co.' },
            { label: 'Fee Per Ton ($)', name: 'feePerTon', type: 'number', placeholder: 'e.g., 10' },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <div className="col-span-full">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-white"
            >
              <option value="Delivered">Delivered</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="col-span-full">
            <label htmlFor="addedBy" className="block text-sm font-medium text-gray-700 mb-1">Added By</label>
            <input
              type="text"
              id="addedBy"
              name="addedBy"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm bg-gray-100 cursor-not-allowed"
              value={formData.addedBy}
              readOnly // Make this field read-only
            />
          </div>
          {error && <p className="col-span-full text-red-500 text-sm mt-2">{error}</p>}
          <div className="col-span-full flex justify-end gap-4 mt-6">
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
              {initialData ? 'Update Arrival' : 'Add Arrival'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for viewing arrival entry details
const ViewArrivalModal = ({ isOpen, onClose, entry }) => {
  if (!isOpen || !entry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Arrival Details</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-gray-700">
          <div className="font-medium">ID:</div><div className="font-semibold text-gray-900">{entry.id}</div>
          <div className="font-medium">Quantity:</div><div>{formatNumberForDisplay(entry.quantity)} Tons</div>
          <div className="font-medium">Arrived Date:</div><div>{entry.arrivedDate}</div>
          <div className="font-medium">Price/Ton:</div><div>${formatNumberForDisplay(entry.pricePerTon)}</div>
          <div className="font-medium">Place Arrived:</div><div>{entry.placeArrived}</div>
          <div className="font-medium">Truck Driver:</div><div>{entry.truckDriver}</div>
          <div className="font-medium">Invoice ID:</div><div>{entry.invoiceId}</div>
          <div className="font-medium">Invoice Date:</div><div>{entry.invoiceDate}</div>
          <div className="font-medium">Sender Name:</div><div>{entry.senderName}</div>
          <div className="font-medium">Fee/Ton:</div><div>${formatNumberForDisplay(entry.feePerTon)}</div>
          <div className="font-medium">Total Fee:</div><div>${formatNumberForDisplay(entry.totalFee)}</div>
          <div className="font-medium">Total Ton Price:</div><div>${formatNumberForDisplay(entry.totalTonPrice)}</div>
          <div className="font-medium text-xl col-span-2 mt-2">Total Price: <span className="font-bold text-blue-600">${formatNumberForDisplay(entry.totalPrice)}</span></div>
          <div className="font-medium">Status:</div>
          <div className="col-span-1">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              entry.status === 'Delivered'
                ? 'bg-green-100 text-green-700'
                : entry.status === 'In Progress'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {entry.status}
            </span>
          </div>
          <div className="font-medium">Added By:</div><div>{entry.addedBy}</div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


const Arrived = () => {
  const [data, setData] = useState([]); // Initialize with empty array, data will be fetched from backend
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // State to store logged-in user

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showSuccessInfoModal, setShowSuccessInfoModal] = useState(false);

  // --- Fetch initial data from backend on component mount ---
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
        console.error("Error fetching arrived data:", error);
        setActionSuccessMessage(`Failed to load data: ${error.message}`);
        setShowSuccessInfoModal(true);
      }
    };

    fetchArrivedData();

    // Get current user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        localStorage.removeItem('user');
      }
    }
  }, []); // Empty dependency array means this runs only once on mount

  // --- Socket.IO for real-time updates ---
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

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);


  // Handlers for Add/Edit/Save
  const handleSaveEntry = async (entryToSave) => {
    try {
      let response;
      let method;
      let url;

      if (editingEntry) {
        // Update existing entry
        method = 'PUT';
        url = `${API_BASE_URL}/arrived/${editingEntry.id}`;
      } else {
        // Add new entry
        method = 'POST';
        url = `${API_BASE_URL}/arrived`;
        // Ensure addedBy is set from current user for new entries
        entryToSave.addedBy = currentUser?.username || 'Unknown';
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
      setActionSuccessMessage(`Arrival record for Invoice ID "${entryToSave.invoiceId}" ${editingEntry ? 'updated' : 'added'} successfully!`);
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
      const response = await fetch(`${API_BASE_URL}/arrived/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage('Arrival record deleted successfully!');
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

  // Handler for Print (using window.print())
  const handlePrint = () => {
    window.print();
  };

  // Handler for Download (using InfoModal as placeholder)
  const handleDownload = () => {
    setShowDownloadInfoModal(true);
  };

  // Filter data based on search and date
  const filteredData = data.filter(
    (item) =>
      (item.placeArrived.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      item.truckDriver.toLowerCase().includes(search.toLowerCase()) ||
      item.senderName.toLowerCase().includes(search.toLowerCase()) ||
      item.status.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDate || item.arrivedDate.startsWith(filterDate))
  ).sort((a, b) => new Date(b.arrivedDate) - new Date(a.arrivedDate)); // Sort by date descending

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        🧂 Salt Arrived Records
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="Search by place, invoice, driver, sender, or status"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-96 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
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
          onClick={() => { setEditingEntry(null); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> Add New Arrival
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3">Arrived Date</th>
              <th className="px-5 py-3">Price/Ton</th>
              <th className="px-5 py-3">Place</th>
              <th className="px-5 py-3">Driver</th>
              <th className="px-5 py-3">Invoice ID</th>
              <th className="px-5 py-3">Invoice Date</th>
              <th className="px-5 py-3">Sender</th>
              <th className="px-5 py-3">Fee/Ton</th>
              <th className="px-5 py-3">Total Fee</th>
              <th className="px-5 py-3">Total Ton Price</th>
              <th className="px-5 py-3">Total Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Added By</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.quantity)}</td>
                  <td className="px-5 py-3">{item.arrivedDate}</td>
                  <td className="px-5 py-3">${formatNumberForDisplay(item.pricePerTon)}</td>
                  <td className="px-5 py-3">{item.placeArrived}</td>
                  <td className="px-5 py-3">{item.truckDriver}</td>
                  <td className="px-5 py-3">{item.invoiceId}</td>
                  <td className="px-5 py-3">{item.invoiceDate}</td>
                  <td className="px-5 py-3">{item.senderName}</td>
                  <td className="px-5 py-3">${formatNumberForDisplay(item.feePerTon)}</td>
                  <td className="px-5 py-3">${formatNumberForDisplay(item.totalFee)}</td>
                  <td className="px-5 py-3">${formatNumberForDisplay(item.totalTonPrice)}</td>
                  <td className="px-5 py-3 font-bold text-blue-600">${formatNumberForDisplay(item.totalPrice)}</td>
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
                      {item.status}
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
                  No records found. Try adjusting your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddEditArrivalModal
        isOpen={showAddEditModal}
        onClose={() => { setShowAddEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
        currentUser={currentUser} // Pass current user to the modal
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
        title="Confirm Deletion"
        message={`Are you sure you want to delete the arrival record for Invoice ID "${data.find(d => d.id === deletingEntryId)?.invoiceId || 'this entry'}"? This action cannot be undone.`}
      />

      <InfoModal
        isOpen={showDownloadInfoModal}
        onClose={() => setShowDownloadInfoModal(false)}
        title="Download Functionality"
        message="The download feature is currently under development. You can use the 'Print' option to generate a printable view."
      />

      <InfoModal
        isOpen={showSuccessInfoModal} // Using this modal for general success messages
        onClose={() => setShowSuccessInfoModal(false)}
        title="Action Complete"
        message={actionSuccessMessage}
      />
    </div>
  );
};

export default Arrived;
