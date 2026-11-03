import React, { useEffect, useMemo, useState } from 'react';
import { BadgePercent, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { deleteAdminOffer, getAdminOffers, getAdminProducts, saveAdminOffer, type AdminOfferRecord, type AdminProductRecord } from '../lib/backend';

type Status = 'All' | 'Scheduled' | 'Active' | 'Expired' | 'Inactive';
type OfferType = 'All' | 'percentage' | 'fixed';
const statusOf = (offer: AdminOfferRecord): Exclude<Status, 'All'> => {
  if (!offer.active) return 'Inactive';
  const now = Date.now();
  if (now < Date.parse(offer.startsAt)) return 'Scheduled';
  if (now > Date.parse(offer.endsAt)) return 'Expired';
  return 'Active';
};
const emptyForm = { name: '', description: '', discountType: 'percentage' as 'percentage' | 'fixed', discountValue: '', startsAt: '', endsAt: '', active: true, productIds: [] as string[] };

export const AdminSales: React.FC = () => {
  const [offers, setOffers] = useState<AdminOfferRecord[]>([]);
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [status, setStatus] = useState<Status>('All');
  const [offerType, setOfferType] = useState<OfferType>('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminOfferRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    Promise.all([getAdminOffers(), getAdminProducts()]).then(([nextOffers, nextProducts]) => { setOffers(nextOffers); setProducts(nextProducts); })
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Offers could not be loaded.')).finally(() => setLoading(false));
  };
  useEffect(load, []);
  const categories = useMemo(() => ['All', ...new Set(offers.flatMap(offer => offer.products.map(product => product.category)).filter(Boolean))], [offers]);
  const filtered = useMemo(() => offers.filter(offer => (status === 'All' || statusOf(offer) === status) && (offerType === 'All' || offer.discountType === offerType) && (category === 'All' || offer.products.some(product => product.category === category)) && (!search || `${offer.name} ${offer.description} ${offer.products.map(product => product.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()))), [offers, status, offerType, category, search]);
  const openNew = () => { setEditing(null); setForm(emptyForm); setError(null); setShowForm(true); };
  const openEdit = (offer: AdminOfferRecord) => {
    setEditing(offer);
    setForm({ name: offer.name, description: offer.description, discountType: offer.discountType, discountValue: String(offer.discountValue), startsAt: offer.startsAt.slice(0, 16), endsAt: offer.endsAt.slice(0, 16), active: offer.active, productIds: offer.products.map(product => product.id) });
    setError(null);
    setShowForm(true);
  };
  const save = async () => {
    try { await saveAdminOffer({ ...form, id: editing?.id, discountValue: Number(form.discountValue) }); setEditing(null); setShowForm(false); load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Offer could not be saved.'); }
  };
  const remove = async (offer: AdminOfferRecord) => {
    try { await deleteAdminOffer(offer.id); setOffers(current => current.filter(item => item.id !== offer.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Offer could not be removed.'); }
  };
  return <div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="font-display text-2xl text-neutral-900 font-medium">Sales & Discounts</h1><p className="text-xs text-neutral-500 mt-0.5">{filtered.length} persisted offers</p></div><button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold uppercase"><Plus className="w-3.5 h-3.5" /> New Offer</button></div>{error && <div className="border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
    <div className="bg-white border border-neutral-200 p-4 flex flex-wrap gap-3"><div className="relative flex-1 min-w-48"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search offers or products…" className="w-full pl-9 pr-3 py-2 border border-neutral-300 text-xs" /></div><select value={status} onChange={event => setStatus(event.target.value as Status)} className="border border-neutral-300 px-3 text-xs">{['All', 'Scheduled', 'Active', 'Expired', 'Inactive'].map(value => <option key={value}>{value}</option>)}</select><select value={offerType} onChange={event => setOfferType(event.target.value as OfferType)} className="border border-neutral-300 px-3 text-xs"><option value="All">All offer types</option><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select><select value={category} onChange={event => setCategory(event.target.value)} className="border border-neutral-300 px-3 text-xs">{categories.map(value => <option key={value}>{value}</option>)}</select></div>
    <div className="bg-white border border-neutral-200 overflow-x-auto"><table className="w-full text-xs min-w-[850px]"><thead className="bg-neutral-50 border-b"><tr>{['Offer', 'Products', 'Discount', 'Starts', 'Ends', 'Status', 'Actions'].map(label => <th key={label} className="text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-5 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{loading ? <tr><td colSpan={7} className="p-8 text-center text-sm text-neutral-400">Loading offers…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-sm text-neutral-400">No offers found.</td></tr> : filtered.map(offer => <tr key={offer.id}><td className="px-5 py-3"><p className="font-medium">{offer.name}</p><p className="text-neutral-500">{offer.description}</p></td><td className="px-5 py-3"><div className="space-y-1">{offer.products.map(product => <div key={product.id} className="flex items-center gap-2"><img src={product.image} alt="" className="w-7 h-7 object-cover" /><span>{product.name}</span><span className="font-mono text-neutral-500">₹{Math.max(0, product.regularPrice - (offer.discountType === 'percentage' ? Math.floor(product.regularPrice * offer.discountValue / 100) : offer.discountValue)).toLocaleString('en-IN')}</span></div>)}</div></td><td className="px-5 py-3 font-mono">{offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue.toLocaleString('en-IN')}`}</td><td className="px-5 py-3">{new Date(offer.startsAt).toLocaleDateString('en-IN')}</td><td className="px-5 py-3">{new Date(offer.endsAt).toLocaleDateString('en-IN')}</td><td className="px-5 py-3">{statusOf(offer)}</td><td className="px-5 py-3 flex gap-2"><button onClick={() => openEdit(offer)}><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => remove(offer)}><Trash2 className="w-3.5 h-3.5 text-rose-700" /></button></td></tr>)}</tbody></table></div>
    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} /><div className="relative bg-white p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"><div className="flex justify-between mb-5"><h2 className="font-display text-lg">{editing ? 'Edit Offer' : 'New Offer'}</h2><button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs">Offer name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="w-full border p-2 mt-1" /></label><label className="text-xs">Description<input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="w-full border p-2 mt-1" /></label><label className="text-xs">Type<select value={form.discountType} onChange={event => setForm({ ...form, discountType: event.target.value as 'percentage' | 'fixed' })} className="w-full border p-2 mt-1"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label><label className="text-xs">Value<input type="number" min="0" value={form.discountValue} onChange={event => setForm({ ...form, discountValue: event.target.value })} className="w-full border p-2 mt-1" /></label><label className="text-xs">Starts<input type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} className="w-full border p-2 mt-1" /></label><label className="text-xs">Ends<input type="datetime-local" value={form.endsAt} onChange={event => setForm({ ...form, endsAt: event.target.value })} className="w-full border p-2 mt-1" /></label></div><label className="flex gap-2 text-xs mt-4"><input type="checkbox" checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} /> Active</label><p className="text-xs font-semibold mt-5 mb-2">Apply to products</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3">{products.map(product => <label key={product.id} className="flex gap-2 text-xs"><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={event => setForm({ ...form, productIds: event.target.checked ? [...form.productIds, product.id] : form.productIds.filter(id => id !== product.id) })} />{product.name}</label>)}</div><button onClick={save} className="mt-5 w-full bg-neutral-900 text-white py-2 text-xs font-semibold uppercase">Save offer</button></div></div>}
  </div>;
};
