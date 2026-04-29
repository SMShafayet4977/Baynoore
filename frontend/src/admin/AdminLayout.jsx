import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import mainLogo from "../assets/baynoore-main-logo.png";

export default function AdminLayout({ children }) {
  const { admin, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  const navLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    ...(isSuperAdmin ? [{ to: "/admin/admins", icon: Users, label: "Admins" }] : []),
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-brown text-ivory">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-ivory/10">
        <img src={mainLogo} alt="Baynoore" className="h-8 w-auto object-contain brightness-0 invert" />
        <p className="text-[10px] tracking-widest text-gold-light mt-1">ADMIN PANEL</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-ivory/15 text-ivory" : "text-ivory/70 hover:bg-ivory/10 hover:text-ivory"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-ivory/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold-muted flex items-center justify-center text-white text-xs font-bold">
            {admin?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ivory truncate">{admin?.name}</p>
            <p className="text-[10px] text-ivory/50 capitalize">{admin?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs text-ivory/70 hover:bg-ivory/10 hover:text-ivory transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-56 flex-shrink-0 flex flex-col z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500 hidden sm:block">{admin?.email}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
