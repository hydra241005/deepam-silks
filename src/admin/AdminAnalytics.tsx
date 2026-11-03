import React, { useEffect, useMemo, useState } from 'react';
import { getAdminMetrics } from '../lib/backend';

export const AdminAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getAdminMetrics>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getAdminMetrics().then(setMetrics).catch(reason => setError(reason instanceof Error ? reason.message : 'Analytics could not be loaded.')); }, []);
  const monthly = useMemo(() => {
    const result = new Map<string, { revenue: number; orders: number }>();
    for (const order of metrics?.orders ?? []) {
      const key = order.created_at.slice(0, 7); const current = result.get(key) ?? { revenue: 0, orders: 0 };
      result.set(key, { revenue: current.revenue + order.total_minor / 100, orders: current.orders + 1 });
    }
    return [...result.entries()];
  }, [metrics]);
  if (error) return <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!metrics) return <div className="text-sm text-neutral-500">Loading live analytics…</div>;
  const average = metrics.totalOrders ? metrics.totalRevenue / metrics.totalOrders : 0;
  return <div className="space-y-6"><div><h1 className="font-display text-2xl text-neutral-900 font-medium">Revenue & Analytics</h1><p className="text-xs text-neutral-500 mt-0.5">Calculated from persisted orders</p></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[['Revenue', `₹${metrics.totalRevenue.toLocaleString('en-IN')}`], ['Orders', metrics.totalOrders], ['Average Order Value', `₹${average.toLocaleString('en-IN')}`]].map(([label, value]) => <div className="bg-white border border-neutral-200 p-5" key={String(label)}><p className="text-2xl font-bold font-mono">{value}</p><p className="text-xs text-neutral-500">{label}</p></div>)}</div><div className="bg-white border border-neutral-200 p-5"><h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Monthly Revenue</h2>{monthly.length === 0 ? <p className="text-sm text-neutral-400">No order data yet.</p> : monthly.map(([month, value]) => <div key={month} className="flex justify-between border-b last:border-0 py-3 text-xs"><span>{month}</span><span>{value.orders} orders</span><strong>₹{value.revenue.toLocaleString('en-IN')}</strong></div>)}</div></div>;
};
