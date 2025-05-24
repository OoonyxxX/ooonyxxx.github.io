const mapTileSize = 256;
const zoomLevels = 6; // от 0 до 5
const fullTileCount = Math.pow(2, zoomLevels - 1); // уровень 5

// Размер всей карты в пикселях на максимальном зуме
const mapWidth = 8192;
const mapHeight = 8192;

// Инициализация карты
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: 5,
  zoomSnap: 0.25,
  maxBounds: [[-256, -256], [mapHeight + 256, mapWidth + 256]],
  maxBoundsViscosity: 1.0,
  zoomControl: true
});

// Центр карты (в пикселях) — ставим посередине изображения
const centerX = 4096;
const centerY = 4096;
map.setView([centerY, centerX], 0); // zoom = 2 как пример

// Подключаем тайлы
L.tileLayer('MapTilestest/{z}/{x}/{y}.png', {
  tileSize: 256,
  minZoom: 0,
  maxZoom: 5,
  noWrap: true
}).addTo(map);