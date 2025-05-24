
const mapTile = 256;
const mapSize = 8192;
const mapTileBorder = 128;
const mapTileSize = [mapTile / 2, mapTile / 2];
const mapSize05 = [mapSize / 2, mapSize / 2];
const mapSize10 = [[0, 0], [mapSize, mapSize]];
const mapBorder = 1024;
const mapWidth = 8192;
const mapHeight = 8192;
const screen_frame_mult = 1;

const mapTileWidthWR = mapTile + mapTileBorder + ((window.innerWidth / 16) * screen_frame_mult);
const mapTileHeightHT = mapTile + mapTileBorder + ((window.innerHeight / 9) * screen_frame_mult);
const mapTileWidthWL = -mapTileBorder - ((window.innerWidth / 16) * screen_frame_mult);
const mapTileHeightHB = -mapTileBorder - (-window.innerHeight / 9) * screen_frame_mult;
//1920x1080

const bounds = [[0, 0], [mapHeight, mapWidth]];

const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 2,
  maxZoom: 5,
  zoomSnap: 0.025,
  zoomDelta: 0.025,
  zoom: 2,
  zoomControl: true,
  maxBounds: [[mapTileHeightHB, mapTileWidthWL], [mapTileHeightHT, mapTileWidthWR]],
  maxBoundsViscosity: 0.5,
  center: [128, 128]
});

L.tileLayer('MapTilestest/{z}/{x}/{y}.png?t=' + Date.now(), {
  noWrap: true,
}).addTo(map);



map.on('zoomend', function () {
  const z = map.getZoom();
  const borderShift = Math.pow(2, z) * mapTile;
  const bounds = [
    [-shift, -shift],
    [mapSize + shift, mapSize + shift]
  ];
  map.setMaxBounds(bounds);
});



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