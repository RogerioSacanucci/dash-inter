import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const DashboardIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="1"
      y="1"
      width="6"
      height="6"
      rx="1.5"
      fill="currentColor"
      opacity=".9"
    />
    <rect
      x="9"
      y="1"
      width="6"
      height="6"
      rx="1.5"
      fill="currentColor"
      opacity=".9"
    />
    <rect
      x="1"
      y="9"
      width="6"
      height="6"
      rx="1.5"
      fill="currentColor"
      opacity=".9"
    />
    <rect
      x="9"
      y="9"
      width="6"
      height="6"
      rx="1.5"
      fill="currentColor"
      opacity=".9"
    />
  </svg>
);

const TransactionsIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 5h12M10 2l3 3-3 3M14 11H2M6 8l-3 3 3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CartIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M1 1h2l1.5 8h8L15 3H4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="13" r="1.5" fill="currentColor" />
    <circle cx="11" cy="13" r="1.5" fill="currentColor" />
  </svg>
);

const ShopIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 7v7h12V7M1 3h14v4c0 0-1.5 1-3.5 1S8 7 8 7s-1.5 1-3.5 1S1 7 1 7V3z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinksIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-white/25 select-none">
      {label}
    </p>
  );
}

function NavItem({
  to,
  label,
  end,
  icon,
  onClick,
}: {
  to: string;
  label: string;
  end: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
          isActive
            ? "bg-brand/10 text-brand"
            : "text-white/40 fine-hover:text-white/70 fine-hover:bg-white/[0.04]"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const hasWayMb = isAdmin || !!user?.payer_email;
  const hasCartpanda = isAdmin || !!user?.cartpanda_param;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-200 ease-out ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside
        aria-label="Menu lateral"
        className={`fixed top-0 left-0 bottom-0 w-[220px] bg-surface-1 border-r border-white/[0.06] flex flex-col z-40 transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-5 h-16 flex items-center shrink-0">
          <img src="/logo2.png" alt="Fractal" className="h-9 w-auto" />
        </div>

        {/* Nav */}
        <nav
          aria-label="Navegação principal"
          className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto"
        >
          <div>
            <GroupHeader label="Geral" />
            <NavItem
              to="/"
              label="Dashboard"
              end
              icon={DashboardIcon}
              onClick={closeSidebar}
            />
          </div>

          {hasWayMb && (
            <div>
              <GroupHeader label="WayMB" />
              <NavItem
                to="/transactions"
                label="Transações"
                end={false}
                icon={TransactionsIcon}
                onClick={closeSidebar}
              />
            </div>
          )}

          {hasCartpanda && (
            <div>
              <GroupHeader label="Internacional" />
              <NavItem
                to="/internacional-orders"
                label="Pedidos"
                end={false}
                icon={CartIcon}
                onClick={closeSidebar}
              />
              {isAdmin && (
                <NavItem
                  to="/admin/internacional-shops"
                  label="Lojas"
                  end={false}
                  icon={ShopIcon}
                  onClick={closeSidebar}
                />
              )}
            </div>
          )}

          <div>
            <GroupHeader label="Ferramentas" />
            <NavItem
              to="/links"
              label="Links"
              end={false}
              icon={LinksIcon}
              onClick={closeSidebar}
            />
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-white/[0.06] shrink-0 flex flex-col gap-0.5">
          <NavItem
            to="/settings"
            label="Configurações"
            end={false}
            icon={SettingsIcon}
            onClick={closeSidebar}
          />
          <p className="text-xs text-white/30 truncate mt-2 px-3">
            {user?.email}
          </p>
          <button
            onClick={handleLogout}
            aria-label="Terminar sessão"
            className="w-full text-left text-sm text-white/40 fine-hover:text-white/70 px-3 py-2 rounded-lg fine-hover:bg-white/[0.05] transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center h-14 px-4 bg-surface-1 border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={sidebarOpen}
            className="p-2 rounded-lg text-white/40 fine-hover:text-white/70 fine-hover:bg-white/[0.05] transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand mr-3"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4h14M2 9h14M2 14h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <img src="/logo2.png" alt="Fractal" className="h-6 w-auto" />
        </div>

        <main className="flex-1 px-6 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
