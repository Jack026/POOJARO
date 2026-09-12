'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Warehouse, Plus, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold?: number;
  unit?: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [components, setComponents] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'components'>('products');
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');

  // Adjust stock modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'delta' | 'exact'>('delta');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('received');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInventory = () => {
    setLoading(true);
    fetch('/api/admin/inventory')
      .then((res) => res.json())
      .then((data) => {
        const prodList = Array.isArray(data?.products)
          ? data.products
          : data?.products?.items || [];
        const compList = Array.isArray(data?.components) ? data.components : [];
        setProducts(prodList);
        setComponents(compList);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setComponents([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentType('delta');
    setAmount(10);
    setReason('received');
    setNote('');
    setFeedback(null);
  };

  const closeAdjustModal = () => {
    setSelectedItem(null);
    setFeedback(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    setFeedback(null);

    const payload: any = {
      targetId: selectedItem.id,
      targetType: tab === 'products' ? 'product' : 'component',
      reason,
      note: note.trim() || 'Inventory updated via admin panel',
    };

    if (adjustmentType === 'delta') {
      payload.delta = Number(amount);
    } else {
      payload.newQty = Math.max(0, Number(amount));
    }

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setFeedback({ type: 'success', message: 'Stock updated successfully!' });
        fetchInventory();
        setTimeout(() => {
          closeAdjustModal();
        }, 1200);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to adjust stock' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = tab === 'products' ? products : components;
  const filteredItems = currentList.filter((item) => {
    if (filter === 'low_stock') {
      return item.stock <= (item.lowStockThreshold || 5);
    }
    return true;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brown">Inventory Management</h1>
            <p className="text-sm text-brown-muted">
              Live ledger-backed stock tracking for products and kit components.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter(filter === 'all' ? 'low_stock' : 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                filter === 'low_stock'
                  ? 'bg-danger/10 border-danger text-danger'
                  : 'bg-white border-sand text-brown hover:bg-sand-soft'
              }`}
            >
              <AlertTriangle size={14} />
              {filter === 'low_stock' ? 'Showing Low Stock Only' : 'Filter Low Stock'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-sand pb-2">
          <button
            className={`pb-2 px-3 text-sm font-semibold transition-colors ${
              tab === 'products'
                ? 'text-gold border-b-2 border-gold'
                : 'text-brown-muted hover:text-brown'
            }`}
            onClick={() => setTab('products')}
          >
            Products ({products.length})
          </button>
          <button
            className={`pb-2 px-3 text-sm font-semibold transition-colors ${
              tab === 'components'
                ? 'text-gold border-b-2 border-gold'
                : 'text-brown-muted hover:text-brown'
            }`}
            onClick={() => setTab('components')}
          >
            Kit Components ({components.length})
          </button>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sand-soft/50 border-b border-sand text-brown font-semibold">
                  <th className="p-4">Name</th>
                  <th className="p-4">SKU / ID</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Threshold</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-deep/40">
                {filteredItems.map((item) => {
                  const isLow = item.stock <= (item.lowStockThreshold || 5);
                  const isOut = item.stock === 0;

                  return (
                    <tr key={item.id} className="hover:bg-sand-soft/20 transition-colors">
                      <td className="p-4 font-medium text-charcoal">{item.name}</td>
                      <td className="p-4 text-xs text-brown-muted font-mono">{item.sku || item.id}</td>
                      <td className="p-4 font-bold text-brown tabular-nums">
                        {item.stock} {item.unit ? <span className="text-xs font-normal text-brown-muted">{item.unit}</span> : ''}
                      </td>
                      <td className="p-4 text-brown-muted text-xs tabular-nums">
                        {item.lowStockThreshold || 5}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
                            isOut
                              ? 'bg-danger/10 text-danger'
                              : isLow
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep hover:text-gold bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded-md transition-colors"
                        >
                          <Plus size={14} />
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-brown-muted italic">
                      No inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Adjust Stock Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-sand space-y-5 relative">
              <button
                onClick={closeAdjustModal}
                className="absolute top-4 right-4 text-brown-muted hover:text-brown"
              >
                <X size={20} />
              </button>

              <div>
                <h3 className="text-lg font-bold text-brown">Adjust Stock</h3>
                <p className="text-xs text-brown-muted mt-0.5">
                  Item: <strong className="text-charcoal">{selectedItem.name}</strong> (Currently: {selectedItem.stock})
                </p>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium ${
                    feedback.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleAdjustSubmit} className="space-y-4 text-sm">
                <div className="flex gap-2 p-1 bg-sand-soft rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('delta');
                      setAmount(10);
                    }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      adjustmentType === 'delta'
                        ? 'bg-white text-brown shadow-sm'
                        : 'text-brown-muted hover:text-brown'
                    }`}
                  >
                    Add / Remove (+ / -)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('exact');
                      setAmount(selectedItem.stock);
                    }}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      adjustmentType === 'exact'
                        ? 'bg-white text-brown shadow-sm'
                        : 'text-brown-muted hover:text-brown'
                    }`}
                  >
                    Set Exact Quantity
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">
                    {adjustmentType === 'delta' ? 'Quantity Change (+/-)' : 'New Total Stock'}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full border border-sand rounded-lg p-2.5 bg-white text-brown focus:outline-none focus:border-gold"
                  />
                  {adjustmentType === 'delta' && (
                    <p className="text-[11px] text-brown-muted mt-1">
                      Resulting stock will be: <strong>{Math.max(0, selectedItem.stock + Number(amount))}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-sand rounded-lg p-2.5 bg-white text-brown focus:outline-none focus:border-gold"
                  >
                    <option value="received">Restock / Received New Shipment</option>
                    <option value="damaged">Damaged / Expired / Spoiled</option>
                    <option value="count_correction">Inventory Physical Count Correction</option>
                    <option value="return_restock">Customer Return Restock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Batch #402, Supplier verification"
                    className="w-full border border-sand rounded-lg p-2.5 bg-white text-brown focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeAdjustModal}
                    className="px-4 py-2 rounded-lg border border-sand text-xs font-semibold text-brown hover:bg-sand-soft"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-gold hover:bg-gold-deep text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Updating...' : 'Save Stock Adjustment'}
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
