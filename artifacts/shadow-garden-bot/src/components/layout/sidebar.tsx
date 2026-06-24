import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Users, 
  MessageSquare, 
  BookOpen, 
  Moon,
  Sword
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "War Room", icon: Activity },
    { href: "/users", label: "The Shades", icon: Users },
    { href: "/messages", label: "Intel", icon: MessageSquare },
    { href: "/about", label: "Codex", icon: BookOpen },
  ];

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-t border-primary/20 p-2 flex justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href} className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              isActive ? "text-primary shadow-[0_0_15px_-5px_hsl(var(--primary))]" : "text-muted-foreground hover:text-foreground"
            )}>
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium tracking-widest uppercase">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border/50 z-40">
        <div className="p-6 border-b border-sidebar-border/50 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <Moon className="w-8 h-8 text-primary relative z-10" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg tracking-wider bg-gradient-to-br from-white to-primary/80 bg-clip-text text-transparent">
              SHADOW
            </h1>
            <p className="text-xs text-primary/60 font-mono tracking-widest uppercase">Garden Base</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-mono tracking-widest text-muted-foreground mb-4 mt-2 px-4 opacity-50">
            SYSTEM_ACCESS
          </div>
          
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            
            return (
              <Link key={link.href} href={link.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_-10px_hsl(var(--primary))]" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_hsl(var(--primary))]"></div>
                )}
                <Icon className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-medium tracking-wide">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-sidebar-border/50 mt-auto">
          <div className="flex items-center gap-3 opacity-60">
            <Sword className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono tracking-widest">I AM ATOMIC</span>
          </div>
        </div>
      </aside>
    </>
  );
}
