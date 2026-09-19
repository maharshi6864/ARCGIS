import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { CASUALTY_CATEGORIES } from './ManageRecoveryView';

// Helper to get today's local date string in YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DashboardView({ stats, dets = [], vehicles = [], recoveries = [], onRefresh }) {
  const navigate = useNavigate();

  // Top Detachment Slicer (Single dropdown / All) - default 'all'
  const [selectedDetId, setSelectedDetId] = useState('all');

  // Date Filter Slicer (Defaults to today's date in YYYY-MM-DD)
  const [selectedDateFilter, setSelectedDateFilter] = useState(() => getTodayDateString());

  // Interactive Tactical Map Ref
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);

  // Clear all filters handler (shows all Dets and all dates)
  const handleClearFilters = () => {
    setSelectedDetId('all');
    setSelectedDateFilter('');
  };

  // Reset to Today filter handler
  const handleResetToToday = () => {
    setSelectedDetId('all');
    setSelectedDateFilter(getTodayDateString());
  };

  // Filtered Recoveries based on active Slicers
  const filteredRecoveries = useMemo(() => {
    let list = recoveries.length > 0 ? [...recoveries] : (stats?.recent_recoveries || []);

    if (selectedDetId !== 'all') {
      const targetId = parseInt(selectedDetId);
      list = list.filter((r) => r.det_id === targetId || (r.det && r.det.id === targetId));
    }

    if (selectedDateFilter && selectedDateFilter !== 'all') {
      list = list.filter((r) => r.date === selectedDateFilter);
    }

    return list;
  }, [recoveries, stats, selectedDetId, selectedDateFilter]);

  // Calculate Casualty Category Counts for the Bar Chart
  const casualtyChartData = useMemo(() => {
    return CASUALTY_CATEGORIES.map((cat) => {
      const count = filteredRecoveries.filter((r) => {
        const cType = (r.casualty_type || '').toLowerCase();
        return (
          cType === cat.key.toLowerCase() ||
          cType.includes(cat.key.toLowerCase()) ||
          cType.includes(cat.short.toLowerCase())
        );
      }).length;
      return {
        ...cat,
        count,
      };
    });
  }, [filteredRecoveries]);

  const maxChartCount = useMemo(() => {
    const maxVal = Math.max(...casualtyChartData.map((d) => d.count), 1);
    return maxVal < 5 ? 5 : maxVal;
  }, [casualtyChartData]);

  const totalRecoveryCount = filteredRecoveries.length;

  // Helper for Status Badge
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success-subtle text-success border border-success';
      case 'active':
        return 'bg-warning-subtle text-warning border border-warning';
      case 'abort':
      case 'aborted':
        return 'bg-danger-subtle text-danger border border-danger';
      default:
        return 'bg-secondary text-light';
    }
  };

  // Tactical Leaflet Beat Map Effect with Recovery Casualty Geolocation Pins & Auto-Focus
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    // Default center around Northern Tactical Sector or first registered Det
    const centerLat = dets[0]?.latitude || 27.5861;
    const centerLng = dets[0]?.longitude || 91.8594;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 10,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Tactical Shaded Threat/Casualty Focus Zones
    if (dets.length > 0) {
      L.circle([centerLat + 0.12, centerLng + 0.08], {
        radius: 9000,
        color: '#b91c1c',
        fillColor: '#7f1d1d',
        fillOpacity: 0.35,
        dashArray: '5, 5',
        weight: 2,
      }).bindPopup('<b>Operational Focus Zone Alpha (High Extraction Density)</b>').addTo(map);

      L.circle([centerLat - 0.14, centerLng - 0.06], {
        radius: 7500,
        color: '#b91c1c',
        fillColor: '#7f1d1d',
        fillOpacity: 0.3,
        dashArray: '5, 5',
        weight: 2,
      }).bindPopup('<b>Operational Focus Zone Bravo (Pass Extraction Beat)</b>').addTo(map);
    }

    // Detachment Base Station Markers (Dynamically from database)
    const detIcon = (name, active) =>
      L.divIcon({
        className: 'tactical-det-pin',
        html: `
          <div style="background:${active ? '#0284c7' : '#1e293b'}; color:#fff; border:2px solid ${active ? '#38bdf8' : '#64748b'}; border-radius:6px; padding:3px 8px; font-family:monospace; font-size:11px; font-weight:700; white-space:nowrap; display:flex; align-items:center; gap:5px; box-shadow:0 3px 8px rgba(0,0,0,0.6); cursor:pointer;">
            <span class="material-symbols-outlined" style="font-size:14px; color:${active ? '#38bdf8' : '#94a3b8'};">radar</span>
            <span>${name}</span>
          </div>
        `,
        iconSize: [85, 26],
        iconAnchor: [42, 13],
      });

    const detCoords = [];

    // Plot all Dets from Database
    dets.forEach((d) => {
      const isSelected = selectedDetId === 'all' || parseInt(selectedDetId) === d.id;
      detCoords.push([d.latitude, d.longitude]);

      const detMarker = L.marker([d.latitude, d.longitude], { icon: detIcon(d.name, isSelected) })
        .bindPopup(`
          <div style="min-width: 160px; font-family: monospace;">
            <div style="font-weight: bold; color: #38bdf8; font-size: 13px;">DETACHMENT: ${d.name}</div>
            <div style="color: #94a3b8; font-size: 11px;">Forward Workshop & Operating Base</div>
            <div style="color: #cbd5e1; font-size: 10px; margin-top: 4px;">Lat: ${d.latitude.toFixed(4)}° | Lng: ${d.longitude.toFixed(4)}°</div>
          </div>
        `)
        .addTo(map);

      detMarker.on('click', () => {
        setSelectedDetId(String(d.id));
      });
    });

    // Connecting Recovery Beat Route Polylines across active Dets
    if (detCoords.length > 1) {
      L.polyline(detCoords, { color: '#f59e0b', weight: 3, dashArray: '6, 6', opacity: 0.85 })
        .bindPopup('<b>Primary Recovery Beat Route (FWC Network)</b>')
        .addTo(map);
    }

    // Pinned Exact Casualty Locations where Recoveries had happened
    filteredRecoveries.forEach((r) => {
      if (r.from_lat && r.from_lng) {
        const casCategory = CASUALTY_CATEGORIES.find((c) => c.key === r.casualty_type) || { icon: 'build', short: 'CAS' };

        const casPinIcon = L.divIcon({
          className: 'custom-cas-marker',
          html: `
            <div style="background:#dc2626; color:#fff; border:2px solid #ffffff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(220,38,38,0.9);">
              <span class="material-symbols-outlined" style="font-size:16px;">${casCategory.icon || 'build'}</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        // Add Marker for Casualty Origin
        const casMarker = L.marker([r.from_lat, r.from_lng], { icon: casPinIcon }).addTo(map);

        const statusColor = r.status === 'Completed' ? '#22c55e' : (r.status === 'Active' ? '#eab308' : '#ef4444');

        casMarker.bindPopup(`
          <div style="min-width: 200px; font-family: monospace; font-size: 11px;">
            <div style="color: #ef4444; font-weight: bold; font-size: 13px; margin-bottom: 2px;">
              ● RECOVERY CASUALTY SITE
            </div>
            <div style="color: #f8fafc; font-size: 12px; font-weight: 600;">
              ${r.cas_vehicle_equipment_name || r.casualty_type}
            </div>
            <div style="color: #94a3b8; margin-bottom: 6px;">
              Type: <strong style="color: #eab308;">${r.casualty_type}</strong>
            </div>
            <div style="background: rgba(0,0,0,0.4); padding: 4px 6px; border-radius: 4px; border: 1px solid #334155; margin-bottom: 6px;">
              <div>Location: <strong>${r.from_place_description || `${r.from_lat.toFixed(4)}°, ${r.from_lng.toFixed(4)}°`}</strong></div>
              <div>Station Det: <strong>${r.det?.name || r.det_name || `DET #${r.det_id}`}</strong></div>
              <div>Date: <strong>${r.date}</strong> | Reach: <strong>${r.time_to_reach}h</strong></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: ${statusColor}; font-weight: bold;">Status: ${r.status}</span>
              <span style="color: #eab308;">Eff: ${r.effectiveness_index}%</span>
            </div>
          </div>
        `);

        // Dotted Transit Line from Casualty Site to Det Destination
        if (r.to_lat && r.to_lng) {
          L.polyline(
            [
              [r.from_lat, r.from_lng],
              [r.to_lat, r.to_lng],
            ],
            {
              color: '#ef4444',
              weight: 2,
              dashArray: '4, 6',
              opacity: 0.7,
            }
          ).addTo(map);
        }
      }
    });

    // Auto Focus logic:
    if (selectedDetId !== 'all') {
      // Auto focus on the specifically selected Det
      const targetDet = dets.find((d) => d.id === parseInt(selectedDetId));
      if (targetDet) {
        map.flyTo([targetDet.latitude, targetDet.longitude], 12, {
          animate: true,
          duration: 0.8,
        });
      }
    } else {
      // Auto focus to show all Dets when All Dets is selected
      if (dets.length > 1) {
        const bounds = L.latLngBounds(dets.map((d) => [d.latitude, d.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
      } else if (dets.length === 1) {
        map.setView([dets[0].latitude, dets[0].longitude], 11);
      }
    }

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [dets, filteredRecoveries, selectedDetId]);

  return (
    <div className="container-fluid p-3 d-flex flex-column gap-3  bg-dark text-light font-sans">
      {/* 1. Top Slicers Bar: Dets Dropdown + Date Calendar Picker + Clear Filter Action */}
      <div
        className="card shadow-sm border-secondary p-2 d-flex flex-row align-items-center justify-content-between gap-3 flex-wrap"
        style={{ backgroundColor: '#131912' }}
      >
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Dets Slicer */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-bold text-uppercase font-monospace" style={{ fontSize: '11px' }}>
              Dets:
            </span>

            {/* Dets Dropdown from Database */}
            <select
              className="form-select form-select-sm font-monospace bg-dark text-light border-secondary shadow-sm"
              style={{ minWidth: '180px', maxWidth: '240px', fontSize: '11px' }}
              value={selectedDetId}
              onChange={(e) => setSelectedDetId(e.target.value)}
            >
              <option value="all">All Dets (Show All)</option>
              {dets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Calendar Picker */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-bold text-uppercase font-monospace" style={{ fontSize: '11px' }}>
              Date:
            </span>
            <input
              type="date"
              className="form-control form-control-sm font-monospace bg-dark text-light border-secondary shadow-sm"
              style={{ width: '145px', fontSize: '11px', colorScheme: 'dark' }}
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            />

            {/* Quick Today Button */}
            <button
              type="button"
              className={`btn btn-sm py-1 px-2 font-monospace d-flex align-items-center gap-1 ${selectedDateFilter === getTodayDateString() ? 'btn-success' : 'btn-outline-secondary text-secondary'
                }`}
              style={{ fontSize: '11px' }}
              onClick={handleResetToToday}
              title="Filter for Today's Recoveries"
            >
              <span className="material-symbols-outlined md-14">today</span>
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Action Controls: Clear Filter + Sync Live */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Clear Filter Button */}
          <button
            type="button"
            className="btn btn-outline-danger btn-sm py-1 px-3 rounded font-monospace d-flex align-items-center gap-1"
            style={{ fontSize: '11px' }}
            onClick={handleClearFilters}
            title="Clear all filters (show all Dets & all dates)"
          >
            <span className="material-symbols-outlined md-14">filter_alt_off</span>
            <span>Clear Filter</span>
          </button>
        </div>
      </div>

      {/* 3. Main Operational Board: Left (Stats/Chart/Table) + Right (Tactical Beat Map) */}
      <div className="row g-3">
        {/* Left Column: Total Rec + Count of CAS Bar Chart + Date/Sector Filters + Casualty Table */}
        <div className="col-12 col-xl-6 d-flex flex-column gap-3">
          {/* Upper Row: Total Rec Card + Bar Chart */}
          <div className="row g-3">
            {/* Total Rec Card */}
            <div className="col-12 col-sm-4">
              <div
                className="card h-100 shadow-sm border-secondary d-flex flex-column justify-content-between p-3"
                style={{
                  backgroundColor: '#151d14',
                  backgroundImage: 'radial-gradient(circle at top right, rgba(85,107,47,0.2) 0%, transparent 70%)',
                }}
              >
                {/* Wrecker / Recovery Truck Graphic */}
                <div className="text-center py-2">
                  <div
                    className="mx-auto rounded border border-secondary p-2 mb-2 d-flex align-items-center justify-content-center bg-dark"
                    style={{ height: '75px', width: '100%', maxWidth: '140px' }}
                  >
                    <svg viewBox="0 0 100 60" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Tactical Recovery ARV Truck Vector Illustration */}
                      <rect x="5" y="25" width="60" height="20" rx="3" fill="#556b2f" stroke="#9cb571" strokeWidth="1.5" />
                      <rect x="55" y="15" width="35" height="30" rx="3" fill="#4b5320" stroke="#9cb571" strokeWidth="1.5" />
                      <rect x="65" y="18" width="20" height="12" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                      {/* Crane boom */}
                      <line x1="15" y1="25" x2="35" y2="5" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                      <line x1="35" y1="5" x2="35" y2="18" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx="35" cy="20" r="2" fill="#eab308" />
                      {/* Wheels */}
                      <circle cx="18" cy="45" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                      <circle cx="35" cy="45" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                      <circle cx="70" cy="45" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                      <circle cx="85" cy="45" r="7" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
                    </svg>
                  </div>

                  <span className="text-secondary small fw-bold font-monospace text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
                    TOTAL REC
                  </span>
                </div>

                <div className="text-center pb-1">
                  <div
                    className="font-monospace fw-bold text-light lh-1"
                    style={{ fontSize: '44px', textShadow: '0 0 12px rgba(255,255,255,0.2)' }}
                  >
                    {totalRecoveryCount}
                  </div>
                  <small className="text-success font-monospace" style={{ fontSize: '10px' }}>
                    TOTAL RECOVERIES
                  </small>
                </div>
              </div>
            </div>

            {/* COUNT OF CAS (Vertical Bar Chart) */}
            <div className="col-12 col-sm-8">
              <div
                className="card h-100 shadow-sm border-secondary p-3 d-flex flex-column justify-content-between"
                style={{ backgroundColor: '#151d14' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2 border-bottom border-secondary pb-1">
                  <span className="small fw-bold text-light font-monospace" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
                    COUNT OF CAS
                  </span>
                  <span className="badge bg-dark border border-secondary text-secondary font-monospace" style={{ fontSize: '10px' }}>
                    6 Categories
                  </span>
                </div>

                {/* Vertical Bar Columns */}
                <div className="d-flex align-items-end justify-content-around pt-3 pb-1" style={{ height: '120px' }}>
                  {casualtyChartData.map((cat) => {
                    const heightPercent = maxChartCount > 0 ? (cat.count / maxChartCount) * 85 : 0;
                    return (
                      <div key={cat.key} className="d-flex flex-column align-items-center flex-grow-1" style={{ maxWidth: '48px' }}>
                        {/* Numerical Count on top of the bar */}
                        <span className="font-monospace fw-bold text-info small mb-1" style={{ fontSize: '11px' }}>
                          {cat.count}
                        </span>

                        {/* Bar Pillar */}
                        <div
                          className="w-100 rounded-top"
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                            backgroundColor: cat.count > 0 ? '#0284c7' : 'rgba(255,255,255,0.05)',
                            border: cat.count > 0 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                            transition: 'height 0.3s ease',
                          }}
                        ></div>

                        {/* Category Short Label */}
                        <span
                          className="text-secondary font-monospace mt-2 text-center text-truncate w-100"
                          style={{ fontSize: '9px', lineHeight: '1.1' }}
                          title={cat.label}
                        >
                          {cat.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Lower Row: Casualty Details Table */}
          <div className="card shadow-sm border-secondary flex-grow-1 overflow-hidden" style={{ backgroundColor: '#151d14' }}>
            <div className="card-header px-3 py-2 border-secondary d-flex align-items-center justify-content-between">
              <span className="small fw-bold text-light font-monospace" style={{ fontSize: '11px' }}>
                Casualty & Extraction Log Table
              </span>
              <span className="badge bg-dark border border-secondary text-info font-monospace" style={{ fontSize: '10px' }}>
                {filteredRecoveries.length} Records
              </span>
            </div>

            <div className="table-responsive" style={{ maxHeight: '260px' }}>
              <table className="table table-dark table-hover mb-0" style={{ fontSize: '11px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th className="font-monospace text-secondary">Count of S/No</th>
                    <th>Bn (Det)</th>
                    <th>Cas Type</th>
                    <th>Cas Veh/Eqpt (Name)</th>
                    <th>Status</th>
                    <th className="text-end">Date (dd-mm-yy)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecoveries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-secondary">
                        <span className="material-symbols-outlined md-24 opacity-50 mb-1">build_circle</span>
                        <div className="small">No casualties recorded for selected slicers</div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecoveries.map((r, idx) => (
                      <tr
                        key={`tbl-rec-${r.id || idx}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/recovery')}
                        title="Click to manage this recovery activity"
                      >
                        <td className="font-monospace text-center text-info fw-bold" style={{ width: '90px' }}>
                          {idx + 1}
                        </td>
                        <td className="font-monospace text-light fw-semibold">
                          {r.det?.name || r.det_name || `DET #${r.det_id}`}
                        </td>
                        <td>
                          <span className="badge bg-dark border border-secondary text-warning font-monospace">
                            {r.casualty_type || 'General'}
                          </span>
                        </td>
                        <td className="text-light fw-bold font-monospace">
                          {r.cas_vehicle_equipment_name || '—'}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(r.status)} font-monospace`}>
                            {r.status || 'Active'}
                          </span>
                        </td>
                        <td className="text-end font-monospace text-secondary">
                          {r.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Beat Map (Leaflet) with Casualty Incident Geolocation Markers */}
        <div className="col-12 col-xl-6">
          <div
            className="card h-100 shadow-sm border-secondary overflow-hidden position-relative"
            style={{ minHeight: '520px', backgroundColor: '#151d14' }}
          >
            {/* Map Header */}
            <div className="card-header px-3 py-2 border-secondary d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined md-18 text-warning">map</span>
                <span className="small fw-bold text-light font-monospace" style={{ fontSize: '11px' }}>
                  Tactical Operational Beat Map (Incident Locations & Dets)
                </span>
              </div>

              <span className="badge bg-dark border border-secondary text-success font-monospace" style={{ fontSize: '10px' }}>
                OpenStreetMap Live
              </span>
            </div>

            {/* Map Container */}
            <div ref={mapContainerRef} className="w-100 flex-grow-1" style={{ height: '500px' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;

