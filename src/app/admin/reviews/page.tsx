'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Review } from '@/lib/data/types';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reviews')
      .then(res => res.json())
      .then(data => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    setReviews(reviews.map(r => r.id === id ? { ...r, status: status as any } : r));
  };

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-6">Reviews</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ivory border-b border-sand">
                  <th className="p-4 font-medium">Product / Author</th>
                  <th className="p-4 font-medium">Rating</th>
                  <th className="p-4 font-medium">Review</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} className="border-b border-sand">
                    <td className="p-4">
                      <div className="font-medium text-charcoal">{r.authorName}</div>
                      <div className="text-xs text-gray-500">Product ID: {r.productId}</div>
                    </td>
                    <td className="p-4 text-gold">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</td>
                    <td className="p-4">
                      <div className="font-medium text-sm">{r.title}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">{r.body}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        r.status === 'published' ? 'bg-green-100 text-green-800' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 space-x-2">
                      {r.status !== 'published' && (
                        <button onClick={() => handleUpdateStatus(r.id, 'published')} className="text-green-600 hover:underline text-sm">Approve</button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => handleUpdateStatus(r.id, 'rejected')} className="text-red-600 hover:underline text-sm">Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No reviews found.</td>
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
