import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isNoPadding = location.pathname.startsWith("/document-edit");
  return (
    <div className="flex min-h-screen w-full bg-background " >
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className={`flex-1 ${isNoPadding ? "" : "flex-1 p-6 md:p-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
