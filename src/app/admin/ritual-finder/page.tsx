'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function RitualFinderPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/recommendation-rules')
      .then(res => res.json())
      .then(data => {
        setRules(Array.isArray(data) ? data : []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Ritual Finder Rules</h1>
          <button className="bg-gold text-white px-4 py-2 rounded-md hover:bg-gold/90 transition">
            Add Rule
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ivory border-b border-sand">
                  <th className="p-4 font-medium">Occasion</th>
                  <th className="p-4 font-medium">People</th>
                  <th className="p-4 font-medium">Level</th>
                  <th className="p-4 font-medium">Recommended Product</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-b border-sand hover:bg-ivory/50">
                    <td className="p-4">{rule.occasionId}</td>
                    <td className="p-4">{rule.minPeople} - {rule.maxPeople}</td>
                    <td className="p-4 capitalize">{rule.level}</td>
                    <td className="p-4">{rule.productId} (Qty: {rule.suggestedQty})</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 space-x-2">
                      <button className="text-gold hover:underline text-sm">Edit</button>
                      <button className="text-red-500 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No recommendation rules found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
