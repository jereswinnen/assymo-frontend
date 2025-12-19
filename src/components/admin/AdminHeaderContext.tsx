"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AdminHeaderContextType {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
}

const AdminHeaderContext = createContext<AdminHeaderContextType | null>(null);

export function AdminHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);

  return (
    <AdminHeaderContext.Provider value={{ actions, setActions }}>
      {children}
    </AdminHeaderContext.Provider>
  );
}

export function useAdminHeaderActions(actions: ReactNode) {
  const context = useContext(AdminHeaderContext);
  if (!context) {
    throw new Error(
      "useAdminHeaderActions must be used within AdminHeaderProvider"
    );
  }

  const { setActions } = context;

  useEffect(() => {
    setActions(actions);
    return () => setActions(null);
  }, [actions, setActions]);
}

export function AdminHeaderActions() {
  const context = useContext(AdminHeaderContext);
  if (!context) return null;
  return <>{context.actions}</>;
}
