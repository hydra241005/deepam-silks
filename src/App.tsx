import React from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HomePageView } from './components/HomePageView';
import { CategoryPage } from './components/CategoryPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { WishlistView } from './components/WishlistView';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminDashboard } from './admin/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { SearchModal } from './components/SearchModal';
import { AccountModal } from './components/AccountModal';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';

const MainContent: React.FC = () => {
  const { currentView, isAdmin, isAuthLoading } = useShop();

  // Admin dashboard — completely separate full-screen layout
  if (currentView === 'admin') {
    if (isAuthLoading) {
      return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Checking authorization…</div>;
    }
    if (!isAdmin) {
      return <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Admin access denied.</div>;
    }
    return <AdminDashboard />;
  }

  // Login and Signup pages use a full-screen layout — no header/footer/overlays
  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden w-full max-w-[100vw]">
        <LoginPage />
        <ToastContainer />
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden w-full max-w-[100vw]">
        <SignupPage />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden w-full max-w-[100vw]">
      {/* Top Promotional Bar */}
      <AnnouncementBar />

      {/* Main Header with Mega Menus */}
      <Header />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {currentView === 'home' && <HomePageView />}
        {currentView === 'category' && <CategoryPage />}
        {currentView === 'product' && <ProductDetailPage />}
        {currentView === 'wishlist' && <WishlistView />}
        {currentView === 'order-confirmation' && <OrderConfirmationView />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Interactive Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal />
      <SearchModal />
      <AccountModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainContent />
    </ShopProvider>
  );
}
