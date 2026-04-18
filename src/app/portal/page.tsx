'use client';
import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import SupplierPortalPage from '@/components/SupplierPortalPage';
import SupplierLoginView from '@/components/SupplierLoginView';
import Modals from '@/components/Modals';

function PortalContent() {
  const { currentSupplier, darkMode } = useApp();

  React.useEffect(() => {
    if (!darkMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [darkMode]);

  // If not logged in as a supplier, show the dedicated login
  if (!currentSupplier) {
    return <SupplierLoginView />;
  }

  // If logged in, show the portal in standalone mode
  return (
    <div className="standalone-portal">
      <SupplierPortalPage standalone={true} />
      <Modals />
    </div>
  );
}

export default function PortalPage() {
  return <PortalContent />;
}
