import React, { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { getAdminCustomers, type AdminCustomerRecord } from '../lib/backend';

const exportCSV = (customers: AdminCustomerRecord[]) => {
  const rows = [['Customer ID', 'Name', 'Email', 'Phone', 'City', 'Orders', 'Total Spent'], ...customers.map(customer => [
    customer.id, customer.name, customer.email, customer.phone, customer.city, String(customer.orderCount), String(customer.totalSpent),
  ])];
  const blob = new Blob([rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'deepam_customers.csv'; link.click(); URL.revokeObjectURL(url);
};

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAdminCustomers().then(setCustomers).catch(reason => setError(reason instanceof Error ? reason.message : 'Customers could not be loaded.')).finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => customers.filter(customer => {
    const query = search.toLowerCase();
    return !query || [customer.id, customer.name, customer.email, customer.phone, customer.city].some(value => value.toLowerCase().includes(query));
  }), [customers, search]);
  const revenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="font-display text-2xl text-neutral-900 font-medium">Customer Management</h1><p className="text-xs text-neutral-500 mt-0.5">{filtered.length} live customers</p></div><button onClick={() => exportCSV(filtered)} className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider"><Download className="w-3.5 h-3.5" /> Export CSV</button></div>
    {error && <div className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{[['Total Customers', customers.length], ['Total Revenue', `₹${revenue.toLocaleString('en-IN')}`], ['Orders', customers.reduce((sum, customer) => sum + customer.orderCount, 0)]].map(([label, value]) => <div className="bg-white border border-neutral-200 p-4" key={String(label)}><p className="text-lg font-bold font-mono">{value}</p><p className="text-[11px] text-neutral-500">{label}</p></div>)}</div>
    <div className="bg-white border border-neutral-200 p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search live customers…" className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs" /></div></div>
    <div className="bg-white border border-neutral-200 overflow-x-auto"><table className="w-full text-xs min-w-[700px]"><thead className="bg-neutral-50 border-b"><tr>{['Customer ID', 'Name', 'Email', 'Phone', 'City', 'Orders', 'Total Spent', 'Joined'].map(label => <th key={label} className="text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{loading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">Loading live customers…</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-neutral-400">No customers found.</td></tr> : filtered.map(customer => <tr key={customer.id}><td className="px-4 py-3 font-mono text-neutral-500">{customer.id}</td><td className="px-4 py-3 font-medium">{customer.name}</td><td className="px-4 py-3">{customer.email || 'Unavailable'}</td><td className="px-4 py-3">{customer.phone || 'Unavailable'}</td><td className="px-4 py-3">{customer.city || 'Unavailable'}</td><td className="px-4 py-3 font-mono font-bold">{customer.orderCount}</td><td className="px-4 py-3 font-mono font-semibold">₹{customer.totalSpent.toLocaleString('en-IN')}</td><td className="px-4 py-3">{customer.joinedDate}</td></tr>)}</tbody></table></div>
  </div>;
};
