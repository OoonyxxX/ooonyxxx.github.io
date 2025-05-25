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
L.tileLayer('MapTilestest/{z}/{x}/{y}.jpg', {
  tileSize: 256,
  minZoom: 0,
  maxZoom: maxZoom,
  noWrap: true
}).addTo(map);

L.marker([0, 0]).addTo(map).bindPopup("Левый верхний угол");
L.marker([8192, 8192]).addTo(map).bindPopup("Правый нижний угол");


////////////////////////////////////////////////////////////////////////
//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//OLD//
////////////////////////////////////////////////////////////////////////


const layers = {
  "Crypt": L.layerGroup().addTo(map),
  "Obelisk": L.layerGroup().addTo(map),
  "Home": L.layerGroup().addTo(map),
};

const icons = {
    Crypticon: L.icon({
    iconUrl: 'icons/T_Icon_Map_Cryptv2.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
    Obeliskicon: L.icon({
    iconUrl: 'icons/T_Icon_Map_Obelisk.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
    PlayerHomeicon: L.icon({
    iconUrl: 'icons/T_Icon_Map_PlayerHome.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  }),
    default: L.icon({
    iconUrl: 'icons/T_Icon_Map_Generic.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
};

fetch('markers.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(marker => {
	  const icon = icons[marker.icon] || icons.default;

      const m = L.marker(marker.coords, { icon })
        .bindPopup(`<b>${marker.name}</b><br>${marker.description}`);

      if (!layers[marker.category]) {
        layers[marker.category] = L.layerGroup().addTo(map);
      }

      layers[marker.category].addLayer(m);
    });

    L.control.layers(null, layers).addTo(map);
  });
