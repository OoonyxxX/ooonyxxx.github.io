const tileSize = 256;
const maxZoom = 5;

// Размер карты на максимальном зуме
const mapPixelSize = tileSize * Math.pow(2, maxZoom); // 256 * 32 = 8192

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: maxZoom,
  zoomSnap: 0.25,
  maxBounds: [[-512, -512], [mapPixelSize + 512, mapPixelSize + 512]],
  maxBoundsViscosity: 1.0,
  zoomControl: true
});

// Центрируем карту по середине
map.setView([mapPixelSize / 2, mapPixelSize / 2], 2);

// Подключаем тайлы
L.tileLayer('', {
  tileSize: tileSize,
  minZoom: 0,
  maxZoom: maxZoom,
  noWrap: true,
  getTileUrl: function(coords) {
    const z = coords.z;
    const x = coords.x;
    const yMax = Math.pow(2, z) - 1;
    const y = coords.y * -1; // инвертируем Y
    return 'MapTilestest/${z}/${x}/${y}.png';
  }
}).addTo(map);

L.marker([0, 0]).addTo(map).bindPopup("Левый верхний угол");
L.marker([8192, 8192]).addTo(map).bindPopup("Правый нижний угол");