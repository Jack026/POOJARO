'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Banner } from '@/lib/data/types';
import { resolveImageUrl } from '@/lib/photos';

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/banners')
      .then(res => res.json())
      .then(data => {
        setBanners(Array.isArray(data) ? data : (data?.items || []));
        setLoading(false);
      }).catch(() => {
        setBanners([]);
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Banners</h1>
          <button className="bg-gold text-white px-4 py-2 rounded-md hover:bg-gold/90 transition">
            Add Banner
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {['announcement', 'hero', 'promo_strip', 'festival'].map(slot => {
              const slotBanners = banners.filter(b => b.slot === slot);
              return (
                <div key={slot} className="bg-white rounded-lg shadow-sm border border-sand">
                  <h2 className="font-semibold text-charcoal p-4 border-b border-sand bg-ivory capitalize">
                    {slot.replace('_', ' ')} Banners
                  </h2>
                  <div className="p-4">
                    {slotBanners.length === 0 ? (
                      <p className="text-gray-500 text-sm">No banners in this slot.</p>
                    ) : (
                      <div className="space-y-4">
                        {slotBanners.map(banner => (
                          <div key={banner.id} className="flex justify-between items-center border border-sand p-4 rounded">
                            <div>
                              <h3 className="font-medium text-charcoal">{banner.title || 'Untitled'}</h3>
                              <p className="text-sm text-gray-500">{banner.subtitle}</p>
                              {banner.imageUrl && (
                                <img src={resolveImageUrl(banner.imageUrl)} alt={banner.title} className="h-16 object-cover mt-2 rounded" />
                              )}
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <span className={`px-2 py-1 text-xs rounded-full ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {banner.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <div className="space-x-2 text-sm">
                                <button className="text-gold hover:underline">Edit</button>
                                <button className="text-red-500 hover:underline">Delete</button>
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
      </div>
    </AdminShell>
  );
}
