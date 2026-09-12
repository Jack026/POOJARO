'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Review, Product } from '@/lib/data/types';
import { Star, CheckCircle, XCircle, Trash2, Search, Filter, AlertCircle, MessageSquare } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, prodRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/products?status=any'),
      ]);

      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(Array.isArray(data) ? data : data?.items || []);
      }
      if (prodRes.ok) {
        const pData = await prodRes.json();
        const list: Product[] = Array.isArray(pData) ? pData : pData?.items || [];
        const map: Record<string, string> = {};
        list.forEach((p) => {
          map[p.id] = p.name;
        });
        setProducts(map);
      }
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'published' | 'rejected' | 'pending') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      } else {
        alert('Failed to update review status');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, authorName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the review by "${authorName}"?`)) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert('Failed to delete review');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting review');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const prodName = products[r.productId] || '';
    const q = search.toLowerCase();
    const matchesSearch =
      r.authorName.toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.body || '').toLowerCase().includes(q) ||
      prodName.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#B78332]" />
              Customer Reviews & Moderation
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Approve, reject, or moderate authentic feedback submitted for puja kits and items.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              {pendingCount} review{pendingCount > 1 ? 's' : ''} awaiting moderation
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E8DDCA] flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, title, comment, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E8DDCA] rounded-md focus:outline-none focus:border-[#B78332] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-[#E8DDCA] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
            >
              <option value="all">All ({reviews.length})</option>
              <option value="pending">Pending Moderation ({reviews.filter((r) => r.status === 'pending').length})</option>
              <option value="published">Published ({reviews.filter((r) => r.status === 'published').length})</option>
              <option value="rejected">Rejected ({reviews.filter((r) => r.status === 'rejected').length})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading reviews...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Feedback</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA] text-sm">
                  {filteredReviews.map((r) => {
                    const productName = products[r.productId] || r.productId;

                    return (
                      <tr key={r.id} className="hover:bg-[#FAF8F3]/60 transition">
                        <td className="p-4">
                          <div className="font-semibold text-[#3A2118]">{r.authorName}</div>
                          {r.city && <div className="text-xs text-gray-500">{r.city}</div>}
                          {r.verifiedPurchase && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Verified Buyer
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-700 max-w-xs truncate">
                          {productName}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center text-[#B78332]">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < r.rating ? 'fill-[#B78332]' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-400 mt-0.5 block">
                            {new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </td>
                        <td className="p-4 max-w-md">
                          {r.title && (
                            <div className="font-medium text-xs text-[#3A2118] mb-0.5">
                              {r.title}
                            </div>
                          )}
                          <p className="text-xs text-gray-600 line-clamp-2">{r.body}</p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              r.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : r.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {r.status !== 'published' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'published')}
                              disabled={actionLoading === r.id}
                              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded transition"
                              title="Approve Review"
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'rejected')}
                              disabled={actionLoading === r.id}
                              className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded transition"
                              title="Reject Review"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id, r.authorName)}
                            disabled={actionLoading === r.id}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition inline-flex items-center"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReviews.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No reviews found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
