
import React, { useState } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle } from 'lucide-react';

const initialData = [
  {
    id: 1,
    saltType: 'Refined',
    quantity: 12,
    date: '2025-08-05',
    note: 'Morning shift'
  },
  {
    id: 2,
    saltType: 'Industrial',
    quantity: 20,
    date: '2025-08-04',
    note: 'Evening shift'
  }
];

const SaltProduced = () => {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    saltType: '',
    quantity: '',
    date: '',
    note: ''
  });

  const filteredData = data.filter(
    (item) =>
      item.saltType.toLowerCase().includes(search.toLowerCase()) ||
      item.note.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const newData = {
      ...newEntry,
      id: data.length + 1
    };
    setData([...data, newData]);
    setShowModal(false);
    setNewEntry({ saltType: '', quantity: '', date: '', note: '' });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setData(data.filter(item => item.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">🏭 Salt Produced</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <PlusCircle size={18} /> Add New
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by type or note"
        className="mb-4 px-4 py-2 border rounded w-72"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table className="min-w-full w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Salt Type</th>
              <th className="px-4 py-3">Quantity (Ton)</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-semibold">{item.id}</td>
                <td className="px-4 py-2">{item.saltType}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2">{item.note}</td>
                <td className="px-4 py-2 flex gap-2 text-gray-600">
                  <Edit size={16} className="cursor-pointer hover:text-blue-600" />
                  <Printer size={16} className="cursor-pointer hover:text-gray-800" />
                  <Download size={16} className="cursor-pointer hover:text-green-700" />
                  <Trash2 size={16} onClick={() => handleDelete(item.id)} className="cursor-pointer hover:text-red-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 relative">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Produced Salt</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Salt Type</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={newEntry.saltType}
                  onChange={(e) => setNewEntry({ ...newEntry, saltType: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity (Ton)</label>
                <input
                  type="number"
                  className="w-full border px-3 py-2 rounded"
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border px-3 py-2 rounded"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Note</label>
                <textarea
                  className="w-full border px-3 py-2 rounded"
                  value={newEntry.note}
                  onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 mr-2 rounded border border-gray-400 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaltProduced;
