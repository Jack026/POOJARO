'use client';
import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit-logs')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.items || []);
        setLogs(list);
        setLoading(false);
      }).catch(() => {
        setLogs([]);
        setLoading(false);
      });
  }, []);

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-charcoal mb-6">Audit Logs</h1>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-sand overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ivory border-b border-sand text-sm">
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Admin</th>
                  <th className="p-4 font-medium">Action</th>
                  <th className="p-4 font-medium">Entity</th>
                  <th className="p-4 font-medium">Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-sand hover:bg-ivory/50">
                    <td className="p-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-sm font-medium">{log.actorName}</td>
                    <td className="p-4 text-sm capitalize">
                      <span className="px-2 py-1 bg-gray-100 rounded text-gray-800">{log.action}</span>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-medium">{log.entityType}</span>
                      <div className="text-gray-500 text-xs">{log.entityLabel || log.entityId}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {log.changes?.length || 0} fields modified
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No audit logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
