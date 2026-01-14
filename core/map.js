import { MAP_CONFIG } from './config.js';

// !!!Нужен структурный патч: Изменить путь к дереву тайлов на MapTiles/{z}/{x}/{y}.webp?t=


// Инициализация Карты
export const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: MAP_CONFIG.minZoom,
  maxZoom: MAP_CONFIG.maxZoom,
  zoomSnap: MAP_CONFIG.zoomSnap,
  zoomDelta: MAP_CONFIG.zoomDelta,
  zoom: MAP_CONFIG.zoom,
  zoomControl: MAP_CONFIG.zoomControl,
  maxBounds: [[MAP_CONFIG.mapTileHB, MAP_CONFIG.mapTileWL], [MAP_CONFIG.mapTileHT, MAP_CONFIG.mapTileWR]],
  maxBoundsViscosity: MAP_CONFIG.maxBoundsViscosity,
  center: MAP_CONFIG.center
});


// Инициализация тайлинга карты !!!Нужно изменить путь к дереву тайлов на MapTiles/{z}/{x}/{y}.webp?t=
L.tileLayer('MapTilestest/{z}/{x}/{y}.png?t=' + Date.now(), {
  noWrap: true,
}).addTo(map);

// Адаптивность зумма карты
map.on('zoomend', function () {
  const z0 = map.getZoom();
  const z = z0 - 2;
  const borderShift = Math.pow(2, z);
  const mapTileWRE = (MAP_CONFIG.mapTileBorder + (MAP_CONFIG.pixelDensity * MAP_CONFIG.screen_frame_mult)) / borderShift;
  const mapTileHTE = (MAP_CONFIG.pixelDensity * MAP_CONFIG.screen_frame_mult) / borderShift;
  const shiftedBounds = [[MAP_CONFIG.mapTileHB / borderShift, MAP_CONFIG.mapTileWL / borderShift], [mapTileHTE + MAP_CONFIG.mapTile, mapTileWRE + MAP_CONFIG.mapTile]];
  map.setMaxBounds(shiftedBounds);
});