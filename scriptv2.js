
const mapTile = 256;
const mapSize = 8192;
const mapTileBorder = 128;
const mapTileSize = [mapTile / 2, mapTile / 2];
const mapSize05 = [mapSize / 2, mapSize / 2];
const mapSize10 = [[0, 0], [mapSize, mapSize]];
const mapBorder = 1024;
const mapWidth = 8192;
const mapHeight = 8192;

const mapTileWidthWR = mapTile + mapTileBorder + (window.innerWidth / 8);
const mapTileHeightHB = mapTile + mapTileBorder + (window.innerHeight / 4);
const mapTileWidthWL = -mapTileBorder - (window.innerWidth / 8);
const mapTileHeightHT = -mapTileBorder - (window.innerHeight / 4);
//1920x1080

const mapWidthWX = mapSize + mapBorder + (window.innerWidth / 4);
const mapHeightHX = mapSize + mapBorder + (window.innerHeight / 4);
const mapWidthWY = -mapBorder - (window.innerHeight / 4);
const mapHeightHY = -mapBorder - (window.innerWidth / 4);
const bounds = [[0, 0], [mapHeight, mapWidth]];
const boundsHW = [[0, 0], [mapHeightHX, mapWidthWX]];
const boundstest = [[mapHeight, 0], [0, mapWidth]];


const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: 5,
  zoomSnap: 0.2,
  zoomDelta: 0.2,
  zoom: 5,
  maxBounds: [[mapTileHeightHT, mapTileWidthWL], [mapTileHeightHB, mapTileWidthWR]],
  maxBoundsViscosity: 0.5,
  //center: [-256, 256],
  zoomControl: true
});

//const image = L.imageOverlay('WorldMap_NoBack.png', bounds).addTo(map);
//map.fitBounds([[mapHeightHY, mapWidthWY], [mapHeightHX, mapWidthWX]]);
//map.fitBounds([[mapTileHeightHT, mapTileWidthWL], [mapTileHeightHB, mapTileWidthWR]]);
//map.setView([centerY, centerX], 5);

L.tileLayer('MapTilestest/{z}/{x}/{y}.png?t=${Date.now()}', {
  bounds: bounds,
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