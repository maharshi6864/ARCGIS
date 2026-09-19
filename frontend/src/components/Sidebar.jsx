import React from 'react';
import { NavLink } from 'react-router-dom';

export function Sidebar({ isCollapsed, onToggleCollapse, stats }) {
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', badge: null },
    { path: '/dets', label: 'Manage Det', icon: 'radar', badge: stats?.total_dets ?? 0 },
    { path: '/vehicles', label: 'Manage Vehicles', icon: 'local_shipping', badge: stats?.total_vehicles ?? 0 },
    { path: '/recovery', label: 'Manage Recovery', icon: 'build_circle', badge: stats?.total_recoveries ?? 0 },
    { path: '/settings', label: 'Settings', icon: 'settings', badge: null },
  ];

  return (
    <aside
      className="bg-body-secondary border-end border-secondary d-flex flex-column justify-content-between position-fixed top-0 bottom-0 start-0 shadow-lg"
      style={{
        width: isCollapsed ? '72px' : '260px',
        zIndex: 1040,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Top Header / Insignia */}
      <div>
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary" style={{ height: '64px' }}>
          {!isCollapsed && (
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="d-flex align-items-center justify-content-center rounded bg-dark border border-secondary text-warning"
                style={{ width: '36px', height: '36px', flexShrink: 0 }}
              >
                <span className="material-symbols-outlined md-22 text-warning">shield</span>
              </div>
              <div className="d-flex flex-column text-nowrap">
                <span className="fw-bold text-light" style={{ fontSize: '14px', letterSpacing: '0.04em' }}>DEFCON COMMAND</span>
                <span className="text-success" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tactical Asset Ops</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto text-warning">
              <span className="material-symbols-outlined md-24">shield</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <span className="material-symbols-outlined md-18">
              {isCollapsed ? 'menu_open' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Menu Navigation List */}
        <div className="p-2">
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-1 text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
              Command Navigation
            </div>
          )}

          <nav className="nav nav-pills flex-column gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link text-start d-flex align-items-center justify-content-between py-2 px-3 rounded ${
                    isActive ? 'active' : ''
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <div className="d-flex align-items-center gap-3 overflow-hidden text-nowrap">
                      <span className={`material-symbols-outlined md-20 ${isActive ? 'text-white' : 'text-success'}`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== null && (
                      <span
                        className={`badge rounded-pill font-monospace ${
                          isActive
                            ? 'bg-black text-white bg-opacity-40'
                            : 'bg-dark text-success border border-secondary'
                        }`}
                        style={{ fontSize: '11px' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom User Info (Default Admin) */}
      <div className="p-3 border-top border-secondary bg-dark">
        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'gap-2'}`}>
          <div
            className="rounded-circle d-flex align-items-center justify-content-center bg-dark border border-secondary text-success"
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
          >
            <span className="material-symbols-outlined md-20">admin_panel_settings</span>
          </div>

          {!isCollapsed && (
            <div className="d-flex flex-column overflow-hidden text-nowrap">
              <span className="text-light fw-bold" style={{ fontSize: '13px' }}>admin</span>
              <div className="d-flex align-items-center gap-1">
                <span className="badge bg-success-subtle text-success py-0 px-1 border border-success-subtle" style={{ fontSize: '9px' }}>
                  Full Access
                </span>
                <span className="text-secondary" style={{ fontSize: '11px' }}>Administrator</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
