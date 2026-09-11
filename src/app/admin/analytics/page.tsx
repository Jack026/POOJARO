'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics?range=30d')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-charcoal">Analytics Overview</h1>
          <select className="border border-sand rounded p-2">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : !data ? (
          <p>No data available</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-sand">
                <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-charcoal">₹{((data.revenue || 0) / 100).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-sand">
                <div className="text-sm text-gray-500 mb-1">Total Orders</div>
                <div className="text-2xl font-bold text-charcoal">{data.orderCount || 0}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-sand">
                <div className="text-sm text-gray-500 mb-1">Average Order Value</div>
                <div className="text-2xl font-bold text-charcoal">₹{((data.averageOrderValue || 0) / 100).toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-sand">
                <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
                <div className="text-2xl font-bold text-charcoal">{((data.conversionRate || 0) * 100).toFixed(2)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-sand p-6">
                <h2 className="font-semibold text-charcoal mb-4">Sales Funnel</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Product Views</span>
                      <span>{data.productViews || 0}</span>
                    </div>
                    <div className="w-full bg-sand rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full" style={{ width: '100%' }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Add to Cart</span>
                      <span>{data.addToCarts || 0} ({(data.addToCartRate * 100 || 0).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-sand rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(data.addToCartRate || 0) * 100}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Checkout Started</span>
                      <span>{data.checkoutsStarted || 0} ({(data.checkoutRate * 100 || 0).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-sand rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(data.checkoutRate || 0) * 100}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Purchases</span>
                      <span>{data.purchases || 0} ({(data.conversionRate * 100 || 0).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-sand rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(data.conversionRate || 0) * 100}%` }}></div></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-sand overflow-hidden">
                <h2 className="font-semibold text-charcoal p-4 border-b border-sand bg-ivory">Top Products</h2>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-sand">
                      <th className="p-3">Product</th>
                      <th className="p-3">Units Sold</th>
                      <th className="p-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.bestSellers || []).map((p: any, i: number) => (
                      <tr key={i} className="border-b border-sand">
                        <td className="p-3 truncate max-w-[200px]">{p.name}</td>
                        <td className="p-3">{p.units}</td>
                        <td className="p-3">₹{(p.revenue / 100).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(!data.bestSellers || data.bestSellers.length === 0) && (
                      <tr><td colSpan={3} className="p-4 text-center text-gray-500">No sales data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
