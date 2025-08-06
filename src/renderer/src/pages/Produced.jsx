import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle, X } from 'lucide-react';
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

// Modal for adding or editing a produced salt entry
const AddEditProducedModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState(initialData || {
    saltType: '',
    quantity: '',
    date: new Date().toISOString().split('T')[0], // Default to current date
    note: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialData || {
      saltType: '',
      quantity: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
    setError('');
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.saltType || !formData.quantity || !formData.date) {
      setError('Salt Type, Quantity, and Date are required.');
      return;
    }
    if (parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors rounded-full p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
          {initialData ? 'Edit Produced Salt' : 'Add New Produced Salt'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="saltType" className="block text-sm font-medium text-gray-700 mb-1">Salt Type</label>
            <input
              type="text"
              id="saltType"
              name="saltType"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              value={formData.saltType}
              onChange={handleChange}
              placeholder="e.g., Refined, Industrial"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity (Ton)</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g., 12"
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
              placeholder="e.g., Morning shift, Quality check passed"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {initialData ? 'Update Record' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SaltProduced = () => {
  const [data, setData] = useState([]); // Initialize with empty array, data will be fetched from backend
  const [search, setSearch] = useState('');

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showSuccessInfoModal, setShowSuccessInfoModal] = useState(false);

  // --- Fetch initial data from backend on component mount ---
  useEffect(() => {
    const fetchProducedData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/produced`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fetchedData = await response.json();
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching produced data:", error);
        setActionSuccessMessage(`Failed to load data: ${error.message}`);
        setShowSuccessInfoModal(true);
      }
    };

    fetchProducedData();
  }, []); // Empty dependency array means this runs only once on mount

  // --- Socket.IO for real-time updates ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('produced:added', (newEntry) => {
      setData(prevData => [...prevData, newEntry]);
    });

    socket.on('produced:updated', (updatedEntry) => {
      setData(prevData => prevData.map(item => item.id === updatedEntry.id ? updatedEntry : item));
    });

    socket.on('produced:deleted', (deletedId) => {
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
        url = `${API_BASE_URL}/produced/${editingEntry.id}`;
      } else {
        // Add new entry
        method = 'POST';
        url = `${API_BASE_URL}/produced`;
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
      setActionSuccessMessage(`Production record for "${entryToSave.saltType}" ${editingEntry ? 'updated' : 'added'} successfully!`);
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
      const response = await fetch(`${API_BASE_URL}/produced/${deletingEntryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setActionSuccessMessage('Production record deleted successfully!');
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

  // Filter data based on search
  const filteredData = data.filter(
    (item) =>
      item.saltType.toLowerCase().includes(search.toLowerCase()) ||
      item.note.toLowerCase().includes(search.toLowerCase()) ||
      item.date.includes(search) // Allow searching by date substring
  ).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans antialiased">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
        🏭 Salt Produced Records
      </h1>

      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-8 items-center justify-center">
        <input
          type="text"
          placeholder="Search by salt type, note, or date"
          className="px-5 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => { setEditingEntry(null); setShowAddEditModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          <PlusCircle size={20} /> Add New Production
        </button>
      </div>

      <div className="overflow-x-auto shadow-lg border border-gray-200 rounded-xl">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Salt Type</th>
              <th className="px-5 py-3">Quantity (Ton)</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Note</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-5 py-3 font-semibold text-gray-900">{item.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">{item.saltType}</td>
                  <td className="px-5 py-3">{formatNumberForDisplay(item.quantity)}</td>
                  <td className="px-5 py-3">{item.date}</td>
                  <td className="px-5 py-3 max-w-xs truncate">{item.note}</td> {/* Truncate long notes */}
                  <td className="px-5 py-3 flex gap-3 justify-center">
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
                <td colSpan="6" className="px-5 py-8 text-center text-gray-500 text-lg">
                  No records found. Try adjusting your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddEditProducedModal
        isOpen={showAddEditModal}
        onClose={() => { setShowAddEditModal(false); setEditingEntry(null); }}
        initialData={editingEntry}
        onSave={handleSaveEntry}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => { setShowDeleteConfirmModal(false); setDeletingEntryId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the production record for "${data.find(d => d.id === deletingEntryId)?.saltType || 'this entry'}" on ${data.find(d => d.id === deletingEntryId)?.date || ''}? This action cannot be undone.`}
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

export default SaltProduced;
