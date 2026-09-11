'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Settings saved successfully');
  };

  if (loading) return <AdminShell><div className="p-6">Loading...</div></AdminShell>;
  if (!settings) return <AdminShell><div className="p-6">Settings not available</div></AdminShell>;

  return (
    <AdminShell>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-6">Store Settings</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sand">
            <h2 className="font-semibold text-charcoal mb-4">Store Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <input type="text" className="w-full border border-sand rounded p-2" value={settings.storeName || ''} onChange={e => setSettings({...settings, storeName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tagline</label>
                <input type="text" className="w-full border border-sand rounded p-2" value={settings.tagline || ''} onChange={e => setSettings({...settings, tagline: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Support Email</label>
                <input type="email" className="w-full border border-sand rounded p-2" value={settings.supportEmail || ''} onChange={e => setSettings({...settings, supportEmail: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input type="text" className="w-full border border-sand rounded p-2" value={settings.whatsappNumber || ''} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-sand">
            <h2 className="font-semibold text-charcoal mb-4">Shipping & Delivery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Free Shipping Threshold (Paise)</label>
                <input type="number" className="w-full border border-sand rounded p-2" value={settings.freeShippingThreshold || 0} onChange={e => setSettings({...settings, freeShippingThreshold: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Shipping Fee (Paise)</label>
                <input type="number" className="w-full border border-sand rounded p-2" value={settings.shippingFee || 0} onChange={e => setSettings({...settings, shippingFee: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-sand">
            <h2 className="font-semibold text-charcoal mb-4">Payment</h2>
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="codEnabled" checked={settings.codEnabled || false} onChange={e => setSettings({...settings, codEnabled: e.target.checked})} />
              <label htmlFor="codEnabled" className="text-sm font-medium">Enable Cash on Delivery (COD)</label>
            </div>
            {settings.codEnabled && (
              <div>
                <label className="block text-sm font-medium mb-1">COD Fee (Paise)</label>
                <input type="number" className="w-full border border-sand rounded p-2 max-w-xs" value={settings.codFee || 0} onChange={e => setSettings({...settings, codFee: parseInt(e.target.value)})} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-gold text-white px-6 py-2 rounded-md hover:bg-gold/90 transition font-medium">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
