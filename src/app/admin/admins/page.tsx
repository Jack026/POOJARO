'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { AdminUser, AdminRole } from '@/lib/data/types';
import { Shield, Plus, Edit2, Trash2, Key, Mail, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ROLES: { id: AdminRole; label: string; desc: string; color: string }[] = [
  {
    id: 'owner',
    label: 'Store Owner',
    desc: 'Full unrestricted access to store, finances, settings, audits, and admin management.',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'manager',
    label: 'Operations Manager',
    desc: 'Manages products, inventory, orders, customer accounts, and promotions.',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'staff',
    label: 'Fulfillment Staff',
    desc: 'Processes orders, updates tracking/dispatch, and manages stock adjustments.',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
  },
];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AdminRole>('manager');
  const [isActive, setIsActive] = useState(true);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const [adminsRes, meRes] = await Promise.all([
        fetch('/api/admin/admins'),
        fetch('/api/admin/auth/me'),
      ]);

      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(Array.isArray(data) ? data : data?.items || []);
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated && meData.admin) {
          setCurrentAdminId(meData.admin.id);
        }
      }
    } catch (e) {
      console.error(e);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('manager');
    setIsActive(true);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: AdminUser) => {
    setEditingAdmin(a);
    setName(a.name);
    setEmail(a.email);
    setPassword(''); // leave blank unless updating
    setShowPassword(false);
    setRole(a.role);
    setIsActive(a.isActive);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!name.trim()) {
      setError('Name is required.');
      setSaving(false);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required.');
      setSaving(false);
      return;
    }

    if (!editingAdmin && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters for a new administrator.');
      setSaving(false);
      return;
    }

    const payload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      isActive,
    };

    if (password) {
      payload.password = password;
    }

    try {
      let res;
      if (editingAdmin) {
        res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchAdmins();
        closeModal();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save admin user.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: AdminUser) => {
    if (a.id === currentAdminId) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    const ownerCount = admins.filter((u) => u.role === 'owner' && u.isActive).length;
    if (a.role === 'owner' && ownerCount <= 1) {
      alert('Cannot delete the last remaining active Store Owner.');
      return;
    }

    if (!confirm(`Are you sure you want to delete administrator account for "${a.name}" (${a.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/admins/${a.id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdmins((prev) => prev.filter((item) => item.id !== a.id));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete administrator');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting administrator');
    }
  };

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#B78332]" />
              Administrators & Roles
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Control team privileges, assign roles (Owner, Manager, Staff), and secure access.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#B78332] text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Administrator
          </button>
        </div>

        {/* Roles Quick Reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-lg border border-[#E8DDCA] shadow-2xs">
              <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${r.color}`}>
                {r.label}
              </span>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading admin users...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                    <th className="p-4">Administrator</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Login</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA] text-sm">
                  {admins.map((admin) => {
                    const roleInfo = ROLES.find((r) => r.id === admin.role) ?? ROLES[0]!;
                    const isSelf = admin.id === currentAdminId;

                    return (
                      <tr key={admin.id} className="hover:bg-[#FAF8F3]/60 transition">
                        <td className="p-4">
                          <div className="font-semibold text-[#3A2118] flex items-center gap-2">
                            <span>{admin.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-gray-700">{admin.email}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              admin.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {admin.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-1.5 text-[#B78332] hover:bg-[#FAF8F3] rounded transition inline-flex items-center"
                            title="Edit Admin"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(admin)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition inline-flex items-center"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No administrator accounts found.
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
            <div className="bg-white rounded-lg shadow-xl border border-[#E8DDCA] w-full max-w-md my-8 overflow-hidden">
              <div className="p-4 border-b border-[#E8DDCA] bg-[#FAF8F3] flex justify-between items-center">
                <h2 className="font-bold text-lg text-[#3A2118]">
                  {editingAdmin ? `Edit Administrator: ${editingAdmin.name}` : 'Add Administrator'}
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh@poojaro.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    {editingAdmin ? 'New Password (leave blank to keep unchanged)' : 'Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingAdmin}
                      placeholder={editingAdmin ? '••••••••' : 'Minimum 6 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm pr-10 focus:outline-none focus:border-[#B78332]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3A2118] uppercase tracking-wider mb-1">
                    Role & Permissions *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AdminRole)}
                    className="w-full border border-[#E8DDCA] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {ROLES.find((r) => r.id === role)?.desc}
                  </p>
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
                      Account is Active and allowed to sign in
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
                    {saving ? 'Saving...' : editingAdmin ? 'Update Account' : 'Create Account'}
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
