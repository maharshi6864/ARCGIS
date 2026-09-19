import React, { useState, useEffect } from 'react';
import { TacticalMap } from '../components/TacticalMap';
import { getMapConfig, saveMapConfig } from '../services/tileCache';

export function SettingsView({ onRefreshAll }) {
  const [mapConfig, setMapConfig] = useState(getMapConfig());
  const [currentViewport, setCurrentViewport] = useState(null);
  const [sectorName, setSectorName] = useState(mapConfig.sectorName || 'Global Operations Theater');
  const [statusMessage, setStatusMessage] = useState(null);

  // Handle Viewport Change from Map
  const handleViewportChange = (vp) => {
    setCurrentViewport(vp);
  };

  // Save Map Configuration
  const handleSaveConfig = () => {
    const newConfig = {
      ...mapConfig,
      centerLat: currentViewport?.centerLat ?? mapConfig.centerLat,
      centerLng: currentViewport?.centerLng ?? mapConfig.centerLng,
      defaultZoom: currentViewport?.zoom ?? mapConfig.defaultZoom,
      sectorName: sectorName.trim() || 'Tactical Sector',
      bounds: currentViewport?.bounds ?? mapConfig.bounds,
    };

    saveMapConfig(newConfig);
    setMapConfig(newConfig);
    setStatusMessage({
      type: 'success',
      text: `Operational settings saved. Map center set to (${newConfig.centerLat}°, ${newConfig.centerLng}°) at Zoom ${newConfig.defaultZoom}x.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Apply Quick Tactical Preset
  const handleApplyPreset = (preset) => {
    const newConfig = {
      ...mapConfig,
      centerLat: preset.lat,
      centerLng: preset.lng,
      defaultZoom: preset.zoom,
      sectorName: preset.name,
    };
    saveMapConfig(newConfig);
    setMapConfig(newConfig);
    setSectorName(preset.name);
    setStatusMessage({
      type: 'info',
      text: `Preset "${preset.name}" applied.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Reset to Global View
  const handleResetToGlobal = () => {
    const globalConfig = {
      centerLat: 28.6139,
      centerLng: 77.2090,
      defaultZoom: 4,
      minZoom: 1,
      maxZoom: 19,
      sectorName: 'Global Tactical Operations',
      bounds: null,
    };

    saveMapConfig(globalConfig);
    setMapConfig(globalConfig);
    setSectorName('Global Tactical Operations');
    setStatusMessage({
      type: 'info',
      text: 'Map settings reset to default global view.',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const presets = [
    { name: 'Central Command HQ', lat: 28.6139, lng: 77.2090, zoom: 6 },
    { name: 'Northern Tactical Sector', lat: 34.0837, lng: 74.7973, zoom: 7 },
    { name: 'Eastern Operations Command', lat: 26.1445, lng: 91.7362, zoom: 7 },
    { name: 'Western Coastal Sector', lat: 18.9220, lng: 72.8347, zoom: 8 },
    { name: 'Southern Naval Fleet Command', lat: 13.0827, lng: 80.2707, zoom: 7 },
  ];

  return (
    <div className="container-fluid p-4">
      {/* Top Title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="h5 fw-bold text-light m-0">Tactical Map Settings</h2>
          <small className="text-secondary">
            Configure default operational center, zoom presets, and theater deployment zones
          </small>
        </div>
      </div>

      {/* Alert Status Banner */}
      {statusMessage && (
        <div
          className={`alert ${
            statusMessage.type === 'error'
              ? 'alert-danger'
              : statusMessage.type === 'info'
              ? 'alert-info'
              : 'alert-success'
          } py-2 px-3 small d-flex align-items-center gap-2 mb-4`}
        >
          <span className="material-symbols-outlined md-18">
            {statusMessage.type === 'error' ? 'error' : statusMessage.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Interactive Map Adjuster */}
        <div className="col-12 col-xl-12">
          <div className="card shadow-sm h-100 overflow-hidden border-secondary">
            <div className="card-header px-3 py-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined md-18 text-success">tune</span>
                <span className="fw-bold text-light" style={{ fontSize: '13px' }}>
                  Operational Map Position & Zoom
                </span>
              </div>
              <span className="badge bg-success-subtle text-success font-monospace" style={{ fontSize: '10px' }}>
                Full World Map
              </span>
            </div>

            {/* Interactive World Map */}
            <div className="card-body p-0" style={{ height: '440px' }}>
              <TacticalMap
                dets={[]}
                height="100%"
                interactiveClick={false}
                onViewportChange={handleViewportChange}
              />
            </div>

            {/* Coordinates Footer */}
            <div className="card-footer p-3 border-top border-secondary">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-8">
                  <div className="d-flex flex-wrap gap-2 small font-monospace text-secondary" style={{ fontSize: '11px' }}>
                    <span className="badge bg-dark border border-secondary">
                      LAT: <strong className="text-light">{currentViewport?.centerLat ?? mapConfig.centerLat}°</strong>
                    </span>
                    <span className="badge bg-dark border border-secondary">
                      LNG: <strong className="text-light">{currentViewport?.centerLng ?? mapConfig.centerLng}°</strong>
                    </span>
                    <span className="badge bg-dark border border-secondary">
                      ZOOM: <strong className="text-success">{currentViewport?.zoom ?? mapConfig.defaultZoom}x</strong>
                    </span>
                  </div>
                </div>

                <div className="col-12 col-md-4 d-flex justify-content-md-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleResetToGlobal}
                    title="Reset to default global view"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                    onClick={handleSaveConfig}
                  >
                    <span className="material-symbols-outlined md-16">check</span>
                    <span>Set Default Position</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
