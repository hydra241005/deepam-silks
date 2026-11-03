import React from 'react';
import {
  LayoutDashboard, ShoppingBag, Package, Tag, Layers,
  BadgePercent, BarChart2, Users, Settings, LogOut,
  X, ChevronRight, Sparkles
} from 'lucide-react';
import { AdminSection } from './adminTypes';

interface Props {
  activeSection: AdminSection;
  onNavigate: (s: AdminSection) => void;
  onLogout: () => void;
  isOpen: boolean;          // mobile drawer open
  onClose: () => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Dashboard',          icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'orders',     label: 'Orders',             icon: <ShoppingBag     className="w-4 h-4" /> },
  { id: 'products',   label: 'Products',           icon: <Package         className="w-4 h-4" /> },
  { id: 'categories', label: 'Categories',         icon: <Tag             className="w-4 h-4" /> },
  { id: 'inventory',  label: 'Inventory',          icon: <Layers          className="w-4 h-4" /> },
  { id: 'sales',      label: 'Sales & Discounts',  icon: <BadgePercent    className="w-4 h-4" /> },
  { id: 'analytics',  label: 'Revenue & Analytics',icon: <BarChart2       className="w-4 h-4" /> },
  { id: 'customers',  label: 'Customers',          icon: <Users           className="w-4 h-4" /> },
  { id: 'settings',   label: 'Settings',           icon: <Settings        className="w-4 h-4" /> },
];

const SidebarContent: React.FC<Props> = ({ activeSection, onNavigate, onLogout, onClose }) => (
  <div className="flex flex-col h-full bg-neutral-950 text-neutral-300">

    {/* Brand */}
    <div className="px-6 pt-6 pb-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
      <div>
        <p className="font-display text-white text-lg tracking-[0.18em] uppercase font-medium leading-tight">
          Deepam Silks
        </p>
        <span className="text-[9px] tracking-[0.22em] uppercase text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
          <Sparkles className="w-2.5 h-2.5" /> Admin Panel
        </span>
      </div>
      {/* Mobile close */}
      <button onClick={onClose} className="lg:hidden text-neutral-500 hover:text-white p-1" aria-label="Close sidebar">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto py-4 px-3 min-h-0">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = activeSection === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors rounded-sm text-left ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-amber-400' : 'text-neutral-500'}>{item.icon}</span>
                <span className="tracking-[0.05em]">{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-amber-400" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>

    {/* Footer */}
    <div className="px-3 py-4 border-t border-neutral-800 shrink-0">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-neutral-400 hover:bg-rose-950/40 hover:text-rose-400 transition-colors rounded-sm"
      >
        <LogOut className="w-4 h-4" />
        <span className="tracking-[0.05em]">Logout</span>
      </button>
    </div>

  </div>
);

export const AdminSidebar: React.FC<Props> = (props) => (
  <>
    {/* Desktop — fixed sidebar */}
    <aside className="hidden lg:flex w-60 shrink-0 flex-col h-screen sticky top-0">
      <SidebarContent {...props} />
    </aside>

    {/* Mobile — overlay drawer */}
    {props.isOpen && (
      <div className="lg:hidden fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/60" onClick={props.onClose} />
        <aside className="fixed inset-y-0 left-0 w-64 flex flex-col shadow-2xl z-50">
          <SidebarContent {...props} />
        </aside>
      </div>
    )}
  </>
);
