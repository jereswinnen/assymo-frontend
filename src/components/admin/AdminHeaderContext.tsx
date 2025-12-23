"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface AdminHeaderContextType {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
  tabs: ReactNode;
  setTabs: (tabs: ReactNode) => void;
}

const AdminHeaderContext = createContext<AdminHeaderContextType | null>(null);

export function AdminHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  const [tabs, setTabs] = useState<ReactNode>(null);

  return (
    <AdminHeaderContext.Provider value={{ actions, setActions, tabs, setTabs }}>
      {children}
    </AdminHeaderContext.Provider>
  );
}

export function useAdminHeaderActions(actions: ReactNode) {
  const context = useContext(AdminHeaderContext);
  if (!context) {
    throw new Error(
      "useAdminHeaderActions must be used within AdminHeaderProvider",
    );
  }

  const { setActions } = context;

  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
  }, [actions, setActions]);
}

export function useAdminHeaderTabs(tabs: ReactNode) {
  const context = useContext(AdminHeaderContext);
  if (!context) {
    throw new Error(
      "useAdminHeaderTabs must be used within AdminHeaderProvider",
    );
  }

  const { setTabs } = context;

  useEffect(() => {
    setTabs(tabs);
    return () => setTabs(null);
  }, [tabs, setTabs]);
}

export function AdminHeaderActions() {
  const context = useContext(AdminHeaderContext);
  if (!context) return null;
  return <>{context.actions}</>;
}

export function AdminHeaderTabs({ className }: { className?: string }) {
  const context = useContext(AdminHeaderContext);
  if (!context || !context.tabs) return null;
  return <div className={cn(className)}>{context.tabs}</div>;
}
