'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Banner, BannerSlot } from '@/lib/data/types';
import { resolveImageUrl } from '@/lib/photos';
import { Plus, Edit2, Trash2, Image as ImageIcon, ExternalLink, AlertCircle, Eye } from 'lucide-react';

const SLOTS: { id: BannerSlot; label: string; description: string }[] = [
  { id: 'announcement', label: 'Announcement Bar', description: 'Top site-wide ticker / announcement text' },
  { id: 'hero', label: 'Hero Banners', description: 'Main prominent carousel on homepage' },
  { id: 'promo_strip', label: 'Promo Strips', description: 'Mid-page promotional callouts' },
  { id: 'festival', label: 'Festival Highlights', description: 'Seasonal and festival feature banners' },
];

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BannerSlot | 'all'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [slot, setSlot] = useState<BannerSlot>('hero');
  const [eyebrow, setEyebrow] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : data?.items || []);
      }
    } catch (e) {
      console.error(e);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = (defaultSlot?: BannerSlot) => {
    setEditingBanner(null);
    setSlot(defaultSlot || 'hero');
    setEyebrow('');
    setTitle('');
    setSubtitle('');
    setCtaLabel('Shop Now');
    setCtaHref('/shop');
    setImageUrl('');
    setSortOrder('0');
    setStartsAt('');
    setEndsAt('');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBanner(b);
    setSlot(b.slot);
    setEyebrow(b.eyebrow || '');
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setCtaLabel(b.ctaLabel || '');
    setCtaHref(b.ctaHref || '');
    setImageUrl(b.imageUrl || '');
    setSortOrder(String(b.sortOrder ?? 0));
    setStartsAt(b.startsAt ? b.startsAt.split('T')[0] ?? '' : '');
    setEndsAt(b.endsAt ? b.endsAt.split('T')[0] ?? '' : '');
    setIsActive(b.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!title.trim() && slot !== 'announcement') {
      setError('Title is required for visual banners.');
      setSaving(false);
      return;
    }

    const payload = {
      slot,
      eyebrow: eyebrow.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      ctaLabel: ctaLabel.trim(),
      ctaHref: ctaHref.trim(),
      imageUrl: imageUrl.trim(),
      sortOrder: parseInt(sortOrder, 10) || 0,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`).toISOString() : null,
      isActive,
    };

    try {
      let res;
      if (editingBanner) {
        res = await fetch(`/api/admin/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchBanners();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save banner.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Are you sure you want to delete this banner "${b.title || b.slot}"?`)) return;

    try {
      const res = await fetch(`/api/admin/banners/${b.id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners((prev) => prev.filter((item) => item.id !== b.id));
      } else {
        alert('Failed to delete banner');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting banner');
    }
  };

  const displayedSlots = activeTab === 'all' ? SLOTS.map((s) => s.id) : [activeTab];

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118]">Banners & Announcements</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage promotional hero carousels, announcement tickers, and festival campaigns.
            </p>
          </div>
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
        </div>

        {/* Slot Tabs */}
        <div className="flex gap-2 border-b border-[#E8DDCA] pb-2 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition ${
              activeTab === 'all'
                ? 'bg-[#3A2118] text-white'
                : 'bg-white border border-[#E8DDCA] text-[#3A2118] hover:bg-[#FAF8F3]'
            }`}
          >
            All Banners ({banners.length})
          </button>
          {SLOTS.map((s) => {
            const count = banners.filter((b) => b.slot === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition ${
                  activeTab === s.id
                    ? 'bg-[#3A2118] text-white'
                    : 'bg-white border border-[#E8DDCA] text-[#3A2118] hover:bg-[#FAF8F3]'
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Banners List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading banners...
          </div>
        ) : (
          <div className="space-y-8">
            {displayedSlots.map((slotId) => {
              const slotInfo = SLOTS.find((s) => s.id === slotId)!;
              const slotBanners = banners.filter((b) => b.slot === slotId);

              return (
                <div key={slotId} className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
                  <div className="p-4 bg-[#FAF8F3] border-b border-[#E8DDCA] flex justify-between items-center">
                    <div>
                      <h2 className="font-bold text-[#3A2118] text-base">{slotInfo.label}</h2>
                      <p className="text-xs text-gray-500">{slotInfo.description}</p>
                    </div>
                    <button
                      onClick={() => openCreateModal(slotId)}
                      className="text-xs font-semibold text-[#B78332] hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to {slotInfo.label}
                    </button>
                  </div>

                  <div className="p-4">
                    {slotBanners.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">
                        No banners configured for this slot yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {slotBanners.map((banner) => (
                          <div
                            key={banner.id}
                            className="border border-[#E8DDCA] rounded-lg p-4 bg-white hover:border-[#B78332] transition flex flex-col justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex gap-4">
                              {banner.imageUrl ? (
                                <div className="w-24 h-24 shrink-0 rounded border border-[#E8DDCA] overflow-hidden bg-gray-50 flex items-center justify-center">
                                  <img
                                    src={resolveImageUrl(banner.imageUrl)}
                                    alt={banner.title || 'Banner'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 shrink-0 rounded border border-dashed border-[#E8DDCA] bg-[#FAF8F3] flex items-center justify-center text-gray-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                                      banner.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {banner.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <span className="text-xs text-gray-400">Order: {banner.sortOrder}</span>
                                </div>
                                {banner.eyebrow && (
                                  <p className="text-xs uppercase tracking-wider text-[#B78332] font-semibold">
                                    {banner.eyebrow}
                                  </p>
                                )}
                                <h3 className="font-bold text-sm text-[#3A2118] truncate">
                                  {banner.title || '(No Title)'}
                                </h3>
                                {banner.subtitle && (
                                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                    {banner.subtitle}
                                  </p>
                                )}
                                {banner.ctaHref && (
                                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-1 font-medium">
                                    <span>CTA: {banner.ctaLabel || 'Learn More'}</span>
                                    <span className="text-gray-400 font-mono text-[11px]">
                                      ({banner.ctaHref})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#E8DDCA] text-xs text-gray-500">
                              <div>
                                {banner.endsAt ? (
                                  <span>Expires {new Date(banner.endsAt).toLocaleDateString('en-IN')}</span>
                                ) : (
                                  <span>No expiration date</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(banner)}
                                  className="text-[#B78332] hover:underline flex items-center gap-1 font-medium"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleDelete(banner)}
                                  className="text-red-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl border border-[#E8DDCA] w-full max-w-lg my-8 overflow-hidden">
              <div className="p-4 border-b border-[#E8DDCA] bg-[#FAF8F3] flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#3A2118]">
                  {editingBanner ? 'Edit Banner' : 'Add New Banner'}
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
                      Banner Slot *
                    </label>
                    <select
                      value={slot}
                      onChange={(e) => setSlot(e.target.value as BannerSlot)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                    >
                      {SLOTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Sort Order
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
                    Eyebrow (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE COLLECTION"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Banner Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Vedic Puja Samagri for Diwali"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Subtitle / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Handcrafted brass diyas, sacred havan samagri, and complete ritual kits."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /images/hero-diwali.jpg or https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                  {imageUrl && (
                    <div className="mt-2 rounded border border-[#E8DDCA] overflow-hidden max-h-32 bg-gray-50 flex items-center justify-center">
                      <img
                        src={resolveImageUrl(imageUrl)}
                        alt="Preview"
                        className="max-h-32 w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Explore Kits"
                      value={ctaLabel}
                      onChange={(e) => setCtaLabel(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                      Button Link (Href)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /shop or /occasions/diwali"
                      value={ctaHref}
                      onChange={(e) => setCtaHref(e.target.value)}
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
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                    />
                  </div>
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
                      Banner is Active and visible on site
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
                    {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
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
