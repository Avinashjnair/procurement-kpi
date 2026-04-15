'use client';
import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import FAB from '@/components/FAB';
import Modals from '@/components/Modals';
import LoginPage from '@/components/LoginPage';
import DashboardPage from '@/components/DashboardPage';
import ItemsPage from '@/components/ItemsPage';
import SuppliersPage from '@/components/SuppliersPage';
import RFQPage from '@/components/RFQPage';
import QuotationsPage from '@/components/QuotationsPage';
import PurchaseOrdersPage from '@/components/PurchaseOrdersPage';
import GRNPage from '@/components/GRNPage';
import InventoryPage from '@/components/InventoryPage';
import DocumentsPage from '@/components/DocumentsPage';
import AssetsPage from '@/components/AssetsPage';
import FinancePage from '@/components/FinancePage';
import ExecutiveReportsPage from '@/components/ExecutiveReportsPage';
import BudgetsPage from '@/components/BudgetsPage';
import ContractsPage from '@/components/ContractsPage';
import AnalyticsPage from '@/components/AnalyticsPage';
import BlanketsPage from '@/components/BlanketsPage';
import InvoicesPage from '@/components/InvoicesPage';
import NotificationsPage from '@/components/NotificationsPage';
import SupplierPortalPage from '@/components/SupplierPortalPage';
import MobileGRNEntry from '@/components/MobileGRNEntry';

function AppContent() {
  const { activePage, darkMode, currentUser } = useApp();

  React.useEffect(() => {
    if (!darkMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [darkMode]);

  if (!currentUser) return <LoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':       return <DashboardPage />;
      case 'portal':          return <SupplierPortalPage />;
      case 'items':           return <ItemsPage />;
      case 'suppliers':       return <SuppliersPage />;
      case 'rfq':             return <RFQPage />;
      case 'quotations':      return <QuotationsPage />;
      case 'purchase-orders': return <PurchaseOrdersPage />;
      case 'invoices':        return <InvoicesPage />;
      case 'quick-grn':       return <MobileGRNEntry />;
      case 'grn':             return <GRNPage />;
      case 'inventory':       return <InventoryPage />;
      case 'blanket-pos':     return <BlanketsPage />;
      case 'notifications':   return <NotificationsPage />;
      case 'documents':       return <DocumentsPage />;
      case 'assets':          return <AssetsPage />;
      case 'finance':         return <FinancePage />;
      case 'reports':         return <ExecutiveReportsPage />;
      case 'budgets':         return <BudgetsPage />;
      case 'contracts':       return <ContractsPage />;
      case 'analytics':       return <AnalyticsPage />;
      default:                return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{renderPage()}</main>
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
