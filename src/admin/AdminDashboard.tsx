import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminOverview } from './AdminOverview';
import { AdminOrders } from './AdminOrders';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminInventory } from './AdminInventory';
import { AdminSales } from './AdminSales';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminCustomers } from './AdminCustomers';
import { AdminSettings } from './AdminSettings';
import { AdminSection } from './adminTypes';
import { useShop } from '../context/ShopContext';

export const AdminDashboard: React.FC = () => {
  const { navigateToHome, logout } = useShop();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout().catch(() => navigateToHome());
  };

  return (
    <div className="flex min-h-screen bg-neutral-100 font-sans text-neutral-900 overflow-x-hidden">

      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-5 py-3.5 flex items-center gap-4 shrink-0">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-1.5 text-neutral-600 hover:text-neutral-900"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 min-w-0">
            <button onClick={handleLogout} className="hover:text-neutral-900 transition-colors shrink-0">
              Deepam Silks
            </button>
            <span className="shrink-0">/</span>
            <span className="text-neutral-900 font-semibold capitalize truncate">
              {activeSection === 'overview' ? 'Dashboard' :
               activeSection === 'analytics' ? 'Revenue & Analytics' :
               activeSection === 'sales' ? 'Sales & Discounts' :
               activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </span>
          </div>

          {/* Admin label */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                A
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[11px] font-semibold text-neutral-900 leading-tight">Admin</p>
                <p className="text-[10px] text-amber-600 font-medium leading-tight">Deepam Silks</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-y-auto">
          {activeSection === 'overview'   && <AdminOverview  onNavigate={setActiveSection as (s: 'orders' | 'products' | 'customers' | 'inventory') => void} />}
          {activeSection === 'orders'     && <AdminOrders    />}
          {activeSection === 'products'   && <AdminProducts  />}
          {activeSection === 'categories' && <AdminCategories/>}
          {activeSection === 'inventory'  && <AdminInventory />}
          {activeSection === 'sales'      && <AdminSales     />}
          {activeSection === 'analytics'  && <AdminAnalytics />}
          {activeSection === 'customers'  && <AdminCustomers />}
          {activeSection === 'settings'   && <AdminSettings  />}
        </main>

      </div>
    </div>
  );
};
