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


const allowedEditors = ["OoonyxxX", "333tripleit"];
//Editors WhiteList
//START
//const whiteList = [
//"OoonyxxX", 
//"333tripleit"
//];
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


//Переменные блока MET
//START
const metControls = document.getElementById('met-controls');
const btnActivate = document.getElementById('activate-met');
const btnExit     = document.getElementById('exit-met');
const btnAdd      = document.getElementById('add-marker');
const btnSave     = document.getElementById('save-changes');

metControls.style.display = 'none';
btnActivate.style.display = 'none';
btnExit.style.display = 'none';
btnAdd.style.display = 'none';
btnSave.style.display = 'none';

btnActivate.disabled = true;
btnExit.disabled     = true;
btnAdd.disabled      = true;
btnSave.disabled     = true;
//END
//Переменные блока MET



//Блок авторизации
//START
const loginButton = document.getElementById("login-button");
const usernameDisplay = document.getElementById("username-display");

function checkAuth() {
  fetch("https://sotn2-auth-proxy.onrender.com/auth/me", {
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
		  
          metControls.style.display = 'block';
		  btnActivate.style.display = 'block';
          btnActivate.disabled = false;
		  initMET();
        } else {
          console.log(`The ${username} is not an editor`);
        }
      } else {
        loginButton.onclick = () => {
          window.location.href = "https://sotn2-auth-proxy.onrender.com/auth/login";
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




//Блок MET
//START
function initMET() {
	(function() {
	  // Состояние MET
	  let metActive = false;
	  let addingMarker = false;
	  const diff = { added: [], updated: [], deleted: [] };


	  // Активация MET
	  btnActivate.addEventListener('click', () => {
		metActive = true;
		btnActivate.disabled = true;
		btnExit.disabled     = false;
		btnAdd.disabled      = false;
		btnExit.style.display = 'block';
		btnAdd.style.display = 'block';
		btnSave.style.display = 'block';
		console.log('MET activated');
		map.on('click', onMapClick);
	  });

	  // Выход из MET
	  btnExit.addEventListener('click', () => {
		metActive = false;
		btnActivate.disabled = false;
		btnExit.disabled     = true;
		btnAdd.disabled      = true;
		btnSave.disabled     = !(diff.added.length || diff.updated.length || diff.deleted.length);
		btnExit.style.display = 'none';
		btnAdd.style.display = 'none';
		btnSave.style.display = 'none';
		console.log('MET exited');
		map.off('click', onMapClick);
	  });

	  // Включение режима добавления маркера
	  btnAdd.addEventListener('click', () => {
		if (!metActive) return;
		addingMarker = true;
		console.log('Click on map to add marker');
	  });

	  // Обработчик клика по карте
	  function onMapClick(e) {
		if (!addingMarker) return;
		const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
		openEditPopup(marker, true);
		addingMarker = false;
	  }

	  // Открытие popup для создания/редактирования
	  function openEditPopup(marker, isNew) {
		const latlng = marker.getLatLng();
		const formHtml = `
		  <form id="marker-form">
			<label>Title: <input name="title" required /></label><br/>
			<label>Description: <textarea name="description"></textarea></label><br/>
			<label>Coords: <input name="lat" value="${latlng.lat.toFixed(5)}" required/> , <input name="lng" value="${latlng.lng.toFixed(5)}" required/></label><br/>
			<button type="submit">${isNew ? 'Create' : 'Update'}</button>
			${!isNew ? '<button id="delete-marker" type="button">Delete</button>' : ''}
		  </form>`;
		marker.bindPopup(formHtml).openPopup();

		// Сохранение или обновление
		document.getElementById('marker-form').addEventListener('submit', (ev) => {
		  ev.preventDefault();
		  const data = new FormData(ev.target);
		  const obj = {
			id: isNew ? generateTempId() : marker.options.id,
			title: data.get('title'),
			description: data.get('description'),
			coords: { lat: parseFloat(data.get('lat')), lng: parseFloat(data.get('lng')) }
		  };
		  if (isNew) {
			diff.added.push(obj);
			marker.options.id = obj.id;
		  } else {
			diff.updated.push(obj);
		  }
		  marker.closePopup();
		  btnSave.disabled = false;
		});

		// Удаление существующего маркера
		if (!isNew) {
		  document.getElementById('delete-marker').addEventListener('click', () => {
			diff.deleted.push(marker.options.id);
			map.removeLayer(marker);
			btnSave.disabled = false;
		  });
		}

		// Обновление координат после перетаскивания
		marker.on('dragend', (e) => {
		  const newCoords = e.target.getLatLng();
		  // при необходимости обновить поля формы или сразу добавить в diff.updated
		});
	  }

	  // Генерация временного ID для новых маркеров
	  function generateTempId() {
		return 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
	  }

	  // Отправка изменений на сервер (заглушка)
	  btnSave.addEventListener('click', () => {
		btnSave.disabled = true;
		console.log('Diff to send:', diff);
		// TODO: Реализовать fetch POST '/markers/update'
		// fetch('/markers/update', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify(diff) })
		//   .then(r => r.json()).then(console.log).catch(console.error);
	  });
	})();
}
//END
//Блок MET