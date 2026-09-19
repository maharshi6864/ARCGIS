/**
 * OpenStreetMap IndexedDB Offline Tile Caching Engine & Bounding Box Downloader
 * Exclusively manages OpenStreetMap tiles for 100% offline production deployment.
 */

const DB_NAME = 'GeoVentures_TileCache';
const DB_VERSION = 1;
const STORE_NAME = 'tiles';
export const OSM_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

let dbInstance = null;

// Initialize IndexedDB
export async function initTileDB() {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB Tile Cache init error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get Cached Tile Blob
export async function getCachedTile(key) {
  try {
    const db = await initTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Error reading tile cache:', err);
    return null;
  }
}

// Store Tile Blob into Cache
export async function storeCachedTile(key, blob) {
  try {
    const db = await initTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, blob, timestamp: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Error storing tile in cache:', err);
    return false;
  }
}

// Cache Statistics
export async function getCacheStats() {
  try {
    const db = await initTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      countReq.onsuccess = () => {
        // Estimate ~25KB per OSM tile
        const count = countReq.result || 0;
        const estSizeMB = (count * 25) / 1024;
        resolve({ count, estSizeMB: estSizeMB.toFixed(2) });
      };
      countReq.onerror = () => resolve({ count: 0, estSizeMB: '0.00' });
    });
  } catch {
    return { count: 0, estSizeMB: '0.00' };
  }
}

// Clear Cache
export async function clearTileCache() {
  try {
    const db = await initTileDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Slippy Map Tile Math Formulas
export function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

// Calculate Tile Count for Bounding Box
export function calculateBoundingBoxTiles(bounds, minZoom = 1, maxZoom = 6) {
  // bounds: { north, south, east, west }
  let totalTiles = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = Math.max(0, lon2tile(bounds.west, z));
    const xMax = Math.min(Math.pow(2, z) - 1, lon2tile(bounds.east, z));
    const yMin = Math.max(0, lat2tile(bounds.north, z));
    const yMax = Math.min(Math.pow(2, z) - 1, lat2tile(bounds.south, z));

    const countX = Math.abs(xMax - xMin) + 1;
    const countY = Math.abs(yMax - yMin) + 1;
    totalTiles += countX * countY;
  }
  const estSizeMB = ((totalTiles * 25) / 1024).toFixed(2);
  return { totalTiles, estSizeMB };
}

// Download Global OpenStreetMap Baseline (Zoom 0 to 5)
export async function downloadGlobalBasemap(maxZoom = 5, onProgress = null) {
  const tileCoords = [];
  for (let z = 0; z <= maxZoom; z++) {
    const maxIndex = Math.pow(2, z);
    for (let x = 0; x < maxIndex; x++) {
      for (let y = 0; y < maxIndex; y++) {
        tileCoords.push({ z, x, y });
      }
    }
  }
  return downloadTileBatch(tileCoords, onProgress);
}

// Download Sector Bounding Box OpenStreetMap Tiles
export async function downloadSectorTiles(bounds, minZoom = 6, maxZoom = 10, onProgress = null) {
  const tileCoords = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = Math.max(0, lon2tile(bounds.west, z));
    const xMax = Math.min(Math.pow(2, z) - 1, lon2tile(bounds.east, z));
    const yMin = Math.max(0, lat2tile(bounds.north, z));
    const yMax = Math.min(Math.pow(2, z) - 1, lat2tile(bounds.south, z));

    for (let x = Math.min(xMin, xMax); x <= Math.max(xMin, xMax); x++) {
      for (let y = Math.min(yMin, yMax); y <= Math.max(yMin, yMax); y++) {
        tileCoords.push({ z, x, y });
      }
    }
  }
  return downloadTileBatch(tileCoords, onProgress);
}

// Internal Batch Downloader with Concurrency
async function downloadTileBatch(tileCoords, onProgress) {
  const total = tileCoords.length;
  let completed = 0;
  const queue = [...tileCoords];
  const concurrency = 6;

  async function worker() {
    while (queue.length > 0) {
      const coord = queue.shift();
      if (!coord) break;
      const { z, x, y } = coord;
      const subdomains = ['a', 'b', 'c'];
      const s = subdomains[(x + y) % subdomains.length];
      const url = OSM_URL_TEMPLATE.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{s}', s);
      const key = `osm_${z}_${x}_${y}`;

      const existing = await getCachedTile(key);
      if (!existing) {
        try {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            await storeCachedTile(key, blob);
          }
        } catch {
          // Continue on individual tile network errors
        }
      }

      completed++;
      if (onProgress) {
        onProgress({
          completed,
          total,
          percent: Math.round((completed / total) * 100),
        });
      }
    }
  }

  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
  return { completed, total };
}

// Persistent Map Operational Configuration Storage
const MAP_CONFIG_KEY = 'DEFCON_MapConfig';

export function getMapConfig() {
  try {
    const saved = localStorage.getItem(MAP_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading map config:', e);
  }
  return {
    centerLat: 28.6139,
    centerLng: 77.2090,
    defaultZoom: 4,
    minZoom: 2,
    maxZoom: 18,
    isOperationalLocked: false,
    sectorName: 'Default Global Operations',
    bounds: null, // { north, south, east, west }
  };
}

export function saveMapConfig(config) {
  try {
    localStorage.setItem(MAP_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Error saving map config:', e);
    return false;
  }
}

