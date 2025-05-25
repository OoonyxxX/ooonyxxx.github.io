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
const mapTileWR = mapTile + mapTileBorder + ((window.innerWidth / 16) * screen_frame_mult);
const mapTileHT = mapTile + ((window.innerHeight / 9) * screen_frame_mult);
const mapTileWL = -mapTileBorder - ((window.innerWidth / 16) * screen_frame_mult);
const mapTileHB = - ((window.innerHeight / 9) * screen_frame_mult);
//1920x1080 120px
const bounds = [[0, 0], [mapHeight, mapWidth]];

//Editors WhiteList
//START
const whiteList = [
"OoonyxxX", 
"333tripleit"
];
//END
//Editors WhiteList

//Инициализация Карты
//START
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: 2,
  maxZoom: 5,
  zoomSnap: 0.025,
  zoomDelta: 0.025,
  zoom: 2,
  zoomControl: true,
  maxBounds: [[mapTileHB, mapTileWL], [mapTileHT, mapTileWR]],
  maxBoundsViscosity: 0.5,
  center: [128, 128]
});
//END
//Инициализация Карты


//Тайловая карта
//START
L.tileLayer('MapTilestest/{z}/{x}/{y}.png?t=' + Date.now(), {
  noWrap: true,
}).addTo(map);
//END
//Тайловая карта


//Адаптивный зумм для карты
//START
map.on('zoomend', function () {
  const z0 = map.getZoom();
  const z = z0 - 2;
  const borderShift = Math.pow(2, z);
  const mapTileWRE = (mapTileBorder + ((window.innerWidth / 16) * screen_frame_mult)) / borderShift;
  const mapTileHTE = ((window.innerHeight / 9) * screen_frame_mult) / borderShift;
  const shiftedBounds = [[mapTileHB / borderShift, mapTileWL / borderShift], [mapTileHTE + mapTile, mapTileWRE + mapTile]];
  map.setMaxBounds(shiftedBounds);
});
//END
//Адаптивный зумм для карты


//Слои меток + Фильтры
//START
Promise.all([
  fetch("categories.json").then(res => res.json()),
  fetch("icons.json").then(res => res.json()),
  fetch("markers.json").then(res => res.json())
])
.then(([categories, iconsData, markers]) => {
    // Работа с категориями и иконками
  
  const layers = {};
  categories.forEach(cat => {
    layers[cat.id] = L.layerGroup().addTo(map);
  });
  
  const icons = {};
  iconsData.forEach(icon => {
    icons[icon.id] = L.icon({
      iconUrl: icon.url,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  });
  
  markers.forEach(marker => {
    const icon = icons[marker.icon_id] || icons.default;
    const layer = layers[marker.category_id];
  
    const m = L.marker(marker.coords, { icon })
      .bindPopup(`<b>${marker.name}</b><br>${marker.description}`);
  
    if (layer) {
      layer.addLayer(m);
    } else {
      console.warn(`No layer for category_id="${marker.category_id}"`);
    }
  });
  
  L.control.layers(null, layers).addTo(map);
})
.catch(error => console.error("JSON reading error:", error));
//END
//Слои меток + Фильтры


//Блок авторизации
//START
const loginButton = document.getElementById("login-button");
const usernameDisplay = document.getElementById("username-display");
const allowedEditors = whiteList;

function checkAuth() {
  fetch("http://localhost:8000/auth/me", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => {
      if (data.authorized) {
        const username = data.username;
        usernameDisplay.textContent = `Hello, ${username}`;
        loginButton.style.display = "none";

        if (allowedEditors.includes(username)) {
          console.log("Editor acepted");
          // здесь можно включить UI редактирования
        } else {
          console.log(`The ${username} is not an editor`);
        }
      } else {
        loginButton.onclick = () => {
          window.location.href = "http://localhost:8000/auth/login";
        };
      }
    })
    .catch(err => {
      console.error("Auth Error:", err);
    });
}

checkAuth();
//END
//Блок авторизации