'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Product } from '@/lib/data/types';
import { resolveImageUrl } from '@/lib/photos';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products?status=any');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.items || [];
        setProducts(list);
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => Array.isArray(prev) ? prev.filter(p => p.id !== id) : []);
      } else {
        alert('Failed to delete product');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const productList = Array.isArray(products) ? products : [];
  const filteredProducts = productList.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#3A2118]">Products</h1>
          <Link href="/admin/products/new" className="bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90">
            Add Product
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search products..."
            className="border border-[#E8DDCA] rounded-md px-4 py-2 flex-1 focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-[#E8DDCA] rounded-md px-4 py-2 focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="text-[#3A2118]">Loading...</div>
        ) : (
          <div className="overflow-x-auto bg-[#FAF8F3] rounded-lg shadow border border-[#E8DDCA]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#E8DDCA] text-[#3A2118]">
                  <th className="p-4 border-b border-[#E8DDCA]">Image</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Name</th>
                  <th className="p-4 border-b border-[#E8DDCA]">SKU</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Price</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Stock</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Status</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white border-b border-[#E8DDCA]">
                    <td className="p-4">
                      {product.images[0] ? (
                        <img src={resolveImageUrl(product.images[0].url)} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      )}
                    </td>
                    <td className="p-4 text-[#3A2118] font-medium">{product.name}</td>
                    <td className="p-4 text-[#3A2118]">{product.sku}</td>
                    <td className="p-4 text-[#3A2118]">₹{(product.price / 100).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      {product.stock === 0 ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">Out of Stock</span>
                      ) : product.stock < product.lowStockThreshold ? (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Low Stock ({product.stock})</span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">In Stock ({product.stock})</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        product.status === 'published' ? 'bg-green-100 text-green-800' : 
                        product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <Link href={`/admin/products/${product.id}/edit`} className="text-[#B78332] hover:underline font-medium">Edit</Link>
                        <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:underline font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">No products found.</td>
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
