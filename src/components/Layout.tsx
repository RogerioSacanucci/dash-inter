import { useRef, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Player } from "@lordicon/react";
import { useAuth } from "../hooks/useAuth";
import LordIcon from "./ui/LordIcon";
import { MilestoneIndicator } from "./MilestoneIndicator";

import dashboardIcon from "../icons/dashboard.json";
import transferIcon from "../icons/transfer.json";
import payoutIcon from "../icons/payout.json";
import shoppingCartIcon from "../icons/shopping-cart.json";
import storeIcon from "../icons/store.json";
import scrollTextIcon from "../icons/scroll-text.json";
import linkIcon from "../icons/link.json";
import settingsIcon from "../icons/settings.json";
import logoutIcon from "../icons/logout.json";
import menuIcon from "../icons/menu.json";
import mailIcon from "../icons/mail.json";

const NAV_ICON_SIZE = 18;
const NAV_COLOR_ACTIVE = "#E8552A";
const NAV_COLOR_INACTIVE = "rgba(255,255,255,0.45)";

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[9px] font-semibold uppercase tracking-widest text-white/25 select-none">
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
  icon: object;
  onClick: () => void;
}) {
  const playerRef = useRef<Player>(null);

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      onMouseEnter={() => playerRef.current?.playFromBeginning()}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-[10px] rounded-[10px] text-[13px] font-medium transition-[color,background-color,transform] duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
          isActive
            ? "bg-brand/10 text-brand"
            : "text-white/50 fine-hover:text-white/80 fine-hover:bg-white/[0.04]"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Player
            ref={playerRef}
            icon={icon}
            size={NAV_ICON_SIZE}
            colorize={isActive ? NAV_COLOR_ACTIVE : NAV_COLOR_INACTIVE}
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const hasWayMb = isAdmin || !!user?.payer_email;
  const hasCartpanda = isAdmin || !!user?.internacional_param;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity duration-200 ease-out ${
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
        className={`fixed top-0 left-0 bottom-0 w-[220px] bg-canvas flex flex-col z-40 transition-transform duration-200 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-5 pt-4 pb-7 flex items-center shrink-0">
          <img src="/logo2.png" alt="Fractal" className="h-6 w-auto" />
        </div>

        {/* Nav */}
        <nav
          aria-label="Navegação principal"
          className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto"
        >
          <div>
            <GroupHeader label="Geral" />
            <NavItem to="/" label="Dashboard" end icon={dashboardIcon} onClick={closeSidebar} />
          </div>

          {hasWayMb && (
            <div className="mt-2">
              <GroupHeader label="WayMB" />
              <NavItem to="/transactions" label="Transações" end={false} icon={transferIcon} onClick={closeSidebar} />
            </div>
          )}

          {hasCartpanda && (
            <div className="mt-2">
              <GroupHeader label="Internacional" />
              <NavItem to="/internacional-orders" label="Pedidos" end={false} icon={shoppingCartIcon} onClick={closeSidebar} />
              {isAdmin && (
                <NavItem to="/admin/internacional-shops" label="Lojas" end={false} icon={storeIcon} onClick={closeSidebar} />
              )}
              {isAdmin && (
                <NavItem to="/admin/webhook-logs" label="Webhook Logs" end={false} icon={scrollTextIcon} onClick={closeSidebar} />
              )}
              {isAdmin && (
                <NavItem to="/admin/email-service" label="E-mail Service" end={false} icon={mailIcon} onClick={closeSidebar} />
              )}
            </div>
          )}

          <div className="mt-2">
            <GroupHeader label="Financeiro" />
            <NavItem to="/saques" label="Saques" end={false} icon={payoutIcon} onClick={closeSidebar} />
          </div>

          <div className="mt-2">
            <GroupHeader label="Ferramentas" />
            <NavItem to="/links" label="Links" end={false} icon={linkIcon} onClick={closeSidebar} />
          </div>
        </nav>

        {/* Bottom */}
        <div className="px-3 pt-6 pb-4 shrink-0 flex flex-col gap-1">
          <NavItem to="/settings" label="Configurações" end={false} icon={settingsIcon} onClick={closeSidebar} />

          {/* User pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-2 rounded-[10px] fine-hover:bg-white/[0.04] transition-colors duration-150 cursor-default">
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-[10px] font-bold text-brand-text shrink-0 tracking-wide">
              {initials}
            </div>
            <p className="text-[12px] font-medium text-white/60 truncate flex-1 min-w-0">
              {user?.email}
            </p>
            <motion.button
              onClick={handleLogout}
              aria-label="Terminar sessão"
              whileTap={{ scale: 0.9 }}
              className="focus-visible:outline-none"
            >
              <LordIcon icon={logoutIcon} size={16} trigger="hover" colorize="rgba(255,255,255,0.35)" />
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Content frame */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[220px]">

        {/* Topbar */}
        <div className="hidden lg:flex items-center justify-end h-12 shrink-0 px-6">
          <MilestoneIndicator />
        </div>

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 bg-canvas shrink-0">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen}
              whileTap={{ scale: 0.92 }}
              className="p-2 rounded-lg fine-hover:bg-white/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <LordIcon icon={menuIcon} size={20} trigger="hover" colorize="rgba(255,255,255,0.45)" />
            </motion.button>
            <img src="/logo2.png" alt="Fractal" className="h-6 w-auto" />
          </div>
          <motion.button
            onClick={handleLogout}
            aria-label="Terminar sessão"
            whileTap={{ scale: 0.9 }}
            className="p-2 focus-visible:outline-none"
          >
            <LordIcon icon={logoutIcon} size={18} trigger="hover" colorize="rgba(255,255,255,0.35)" />
          </motion.button>
        </div>

        {/* Content area with rounded top-left corner */}
        <main className="flex-1 bg-content-bg lg:rounded-tl-[20px] px-8 py-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
