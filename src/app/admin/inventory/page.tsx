'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'components'>('products');

  useEffect(() => {
    fetch('/api/admin/inventory')
      .then(res => res.json())
      .then(data => {
        setItems(data.products || []);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-6">Inventory Management</h1>
        
        <div className="flex gap-4 mb-6 border-b border-sand">
          <button 
            className={`pb-2 px-1 font-medium ${tab === 'products' ? 'text-gold border-b-2 border-gold' : 'text-gray-500'}`}
            onClick={() => setTab('products')}
          >
            Products
          </button>
          <button 
            className={`pb-2 px-1 font-medium ${tab === 'components' ? 'text-gold border-b-2 border-gold' : 'text-gray-500'}`}
            onClick={() => setTab('components')}
          >
            Kit Components
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ivory border-b border-sand">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-sand">
                    <td className="p-4">{item.name}</td>
                    <td className="p-4">{item.sku}</td>
                    <td className="p-4">{item.stock}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.stock > (item.lowStockThreshold || 5) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.stock > (item.lowStockThreshold || 5) ? 'In Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-gold hover:underline">Adjust Stock</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No inventory items found.</td>
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
