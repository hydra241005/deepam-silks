import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Edit2, Search, XCircle } from 'lucide-react';
import { getAdminProducts, updateAdminInventory, type AdminProductRecord } from '../lib/backend';

export const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [target, setTarget] = useState<{ product: AdminProductRecord; variantId: string; variantName: string; stock: number } | null>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); getAdminProducts().then(setProducts).catch(reason => setError(reason instanceof Error ? reason.message : 'Inventory could not be loaded.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  const rows = useMemo(() => products.flatMap(product => product.variants.map(variant => ({ product, variant }))).filter(({ product, variant }) => {
    const query = search.toLowerCase(); const stock = variant.stock;
    return (!query || product.name.toLowerCase().includes(query) || variant.id.toLowerCase().includes(query)) &&
      (filter === 'all' || (filter === 'low' ? stock > 0 && stock <= 5 : stock === 0));
  }), [products, search, filter]);
  const total = products.reduce((sum, product) => sum + product.stock, 0);
  const low = products.reduce((sum, product) => sum + product.variants.filter(variant => variant.stock > 0 && variant.stock <= 5).length, 0);
  const out = products.reduce((sum, product) => sum + product.variants.filter(variant => variant.stock === 0).length, 0);
  const save = async () => {
    const quantity = Number(value);
    if (!target || !Number.isInteger(quantity) || quantity < 0) { setError('Enter a non-negative whole number.'); return; }
    try { await updateAdminInventory(target.variantId, quantity); setProducts(current => current.map(product => product.id !== target.product.id ? product : { ...product, stock: product.stock - target.stock + quantity, variants: product.variants.map(variant => variant.id === target.variantId ? { ...variant, stock: quantity } : variant) })); setTarget(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Inventory could not be updated.'); }
  };
  return <div className="space-y-6"><div><h1 className="font-display text-2xl text-neutral-900 font-medium">Inventory Management</h1><p className="text-xs text-neutral-500 mt-0.5">Live variant inventory</p></div>{error && <div className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[['Total Stock Units', total], ['Low Stock Variants', low], ['Out of Stock', out]].map(([label, count], index) => <button key={String(label)} onClick={() => setFilter(index === 0 ? 'all' : index === 1 ? 'low' : 'out')} className="text-left p-5 border border-neutral-200 bg-white"><p className="text-3xl font-bold font-mono">{count}</p><p className="text-xs text-neutral-500">{label}</p></button>)}</div>
    <div className="bg-white border border-neutral-200 p-4 flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products or variants…" className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs" /></div><select value={filter} onChange={event => setFilter(event.target.value as typeof filter)} className="border border-neutral-300 px-3 text-xs"><option value="all">All</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select></div>
    <div className="bg-white border border-neutral-200 overflow-x-auto"><table className="w-full text-xs min-w-[650px]"><thead className="bg-neutral-50 border-b"><tr>{['Product', 'Variant', 'Stock Status', 'Units', 'Price', 'Update'].map(label => <th key={label} className="text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{loading ? <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-neutral-400">Loading live inventory…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-neutral-400">No inventory records found.</td></tr> : rows.map(({ product, variant }) => <tr key={variant.id}><td className="px-5 py-3"><p className="font-medium">{product.name}</p><p className="text-neutral-400 font-mono">{product.id}</p></td><td className="px-5 py-3">{variant.name}<p className="text-neutral-400 font-mono">{variant.id}</p></td><td className="px-5 py-3">{variant.stock === 0 ? <span className="text-rose-700"><XCircle className="inline w-3.5 h-3.5" /> Out</span> : variant.stock <= 5 ? <span className="text-amber-700"><AlertTriangle className="inline w-3.5 h-3.5" /> Low</span> : <span className="text-emerald-700"><CheckCircle2 className="inline w-3.5 h-3.5" /> In Stock</span>}</td><td className="px-5 py-3 font-mono font-bold">{variant.stock}</td><td className="px-5 py-3">₹{product.sellingPrice.toLocaleString('en-IN')}</td><td className="px-5 py-3"><button onClick={() => { setTarget({ product, variantId: variant.id, variantName: variant.name, stock: variant.stock }); setValue(String(variant.stock)); }} className="inline-flex items-center gap-1 border border-neutral-300 px-3 py-1.5"><Edit2 className="w-3 h-3" /> Update</button></td></tr>)}</tbody></table></div>
    {target && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/50" onClick={() => setTarget(null)} /><div className="relative bg-white p-6 w-full max-w-sm z-10"><div className="flex justify-between mb-4"><h2 className="font-display text-lg">Update Inventory</h2><button onClick={() => setTarget(null)}><XCircle className="w-5 h-5" /></button></div><p className="text-sm mb-3">{target.product.name} · {target.variantName}</p><input type="number" min="0" value={value} onChange={event => setValue(event.target.value)} className="w-full border border-neutral-300 px-3 py-2 text-sm" /><button onClick={save} className="mt-4 w-full bg-neutral-900 text-white py-2 text-xs font-semibold uppercase">Save Stock</button></div></div>}
  </div>;
};
