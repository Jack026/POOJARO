'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, X, Check, Loader2, User, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/toast-store';

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    marketingOptIn?: boolean;
  };
}

export function AccountProfileEditor({ user }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [marketingOptIn, setMarketingOptIn] = useState(user.marketingOptIn || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setName(user.name);
    setPhone(user.phone || '');
    setMarketingOptIn(user.marketingOptIn || false);
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          marketingOptIn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      toast.success('Profile updated', {
        description: 'Your personal details have been saved successfully.',
      });

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-gold hover:text-gold-deep transition-colors p-2 -mr-2 -mt-2 rounded-full hover:bg-gold/10"
        title="Edit Personal Details"
        aria-label="Edit Personal Details"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-[#FAF6F0] border border-[#E8DDCF] rounded-2xl w-full max-w-md p-6 shadow-card relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DDCF]">
              <h3 className="font-display text-xl text-brown font-medium flex items-center gap-2">
                <User className="w-5 h-5 text-gold-deep" />
                Edit Personal Details
              </h3>
              <button
                onClick={handleClose}
                className="text-brown-muted hover:text-brown transition-colors p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3.5 py-2 text-sm text-brown focus:outline-none focus:border-gold-deep"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-3.5 py-2 text-sm cursor-not-allowed"
                />
                <span className="text-[11px] text-brown-muted mt-1 block">
                  Email is linked to your login credentials and cannot be modified.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-[#D9CBB9] rounded-lg px-3.5 py-2 text-sm text-brown focus:outline-none focus:border-gold-deep"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 accent-gold-deep rounded"
                  />
                  <span className="text-xs text-brown">
                    Receive sacred festival reminders, auspicious muhurat alerts, and exclusive offers.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DDCF]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-medium text-brown-muted hover:text-brown transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gold-deep hover:bg-gold-dark text-white rounded-lg text-xs font-medium transition shadow-subtle flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
