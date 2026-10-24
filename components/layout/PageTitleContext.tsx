"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface PageTitleContextValue {
  title: string | null;
  setPageTitle: (title: string | null) => void;
  mobileTitle: string | null;
  setMobileTitle: (title: string | null) => void;
  headerActions: ReactNode | null;
  setHeaderActions: (actions: ReactNode | null) => void;
  headerBack: (() => void) | null;
  setHeaderBack: (onBack: (() => void) | null) => void;
  hideBottomNav: boolean;
  setHideBottomNav: (hide: boolean) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setPageTitle] = useState<string | null>(null);
  const [mobileTitle, setMobileTitle] = useState<string | null>(null);
  const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
  const [headerBack, setHeaderBackState] = useState<(() => void) | null>(null);
  const setHeaderBack = useCallback((onBack: (() => void) | null) => setHeaderBackState(() => onBack), []);
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const value = useMemo(
    () => ({
      title,
      setPageTitle,
      mobileTitle,
      setMobileTitle,
      headerActions,
      setHeaderActions,
      headerBack,
      setHeaderBack,
      hideBottomNav,
      setHideBottomNav,
    }),
    [title, mobileTitle, headerActions, headerBack, hideBottomNav, setHeaderBack],
  );

  return <PageTitleContext.Provider value={value}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
