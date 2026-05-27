import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * UpgradeContext
 *
 * Provides a global `showUpgrade(plan?)` function that any component can call
 * to open the upgrade modal. The modal itself is rendered once in App.jsx so
 * it floats above all other content.
 *
 * Usage:
 *   const { showUpgrade } = useUpgrade();
 *   showUpgrade('pro');      // opens modal pre-selecting Pro
 *   showUpgrade('starter');  // opens modal pre-selecting Starter
 *   showUpgrade();           // opens modal with default selection
 */

const UpgradeContext = createContext(null);

export function UpgradeProvider({ children }) {
  // null = modal closed; 'starter' | 'pro' = modal open with that plan focused
  const [upgradeTarget, setUpgradeTarget] = useState(null);

  const showUpgrade = useCallback((plan = null) => {
    setUpgradeTarget(plan || 'starter');
  }, []);

  const hideUpgrade = useCallback(() => {
    setUpgradeTarget(null);
  }, []);

  return (
    <UpgradeContext.Provider value={{ upgradeTarget, showUpgrade, hideUpgrade }}>
      {children}
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error('useUpgrade must be used inside <UpgradeProvider>');
  return ctx;
}
