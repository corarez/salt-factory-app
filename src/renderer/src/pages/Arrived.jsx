
import React, { useState } from 'react';
import { Edit, Trash2, Printer, Download, PlusCircle, X ,Eye } from 'lucide-react';
import GlobalModal from '../components/GlobalModal';

const initialData = [
  {
    id: 1,
    quantity: 20,
    arrivedDate: '2025-08-05',
    pricePerTon: 150,
    placeArrived: 'Erbil',
    truckDriver: 'Kamal Ali',
    invoiceId: 'INV-001',
    invoiceDate: '2025-08-05',
    senderName: 'Salt Co.',
    feePerTon: 10,
    totalFee: 200,
    totalTonPrice: 3000,
    totalPrice: 3200,
    status: 'Delivered',
    addedBy: 'admin'
  }
];

const Arrived = () => {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    quantity: '',
    arrivedDate: '',
    pricePerTon: '',
    placeArrived: '',
    truckDriver: '',
    invoiceId: '',
    invoiceDate: '',
    senderName: '',
    feePerTon: '',
    status: 'Delivered',
    addedBy: ''
  });

  const handleAdd = () => {
    const totalFee = newEntry.feePerTon * newEntry.quantity;
    const totalTonPrice = newEntry.pricePerTon * newEntry.quantity;
    const totalPrice = totalFee + totalTonPrice;
    setData([
      ...data,
      {
        id: data.length + 1,
        ...newEntry,
        totalFee,
        totalTonPrice,
        totalPrice
      }
    ]);
    setNewEntry({
      quantity: '',
      arrivedDate: '',
      pricePerTon: '',
      placeArrived: '',
      truckDriver: '',
      invoiceId: '',
      invoiceDate: '',
      senderName: '',
      feePerTon: '',
      status: 'Delivered',
      addedBy: ''
    });
    setShowModal(false);
  };

  const filteredData = data.filter(
    (item) =>
      (item.placeArrived.toLowerCase().includes(search.toLowerCase()) ||
      item.invoiceId.toLowerCase().includes(search.toLowerCase())) &&
      (!filterDate || item.arrivedDate.startsWith(filterDate))
  );
const [selectedItem, setSelectedItem] = useState(null);
const [status, setStatus] = useState('Unpaid');
const [oldDebt, setOldDebt] = useState(0);

const handleViewClick = (item) => {
  setSelectedItem(item);
};
const closeModal = () => setSelectedItem(null);
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">🧂 Salt Arrived</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <PlusCircle size={18} /> Add New Arrival
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by place or invoice ID"
          className="px-4 py-2 border rounded w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-4 py-2 border rounded"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table className="min-w-[1200px] w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Arrived Date</th>
              <th className="px-4 py-3">Price/Ton</th>
              <th className="px-4 py-3">Place</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Invoice ID</th>
              <th className="px-4 py-3">Invoice Date</th>
              <th className="px-4 py-3">Sender</th>
              <th className="px-4 py-3">Fee/Ton</th>
              <th className="px-4 py-3">Total Fee</th>
              <th className="px-4 py-3">Total Ton Price</th>
              <th className="px-4 py-3">Total Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added By</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-semibold">{item.id}</td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">{item.arrivedDate}</td>
                <td className="px-4 py-2">${item.pricePerTon}</td>
                <td className="px-4 py-2">{item.placeArrived}</td>
                <td className="px-4 py-2">{item.truckDriver}</td>
                <td className="px-4 py-2">{item.invoiceId}</td>
                <td className="px-4 py-2">{item.invoiceDate}</td>
                <td className="px-4 py-2">{item.senderName}</td>
                <td className="px-4 py-2">${item.feePerTon}</td>
                <td className="px-4 py-2">${item.totalFee}</td>
                <td className="px-4 py-2">${item.totalTonPrice}</td>
                <td className="px-4 py-2 font-bold">${item.totalPrice}</td>
               <td className="px-4 py-2 flex items-center gap-1">
  <span className={`px-2 py-1 rounded text-xs font-semibold ${
    item.status === 'Delivered'
      ? 'bg-green-100 text-green-700'
      : item.status === 'In Progress'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-200 text-gray-800'
  }`}>
    {item.status}
  </span>
  <Eye
    size={16}
    className="cursor-pointer text-gray-500 hover:text-blue-600"
    onClick={() => handleViewClick(item)}
  />
</td>

                <td className="px-4 py-2">{item.addedBy}</td>
                <td className="px-4 py-2 flex gap-2 text-gray-600">
                  <Edit size={16} />
                  <Printer size={16} />
                  <Download size={16} />
                  <Trash2 size={16} onClick={() => {
                    if (confirm('Delete this item?')) {
                      setData(data.filter(d => d.id !== item.id));
                    }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500">
              <X />
            </button>
            <h2 className="text-xl font-semibold mb-4">Add New Salt Arrival</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Quantity', name: 'quantity', type: 'number' },
                { label: 'Arrived Date', name: 'arrivedDate', type: 'date' },
                { label: 'Price/Ton', name: 'pricePerTon', type: 'number' },
                { label: 'Place Arrived', name: 'placeArrived' },
                { label: 'Truck Driver', name: 'truckDriver' },
                { label: 'Invoice ID', name: 'invoiceId' },
                { label: 'Invoice Date', name: 'invoiceDate', type: 'date' },
                { label: 'Sender', name: 'senderName' },
                { label: 'Fee/Ton', name: 'feePerTon', type: 'number' },
                { label: 'Added By', name: 'addedBy' }
              ].map(({ label, name, type = 'text' }) => (
                <div key={name}>
                  <label className="text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    className="w-full mt-1 px-3 py-2 border rounded"
                    value={newEntry[name]}
                    onChange={(e) => setNewEntry({ ...newEntry, [name]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Entry</button>
            </div>
          </div>
        </div>
      )}
      <GlobalModal
  isOpen={!!selectedItem}
  onClose={() => setSelectedItem(null)}
  item={selectedItem}
  status={status}
  setStatus={setStatus}
  oldDebt={oldDebt}
  setOldDebt={setOldDebt}
/>
    </div>
  );
};

export default Arrived;
