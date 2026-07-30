import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  NotebookPen,
  MessagesSquare,
  Users,
  Trophy,
  LifeBuoy,
  UserRound,
  LogOut,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/app", label: "Prezentare", icon: LayoutDashboard, end: true },
  { to: "/app/jurnal", label: "Jurnal", icon: NotebookPen },
  { to: "/app/asistent", label: "Asistent AI", icon: MessagesSquare },
  { to: "/app/obiective", label: "Obiective", icon: Trophy },
  { to: "/app/comunitate", label: "Comunitate", icon: Users },
  { to: "/app/resurse", label: "Resurse", icon: LifeBuoy },
  { to: "/app/profil", label: "Profil", icon: UserRound },
];

const SidebarContent = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2 px-6 h-16" data-testid="sidebar-logo">
        <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Leaf className="h-4 w-4" strokeWidth={1.5} />
        </span>
        <span className="font-serif text-xl tracking-tight">Renaștere</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-secondary-foreground hover:bg-white/70"
              }`
            }
          >
            <item.icon className="h-5 w-5" strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-black/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center font-medium">
            {(user?.name || "U")[0].toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          data-testid="logout-button"
          className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:bg-white/70 transition-colors"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} /> Deconectare
        </button>
      </div>
    </div>
  );
};

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#EEF2EE] border-r border-black/5 flex-col fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#EEF2EE] z-50 lg:hidden"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4" data-testid="close-sidebar">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-black/5 h-14 flex items-center px-4 gap-3">
          <button onClick={() => setOpen(true)} data-testid="open-sidebar">
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>
          <span className="font-serif text-lg">Renaștere</span>
        </header>
        <main className="p-5 md:p-8 lg:p-12 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
