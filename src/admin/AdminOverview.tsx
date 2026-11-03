import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, IndianRupee, Package, ShoppingBag, Users } from 'lucide-react';
import { getAdminMetrics } from '../lib/backend';

interface Props { onNavigate: (section: 'orders' | 'products' | 'customers' | 'inventory') => void }
export const AdminOverview: React.FC<Props> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<Awaited<ReturnType<typeof getAdminMetrics>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { getAdminMetrics().then(setMetrics).catch(reason => setError(reason instanceof Error ? reason.message : 'Dashboard data could not be loaded.')); }, []);
  if (error) return <div className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  if (!metrics) return <div className="text-sm text-neutral-500">Loading live dashboard…</div>;
  const cards = [
    ['Total Orders', metrics.totalOrders, ShoppingBag, 'orders'], ['Total Revenue', `₹${metrics.totalRevenue.toLocaleString('en-IN')}`, IndianRupee, undefined],
    ['Total Products', metrics.totalProducts, Package, 'products'], ['Total Customers', metrics.totalCustomers, Users, 'customers'],
    ['Pending Orders', metrics.pendingOrders, Clock, 'orders'], ['Delivered Orders', metrics.deliveredOrders, CheckCircle2, 'orders'],
  ] as const;
  return <div className="space-y-8"><div><h1 className="font-display text-2xl text-neutral-900 font-medium">Dashboard Overview</h1><p className="text-xs text-neutral-500 mt-0.5">Live data from local Supabase</p></div><div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{cards.map(([label, value, Icon, section]) => <button key={label} onClick={() => section && onNavigate(section)} className="text-left bg-white border border-neutral-200 p-4 hover:border-neutral-400"><Icon className="w-5 h-5 text-neutral-600 mb-3" /><p className="text-xl font-bold font-mono">{value}</p><p className="text-[11px] text-neutral-500 mt-0.5">{label}</p></button>)}</div><div className="bg-white border border-neutral-200 p-5"><h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Recent Orders</h2>{metrics.orders.slice(0, 8).map(order => <div key={order.created_at} className="flex justify-between border-b last:border-0 py-3 text-xs"><span>{order.created_at.slice(0, 10)}</span><span className="font-mono">₹{(order.total_minor / 100).toLocaleString('en-IN')}</span><span className="text-neutral-500">{order.fulfillment_status}</span></div>)}{metrics.orders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}</div></div>;
};
