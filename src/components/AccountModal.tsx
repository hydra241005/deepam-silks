import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { 
  X, 
  User, 
  Package, 
  MapPin, 
  Sparkles, 
  Edit3,
  Plus,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import type { DeliveryAddressInput } from '../lib/backend';

export const AccountModal: React.FC = () => {
  const {
    isAccountOpen,
    setIsAccountOpen,
    recentOrders,
    profile,
    addresses,
    isAccountDataLoading,
    accountError,
    saveProfile,
    saveAddress,
    removeAddress,
    makePrimaryAddress,
  } = useShop();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<DeliveryAddressInput>({
    fullName: '', phone: '', email: '', pinCode: '', addressLine1: '',
    addressLine2: '', city: '', state: '', isDefault: false,
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({ fullName: profile.fullName, phone: profile.phone });
    }
  }, [profile]);

  const validateProfile = () => {
    if (profileForm.fullName.trim().length < 2) return 'Enter your full name.';
    if (profileForm.phone.trim() && !/^[6-9]\d{9}$/.test(profileForm.phone.trim())) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    return '';
  };

  const validateAddress = () => {
    if (addressForm.fullName.trim().length < 2) return 'Enter the recipient name.';
    if (!/^[6-9]\d{9}$/.test(addressForm.phone.trim())) return 'Enter a valid 10-digit Indian mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addressForm.email.trim())) return 'Enter a valid email address.';
    if (!/^[1-9]\d{5}$/.test(addressForm.pinCode.trim())) return 'Enter a valid 6-digit PIN code.';
    if (addressForm.addressLine1.trim().length < 5) return 'Enter a complete address.';
    if (addressForm.city.trim().length < 2 || addressForm.state.trim().length < 2) return 'Enter city and state.';
    return '';
  };

  const handleProfileSave = async () => {
    const error = validateProfile();
    if (error) { setFormError(error); return; }
    setIsSaving(true);
    setFormError('');
    try {
      await saveProfile(profileForm);
      setIsEditingProfile(false);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Profile could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const startAddress = (address?: typeof addresses[number]) => {
    setEditingAddressId(address?.id ?? null);
    setAddressForm(address ? {
      fullName: address.fullName, phone: address.phone, email: address.email,
      pinCode: address.pinCode, addressLine1: address.addressLine1,
      addressLine2: address.addressLine2, city: address.city, state: address.state,
      isDefault: address.isDefault,
    } : {
      fullName: profile?.fullName ?? '', phone: profile?.phone ?? '', email: profile?.email ?? '',
      pinCode: '', addressLine1: '', addressLine2: '', city: '', state: '', isDefault: addresses.length === 0,
    });
    setFormError('');
    setIsAddressFormOpen(true);
  };

  const handleAddressSave = async () => {
    const error = validateAddress();
    if (error) { setFormError(error); return; }
    setIsSaving(true);
    setFormError('');
    try {
      await saveAddress(addressForm, editingAddressId ?? undefined);
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : 'Address could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setIsSaving(true);
    setFormError('');
    try {
      await removeAddress(id);
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : 'Address could not be deleted.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAccountOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsAccountOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-none">
        <div className="w-full sm:w-[420px] max-w-[100vw] sm:max-w-md bg-white shadow-2xl flex flex-col h-full max-h-[100dvh] overflow-hidden pointer-events-auto border-l border-neutral-200">
          
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-display text-base">
                {(profile?.fullName || profile?.email || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  {profile?.fullName || profile?.email?.split('@')[0] || 'Customer'}
                </h3>
                <span className="text-[10px] text-neutral-500 tracking-wider">
                  {profile?.email || 'Account details'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsAccountOpen(false)}
              className="p-1 text-neutral-400 hover:text-black"
              aria-label="Close account"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-8">
            {isAccountDataLoading && (
              <p className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading account details…
              </p>
            )}
            {(accountError || formError) && (
              <p className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200" role="alert">
                {formError || accountError}
              </p>
            )}

            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-neutral-600" /> Profile
                </h4>
                <button onClick={() => { setIsEditingProfile(v => !v); setFormError(''); }} className="text-xs text-neutral-600 hover:text-black inline-flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> {isEditingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {isEditingProfile ? (
                <div className="space-y-3">
                  <input value={profileForm.fullName} onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 border border-neutral-300 text-xs" />
                  <input value={profile?.email ?? ''} readOnly className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-xs text-neutral-500" />
                  <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone number" inputMode="numeric" className="w-full px-3 py-2 border border-neutral-300 text-xs" />
                  <button disabled={isSaving} onClick={handleProfileSave} className="px-3 py-2 bg-neutral-900 text-white text-xs inline-flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              ) : (
                <div className="p-3.5 border border-neutral-200 text-xs text-neutral-600 space-y-1">
                  <p className="font-semibold text-neutral-900">{profile?.fullName || 'Customer'}</p>
                  <p>{profile?.email || 'Email unavailable'}</p>
                  {profile?.phone && <p className="font-mono">{profile.phone}</p>}
                </div>
              )}
            </section>
            
            {/* Membership Perks */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Privé Rewards Active</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed font-light">
                Earn 5% cashback points on all handloom sarees & jewellery. Complimentary insured shipping on all orders.
              </p>
            </div>

            {/* Recent Orders Section */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 mb-3 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-neutral-600" /> Recent Orders ({recentOrders.length})
              </h4>

              {recentOrders.length === 0 ? (
                <div className="p-5 border border-dashed border-neutral-300 text-center text-xs text-neutral-500">
                  No orders placed yet. Start shopping our new arrivals!
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <div
                      key={order.orderId}
                      className="p-3.5 border border-neutral-200 bg-white hover:border-neutral-400 transition-colors text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-neutral-900 mb-1">
                        <strong className="font-bold">{order.orderId}</strong>
                        <span className="px-2 py-0.5 bg-neutral-100 text-[10px] uppercase font-sans font-semibold">
                          {order.status}
                        </span>
                      </div>
                      <div className="text-neutral-500 text-[11px] flex justify-between">
                        <span>{order.date}</span>
                        <span className="text-neutral-900 font-semibold">
                          ₹{order.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {order.estimatedDelivery}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-neutral-600" /> Delivery Addresses
                </h4>
                <button onClick={() => startAddress()} className="text-xs text-neutral-600 hover:text-black inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {isAddressFormOpen && (
                <div className="p-3.5 border border-neutral-300 mb-3 space-y-2">
                  {(['fullName', 'phone', 'email', 'pinCode', 'addressLine1', 'addressLine2', 'city', 'state'] as const).map(field => (
                    <input key={field} value={addressForm[field]} onChange={e => setAddressForm({ ...addressForm, [field]: e.target.value })} placeholder={field.replace(/([A-Z])/g, ' $1')} className="w-full px-3 py-2 border border-neutral-300 text-xs" />
                  ))}
                  <label className="flex items-center gap-2 text-xs text-neutral-600">
                    <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} />
                    Set as primary address
                  </label>
                  <div className="flex gap-2">
                    <button disabled={isSaving} onClick={handleAddressSave} className="px-3 py-2 bg-neutral-900 text-white text-xs disabled:opacity-50">{isSaving ? 'Saving…' : 'Save Address'}</button>
                    <button onClick={() => setIsAddressFormOpen(false)} className="px-3 py-2 border border-neutral-300 text-xs">Cancel</button>
                  </div>
                </div>
              )}
              {addresses.length === 0 && !isAddressFormOpen ? (
                <div className="p-5 border border-dashed border-neutral-300 text-center text-xs text-neutral-500">No delivery addresses saved.</div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(address => (
                    <div key={address.id} className="p-3.5 border border-neutral-200 text-xs text-neutral-600 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-neutral-900">{address.fullName} {address.isDefault && <span className="text-[10px] text-amber-700 uppercase">(Primary)</span>}</p>
                        <div className="flex gap-2">
                          <button onClick={() => startAddress(address)} aria-label="Edit address" className="text-neutral-500 hover:text-black"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteAddress(address.id)} disabled={isSaving} aria-label="Delete address" className="text-neutral-500 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                      <p>{address.city}, {address.state} - {address.pinCode}</p>
                      <p className="font-mono pt-1">{address.phone}</p>
                      {!address.isDefault && <button onClick={() => makePrimaryAddress(address.id)} className="pt-2 text-[10px] uppercase tracking-wider text-neutral-700 hover:text-black">Make primary</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">Personal Fashion Concierge</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-light">
                Need styling advice for an upcoming wedding or assistance with custom blouse tailoring?
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
