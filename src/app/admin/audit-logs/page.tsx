'use client';

import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import type { AuditLog } from '@/lib/data/types';
import { ScrollText, Search, ChevronDown, ChevronRight, User, Clock, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setLogs(list);
        setLoading(false);
      })
      .catch(() => {
        setLogs([]);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const entities = Array.from(new Set(logs.map((l) => l.entityType).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (log.actorName || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.entityType || '').toLowerCase().includes(q) ||
      (log.entityLabel || '').toLowerCase().includes(q) ||
      (log.entityId || '').toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#3A2118] flex items-center gap-2">
              <ScrollText className="w-6 h-6 text-[#B78332]" />
              Immutable Audit Trail
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Historical ledger of administrative actions, pricing adjustments, inventory modifications, and status changes.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[#E8DDCA] flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by admin name, action, or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E8DDCA] rounded-md focus:outline-none focus:border-[#B78332] text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="border border-[#E8DDCA] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#B78332] bg-white text-[#3A2118]"
            >
              <option value="all">All Entities</option>
              {entities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] p-12 text-center text-gray-500">
            Loading audit logs...
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-[#E8DDCA] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E8DDCA] text-xs font-semibold text-[#3A2118] uppercase tracking-wider">
                    <th className="p-4 w-8"></th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Admin Actor</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity</th>
                    <th className="p-4">Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDCA] text-sm">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const changeCount = log.changes?.length || 0;

                    return (
                      <>
                        <tr
                          key={log.id}
                          onClick={() => changeCount > 0 && toggleExpand(log.id)}
                          className={`hover:bg-[#FAF8F3]/60 transition cursor-pointer ${
                            isExpanded ? 'bg-[#FAF8F3]/80' : ''
                          }`}
                        >
                          <td className="p-4 text-gray-400">
                            {changeCount > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#B78332]" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )
                            ) : null}
                          </td>
                          <td className="p-4 whitespace-nowrap text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-semibold text-xs text-[#3A2118]">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#B78332]" />
                              {log.actorName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium rounded bg-gray-100 text-gray-800 border border-gray-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-xs text-[#3A2118] block">
                              {log.entityType}
                            </span>
                            <span className="text-[11px] text-gray-500 block truncate max-w-xs">
                              {log.entityLabel || log.entityId}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            {changeCount > 0 ? (
                              <span className="text-[#B78332] font-medium hover:underline">
                                {changeCount} field{changeCount > 1 ? 's' : ''} recorded (click to inspect)
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">No field diffs</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && changeCount > 0 && (
                          <tr key={`${log.id}-details`} className="bg-[#FAF8F3] border-b border-[#E8DDCA]">
                            <td colSpan={6} className="p-4 pl-12">
                              <div className="bg-white border border-[#E8DDCA] rounded-md p-4 text-xs space-y-3">
                                <h4 className="font-semibold text-[#3A2118] text-xs uppercase tracking-wider">
                                  Field Modifications
                                </h4>
                                <div className="space-y-2">
                                  {log.changes.map((c, i) => (
                                    <div
                                      key={i}
                                      className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1.5 border-b border-gray-100 last:border-0"
                                    >
                                      <div className="font-mono font-bold text-gray-700">
                                        {c.field}
                                      </div>
                                      <div className="text-red-700 bg-red-50 p-1.5 rounded font-mono text-[11px] break-all">
                                        From: {JSON.stringify(c.from) ?? 'null'}
                                      </div>
                                      <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded font-mono text-[11px] break-all">
                                        To: {JSON.stringify(c.to) ?? 'null'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No audit events found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
