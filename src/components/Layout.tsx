import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isNoPadding = location.pathname.startsWith("/document-edit");

  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      
      {/* Sidebar — fixed, never moves */}
      <div className="flex-shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Main content — scrolls independently */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <main className={`flex-1 ${isNoPadding ? "" : "p-6 md:p-8"}`}>
          {children}
        </main>
      </div>

    </div>
  );
}