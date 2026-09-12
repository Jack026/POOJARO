'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Coupon, CouponType } from '@/lib/data/types';
import { Search, Plus, Edit2, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState(''); // percent or rupees
  const [minOrderRupees, setMinOrderRupees] = useState('');
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : data?.items || []);
      }
    } catch (e) {
      console.error(e);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDescription('');
    setType('percentage');
    setValue('');
    setMinOrderRupees('');
    setMaxDiscountRupees('');
    setUsageLimit('');
    setPerUserLimit('1');
    setFirstOrderOnly(false);
    setStartsAt('');
    setExpiresAt('');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDescription(c.description || '');
    setType(c.type);
    // If flat, value is in paise -> convert to rupees. If percentage, keep as is.
    setValue(c.type === 'percentage' ? String(c.value) : String(c.value / 100));
    setMinOrderRupees(c.minOrderAmount ? String(c.minOrderAmount / 100) : '');
    setMaxDiscountRupees(c.maxDiscount ? String(c.maxDiscount / 100) : '');
    setUsageLimit(c.usageLimit !== null && c.usageLimit !== undefined ? String(c.usageLimit) : '');
    setPerUserLimit(c.perUserLimit !== null && c.perUserLimit !== undefined ? String(c.perUserLimit) : '1');
    setFirstOrderOnly(Boolean(c.firstOrderOnly));
    setStartsAt(c.startsAt ? c.startsAt.split('T')[0] ?? '' : '');
    setExpiresAt(c.expiresAt ? c.expiresAt.split('T')[0] ?? '' : '');
    setIsActive(c.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum <= 0) {
      setError('Please provide a valid coupon discount value.');
      setSaving(false);
      return;
    }

    if (type === 'percentage' && (valNum > 100 || valNum < 1)) {
      setError('Percentage value must be between 1% and 100%.');
      setSaving(false);
      return;
    }

    // Prepare payload
    // In store: if flat, value is paise. If percentage, value is 1-100.
    const storedValue = type === 'percentage' ? Math.round(valNum) : Math.round(valNum * 100);
    const minOrderPaise = minOrderRupees ? Math.round(parseFloat(minOrderRupees) * 100) : 0;
    const maxDiscountPaise = maxDiscountRupees ? Math.round(parseFloat(maxDiscountRupees) * 100) : null;

    const payload = {
      code: code.trim().toUpperCase(),
      description: description.trim(),
      type,
      value: storedValue,
      minOrderAmount: minOrderPaise,
      maxDiscount: maxDiscountPaise,
      productIds: editingCoupon?.productIds || [],
      categoryIds: editingCoupon?.categoryIds || [],
      firstOrderOnly,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
      usageCount: editingCoupon?.usageCount || 0,
      perUserLimit: perUserLimit ? parseInt(perUserLimit, 10) : null,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`).toISOString() : null,
      isActive,
    };

    try {
      let res;
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchCoupons();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save coupon.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${c.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((item) => item.id !== c.id));
      } else {
        alert('Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting coupon');
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118]">Coupons & Discounts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage promotional discount codes for orders.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E8DDCA] flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or description..."
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
              <option value="all">All Coupons</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading coupons...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Thresholds</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Validity</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA] text-sm">
                  {filteredCoupons.map((c) => {
                    const isExpired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
                    return (
                      <tr key={c.id} className="hover:bg-[#FAF8F3]/60 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-[#B78332]" />
                            <span className="font-mono font-bold text-[#3A2118] bg-[#FAF8F3] border border-[#E8DDCA] px-2 py-0.5 rounded">
                              {c.code}
                            </span>
                          </div>
                          {c.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {c.description}
                            </div>
                          )}
                          {c.firstOrderOnly && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              First Order Only
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-[#3A2118]">
                          {c.type === 'percentage' ? (
                            <span>{c.value}% OFF</span>
                          ) : (
                            <span>₹{(c.value / 100).toLocaleString('en-IN')} FLAT OFF</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-gray-600 space-y-0.5">
                          <div>
                            Min Order:{' '}
                            <span className="font-medium text-[#3A2118]">
                              {c.minOrderAmount
                                ? `₹${(c.minOrderAmount / 100).toLocaleString('en-IN')}`
                                : 'None'}
                            </span>
                          </div>
                          {c.maxDiscount ? (
                            <div>
                              Max Cap:{' '}
                              <span className="font-medium text-[#3A2118]">
                                ₹{(c.maxDiscount / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          <div className="font-medium text-[#3A2118]">
                            {c.usageCount} used
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Limit: {c.usageLimit !== null ? c.usageLimit : 'Unlimited'}
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-600">
                          {c.expiresAt ? (
                            <div className={isExpired ? 'text-red-600 font-semibold' : ''}>
                              Exp: {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                              {isExpired && <span className="block text-[10px]">Expired</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400">Never expires</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              c.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-[#B78332] hover:bg-[#FAF8F3] rounded transition inline-flex items-center"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition inline-flex items-center"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No coupons found matching your criteria.
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
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DIWALI25"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm font-mono font-bold uppercase focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as CouponType)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    {type === 'percentage' ? 'Percentage Off (1 - 100) *' : 'Flat Discount in Rupees (₹) *'}
                  </label>
                  <input
                    type="number"
                    step={type === 'percentage' ? '1' : '0.01'}
                    required
                    placeholder={type === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20% off on all festive puja kits"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Min Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0 for none"
                      value={minOrderRupees}
                      onChange={(e) => setMinOrderRupees(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Leave empty for none"
                      value={maxDiscountRupees}
                      onChange={(e) => setMaxDiscountRupees(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Per User Limit
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startsAt}
                      onChange={(e) => setStartsAt(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E8DDCA] space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={firstOrderOnly}
                      onChange={(e) => setFirstOrderOnly(e.target.checked)}
                      className="rounded border-[#E8DDCA] text-[#B78332] focus:ring-[#B78332]"
                    />
                    <span className="text-sm text-[#3A2118]">
                      First-time customer orders only
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-[#E8DDCA] text-[#B78332] focus:ring-[#B78332]"
                    />
                    <span className="text-sm font-medium text-[#3A2118]">
                      Coupon is Active and usable at checkout
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
                    {saving ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
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
