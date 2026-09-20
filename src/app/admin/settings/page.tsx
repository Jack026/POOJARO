'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Settings,
  ShieldCheck,
  CreditCard,
  Truck,
  Store,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setReadiness(data.readiness);
        } else {
          setSettings(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setSettings(data);
        setFeedback({ type: 'success', message: 'Store settings saved and synchronized successfully!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update settings.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="p-12 text-center text-gray-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B78332]" />
          Loading store settings...
        </div>
      </AdminShell>
    );
  }

  if (!settings) {
    return (
      <AdminShell>
        <div className="p-12 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          Settings could not be loaded from datastore.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#B78332]" />
              Store & Operational Settings
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure brand identity, shipping thresholds, payment gateways, and social profiles.
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Payment Readiness Banner */}
        {readiness && (
          <div className="bg-linear-to-r from-[#FAF8F3] via-amber-50/40 to-white border border-[#E8DDCA] rounded-xl p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#B78332]/10 rounded-lg text-[#B78332] shrink-0 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#3A2118]">Payment Gateway & Checkout Readiness</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      {readiness.isTestMode ? 'Sandbox Test Mode Active' : 'Live Gateway Active'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                    UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery are operational. Webhooks status:{' '}
                    <span className="font-semibold text-[#3A2118]">
                      {readiness.webhookConfigured ? 'Configured' : 'Optional / Polling fallback enabled'}
                    </span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E8DDCA] space-y-4">
            <h2 className="font-bold text-[#3A2118] text-base flex items-center gap-2 border-b border-[#E8DDCA] pb-3">
              <Store className="w-4 h-4 text-[#B78332]" />
              Store Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.storeName || ''}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.tagline || ''}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.supportEmail || ''}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  WhatsApp Helpline
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.whatsappNumber || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Shipping & Delivery */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E8DDCA] space-y-4">
            <h2 className="font-bold text-[#3A2118] text-base flex items-center gap-2 border-b border-[#E8DDCA] pb-3">
              <Truck className="w-4 h-4 text-[#B78332]" />
              Shipping & Delivery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Free Shipping Threshold (₹)
                </label>
                <input
                  type="number"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={Math.round((settings.freeShippingThreshold || 0) / 100)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      freeShippingThreshold: Math.max(0, parseInt(e.target.value || '0', 10) * 100),
                    })
                  }
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Current raw paise: {settings.freeShippingThreshold || 0}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Standard Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={Math.round((settings.shippingFee || 0) / 100)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shippingFee: Math.max(0, parseInt(e.target.value || '0', 10) * 100),
                    })
                  }
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Current raw paise: {settings.shippingFee || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & COD */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E8DDCA] space-y-4">
            <h2 className="font-bold text-[#3A2118] text-base flex items-center gap-2 border-b border-[#E8DDCA] pb-3">
              <CreditCard className="w-4 h-4 text-[#B78332]" />
              Payment & COD
            </h2>
            <div className="space-y-4 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="codEnabled"
                  checked={Boolean(settings.codEnabled)}
                  onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#B78332] rounded"
                />
                <span className="text-sm font-medium text-[#3A2118]">
                  Enable Cash on Delivery (COD) for shoppers
                </span>
              </label>
              {settings.codEnabled && (
                <div className="max-w-xs pl-7">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    COD Handling Fee (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                    value={Math.round((settings.codFee || 0) / 100)}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        codFee: Math.max(0, parseInt(e.target.value || '0', 10) * 100),
                      })
                    }
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Current raw paise: {settings.codFee || 0}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E8DDCA] space-y-4">
            <h2 className="font-bold text-[#3A2118] text-base flex items-center gap-2 border-b border-[#E8DDCA] pb-3">
              <Share2 className="w-4 h-4 text-[#B78332]" />
              Social Media Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Instagram URL
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.social?.instagram || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/poojaro"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Facebook URL
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.social?.facebook || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/poojaro"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  YouTube URL
                </label>
                <input
                  type="text"
                  className="w-full border border-[#E8DDCA] rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#B78332] text-[#3A2118]"
                  value={settings.social?.youtube || ''}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, youtube: e.target.value },
                    })
                  }
                  placeholder="https://youtube.com/@poojaro"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#B78332] hover:bg-[#966723] text-white px-6 py-2.5 rounded-lg transition font-semibold text-sm shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
