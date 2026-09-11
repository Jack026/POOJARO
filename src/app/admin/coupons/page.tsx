'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Coupon } from '@/lib/data/types';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then(res => res.json())
      .then(data => {
        setCoupons(Array.isArray(data) ? data : (data?.items || []));
        setLoading(false);
      }).catch(() => {
        setCoupons([]);
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Coupons</h1>
          <button className="bg-gold text-white px-4 py-2 rounded-md hover:bg-gold/90 transition">
            Create Coupon
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ivory border-b border-sand">
                  <th className="p-4 font-medium">Code</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Value</th>
                  <th className="p-4 font-medium">Usage</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b border-sand hover:bg-ivory/50">
                    <td className="p-4 font-medium">{c.code}</td>
                    <td className="p-4 capitalize">{c.type}</td>
                    <td className="p-4">
                      {c.type === 'percentage' ? `${c.value}%` : `₹${(c.value/100).toLocaleString('en-IN')}`}
                    </td>
                    <td className="p-4">{c.usageCount} / {c.usageLimit || '∞'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 space-x-2">
                      <button className="text-gold hover:underline">Edit</button>
                      <button className="text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No coupons found.</td>
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
