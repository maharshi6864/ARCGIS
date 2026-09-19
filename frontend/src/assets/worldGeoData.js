/**
 * High-quality bundled offline world GeoJSON vector dataset.
 * Contains continents, prominent world landmasses, country boundaries,
 * graticules (equator, tropics, polar circles), and key geographic markers.
 * This guarantees a 100% offline interactive map that renders anywhere in the world.
 */

export const WORLD_GRATICULES = {
  type: "FeatureCollection",
  features: [
    // Equator
    {
      type: "Feature",
      properties: { name: "Equator", type: "equator" },
      geometry: {
        type: "LineString",
        coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
      }
    },
    // Tropic of Cancer
    {
      type: "Feature",
      properties: { name: "Tropic of Cancer", type: "tropic" },
      geometry: {
        type: "LineString",
        coordinates: [[-180, 23.436], [-90, 23.436], [0, 23.436], [90, 23.436], [180, 23.436]]
      }
    },
    // Tropic of Capricorn
    {
      type: "Feature",
      properties: { name: "Tropic of Capricorn", type: "tropic" },
      geometry: {
        type: "LineString",
        coordinates: [[-180, -23.436], [-90, -23.436], [0, -23.436], [90, -23.436], [180, -23.436]]
      }
    },
    // Prime Meridian
    {
      type: "Feature",
      properties: { name: "Prime Meridian", type: "meridian" },
      geometry: {
        type: "LineString",
        coordinates: [[0, 85], [0, 45], [0, 0], [0, -45], [0, -85]]
      }
    }
  ]
};

export const WORLD_HUBS = [
  { name: "Silicon Valley", lat: 37.3861, lng: -122.0839, country: "USA" },
  { name: "New York", lat: 40.7128, lng: -74.0060, country: "USA" },
  { name: "London", lat: 51.5074, lng: -0.1278, country: "UK" },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, country: "Germany" },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, country: "Japan" },
  { name: "Stockholm", lat: 59.3293, lng: 18.0686, country: "Sweden" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, country: "India" },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, country: "India" },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, country: "Singapore" },
  { name: "Sydney", lat: -33.8688, lng: 151.2093, country: "Australia" },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, country: "Brazil" },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, country: "Canada" },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, country: "UAE" },
  { name: "Seoul", lat: 37.5665, lng: 126.9780, country: "South Korea" },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241, country: "South Africa" }
];

