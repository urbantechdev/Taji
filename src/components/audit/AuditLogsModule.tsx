import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { LOCATIONS } from '../../data/initialData';
import { ClipboardList, Search, Clock, UserCheck, Shield } from 'lucide-react';

export const AuditLogsModule: React.FC = () => {
  const { auditLogs } = useERP();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    return (
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-rose-600" />
              <h2 className="font-bold text-slate-900 text-lg">
                Operator Audit Trail &amp; Security Compliance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable timestamped operational log tracking POS sales, order tickets, restock dispatches, and role switches
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by operator or action..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/60 border-b border-rose-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Log ID &amp; Timestamp</th>
                <th className="p-4">Operator &amp; Role</th>
                <th className="p-4">Node Location</th>
                <th className="p-4">Operational Action</th>
                <th className="p-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {filteredLogs.map(log => {
                const loc = LOCATIONS.find(l => l.id === log.locationId);

                return (
                  <tr key={log.id} className="hover:bg-rose-50/30 transition-colors">
                    
                    <td className="p-4">
                      <p className="font-mono font-bold text-slate-900">{log.id}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900">{log.operatorName}</p>
                      <p className="text-[10px] font-mono text-rose-700 bg-rose-50 inline-block px-1.5 py-0.2 rounded mt-0.5">
                        {log.operatorRole}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-800">
                        {loc?.name || log.locationId}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-rose-800">
                      {log.action}
                    </td>

                    <td className="p-4 text-slate-600 max-w-md leading-snug">
                      {log.details}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
