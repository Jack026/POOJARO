'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { RecommendationRule, PreparationLevel, Occasion, Product } from '@/lib/data/types';
import { Plus, Edit2, Trash2, Sparkles, Search, Compass, AlertCircle } from 'lucide-react';

const LEVELS: { id: PreparationLevel; label: string; desc: string }[] = [
  { id: 'essentials', label: 'Essentials', desc: 'Core samagri needed for standard rituals' },
  { id: 'complete', label: 'Complete', desc: 'Full traditional vidhi set with all required items' },
  { id: 'premium', label: 'Grand / Premium', desc: 'Elaborate setup with premium brass & rare herbs' },
];

export default function RitualFinderPage() {
  const [rules, setRules] = useState<RecommendationRule[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecommendationRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [occasionId, setOccasionId] = useState('');
  const [minPeople, setMinPeople] = useState('1');
  const [maxPeople, setMaxPeople] = useState('10');
  const [level, setLevel] = useState<PreparationLevel>('complete');
  const [productId, setProductId] = useState('');
  const [suggestedQty, setSuggestedQty] = useState('1');
  const [reason, setReason] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, occasionsRes, productsRes] = await Promise.all([
        fetch('/api/admin/recommendation-rules'),
        fetch('/api/admin/occasions'),
        fetch('/api/admin/products?status=any'),
      ]);

      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(Array.isArray(data) ? data : data?.items || []);
      }
      if (occasionsRes.ok) {
        const data = await occasionsRes.json();
        setOccasions(Array.isArray(data) ? data : data?.items || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : data?.items || []);
      }
    } catch (e) {
      console.error('Failed to load ritual finder data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRule(null);
    setOccasionId(occasions[0]?.id || '');
    setMinPeople('1');
    setMaxPeople('8');
    setLevel('complete');
    setProductId(products[0]?.id || '');
    setSuggestedQty('1');
    setReason('');
    setSortOrder('0');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: RecommendationRule) => {
    setEditingRule(r);
    setOccasionId(r.occasionId);
    setMinPeople(String(r.minPeople));
    setMaxPeople(String(r.maxPeople));
    setLevel(r.level);
    setProductId(r.productId);
    setSuggestedQty(String(r.suggestedQty || 1));
    setReason(r.reason || '');
    setSortOrder(String(r.sortOrder || 0));
    setIsActive(r.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!occasionId) {
      setError('Please select an occasion.');
      setSaving(false);
      return;
    }

    if (!productId) {
      setError('Please select a recommended product.');
      setSaving(false);
      return;
    }

    const payload = {
      occasionId,
      minPeople: parseInt(minPeople, 10) || 1,
      maxPeople: parseInt(maxPeople, 10) || 10,
      level,
      productId,
      suggestedQty: parseInt(suggestedQty, 10) || 1,
      reason: reason.trim(),
      addOnProductIds: editingRule?.addOnProductIds || [],
      sortOrder: parseInt(sortOrder, 10) || 0,
      isActive,
    };

    try {
      let res;
      if (editingRule) {
        res = await fetch(`/api/admin/recommendation-rules/${editingRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/recommendation-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchData();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save recommendation rule.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: RecommendationRule) => {
    if (!confirm('Are you sure you want to delete this recommendation rule?')) return;

    try {
      const res = await fetch(`/api/admin/recommendation-rules/${r.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRules((prev) => prev.filter((item) => item.id !== r.id));
      } else {
        alert('Failed to delete recommendation rule');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting recommendation rule');
    }
  };

  // Helper lookups
  const getOccasionName = (id: string) => occasions.find((o) => o.id === id)?.name || id;
  const getProduct = (id: string) => products.find((p) => p.id === id);

  const filteredRules = rules.filter((r) => {
    const occName = getOccasionName(r.occasionId).toLowerCase();
    const prodName = (getProduct(r.productId)?.name || '').toLowerCase();
    const reasonText = (r.reason || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = occName.includes(q) || prodName.includes(q) || reasonText.includes(q);
    const matchesOccasion = occasionFilter === 'all' || r.occasionId === occasionFilter;
    const matchesLevel = levelFilter === 'all' || r.level === levelFilter;

    return matchesSearch && matchesOccasion && matchesLevel;
  });

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#B78332]" />
              Ritual Finder Engine
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure intelligent ritual kit recommendations based on occasion, family gathering size, and devotion level.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E8DDCA] flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by occasion, product, or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E8DDCA] rounded-md focus:outline-none focus:border-[#B78332] text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Occasion:</span>
              <select
                value={occasionFilter}
                onChange={(e) => setOccasionFilter(e.target.value)}
                className="border border-[#E8DDCA] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
              >
                <option value="all">All Occasions</option>
                {occasions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Level:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="border border-[#E8DDCA] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
              >
                <option value="all">All Levels</option>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading recommendation rules...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                    <th className="p-4">Occasion</th>
                    <th className="p-4">Attendees</th>
                    <th className="p-4">Preparation Level</th>
                    <th className="p-4">Recommended Product</th>
                    <th className="p-4">Why This Kit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA] text-sm">
                  {filteredRules.map((rule) => {
                    const product = getProduct(rule.productId);
                    return (
                      <tr key={rule.id} className="hover:bg-[#FAF8F3]/60 transition">
                        <td className="p-4 font-semibold text-[#3A2118]">
                          {getOccasionName(rule.occasionId)}
                        </td>
                        <td className="p-4 text-xs font-medium text-gray-700">
                          {rule.minPeople} - {rule.maxPeople} people
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                              rule.level === 'premium'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : rule.level === 'complete'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {rule.level}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-[#3A2118]">
                            {product?.name || rule.productId}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Qty: <span className="font-semibold text-[#B78332]">{rule.suggestedQty}</span>
                            {product?.price ? ` • ₹${(product.price / 100).toLocaleString('en-IN')}` : ''}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs line-clamp-2">
                          {rule.reason || <span className="text-gray-400 italic">No specific reason specified</span>}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              rule.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-1.5 text-[#B78332] hover:bg-[#FAF8F3] rounded transition inline-flex items-center"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition inline-flex items-center"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRules.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No recommendation rules found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl border border-[#E8DDCA] w-full max-w-lg my-8 overflow-hidden">
              <div className="p-4 border-b border-[#E8DDCA] bg-[#FAF8F3] flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#3A2118]">
                  {editingRule ? 'Edit Recommendation Rule' : 'Create Recommendation Rule'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Occasion *
                  </label>
                  <select
                    value={occasionId}
                    onChange={(e) => setOccasionId(e.target.value)}
                    required
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                  >
                    <option value="">Select an Occasion...</option>
                    {occasions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Min Attendees *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={minPeople}
                      onChange={(e) => setMinPeople(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Max Attendees *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={maxPeople}
                      onChange={(e) => setMaxPeople(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Preparation / Devotion Level *
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as PreparationLevel)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                  >
                    {LEVELS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label} ({l.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Recommended Kit / Product *
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                  >
                    <option value="">Select a Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.price ? `(₹${(p.price / 100).toLocaleString('en-IN')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Suggested Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={suggestedQty}
                      onChange={(e) => setSuggestedQty(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Sort Priority
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Reason ("Why this kit")
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Sized appropriately for a family gathering of up to 10 devotees, contains complete havan samagri and pure brass kalash."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div className="pt-2 border-t border-[#E8DDCA]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-[#E8DDCA] text-[#B78332] focus:ring-[#B78332]"
                    />
                    <span className="text-sm font-medium text-[#3A2118]">
                      Rule is Active in the Ritual Finder questionnaire
                    </span>
                  </label>
                </div>

                <div className="p-4 -mx-6 -mb-6 bg-[#FAF8F3] border-t border-[#E8DDCA] flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-[#E8DDCA] text-[#3A2118] rounded hover:bg-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-[#B78332] text-white rounded hover:bg-opacity-90 text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
