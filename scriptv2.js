const mapSize = 8192;
const mapBorder = 1024;
const mapWidth = 8192;
const mapHeight = 8192;
const mapWidthWX = mapSize + mapBorder + (window.innerWidth / 4);
const mapHeightHX = mapSize + mapBorder + (window.innerHeight / 4);
const mapWidthWY = -mapBorder - (window.innerHeight / 4);
const mapHeightHY = -mapBorder - (window.innerWidth / 4);
const bounds = [[0, 0], [mapHeight, mapWidth]];
const boundsHW = [[0, 0], [mapHeightHX, mapWidthWX]];
const boundstest = [[mapHeight, 0], [0, mapWidth]];


const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 2,
  zoomSnap: 0.2,
  zoomDelta: 0.2,
  zoom: -3,
  //maxBounds: [[mapHeightHY, mapWidthWY], [mapHeightHX, mapWidthWX]],
  //maxBounds: boundsHW,
  maxBoundsViscosity: 0.5,
  center: [-8192, -8192],
  zoomControl: true
});

//const image = L.imageOverlay('WorldMap_NoBack.png', bounds).addTo(map);
//map.fitBounds([[mapHeightHY, mapWidthWY], [mapHeightHX, mapWidthWX]]);

L.tileLayer('MapTilestest/{z}/{x}/{y}.png', {
  zoomOffset: 3,
  minZoom: -3,
  maxZoom: 2,
  zoom: -3,
  tileSize: 256,
  center: [0, 0],
  //bounds: [[-mapHeight, -mapWidth], [2048, 2048]],
  noWrap: true
}).addTo(map);



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