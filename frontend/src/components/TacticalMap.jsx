import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { getCachedTile, storeCachedTile, getMapConfig, OSM_URL_TEMPLATE } from '../services/tileCache';

// Cached OpenStreetMap Tile Layer - seamlessly serves cached or live tiles
const CachedOSMTileLayer = L.TileLayer.extend({
  createTile: function (coords, done) {
    const tile = document.createElement('img');
    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);
    const cacheKey = `osm_${coords.z}_${coords.x}_${coords.y}`;

    getCachedTile(cacheKey)
      .then((cachedBlob) => {
        if (cachedBlob) {
          tile.src = URL.createObjectURL(cachedBlob);
          done(null, tile);
          return;
        }

        fetch(url, { mode: 'cors' })
          .then((res) => {
            if (!res.ok) throw new Error('Tile network error');
            return res.blob();
          })
          .then((blob) => {
            storeCachedTile(cacheKey, blob);
            tile.src = URL.createObjectURL(blob);
            done(null, tile);
          })
          .catch(() => {
            // Offline fallback tile
            tile.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%230e140d"/><path d="M0,0 L256,256 M256,0 L0,256" stroke="%23334431" stroke-width="0.5"/><text x="128" y="128" fill="%23556b2f" font-size="11" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle">OSM Tile</text></svg>';
            done(null, tile);
          });
      })
      .catch(() => {
        tile.src = url;
        done(null, tile);
      });

    return tile;
  },
});

