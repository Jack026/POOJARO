'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  Percent,
  IndianRupee,
  RefreshCw,
  Database,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/domain/orders';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [exportingAnalytics, setExportingAnalytics] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportAnalytics = async () => {
    setExportingAnalytics(true);
    setExportMessage(null);
    try {
      const res = await fetch('/api/admin/storage/export-analytics', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setExportMessage(
          `Success: Exported ${json.eventCount} events to ${json.fileName} in Supabase Analytics Bucket!`
        );
      } else {
        setExportMessage(`Error: ${json.error || 'Failed to export telemetry.'}`);
      }
    } catch (err: any) {
      setExportMessage(`Error: ${err.message || 'Export error'}`);
    } finally {
      setExportingAnalytics(false);
    }
  };

  const fetchAnalytics = async (selectedRange: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const revenueByDay = data?.revenueByDay || [];
  const maxDayRevenue = Math.max(...revenueByDay.map((d: any) => d.revenue || 0), 1);

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#B78332]" />
              Store Analytics & Reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Performance metrics, sales conversion funnel, and popular ritual kits.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-gray-500 font-medium">Time Window:</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="border border-[#E8DDCA] rounded-md px-3 py-1.5 text-sm bg-white text-[#3A2118] focus:outline-none focus:border-[#B78332] font-medium shadow-2xs"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={() => fetchAnalytics(range)}
              disabled={loading}
              className="p-1.5 border border-[#E8DDCA] rounded-md hover:bg-[#FAF8F3] text-gray-600"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Supabase Analytics Buckets Callout Banner */}
        <div className="bg-linear-to-r from-[#FAF8F3] via-amber-50/50 to-orange-50/40 border border-[#E8DDCA] rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#B78332]/10 rounded-lg text-[#B78332] shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#3A2118]">
                    Supabase Analytics Buckets Integration
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Private Alpha Ready
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                  Stream structured shopper analytics, conversion events, and funnel telemetry into high-throughput analytical storage on Supabase with zero latency impact.
                </p>
                {exportMessage && (
                  <p
                    className={`text-xs mt-2 font-medium flex items-center gap-1.5 ${
                      exportMessage.startsWith('Success') ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {exportMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                onClick={handleExportAnalytics}
                disabled={exportingAnalytics}
                className="px-3.5 py-2 bg-white border border-[#E8DDCA] hover:border-[#B78332] text-xs font-semibold text-[#3A2118] rounded-lg transition shadow-2xs flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#B78332] ${exportingAnalytics ? 'animate-spin' : ''}`}
                />
                {exportingAnalytics ? 'Syncing to Bucket...' : 'Export Telemetry to Bucket'}
              </button>
              <Link
                href="/admin/storage"
                className="px-3.5 py-2 bg-[#B78332] hover:bg-[#966723] text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-1.5"
              >
                <span>View Storage Buckets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B78332]" />
            Calculating store performance for {range}...
          </div>
        ) : !data || data.error ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            {data?.error || 'No analytics data available for this range.'}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
                  <IndianRupee className="w-4 h-4 text-[#B78332]" />
                </div>
                <div className="text-2xl font-bold text-[#3A2118]">
                  {formatMoney(data.revenue || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Paid & fulfilled orders</p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-[#B78332]" />
                </div>
                <div className="text-2xl font-bold text-[#3A2118]">{data.orderCount || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.customerCount || 0} unique customer{data.customerCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Average Order Value</span>
                  <TrendingUp className="w-4 h-4 text-[#B78332]" />
                </div>
                <div className="text-2xl font-bold text-[#3A2118]">
                  {formatMoney(data.averageOrderValue || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Per completed transaction</p>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm border border-[#E8DDCA]">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
                  <Percent className="w-4 h-4 text-[#B78332]" />
                </div>
                <div className="text-2xl font-bold text-[#3A2118]">
                  {((data.conversionRate || 0) * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  From {data.productViews || 0} product views
                </p>
              </div>
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-[#3A2118] text-base">Revenue Timeline</h2>
                  <p className="text-xs text-gray-500">Daily sales breakdown over the selected period</p>
                </div>
              </div>

              {revenueByDay.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No daily revenue transactions recorded in this period.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-44 flex items-end gap-1 sm:gap-2 pt-4 border-b border-[#E8DDCA]">
                    {revenueByDay.map((day: any) => {
                      const heightPercent = Math.max(
                        Math.round(((day.revenue || 0) / maxDayRevenue) * 100),
                        day.revenue > 0 ? 6 : 2
                      );

                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center group relative h-full justify-end"
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-10 bg-[#3A2118] text-white text-[11px] rounded px-2 py-1 pointer-events-none whitespace-nowrap shadow-lg">
                            <div className="font-semibold">{day.date}</div>
                            <div>Revenue: {formatMoney(day.revenue || 0)}</div>
                            <div>Orders: {day.orders}</div>
                          </div>

                          <div
                            className={`w-full max-w-[28px] rounded-t transition-all ${
                              day.revenue > 0
                                ? 'bg-[#B78332] group-hover:bg-[#3A2118]'
                                : 'bg-[#E8DDCA]/40'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                    <span>{revenueByDay[0]?.date}</span>
                    <span>{revenueByDay[revenueByDay.length - 1]?.date}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sales Funnel & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Funnel */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-6 flex flex-col justify-between">
                <div>
                  <h2 className="font-bold text-[#3A2118] text-base mb-1">Conversion Funnel</h2>
                  <p className="text-xs text-gray-500 mb-6">Customer progression from discovery to checkout</p>

                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#3A2118] mb-1.5">
                        <span>1. Product Views</span>
                        <span>{data.productViews || 0} visits</span>
                      </div>
                      <div className="w-full bg-[#FAF8F3] border border-[#E8DDCA] rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[#B78332] h-full rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#3A2118] mb-1.5">
                        <span>2. Added to Cart</span>
                        <span>
                          {data.addToCarts || 0} (
                          {((data.addToCartRate || 0) * 100).toFixed(1)}% of views)
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF8F3] border border-[#E8DDCA] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(Math.max((data.addToCartRate || 0) * 100, 2), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#3A2118] mb-1.5">
                        <span>3. Checkout Initiated</span>
                        <span>
                          {data.checkoutsStarted || 0} (
                          {((data.checkoutRate || 0) * 100).toFixed(1)}% of cart adds)
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF8F3] border border-[#E8DDCA] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-orange-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(Math.max((data.checkoutRate || 0) * 100, 2), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-[#3A2118] mb-1.5">
                        <span>4. Completed Orders</span>
                        <span>
                          {data.purchases || 0} (
                          {((data.conversionRate || 0) * 100).toFixed(1)}% overall)
                        </span>
                      </div>
                      <div className="w-full bg-[#FAF8F3] border border-[#E8DDCA] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(Math.max((data.conversionRate || 0) * 100, 2), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {data.cartAbandonmentRate > 0 && (
                  <div className="mt-6 pt-4 border-t border-[#E8DDCA] flex items-center justify-between text-xs text-gray-500">
                    <span>Cart Abandonment Rate</span>
                    <span className="font-semibold text-[#3A2118]">
                      {((data.cartAbandonmentRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Best Sellers */}
              <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden flex flex-col">
                <div className="p-4 bg-[#FAF8F3] border-b border-[#E8DDCA]">
                  <h2 className="font-bold text-[#3A2118] text-base">Top Performing Products</h2>
                  <p className="text-xs text-gray-500">Best selling puja kits and samagri by units & revenue</p>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] bg-white">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Units</th>
                        <th className="p-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDCA]">
                      {(data.bestSellers || []).map((p: any, i: number) => (
                        <tr key={i} className="hover:bg-[#FAF8F3]/50 transition">
                          <td className="p-3 font-medium text-xs text-[#3A2118] max-w-[200px] truncate">
                            {p.name}
                          </td>
                          <td className="p-3 text-xs text-center font-bold text-gray-700">
                            {p.units}
                          </td>
                          <td className="p-3 text-xs text-right font-semibold text-[#B78332]">
                            {formatMoney(p.revenue)}
                          </td>
                        </tr>
                      ))}
                      {(!data.bestSellers || data.bestSellers.length === 0) && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-xs text-gray-500">
                            No product sales recorded in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
