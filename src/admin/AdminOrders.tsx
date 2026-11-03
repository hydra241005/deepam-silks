import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Search, X } from 'lucide-react';
import { getAdminOrders, updateAdminOrderStatus, type AdminOrderRecord } from '../lib/backend';
import type { AdminOrderStatus } from './adminTypes';

const STATUSES: AdminOrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const COLORS: Record<AdminOrderStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200', Confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  Processing: 'bg-indigo-100 text-indigo-800 border-indigo-200', Shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200', Cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const exportCSV = (orders: AdminOrderRecord[]) => {
  const rows = [['Order ID', 'Customer', 'Total', 'Date', 'Status', 'Payment'], ...orders.map(order => [
    order.orderId, order.customerName, String(order.total), order.date, order.status, order.paymentMethod,
  ])];
  const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'deepam_orders.csv'; link.click(); URL.revokeObjectURL(url);
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminOrderStatus | 'All'>('All');
  const [detail, setDetail] = useState<AdminOrderRecord | null>(null);
  const [state, setState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });

  const load = () => {
    setState({ loading: true, error: null });
    getAdminOrders().then(setOrders).catch(error => setState({ loading: false, error: error instanceof Error ? error.message : 'Orders could not be loaded.' }))
      .finally(() => setState(current => ({ ...current, loading: false })));
  };
  useEffect(load, []);
  const filtered = useMemo(() => orders.filter(order => {
    const query = search.toLowerCase();
    return (!query || order.orderId.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query) ||
      order.products.some(product => product.name.toLowerCase().includes(query))) &&
      (status === 'All' || order.status === status);
  }), [orders, search, status]);

  const changeStatus = async (order: AdminOrderRecord, next: AdminOrderStatus) => {
    try {
      await updateAdminOrderStatus(order.id, next);
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status: next } : item));
      setDetail(current => current?.id === order.id ? { ...current, status: next } : current);
    } catch (error) {
      setState(current => ({ ...current, error: error instanceof Error ? error.message : 'Order status could not be updated.' }));
    }
  };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl text-neutral-900 font-medium">Order Management</h1><p className="text-xs text-neutral-500 mt-0.5">{filtered.length} live orders</p></div>
      <button onClick={() => exportCSV(filtered)} className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider"><Download className="w-3.5 h-3.5" /> Export CSV</button>
    </div>
    {state.error && <div className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{state.error}</div>}
    <div className="bg-white border border-neutral-200 p-4 flex gap-3">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search order, customer or product…" className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs" /></div>
      <select value={status} onChange={event => setStatus(event.target.value as AdminOrderStatus | 'All')} className="border border-neutral-300 px-3 py-2 text-xs"><option>All</option>{STATUSES.map(item => <option key={item}>{item}</option>)}</select>
      <button onClick={load} className="border border-neutral-300 px-3 py-2 text-xs">Refresh</button>
    </div>
    <div className="bg-white border border-neutral-200 overflow-x-auto">
      <table className="w-full text-xs min-w-[700px]"><thead className="bg-neutral-50 border-b border-neutral-200"><tr>{['Order ID','Customer','Products','Total','Date','Payment','Status','Actions'].map(label => <th key={label} className="text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-4 py-3">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-neutral-100">{state.loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">Loading live orders…</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">No orders found.</td></tr> : filtered.map(order => <tr key={order.id}>
          <td className="px-4 py-3 font-mono font-semibold">{order.orderId}</td><td className="px-4 py-3"><p className="font-medium">{order.customerName}</p><p className="text-neutral-500">{order.phone}</p></td>
          <td className="px-4 py-3">{order.products.map(product => <span className="block truncate max-w-[190px]" key={product.name}>{product.name} ×{product.qty}</span>)}</td><td className="px-4 py-3 font-mono font-semibold">{fmt(order.total)}</td><td className="px-4 py-3">{order.date}</td><td className="px-4 py-3">{order.paymentMethod} / {order.paymentStatus}</td>
          <td className="px-4 py-3"><span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold ${COLORS[order.status]}`}>{order.status}</span></td><td className="px-4 py-3"><button onClick={() => setDetail(order)}><Eye className="w-3.5 h-3.5" /></button></td>
        </tr>)}</tbody>
      </table>
    </div>
    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/50" onClick={() => setDetail(null)} /><div className="relative bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl z-10">
      <div className="flex justify-between border-b pb-4"><div><h2 className="font-display text-lg">Order {detail.orderId}</h2><p className="text-xs text-neutral-500">{detail.customerName} · {detail.customerEmail || 'Email unavailable'}</p></div><button onClick={() => setDetail(null)}><X className="w-5 h-5" /></button></div>
      <div className="py-4 text-xs leading-relaxed"><p>{detail.address}</p><p>{detail.area ? `${detail.area}, ` : ''}{detail.city} — {detail.pinCode}, {detail.state}</p><div className="divide-y my-4">{detail.products.map(product => <div className="flex justify-between py-2" key={product.name}><span>{product.name} ×{product.qty}</span><span>{fmt(product.price * product.qty)}</span></div>)}</div><p className="font-bold">Total: {fmt(detail.total)}</p></div>
      <div className="border-t pt-4"><p className="text-[10px] uppercase font-semibold text-neutral-500 mb-2">Fulfillment status</p><div className="flex flex-wrap gap-2">{STATUSES.map(item => <button key={item} onClick={() => changeStatus(detail, item)} className={`px-3 py-1.5 text-[11px] border ${detail.status === item ? 'bg-neutral-900 text-white' : 'border-neutral-300'}`}>{item}</button>)}</div></div>
    </div></div>}
  </div>;
};
