'use client';
import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import FAB from '@/components/FAB';
import Modals from '@/components/Modals';
import DashboardPage from '@/components/DashboardPage';
import ItemsPage from '@/components/ItemsPage';
import SuppliersPage from '@/components/SuppliersPage';
import PurchaseOrdersPage from '@/components/PurchaseOrdersPage';
import DocumentsPage from '@/components/DocumentsPage';

function AppContent() {
  const { activePage } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'items':
        return <ItemsPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'purchase-orders':
        return <PurchaseOrdersPage />;
      case 'documents':
        return <DocumentsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {renderPage()}
      </main>
      <FAB />
      <Modals />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
