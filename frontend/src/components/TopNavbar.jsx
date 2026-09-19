import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function TopNavbar({ onRefresh, isRefreshing, sidebarCollapsed }) {
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })
  );

  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const path = location.pathname.toLowerCase();

  const titles = {
    '/dashboard': { label: 'Operational Dashboard', icon: 'dashboard', desc: 'Tactical overview & live asset readiness' },
    '/dets': { label: 'Detachment Management', icon: 'radar', desc: 'Forward operating bases & station coordinates' },
    '/vehicles': { label: 'Vehicle Fleet Management', icon: 'local_shipping', desc: 'Combat & transport vehicle inventory' },
    '/recovery': { label: 'Recovery Operations Management', icon: 'build_circle', desc: 'Tactical casualty extractions, equipment deployment & recovery logs' },
    '/settings': { label: 'Operational Map Settings', icon: 'settings', desc: 'Configure map presets and operational center' },
  };

  const current = titles[path] || titles['/dashboard'];

  return (
    <header
      className="bg-body-secondary border-bottom border-secondary position-fixed top-0 end-0 px-4 d-flex align-items-center justify-content-between shadow-sm"
      style={{
        left: sidebarCollapsed ? '72px' : '260px',
        height: '64px',
        zIndex: 1030,
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Title & Description */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center justify-content-center p-2 rounded bg-dark border border-secondary text-success">
          <span className="material-symbols-outlined md-20">{current.icon}</span>
        </div>
        <div>
          <h1 className="h6 fw-bold text-light m-0 lh-1" style={{ fontSize: '15px' }}>
            {current.label}
          </h1>
          <small className="text-secondary" style={{ fontSize: '11px' }}>
            {current.desc}
          </small>
        </div>
      </div>

      {/* Military Indicators & Controls */}
      <div className="d-flex align-items-center gap-3">
        {/* UTC Military Clock */}
        <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded bg-dark border border-secondary font-monospace text-secondary" style={{ fontSize: '11px' }}>
          <span className="material-symbols-outlined md-16 text-warning">schedule</span>
          <span>{currentTime}</span>
        </div>

        {/* Global Map Status Badge */}
        <div className="d-flex align-items-center gap-2 px-2 py-1 rounded bg-dark border border-secondary">
          <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }} role="status"></span>
          <span className="text-success fw-semibold" style={{ fontSize: '11px' }}>World Map Active</span>
        </div>

        {/* Refresh Sync Button */}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sync with local SQLite database"
        >
          <span className={`material-symbols-outlined md-18 ${isRefreshing ? 'spinner-border spinner-border-sm' : ''}`}>
            sync
          </span>
          <span className="d-none d-sm-inline" style={{ fontSize: '12px' }}>Sync</span>
        </button>
      </div>
    </header>
  );
}
