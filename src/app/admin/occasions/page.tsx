'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Occasion } from '@/lib/data/types';

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchOccasions();
  }, []);

  const fetchOccasions = async () => {
    try {
      const res = await fetch('/api/admin/occasions');
      if (res.ok) {
        const data = await res.json();
        setOccasions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteOccasion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this occasion?')) return;
    try {
      const res = await fetch(`/api/admin/occasions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setOccasions(occasions.filter(o => o.id !== id));
      } else {
        alert('Failed to delete occasion');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (occasion?: Occasion) => {
    if (occasion) {
      setEditingId(occasion.id);
      setName(occasion.name);
      setSlug(occasion.slug);
      setTagline(occasion.tagline);
      setDescription(occasion.description);
      setImageUrl(occasion.imageUrl);
      setIcon(occasion.icon);
      setSortOrder(occasion.sortOrder.toString());
      setIsActive(occasion.isActive);
    } else {
      setEditingId(null);
      setName('');
      setSlug('');
      setTagline('');
      setDescription('');
      setImageUrl('');
      setIcon('');
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
      tagline,
      description,
      imageUrl,
      icon,
      sortOrder: parseInt(sortOrder, 10),
      isActive
    };

    try {
      const url = editingId ? `/api/admin/occasions/${editingId}` : '/api/admin/occasions';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchOccasions();
        closeModal();
      } else {
        alert('Failed to save occasion');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#3A2118]">Occasions</h1>
          <button 
            onClick={() => openModal()} 
            className="bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90"
          >
            Add Occasion
          </button>
        </div>

        {loading ? (
          <div className="text-[#3A2118]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {occasions.map((occ) => (
              <div key={occ.id} className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden flex flex-col">
                {occ.imageUrl ? (
                  <div className="h-40 bg-gray-200 w-full">
                    <img src={occ.imageUrl} alt={occ.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-[#E8DDCA] w-full flex items-center justify-center text-[#B78332]">
                    No Image
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-[#3A2118]">{occ.name}</h3>
                    {!occ.isActive && (
                      <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-[#B78332] mb-3 font-medium">{occ.tagline}</p>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">{occ.description}</p>
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-[#E8DDCA]">
                    <span className="text-xs text-gray-500">Order: {occ.sortOrder}</span>
                    <div className="flex gap-3">
                      <button onClick={() => openModal(occ)} className="text-[#B78332] hover:underline text-sm font-medium">Edit</button>
                      <button onClick={() => deleteOccasion(occ.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {occasions.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-[#FAF8F3] rounded-lg border border-[#E8DDCA]">
                No occasions found.
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-[#FAF8F3] rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8DDCA] flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-[#3A2118]">{editingId ? 'Edit Occasion' : 'Add Occasion'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="occasion-form" onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="e.g. Flame"
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
              <button type="submit" form="occasion-form" className="px-4 py-2 bg-[#B78332] text-white rounded-md hover:bg-opacity-90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
