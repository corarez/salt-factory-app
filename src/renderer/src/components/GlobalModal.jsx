
import React from 'react';
import { X } from 'lucide-react';

const GlobalModal = ({ isOpen, onClose, item, status, setStatus, oldDebt, setOldDebt, onSave }) => {
  if (!isOpen || !item) return null;

  const total = item.totalPrice + Number(oldDebt || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[600px] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* Left Sidebar */}
          <div className="bg-blue-100 p-6 w-full md:w-1/3 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Salt Arrival Info</h2>
              <p className="text-sm text-blue-900"><strong>Place:</strong> {item.placeArrived}</p>
              <p className="text-sm text-blue-900"><strong>Driver:</strong> {item.truckDriver}</p>
              <p className="text-sm text-blue-900"><strong>Invoice:</strong> {item.invoiceId}</p>
              <p className="text-sm text-blue-900"><strong>Status:</strong> {item.status}</p>
              <p className="text-sm text-blue-900"><strong>Added By:</strong> {item.addedBy}</p>
            </div>
          </div>

          {/* Right Form */}
          <div className="p-6 w-full md:w-2/3 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500">
              <X />
            </button>

            <h2 className="text-xl font-semibold mb-6 text-gray-800">Update Payment</h2>

            <div className="space-y-6">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
                <select
                  className="w-full border px-4 py-2 rounded bg-gray-50"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Old Debt</label>
                <input
                  type="number"
                  className="w-full border px-4 py-2 rounded"
                  value={oldDebt}
                  onChange={(e) => setOldDebt(e.target.value)}
                  placeholder="Enter old debt"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Total (Including Old Debt)</label>
                <input
                  type="text"
                  className="w-full border px-4 py-2 rounded bg-gray-100 text-gray-800"
                  readOnly
                  value={`$${total.toFixed(2)}`}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-400 text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GlobalModal;
