'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Festival } from '@/lib/data/types';

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [headline, setHeadline] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accent, setAccent] = useState('#B78332');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchFestivals();
  }, []);

  const fetchFestivals = async () => {
    try {
      const res = await fetch('/api/admin/festivals');
      if (res.ok) {
        const data = await res.json();
        setFestivals(Array.isArray(data) ? data : (data?.items || []));
      }
    } catch (e) {
      console.error(e);
      setFestivals([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteFestival = async (id: string) => {
    if (!confirm('Are you sure you want to delete this festival?')) return;
    try {
      const res = await fetch(`/api/admin/festivals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFestivals(prev => Array.isArray(prev) ? prev.filter(f => f.id !== id) : []);
      } else {
        alert('Failed to delete festival');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (festival?: Festival) => {
    if (festival) {
      setEditingId(festival.id);
      setName(festival.name);
      setSlug(festival.slug);
      setHeadline(festival.headline);
      setTagline(festival.tagline);
      setDescription(festival.description);
      setImageUrl(festival.imageUrl);
      setIcon(festival.icon);
      setStartDate(festival.startDate ? festival.startDate.substring(0, 10) : '');
      setEndDate(festival.endDate ? festival.endDate.substring(0, 10) : '');
      setAccent(festival.accent);
      setSortOrder(festival.sortOrder.toString());
      setIsActive(festival.isActive);
    } else {
      setEditingId(null);
      setName('');
      setSlug('');
      setHeadline('');
      setTagline('');
      setDescription('');
      setImageUrl('');
      setIcon('');
      setStartDate('');
      setEndDate('');
      setAccent('#B78332');
      setSortOrder('0');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      slug,
      headline,
      tagline,
      description,
      imageUrl,
      icon,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      accent,
      sortOrder: parseInt(sortOrder, 10),
      isActive
    };

    try {
      const url = editingId ? `/api/admin/festivals/${editingId}` : '/api/admin/festivals';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchFestivals();
        closeModal();
      } else {
        alert('Failed to save festival');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#3A2118]">Festivals</h1>
          <button 
            onClick={() => openModal()} 
            className="bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90"
          >
            Add Festival
          </button>
        </div>

        {loading ? (
          <div className="text-[#3A2118]">Loading...</div>
        ) : (
          <div className="overflow-x-auto bg-[#FAF8F3] rounded-lg shadow border border-[#E8DDCA]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#E8DDCA] text-[#3A2118]">
                  <th className="p-4 border-b border-[#E8DDCA]">Name</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Headline</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Dates</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Accent</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Status</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {festivals.map((fest) => (
                  <tr key={fest.id} className="hover:bg-white border-b border-[#E8DDCA]">
                    <td className="p-4 text-[#3A2118] font-medium">{fest.name}</td>
                    <td className="p-4 text-[#3A2118]">{fest.headline}</td>
                    <td className="p-4 text-[#3A2118]">
                      {fest.startDate ? new Date(fest.startDate).toLocaleDateString() : 'N/A'} - 
                      {fest.endDate ? new Date(fest.endDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: fest.accent }}></div>
                        <span className="text-xs text-gray-600">{fest.accent}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {fest.isActive ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Active</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button onClick={() => openModal(fest)} className="text-[#B78332] hover:underline font-medium">Edit</button>
                        <button onClick={() => deleteFestival(fest.id)} className="text-red-600 hover:underline font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {festivals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No festivals found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-[#FAF8F3] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8DDCA] flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-[#3A2118]">{editingId ? 'Edit Festival' : 'Add Festival'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="festival-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingId) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Headline</label>
                    <input
                      type="text"
                      required
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Tagline</label>
                    <input
                      type="text"
                      required
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2118] mb-1">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Image URL</label>
                    <input
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Icon (Lucide name)</label>
                    <input
                      type="text"
                      required
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Accent Color</label>
                    <input
                      type="color"
                      required
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      className="w-full h-10 border border-[#E8DDCA] rounded-md px-1 py-1 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#3A2118] mb-1">Sort Order</label>
                    <input
                      type="number"
                      required
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="mr-2 h-4 w-4 text-[#B78332] focus:ring-[#B78332] border-[#E8DDCA] rounded"
                      />
                      <span className="text-sm font-medium text-[#3A2118]">Active</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-[#E8DDCA] bg-[#FAF8F3] flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 border border-[#E8DDCA] text-[#3A2118] rounded-md hover:bg-white">
                Cancel
              </button>
              <button type="submit" form="festival-form" className="px-4 py-2 bg-[#B78332] text-white rounded-md hover:bg-opacity-90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
