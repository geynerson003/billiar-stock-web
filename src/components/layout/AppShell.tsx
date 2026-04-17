import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth, usePWAInstall } from "../../shared/hooks";

/* ── SVG Icons (inline for zero-dependency, tree-shakeable) ── */
const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  tables: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
      <circle cx="7" cy="8" r="1.5" fill="currentColor" /><circle cx="17" cy="16" r="1.5" fill="currentColor" />
    </svg>
  ),
  expenses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /><path d="M12 2L2 7l10 5 10-5L12 2z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const navItems = [
  { to: "/", label: "Dashboard", icon: icons.dashboard },
  { to: "/inventory", label: "Inventario", icon: icons.inventory },
  { to: "/sales", label: "Ventas", icon: icons.sales },
  { to: "/clients", label: "Clientes", icon: icons.clients },
  { to: "/tables", label: "Mesas", icon: icons.tables },
  { to: "/expenses", label: "Gastos", icon: icons.expenses },
  { to: "/reports", label: "Reportes", icon: icons.reports },
];

/** Items shown in the bottom navigation (limited for mobile) */
const bottomNavItems = navItems.slice(0, 5); // Dashboard, Inventario, Ventas, Clientes, Mesas

export function AppShell() {
  const { logout, profile, user } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();

  /* Close drawer on navigation */
  useEffect(() => {
    setDrawerOpen(false);
    document.body.classList.remove("drawer-open");
  }, [location.pathname]);

  function toggleDrawer() {
    setDrawerOpen((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add("drawer-open");
      } else {
        document.body.classList.remove("drawer-open");
      }
      return next;
    });
  }

  function closeDrawer() {
    setDrawerOpen(false);
    document.body.classList.remove("drawer-open");
  }

  return (
    <div className="app-shell">
      {/* ── Mobile Header ── */}
      <header className="mobile-header">
        <div className="mobile-header__brand">
          <img src="/icons/navbar-icon-32x32.png" alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
          <strong>Billiard Stock</strong>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isInstallable && (
            <button 
               className="button button--primary" 
               style={{ padding: '6px 12px', fontSize: '0.75rem', height: '32px' }}
               onClick={promptInstall}
            >
              Obtén la app
            </button>
          )}
          <button
            className="hamburger-btn"
            onClick={toggleDrawer}
            type="button"
            aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {drawerOpen ? icons.close : icons.menu}
          </button>
        </div>
      </header>

      {/* ── Sidebar Overlay (mobile only) ── */}
      <div
        className={`sidebar-overlay ${drawerOpen ? "sidebar-overlay--visible" : ""}`}
        onClick={closeDrawer}
        role="presentation"
      />

      {/* ── Sidebar / Drawer ── */}
      <aside className={`sidebar ${drawerOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <img src="/icons/navbar-icon-32x32.png" alt="Logo" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <strong>Billiard Stock</strong>
            <span>Control total del negocio</span>
            <span style={{ fontSize: "0.65rem", opacity: 0.5, marginTop: "2px", display: "block" }}>
              v{__APP_VERSION__}
            </span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
              }
              key={item.to}
              to={item.to}
              end={item.to === "/"}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__profile">
          <strong>{profile?.businessName ?? "Mi negocio"}</strong>
          <span>{user?.email}</span>
          <button
            className="button button--secondary button--full"
            onClick={() => void logout()}
            type="button"
          >
            {icons.logout}
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="content">
        <Outlet />
      </main>

      {/* ── Bottom Navigation (mobile only) ── */}
      <nav className="bottom-nav">
        {bottomNavItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`
            }
            key={item.to}
            to={item.to}
            end={item.to === "/"}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