export function TacticalMap({
  dets = [],
  selectedDet = null,
  onSelectDet = null,
  onMapClick = null,
  height = '100%',
  interactiveClick = true,
  onViewportChange = null,
  mapRef = null,
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const clickBeaconRef = useRef(null);

  const [cursorCoords, setCursorCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [currentZoom, setCurrentZoom] = useState(4);

  // Initialize Pure World Map
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const config = getMapConfig();

    const map = L.map(mapContainerRef.current, {
      center: [config.centerLat || 28.6139, config.centerLng || 77.2090],
      zoom: config.defaultZoom || 4,
      minZoom: 1,
      maxZoom: 19,
      zoomControl: false,
      worldCopyJump: true,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileLayer = new CachedOSMTileLayer(OSM_URL_TEMPLATE, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 1,
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    });
    tileLayer.addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('mousemove', (e) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('moveend zoomend', () => {
      setCurrentZoom(map.getZoom());
      if (onViewportChange) {
        const center = map.getCenter();
        const b = map.getBounds();
        onViewportChange({
          centerLat: parseFloat(center.lat.toFixed(6)),
          centerLng: parseFloat(center.lng.toFixed(6)),
          zoom: map.getZoom(),
          bounds: {
            north: parseFloat(b.getNorth().toFixed(6)),
            south: parseFloat(b.getSouth().toFixed(6)),
            east: parseFloat(b.getEast().toFixed(6)),
            west: parseFloat(b.getWest().toFixed(6)),
          },
        });
      }
    });

    if (interactiveClick && onMapClick) {
      map.on('click', (e) => {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));

        if (clickBeaconRef.current) {
          map.removeLayer(clickBeaconRef.current);
        }

        const beaconIcon = L.divIcon({
          className: 'click-target-beacon-wrapper',
          html: `<div class="click-target-beacon" style="border-color: #eab308; background: rgba(234, 179, 8, 0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const beacon = L.marker([lat, lng], { icon: beaconIcon }).addTo(map);
        clickBeaconRef.current = beacon;

        onMapClick({ lat, lng });
      });
    }

    leafletMapRef.current = map;
    if (mapRef) {
      mapRef.current = map;
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update Detachment Markers & Auto-Focus
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;

    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const markerMap = {};

    dets.forEach((det) => {
      const isSelected = selectedDet && (selectedDet.id === det.id || String(selectedDet.id) === String(det.id));

      const customIcon = L.divIcon({
        className: `tactical-det-pin ${isSelected ? 'active' : ''}`,
        html: `
          <div class="tactical-pin-beacon"></div>
          <div class="tactical-pin-body" style="background: ${isSelected ? '#0284c7' : '#1e293b'}; border: 2px solid ${isSelected ? '#38bdf8' : '#64748b'}; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${isSelected ? 'rgba(56,189,248,0.8)' : 'rgba(0,0,0,0.6)'};">
            <span class="tactical-pin-icon material-symbols-outlined" style="font-size: 18px; color: ${isSelected ? '#38bdf8' : '#94a3b8'};">radar</span>
          </div>
          <div class="tactical-pin-label" style="background: ${isSelected ? '#0284c7' : 'rgba(15, 23, 42, 0.85)'}; color: #ffffff; border: 1px solid ${isSelected ? '#38bdf8' : '#475569'}; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 700; font-family: monospace; white-space: nowrap; margin-top: 3px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
            ${det.name}
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([det.latitude, det.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 100,
      });

      const popupHtml = `
        <div style="min-width: 200px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="font-weight: 700; font-size: 14px; color: #38bdf8; margin-bottom: 2px;">
            ${det.name}
          </div>
          <div style="font-size: 11px; color: #9cb571; font-family: monospace; margin-bottom: 6px;">
            DET ID: #${det.id}
          </div>
          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">
            ${det.description || 'Forward operating detachment station.'}
          </div>
          <div style="font-size: 11px; color: #eab308; font-family: monospace; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; border: 1px solid #334431;">
            LAT: ${det.latitude.toFixed(4)}° | LNG: ${det.longitude.toFixed(4)}°
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      if (onSelectDet) {
        marker.on('click', () => onSelectDet(det));
      }

      markersLayer.addLayer(marker);
      markerMap[det.id] = marker;
    });

    // Auto Focus Logic:
    if (selectedDet && selectedDet.latitude && selectedDet.longitude) {
      map.flyTo([selectedDet.latitude, selectedDet.longitude], 13, {
        animate: true,
        duration: 0.8,
      });
      if (markerMap[selectedDet.id]) {
        markerMap[selectedDet.id].openPopup();
      }
    } else if (dets && dets.length > 0) {
      // When initially loaded or no det selected, fit bounds to show all Dets
      if (dets.length > 1) {
        const bounds = L.latLngBounds(dets.map((d) => [d.latitude, d.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
      } else if (dets.length === 1) {
        map.setView([dets[0].latitude, dets[0].longitude], 12);
      }
    }
  }, [dets, selectedDet]);

  return (
    <div className="position-relative w-100 rounded overflow-hidden border border-secondary" style={{ height }}>
      {/* Pure World Map Container */}
      <div ref={mapContainerRef} className="w-100 h-100" />

      {/* Top-Right OpenStreetMap Badge */}
      <div className="position-absolute" style={{ top: '12px', right: '12px', zIndex: 1000 }}>
        {/* <div className="badge bg-dark text-success border border-secondary d-flex align-items-center gap-1 py-1 px-2 shadow">
          <span className="material-symbols-outlined md-14 text-warning">public</span>
          <span style={{ fontSize: '11px' }}>World Map</span>
        </div> */}
      </div>

      {/* Bottom HUD Coordinate Bar */}
      <div
        className="card position-absolute px-3 py-1 d-flex flex-row align-items-center gap-3 shadow-sm border border-secondary"
        style={{
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          backgroundColor: 'rgba(21, 29, 20, 0.92)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="d-flex align-items-center gap-2 small font-monospace text-secondary" style={{ fontSize: '11px' }}>
          <span className="material-symbols-outlined md-14 text-warning">near_me</span>
          <span>LAT: <strong className="text-light">{cursorCoords.lat}°</strong></span>
          <span>LNG: <strong className="text-light">{cursorCoords.lng}°</strong></span>
        </div>

        <span className="text-secondary opacity-50">|</span>

        <small className="text-success fw-bold font-monospace" style={{ fontSize: '11px' }}>
          ZOOM: {Math.round(currentZoom)}x
        </small>
      </div>
    </div>
  );
}
