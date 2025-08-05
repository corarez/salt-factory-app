
import React, { useState } from 'react';
import { Printer, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const SaltSold = () => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState({ day: '', month: '', year: '' });

  const today = new Date().toISOString().split('T')[0];
  const allData = [
    {
      id: 1,
      buyerName: 'Rashid Group',
      invoiceId: 'INV-1001',
      date: '2025-08-01',
      items: [
        { saltType: 'Fine', quantity: 5, pricePerTon: 100 },
        { saltType: 'Coarse', quantity: 2, pricePerTon: 90 }
      ]
    },
    {
      id: 2,
      buyerName: 'Kurd Salt Co.',
      invoiceId: 'INV-1002',
      date: '2025-08-03',
      items: [
        { saltType: 'Refined', quantity: 4, pricePerTon: 110 }
      ]
    }
  ];

  const filteredData = allData
    .filter((entry) =>
      entry.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      entry.invoiceId.toLowerCase().includes(search.toLowerCase())
    )
    .filter((entry) => {
      if (filter.year && !entry.date.startsWith(filter.year)) return false;
      if (filter.month && !entry.date.includes(`-${filter.month.padStart(2, '0')}-`)) return false;
      if (filter.day && !entry.date.endsWith(`-${filter.day.padStart(2, '0')}`)) return false;
      return true;
    });

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getTotal = (items) =>
    items.reduce((total, item) => total + item.quantity * item.pricePerTon, 0);

  const handlePrint = (id) => {
    const element = document.getElementById(`card-${id}`);
    if (!element) return;
    html2canvas(element).then((canvas) => {
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(img, 'PNG', 10, 10, 190, 0);
      pdf.save(`Salt_Sale_${id}.pdf`);
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🧾 Salt Sold</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search by buyer or invoice..."
          className="border px-4 py-2 rounded w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Day"
          className="border px-2 py-2 rounded w-20"
          maxLength={2}
          value={filter.day}
          onChange={(e) => setFilter({ ...filter, day: e.target.value })}
        />
        <input
          type="text"
          placeholder="Month"
          className="border px-2 py-2 rounded w-20"
          maxLength={2}
          value={filter.month}
          onChange={(e) => setFilter({ ...filter, month: e.target.value })}
        />
        <input
          type="text"
          placeholder="Year"
          className="border px-2 py-2 rounded w-24"
          maxLength={4}
          value={filter.year}
          onChange={(e) => setFilter({ ...filter, year: e.target.value })}
        />
      </div>

      <div className="space-y-6">
        {filteredData.map((entry) => (
          <div key={entry.id} id={`card-${entry.id}`} className="bg-gradient-to-tr from-white to-slate-50 shadow-lg border border-slate-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpanded(entry.id)}
            >
              <div>
                <h2 className="text-2xl font-bold text-blue-800 flex items-center gap-2">{entry.buyerName}</h2>
                <p className="text-sm text-gray-500">Invoice: {entry.invoiceId} • Date: {entry.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handlePrint(entry.id); }} className="text-sm px-3 py-1 border rounded-full border-blue-300 bg-white text-blue-700 hover:bg-blue-50 transition">
                  <Printer size={16} /> Print
                </button>
                {expanded[entry.id] ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {expanded[entry.id] && (
              <div className="mt-4">
                <table className="w-full text-sm text-left mt-2 border border-slate-300 rounded-xl overflow-hidden">
                  <thead className="bg-blue-100 text-blue-900 font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">#</th>
                      <th className="px-4 py-3 border-b border-slate-200">Salt Type</th>
                      <th className="px-4 py-3 border-b border-slate-200">Qty (Ton)</th>
                      <th className="px-4 py-3 border-b border-slate-200">Price/Ton</th>
                      <th className="px-4 py-3 border-b border-slate-200">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3 border-b border-slate-200">{index + 1}</td>
                        <td className="px-4 py-3 border-b border-slate-200">{item.saltType}</td>
                        <td className="px-4 py-3 border-b border-slate-200">{item.quantity}</td>
                        <td className="px-4 py-3 border-b border-slate-200">${item.pricePerTon}</td>
                        <td className="px-4 py-3 font-bold text-green-800 bg-green-50 border-b border-slate-200">
                          ${item.quantity * item.pricePerTon}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right mt-4 text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded border border-blue-100">
                  Total: ${getTotal(entry.items)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaltSold;