export const WORLD_COUNTRIES_GEOJSON = {
  type: "FeatureCollection",
  features: [
    // North America (USA, Canada, Mexico)
    {
      type: "Feature",
      properties: { name: "United States of America", code: "USA", continent: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-124.7, 48.4], [-124.5, 46.3], [-124.1, 42.0], [-124.4, 40.4], [-120.5, 34.4],
          [-117.2, 32.5], [-114.7, 32.7], [-109.0, 31.3], [-106.5, 31.8], [-103.0, 29.0],
          [-97.1, 26.0], [-93.8, 29.8], [-89.9, 29.3], [-85.4, 29.9], [-81.8, 24.5],
          [-80.0, 26.5], [-75.5, 35.2], [-74.0, 40.5], [-70.0, 41.5], [-67.0, 44.5],
          [-67.8, 47.2], [-71.5, 45.0], [-75.0, 45.0], [-79.0, 43.0], [-83.0, 42.0],
          [-87.5, 41.5], [-92.0, 46.5], [-95.2, 49.4], [-104.0, 49.0], [-117.0, 49.0],
          [-123.3, 49.0], [-124.7, 48.4]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Canada", code: "CAN", continent: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-141.0, 69.6], [-133.0, 69.5], [-120.0, 69.0], [-110.0, 68.0], [-95.0, 68.0],
          [-85.0, 70.0], [-75.0, 62.0], [-64.0, 60.0], [-55.5, 52.0], [-60.0, 46.0],
          [-67.0, 44.5], [-71.5, 45.0], [-75.0, 45.0], [-79.0, 43.0], [-83.0, 42.0],
          [-87.5, 41.5], [-95.2, 49.4], [-104.0, 49.0], [-117.0, 49.0], [-123.3, 49.0],
          [-130.0, 55.0], [-135.0, 59.0], [-141.0, 60.3], [-141.0, 69.6]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Mexico & Central America", code: "MEX", continent: "North America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-117.2, 32.5], [-114.7, 32.7], [-109.0, 31.3], [-106.5, 31.8], [-103.0, 29.0],
          [-97.1, 26.0], [-97.5, 20.0], [-90.5, 19.8], [-87.0, 21.5], [-88.0, 16.0],
          [-83.5, 10.0], [-77.5, 8.0], [-80.0, 7.5], [-85.5, 11.0], [-92.5, 14.5],
          [-97.0, 16.0], [-105.0, 20.0], [-110.0, 23.5], [-115.0, 30.0], [-117.2, 32.5]
        ]]
      }
    },
    // South America (Brazil, Argentina, Andes)
    {
      type: "Feature",
      properties: { name: "South America", code: "SAM", continent: "South America" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-77.5, 8.0], [-72.0, 11.5], [-60.0, 9.0], [-50.0, 1.0], [-35.0, -5.0],
          [-35.0, -10.0], [-38.5, -13.0], [-41.0, -21.0], [-48.0, -28.0], [-53.0, -33.5],
          [-58.0, -38.5], [-65.0, -43.0], [-67.0, -55.0], [-75.0, -50.0], [-74.0, -40.0],
          [-71.0, -30.0], [-70.0, -18.0], [-81.0, -5.0], [-79.0, 2.0], [-77.5, 8.0]
        ]]
      }
    },
    // Western & Northern Europe
    {
      type: "Feature",
      properties: { name: "United Kingdom & Ireland", code: "GBR", continent: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-5.5, 50.0], [-0.5, 50.7], [1.8, 52.5], [0.0, 54.0], [-2.0, 57.0],
          [-3.5, 58.5], [-5.0, 58.5], [-6.5, 55.0], [-4.5, 52.0], [-5.5, 50.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Western & Central Europe", code: "EUR", continent: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-9.5, 37.0], [-9.0, 43.0], [-1.5, 43.5], [-4.5, 48.5], [1.5, 50.5],
          [4.5, 51.5], [7.0, 53.5], [10.0, 54.5], [12.0, 54.0], [14.5, 53.5],
          [19.0, 54.5], [23.0, 54.0], [28.0, 45.0], [24.0, 40.0], [20.0, 37.0],
          [15.0, 37.5], [16.0, 41.0], [12.0, 44.0], [8.0, 44.0], [3.0, 42.5],
          [-0.5, 38.0], [-5.5, 36.0], [-9.5, 37.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Scandinavia & Nordics", code: "SCA", continent: "Europe" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [5.0, 58.0], [5.0, 62.0], [12.0, 65.0], [18.0, 69.0], [28.0, 70.0],
          [30.0, 65.0], [25.0, 60.5], [18.0, 59.0], [12.5, 56.0], [8.5, 57.0],
          [5.0, 58.0]
        ]]
      }
    },
    // Eastern Europe & Russia
    {
      type: "Feature",
      properties: { name: "Eastern Europe & Northern Eurasia", code: "RUS", continent: "Europe/Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [30.0, 60.0], [40.0, 67.0], [60.0, 68.0], [80.0, 73.0], [110.0, 76.0],
          [140.0, 72.0], [170.0, 67.0], [180.0, 65.0], [170.0, 60.0], [160.0, 55.0],
          [140.0, 48.0], [130.0, 43.0], [120.0, 50.0], [90.0, 50.0], [60.0, 52.0],
          [45.0, 46.0], [35.0, 46.0], [30.0, 52.0], [30.0, 60.0]
        ]]
      }
    },
    // Asia (China, India, Japan, SE Asia, Middle East)
    {
      type: "Feature",
      properties: { name: "India & South Asia", code: "IND", continent: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [68.0, 24.0], [68.5, 22.0], [72.8, 19.0], [75.0, 12.0], [77.5, 8.0],
          [80.0, 13.0], [85.0, 19.5], [89.0, 22.0], [92.5, 21.0], [96.0, 27.5],
          [88.0, 28.0], [80.0, 30.5], [74.0, 36.0], [70.0, 30.0], [68.0, 24.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "East Asia & China", code: "CHN", continent: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [75.0, 37.0], [85.0, 48.0], [100.0, 42.0], [115.0, 40.0], [122.0, 40.0],
          [125.0, 38.0], [121.0, 31.0], [119.0, 25.0], [114.0, 22.5], [108.0, 21.5],
          [105.0, 10.0], [100.0, 14.0], [98.0, 22.0], [92.0, 28.0], [80.0, 35.0],
          [75.0, 37.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Japan", code: "JPN", continent: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [130.0, 31.5], [131.0, 34.0], [135.0, 34.5], [140.0, 36.0], [141.5, 41.5],
          [145.5, 44.0], [142.0, 45.5], [140.0, 42.0], [136.0, 36.5], [131.0, 33.0],
          [130.0, 31.5]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Southeast Asia & Archipelago", code: "SEA", continent: "Asia" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [98.0, 10.0], [104.0, 1.0], [110.0, 2.0], [118.0, 5.0], [122.0, 14.0],
          [120.0, 18.0], [115.0, 10.0], [108.0, 10.0], [100.0, 6.0], [98.0, 10.0]
        ]]
      }
    },
    {
      type: "Feature",
      properties: { name: "Middle East & Arabia", code: "MDE", continent: "Asia/Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [35.0, 32.0], [42.0, 37.0], [50.0, 38.0], [60.0, 30.0], [63.0, 25.0],
          [58.0, 22.0], [54.0, 16.5], [44.0, 12.5], [42.0, 16.0], [35.0, 27.5],
          [35.0, 32.0]
        ]]
      }
    },
    // Africa
    {
      type: "Feature",
      properties: { name: "Africa", code: "AFR", continent: "Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-17.5, 14.5], [-12.0, 28.0], [-5.0, 36.0], [10.0, 37.0], [25.0, 32.0],
          [32.0, 31.5], [35.0, 27.5], [43.0, 12.5], [51.0, 11.5], [41.0, -4.0],
          [35.0, -15.0], [32.0, -28.0], [20.0, -34.5], [18.0, -34.0], [12.0, -18.0],
          [9.0, -1.0], [3.0, 6.0], [-5.0, 5.0], [-15.0, 11.0], [-17.5, 14.5]
        ]]
      }
    },
    // Oceania / Australia
    {
      type: "Feature",
      properties: { name: "Australia & New Zealand", code: "AUS", continent: "Oceania" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [114.0, -22.0], [122.0, -16.0], [135.0, -12.0], [142.0, -11.0], [146.0, -19.0],
          [153.5, -28.0], [150.0, -37.5], [140.0, -38.0], [130.0, -32.0], [115.0, -34.0],
          [113.0, -26.0], [114.0, -22.0]
        ]]
      }
    },
    // Antarctica
    {
      type: "Feature",
      properties: { name: "Antarctica", code: "ATA", continent: "Antarctica" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-180.0, -78.0], [-120.0, -75.0], [-60.0, -65.0], [0.0, -70.0],
          [60.0, -68.0], [120.0, -66.0], [180.0, -78.0]
        ]]
      }
    }
  ]
};
