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


const allowedEditors = [
"OoonyxxX", 
"333tripleit"
];


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




//Переменные для редактирования существующих меток
//START
//const m = L.marker(mData.coords, { icon, id: mData.id })
const existingMarkers = new Map();

//END
//Переменные для редактирования существующих меток




//Слои меток + Фильтры
//START
Promise.all([
  fetch("categories.json").then(res => res.json()),
  fetch("icons.json").then(res => res.json()),
  fetch("markers.json").then(res => res.json())
])

.then(([categories, iconsData, markersData]) => {
  // 1) Готовим слои (по категориям)
  const layers   = {};     // id категории → L.LayerGroup
  const overlays = {};     // label категории → L.LayerGroup (для UI)

  categories.forEach(cat => {
    const layer = L.layerGroup().addTo(map);
    layers[cat.id]     = layer;
    overlays[cat.label] = layer;
  });

  // 2) Готовим иконки
  const icons = {};
  iconsData.forEach(ic => {
    icons[ic.id] = L.icon({
      iconUrl:    ic.url,
      iconSize:   [32, 32],
      iconAnchor: [16, 32],
      popupAnchor:[0, -32]
    });
  });
  // Если в JSON есть default–иконка, назначим её как fallback
  if (icons["default"]) {
    icons.default = icons["default"];
  } else {
    // можно вписать свою картинку или оставить первую
    icons.default = Object.values(icons)[0];
  }
  // 3) Создаём маркеры из markersData
  markersData.forEach(m => {
    const {id, name, description, coords, category_id, icon_id} = m;
	
    // выбираем иконку, fallback → icons.default
    const icon  = icons[icon_id] || icons.default;
    const layer = layers[category_id];
	
    const marker = L.marker(coords, { icon })
      .bindPopup(`<b>${name}</b><br>${description}`);
	  
    // опционально сохраняем id и данные в options
    marker.options.id = id;
    marker.options.name = name;
    marker.options.description = description;
	marker.options.coords = coords;
    marker.options.category_id = category_id;
    marker.options.icon_id = icon_id;

    layer.addLayer(marker);
	existingMarkers.set(marker.options.id, marker);
  });
  L.control
    .layers(null, overlays, {collapsed: true}).addTo(map);
  checkAuth(categories, iconsData);
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

function checkAuth(categories, iconsData) {
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
		  initMET(categories, iconsData);
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
//END
//Блок авторизации

const tpl = document.getElementById('marker-form-template');

function genId(title, lat, lng) {
  // 1) Title: пробелы → нижнее подчёркивание, оборвать лишние пробелы
  const safeTitle = title.trim().replace(/\s+/g, '_');

  // 2) Рандом 8 цифр
  const rand = String(Math.floor(Math.random() * 1e8))
	.padStart(8, '0');

  // 3) Координаты ×1000, 6-значным числом, с ведущими нулями
  const latPart = String(Math.round(lat * 1000)).padStart(6, '0');
  const lngPart = String(Math.round(lng * 1000)).padStart(6, '0');

  return `${safeTitle}_${rand}_${latPart}_${lngPart}`;
}

//Блок MET
//START
function initMET(categories, iconsData) {
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
		console.log(existingMarkers);
		map.on('click', METOnMapClick);
		existingMarkers.forEach(marker => {
          marker.off('click');              // сбросить старый popup
          marker.on('click', () => openEditPopup(marker, false, categories, iconsData));
        });
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
		map.off('click', METOnMapClick);
		existingMarkers.forEach(marker => {
			marker.unbindPopup();
			marker.off('click');
			marker.bindPopup(`<b>${marker.options.name}</b><br>${marker.options.description}`);
        });
	  });

	  // Включение режима добавления маркера
	  btnAdd.addEventListener('click', () => {
		if (!metActive) return;
		addingMarker = true;
		console.log('Click on map to add marker');
	  });

	  // Обработчик клика по карте
	  function METOnMapClick(e) {
		if (!addingMarker) return;
		const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
		openEditPopup(marker, true, categories, iconsData);
		addingMarker = false;
	  }
	  
	  // Открытие popup для создания/редактирования
	  function openEditPopup(marker, isNew, categories, iconsData) {
		marker.unbindPopup();
		const clone = tpl.content.cloneNode(true);
		const form      = clone.querySelector('#marker-form');
		const titleIn   = form.querySelector('input[name="title"]');
		const descIn    = form.querySelector('textarea[name="description"]');
		const catSel    = form.querySelector('select[name="category"]');
		const iconSel   = form.querySelector('select[name="icon"]');
		const latIn     = form.querySelector('input[name="lat"]');
		const lngIn     = form.querySelector('input[name="lng"]');
		const submitBtn = form.querySelector('#submit-btn');
		const cancelBtn = form.querySelector('#cancel-btn');
		const latlng = isNew
		  ? marker.getLatLng()   // для новых берём клик-координаты
		  : marker.getLatLng();  // для старых — тоже из самого маркера
		
		categories.forEach(cat => {
		  const opt = document.createElement('option');
		  opt.value = cat.id;
		  opt.textContent = cat.label;
		  catSel.append(opt);
		});
		  iconsData.forEach(ic => {
		  const opt = document.createElement('option');
		  opt.value = ic.id;
		  opt.textContent = ic.name;
		  iconSel.append(opt);
		});
		if (isNew) {
		  titleIn.value       = 'Name_PlaceHolder';
		  descIn.value        = 'Description_PlaceHolder';
		  catSel.value        = 'none';
		  iconSel.value       = 'default';
		  latIn.value         = latlng.lat;
		  lngIn.value         = latlng.lng;
		  submitBtn.textContent = 'Create';
		  cancelBtn.textContent = 'Cancel';
		} else {
		  titleIn.value       = marker.options.name;
		  descIn.value        = marker.options.description;
		  catSel.value        = marker.options.category_id || 'none';
		  iconSel.value       = marker.options.icon_id || 'default';
		  latIn.value         = marker.options.coords[0];
		  lngIn.value         = marker.options.coords[1];
		  submitBtn.textContent = 'Save';
		  cancelBtn.textContent = 'Delete';
		}
		marker.bindPopup(clone).openPopup();
		
		console.log(form);
		
		const popupEl = popup.getElement();
		const contentEl = popupEl.querySelector('.leaflet-popup-content');
		const formN      = contentEl.querySelector('#marker-form');
		cancelBtn = contentEl.querySelector('#cancel-btn');
		submitBtn = contentEl.querySelector('#submit-btn');
		console.log(submitBtn);
		console.log(contentEl);
		console.log(formN);
		// 7) Обработчик submit
		submitBtn.addEventListener('click', ev => {
			ev.preventDefault();
			const data		  = new FormData(formN);
			const title       = data.get('title')       || 'Name_PlaceHolder';
			const description = data.get('description') || 'Description_PlaceHolder';
			const category_id = data.get('category')    || null;
			const icon_id     = data.get('icon')        || 'default';
			const lat         = parseFloat(data.get('lat'));
			const lng         = parseFloat(data.get('lng'));
			console.log(data);
			
			if (isNew) {
				const newId = genId(title, lat, lng);
				marker.options.id 		   = newId;
				marker.options.name        = title;
				marker.options.description = description;
				marker.options.category_id = category_id;
				marker.options.icon_id     = icon_id;
				marker.options.coords = [lat, lng];
				existingMarkers.set(marker.options.id, marker);
				diff.added.push({
				  id:            marker.options.id,
				  title:         marker.options.name,
				  description:   marker.options.description,
				  category_id:   marker.options.category_id,
				  icon_id:       marker.options.icon_id,
				  coords:        marker.options.coords
				});
				btnSave.disabled = !(diff.added.length || diff.updated.length || diff.deleted.length);
				console.log(newId);
			} else {
				const oldCategoryId = marker.options.category_id;
				const newCategoryId = category_id;
				const oldLayer = layers[oldCategoryId];
				const newLayer = layers[newCategoryId];
				oldLayer.removeLayer(marker);
				newLayer.addLayer(marker);
				console.log(oldCategoryId);
				console.log(newCategoryId);
				marker.options.name        = title;
				marker.options.description = description;
				marker.options.category_id = category_id;
				marker.options.icon_id     = icon_id;
				marker.options.coords = [lat, lng];
				marker.setLatLng([lat, lng]);
				console.log(marker.options.icon_id);
				const newIcon = iconsData.find(ic => ic.id == icon_id);
				marker.setIcon(L.icon({
				  iconUrl:    newIcon.url,
				  iconSize:   [32, 32],
				  iconAnchor: [16, 32],
				  popupAnchor:[0, -32]
				}));
				diff.updated.push({ id: marker.options.id, title, description, category_id, icon_id, coords:[lat,lng] });
				btnSave.disabled = !(diff.added.length || diff.updated.length || diff.deleted.length);
			}

			  // 8) Закрыть попап и обновить слой
			  marker.closePopup();
		});

		// 9) Обработчик Cancel/Delete
		cancelBtn.addEventListener('click', () => {
		  if (isNew) {
			// — удаляем маркер совсем
			map.removeLayer(marker);
			// и из diff.added
			diff.added = diff.added.filter(o => o.id !== marker.options.id);
			btnSave.disabled = !(diff.added.length || diff.updated.length || diff.deleted.length);
		  } else {
			// — помечаем на удаление
			diff.deleted.push(marker.options.id);
			map.removeLayer(marker);
			btnSave.disabled = !(diff.added.length || diff.updated.length || diff.deleted.length);
		  }
		  marker.closePopup();
		});
	  }
	})();
}
//END
//Блок MET