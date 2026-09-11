'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Category } from '@/lib/data/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
      } else {
        alert('Failed to delete category');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setName(category.name);
      setSlug(category.slug);
      setParentId(category.parentId || '');
      setDescription(category.description);
      setSortOrder(category.sortOrder.toString());
      setIsActive(category.isActive);
    } else {
      setEditingId(null);
      setName('');
      setSlug('');
      setParentId('');
      setDescription('');
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
      parentId: parentId || null,
      description,
      sortOrder: parseInt(sortOrder, 10),
      isActive
    };

    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        fetchCategories();
        closeModal();
      } else {
        alert('Failed to save category');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AdminShell>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#3A2118]">Categories</h1>
          <button 
            onClick={() => openModal()} 
            className="bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90"
          >
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="text-[#3A2118]">Loading...</div>
        ) : (
          <div className="overflow-x-auto bg-[#FAF8F3] rounded-lg shadow border border-[#E8DDCA]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#E8DDCA] text-[#3A2118]">
                  <th className="p-4 border-b border-[#E8DDCA]">Name</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Slug</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Parent</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Order</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Status</th>
                  <th className="p-4 border-b border-[#E8DDCA]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white border-b border-[#E8DDCA]">
                    <td className="p-4 text-[#3A2118] font-medium">{cat.name}</td>
                    <td className="p-4 text-[#3A2118]">{cat.slug}</td>
                    <td className="p-4 text-[#3A2118]">
                      {cat.parentId ? categories.find(c => c.id === cat.parentId)?.name || cat.parentId : '-'}
                    </td>
                    <td className="p-4 text-[#3A2118]">{cat.sortOrder}</td>
                    <td className="p-4">
                      {cat.isActive ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">Active</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <button onClick={() => openModal(cat)} className="text-[#B78332] hover:underline font-medium">Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-red-600 hover:underline font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">No categories found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-[#FAF8F3] rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#E8DDCA] flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-[#3A2118]">{editingId ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                  <label className="block text-sm font-medium text-[#3A2118] mb-1">Parent Category</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c.id !== editingId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3A2118] mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full border border-[#E8DDCA] rounded-md px-3 py-2 focus:outline-none focus:border-[#B78332]"
                  ></textarea>
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
              <button type="submit" form="category-form" className="px-4 py-2 bg-[#B78332] text-white rounded-md hover:bg-opacity-90">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
