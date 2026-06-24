import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Shield } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 w-full max-w-[100vw] overflow-x-hidden md:ml-64 transition-all pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
