'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { buttonClasses } from '@/components/ui/button-styles';
import type { Address } from '@/lib/data/types';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Address>>({
    label: 'Home',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let newAddresses = [...addresses];
      if (formData.id) {
        newAddresses = newAddresses.map(a => a.id === formData.id ? { ...a, ...formData } as Address : a);
      } else {
        const newAddress = { 
          ...formData, 
          id: `addr_${Date.now()}` 
        } as Address;
        newAddresses.push(newAddress);
      }

      // The row we just added or edited — the one the default flag applies to.
      const targetId = formData.id ?? newAddresses.at(-1)?.id;

      if (formData.isDefault) {
        newAddresses = newAddresses.map(a => ({ ...a, isDefault: a.id === targetId }));
      } else if (newAddresses.length === 1) {
        // A lone address is always the default, whatever the checkbox said.
        newAddresses = newAddresses.map(a => ({ ...a, isDefault: true }));
      }

      const res = await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: newAddresses })
      });
      
      if (res.ok) {
        setAddresses(newAddresses);
        setIsFormOpen(false);
        setFormData({
          label: 'Home', fullName: '', phone: '', line1: '', line2: '', 
          landmark: '', city: '', state: '', pincode: '', isDefault: false
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      let newAddresses = addresses.filter(a => a.id !== id);
      // Deleting the default promotes whichever address is now first.
      if (addresses.find(a => a.id === id)?.isDefault) {
        newAddresses = newAddresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
      }
      
      await fetch('/api/account/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: newAddresses })
      });
      setAddresses(newAddresses);
    } catch (e) {
      console.error(e);
    }
  };

  const editAddress = (address: Address) => {
    setFormData(address);
    setIsFormOpen(true);
  };

  const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh"
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display text-3xl text-brown font-medium">Saved Addresses</h1>
          <p className="text-brown-muted mt-1">Manage your delivery addresses.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => {
              setFormData({ label: 'Home', fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', isDefault: false });
              setIsFormOpen(true);
            }} 
            className={buttonClasses({ variant: 'gold', size: 'sm' })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add New
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-sand-soft/10 border border-sand-deep/40 rounded-xl p-6">
          <h2 className="font-display text-xl text-brown font-medium mb-6">
            {formData.id ? 'Edit Address' : 'Add New Address'}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Mobile Number (10 digits)</label>
                <input required type="tel" pattern="[0-9]{10}" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-brown mb-1">Address Line 1 (House No, Building, Street)</label>
              <input required type="text" value={formData.line1} onChange={e => setFormData({...formData, line1: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Address Line 2 (Area, Sector) <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input type="text" value={formData.line2} onChange={e => setFormData({...formData, line2: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Landmark <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input type="text" value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown mb-1">Pincode (6 digits)</label>
                <input required type="text" pattern="[0-9]{6}" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">City</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-1">State</label>
                <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full rounded-lg border border-sand-deep/50 px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold bg-white">
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2">
                <input type="radio" checked={formData.label === 'Home'} onChange={() => setFormData({...formData, label: 'Home'})} className="text-gold focus:ring-gold accent-gold" />
                <span className="text-sm font-medium text-brown">Home</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={formData.label === 'Work'} onChange={() => setFormData({...formData, label: 'Work'})} className="text-gold focus:ring-gold accent-gold" />
                <span className="text-sm font-medium text-brown">Work</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={formData.label === 'Other'} onChange={() => setFormData({...formData, label: 'Other'})} className="text-gold focus:ring-gold accent-gold" />
                <span className="text-sm font-medium text-brown">Other</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} className="rounded text-gold focus:ring-gold accent-gold" />
                <span className="text-sm font-medium text-brown">Make this my default address</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-sand-deep/30">
              <button type="submit" disabled={saving} className={buttonClasses({ variant: 'gold' })}>
                {saving ? 'Saving...' : 'Save Address'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} className={buttonClasses({ variant: 'secondary' })}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-sand-soft/30 animate-pulse border border-sand-deep/20" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="border border-sand-deep/30 rounded-xl p-12 text-center bg-sand-soft/5 flex flex-col items-center">
          <div className="w-16 h-16 bg-sand-soft/50 rounded-full flex items-center justify-center mb-4 text-gold">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl text-brown font-medium mb-2">No addresses saved</h3>
          <p className="text-brown-muted mb-6">Add an address to speed up your checkout process.</p>
          <button onClick={() => setIsFormOpen(true)} className={buttonClasses({ variant: 'gold' })}>
            <Plus className="w-4 h-4 mr-2" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div key={address.id} className={`relative border rounded-xl p-5 ${address.isDefault ? 'border-gold bg-gold/5 shadow-subtle' : 'border-sand-deep/40 bg-white hover:border-sand-deep'}`}>
              {address.isDefault && (
                <span className="absolute top-4 right-4 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Default</span>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-sand-soft text-brown text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                  {address.label}
                </span>
                <span className="font-medium text-brown">{address.fullName}</span>
              </div>
              
              <div className="text-sm text-brown-muted space-y-1 mb-4 max-w-[85%]">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                {address.landmark && <p>Landmark: {address.landmark}</p>}
                <p>{address.city}, {address.state} - {address.pincode}</p>
                <p className="pt-1 text-brown font-medium">Ph: +91 {address.phone}</p>
              </div>
              
              <div className="flex gap-3 pt-3 border-t border-sand-deep/30">
                <button onClick={() => editAddress(address)} className="flex items-center text-sm font-medium text-gold hover:text-gold-deep transition-colors">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </button>
                <button onClick={() => handleDelete(address.id)} className="flex items-center text-sm font-medium text-danger/80 hover:text-danger transition-colors">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
