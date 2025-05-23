// Размер карты в пикселях (подставь свои)
const mapWidth = 8192;
const mapHeight = 8192;

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 2,
  zoomControl: true
});

const bounds = [[0, 0], [mapHeight, mapWidth]];
const image = L.imageOverlay('WorldMap_NoBack.png', bounds).addTo(map);

map.fitBounds(bounds);

// Маркеры вручную
const markers = [
  {
    name: "Начальная точка",
    coords: [2800, 600], // [y, x]
    category: "сюжет",
    description: "Здесь начинается путь Лисы."
  },
  {
    name: "Древний артефакт",
    coords: [1500, 1800],
    category: "артефакт",
    description: "Скрытый объект для изучения."
  }
];

// Группы по категориям
const layers = {
  "сюжет": L.layerGroup().addTo(map),
  "артефакт": L.layerGroup().addTo(map),
};

// Добавляем маркеры в нужные группы
markers.forEach(marker => {
  const m = L.marker(marker.coords)
    .bindPopup(`<b>${marker.name}</b><br>${marker.description}`);
  layers[marker.category].addLayer(m);
});

// Контроль слоёв (фильтры)
L.control.layers(null, layers).addTo(map);