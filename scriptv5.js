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
"333tripleit",
"MiscFlower"
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
const existingMarkers = new Map();
const layers   = {};
//END
//Переменные для редактирования существующих меток

let originalMarkersData = [];


//Слои меток
//START

let iconsData, markersData, icons, overlays;

(async () => {
  [iconsData, markersData] = await Promise.all([
    fetch(`svgicons.json?_=${Date.now()}`).then(r => r.json()),
    fetch(`markers.json?_=${Date.now()}`).then(r => r.json())
  ]);

  overlays = {};

  iconsData.forEach(ic => {
    const img = new Image();
    img.src = ic.url;
  });

  icons = {};
  await Promise.all(iconsData.map(async ic => {
    const svgText = await fetch(ic.url).then(r => r.text());
    const html = `<div class="svg-icon" data-icon-id="${ic.id}">${svgText}</div>`;
    icons[ic.id] = L.divIcon({
      html,
      className: '',
      iconSize:   [32, 32],
      iconAnchor: [16, 32],
      popupAnchor:[0, -32]
    });
  }));
  icons.default = icons.default || Object.values(icons)[0];

  originalMarkersData = markersData.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    icon_id: m.icon_id,
    coords: [m.coords[0], m.coords[1]],
	region: m.reg_id,
	level: m.height,
	custom_color: [m.color.R ,m.color.G ,m.color.B]
  }));

  markersData.forEach(m => {
    const {id, name, description, icon_id, coords, reg_id, height, color} = m;
    const icon  = icons[icon_id] || icons.default;
    const marker = L.marker(coords, { icon })
      .bindPopup(`<b>${name}</b><br>${description}`);
    marker.options.id = id;
    marker.options.name = name;
    marker.options.description = description;
    marker.options.icon_id = icon_id;
    marker.options.coords = coords;
	marker.options.region = reg_id;
	marker.options.level = height;

	marker.addTo(map);
	const el = marker.getElement();
	const path = el.querySelector(`#${marker.options.icon_id}_svg`);
	const { R, G, B } = color;
	const cssColor = `rgb(${R}, ${G}, ${B})`;
	marker.options.custom_rgbcolor = color;
	marker.options.custom_csscolor = cssColor;
	const Rh = Math.floor(R / 2);
	const Gh = Math.floor(G / 2);
	const Bh = Math.floor(B / 2);
	marker.options.height_color = `rgb(${Rh}, ${Gh}, ${Bh})`;
	paintingAllMarkers();
    existingMarkers.set(marker.options.id, marker);
  });

  checkAuth(iconsData);

})().catch(error => console.error("JSON reading error:", error));


//END
//Слои меток + Фильтры

let ctx = 0;

//Переменные блока MET
//START
const metControls = document.getElementById('met-controls');
const btnActivate = document.getElementById('activate-met');
const btnExit     = document.getElementById('exit-met');
const btnAdd      = document.getElementById('add-marker');
const btnSave     = document.getElementById('save-changes');
const timerProgress = document.getElementById('timerProgressCircle');
const blueTimer = document.getElementById('TimerBlue');
const redTimer = document.getElementById('TimerRed');

//metControls.style.display = 'none';
//btnActivate.style.display = 'none';
//btnExit.style.display = 'none';
//btnAdd.style.display = 'none';
//btnSave.style.display = 'none';

btnActivate.disabled = true;
btnExit.disabled     = true;
btnAdd.disabled      = true;
btnSave.disabled     = true;

btnActivate.classList.add('disabled')
btnExit.classList.add('disabled')
btnAdd.classList.add('disabled')
btnSave.classList.add('disabled')
//END
//Переменные блока MET



//Блок авторизации
//START
const loginButton = document.getElementById("login-button");
const usernameDisplay = document.getElementById("username-display");

function checkAuth(iconsData) {
  fetch("https://testproxyserveroauth.onrender.com/auth/me", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => {
      if (data.authorized) {
        const username = data.username;
        usernameDisplay.textContent = `Hello, ${username}`;
        loginButton.classList.add('hide');
		
        if (allowedEditors.includes(username)) {
          console.log("Editor acepted");
		  
          metControls.classList.add('open');
		  btnActivate.classList.add('open');
          btnActivate.classList.remove('disabled')
		  btnActivate.disabled = false;
		  initMET(iconsData);
        } else {
          console.log(`The ${username} is not an editor`);
        }
      } else {
        loginButton.onclick = () => {
          window.location.href = "https://testproxyserveroauth.onrender.com/auth/login";
        };
      }
    })
    .catch(err => {
      console.error("Auth Error:", err);
    });
}
//END
//Блок авторизации

//Блок Options
//START

const reg_color = {
  fox_island:   '#ffb257',
  misthaven:    '#b890f9',
  mosswood:     '#69ec72',
  stormvale:    '#e6f368',
  frigid_peaks: '#89e1f0',
  ashlands:     '#fa7a7a',
  ocean:        '#7497f7',
};

const reg_heightcolor = {
  fox_island:   '#a16826',
  misthaven:    '#684d93',
  mosswood:     '#4c9b46',
  stormvale:    '#9ca630',
  frigid_peaks: '#27acc4',
  ashlands:     '#993d3d',
  ocean:        '#385299',
};

const coloredRegionsToggle = document.getElementById('toggle-regions');
const heightDisplayToggle = document.getElementById('toggle-height');
const coloredMarkersToggle = document.getElementById('toggle-color');
const customColorsToggle = document.getElementById('toggle-customcolor');

let coloredRegionsEnabled = false;
let heightDisplayEnabled = false;
let coloredMarkersEnabled = true;
let customColorsEnabled = false;

coloredRegionsToggle.addEventListener('change', () => {
  coloredRegionsEnabled = !coloredRegionsEnabled;
  paintingAllMarkers();
});

heightDisplayToggle.addEventListener('change', () => {
  heightDisplayEnabled = !heightDisplayEnabled;
  paintingAllMarkers();
});

coloredMarkersToggle.addEventListener('change', () => {
  coloredMarkersEnabled = !coloredMarkersEnabled;
  paintingAllMarkers();
});

function paintingAllMarkers() {
  existingMarkers.forEach(marker => {
	const markerHeightGround = !marker.options.level;
	const markerUnderground = heightDisplayEnabled && !markerHeightGround;
    const cssHexColor = reg_color[marker.options.region] || '#fff';
	const cssHeightHexColor = reg_heightcolor[marker.options.region] || '#7f7f7f';
	
    const el = marker.getElement();
	const path = el.querySelector(`#${marker.options.icon_id}_svg`);
	const { R, G, B } = marker.options.custom_rgbcolor;
	
	const white = [R, G, B].every(v => v === 255);
	const cWhite = '#fff';
	const cGray = '#7f7f7f';

    path.style.color = (coloredMarkersEnabled && coloredRegionsEnabled && markerUnderground && ((white && cssHeightHexColor) || marker.options.height_color)) || (coloredMarkersEnabled && coloredRegionsEnabled && ((white && cssHexColor) || marker.options.custom_csscolor)) || (coloredMarkersEnabled && markerUnderground && marker.options.height_color) || (coloredRegionsEnabled && markerUnderground && cssHeightHexColor) || (coloredMarkersEnabled && marker.options.custom_csscolor) || (coloredRegionsEnabled && cssHexColor) || (markerUnderground && cGray) || cWhite;
  });
}

function paintSingleMarker(marker) {
  const markerHeightGround = !marker.options.level;
  const markerUnderground = heightDisplayEnabled && !markerHeightGround;
  const cssHexColor = reg_color[marker.options.region] || '#fff';
  const cssHeightHexColor = reg_heightcolor[marker.options.region] || '#7f7f7f';
	
  const el = marker.getElement();
  const path = el.querySelector(`#${marker.options.icon_id}_svg`);
  const { R, G, B } = marker.options.custom_rgbcolor;

  const white = [R, G, B].every(v => v === 255);
  const cWhite = '#fff';
  const cGray = '#7f7f7f';

  path.style.color = (coloredMarkersEnabled && coloredRegionsEnabled && markerUnderground && ((white && cssHeightHexColor) || marker.options.height_color)) || (coloredMarkersEnabled && coloredRegionsEnabled && ((white && cssHexColor) || marker.options.custom_csscolor)) || (coloredMarkersEnabled && markerUnderground && marker.options.height_color) || (coloredRegionsEnabled && markerUnderground && cssHeightHexColor) || (coloredMarkersEnabled && marker.options.custom_csscolor) || (coloredRegionsEnabled && cssHexColor) || (markerUnderground && cGray) || cWhite;
}

function dynamicPaintSingleMarker(marker, rgbColor) {
  const { r, g, b } = rgbColor;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;
  const el = marker.getElement();
  //const isNewChecker = (isNew && 'default') || marker.options.icon_id;
  const path = el.querySelector(`#${marker.options.icon_id}_svg`);
  path.style.color = dynamicColor;
}

//END
//Блок Options

const tpl = document.getElementById('marker-form-template');

function genId(title, lat, lng) {
  const safeTitle = title.trim().replace(/\s+/g, '_');

  const rand = String(Math.floor(Math.random() * 1e8))
	.padStart(8, '0');

  const latPart = String(Math.round(lat * 1000)).padStart(6, '0');
  const lngPart = String(Math.round(lng * 1000)).padStart(6, '0');

  return `${safeTitle}_${rand}_${latPart}_${lngPart}`;
}

let exitSave = false;




//Блок MET
//START
function initMET(iconsData) {
  (function () {
	let editPopup;
	editPopup = L.popup({
	  autoClose: false,
	  closeOnClick: false,
	  autoPan: false,
	  closeButton: false,
	  className: 'edit-popup-class'
	});
	//Переменные внутри блока MET
	//START
	let exitchecker = false;
	let popapsaved = false;
    //const iconsById = Object.fromEntries(iconsData.map(i => [i.id, i]));
    let metActive = false;
    let addingMarker = false;
	let editPopupOpen = false;
    const diff = { added: [], updated: [], deleted: [] };
	//END
	//Переменные внутри блока MET
	
	function discardChanges() {
	  editPopup.remove();
	  
	  existingMarkers.clear();
	  
	  if (icons["default"]) {
		icons.default = icons["default"];
	  } else {
		icons.default = Object.values(icons)[0];
	  }

	  originalMarkersData.forEach(m => {
		const icon = icons[m.icon_id] || icons.default;
		const marker = L.marker(m.coords, { icon });
		marker.options.id           = m.id;
		marker.options.name         = m.name;
		marker.options.description  = m.description;
		marker.options.icon_id      = m.icon_id;
		marker.options.coords       = m.coords;
		marker.bindPopup(`<b>${m.name}</b><br>${m.description}`);
		existingMarkers.set(m.id, marker);
	  });

	  diff.added   = [];
	  diff.updated = [];
	  diff.deleted = [];
	  updateSaveState();
	}
	
	//Обновление состояния кнопки btnSave
    function updateSaveState() {
	  const hasChanges = !(diff.added.length || diff.updated.length || diff.deleted.length);
	  btnSave.classList.toggle('disabled', hasChanges);
	  btnSave.disabled = !(diff.added.length || diff.updated.length || diff.deleted.length);
    }

    function onMarkerClick(e) {
	  if (editPopupOpen) return;
	  if (addingMarker) return;
      openEditPopup(e.target, false);
    }
	
    function setAddMode() {
      if (addingMarker) {
        btnAdd.classList.add('btnAddMode');
        map.on('click', onMapClick);
      } else {
        btnAdd.classList.remove('btnAddMode');
        map.off('click', onMapClick);
      }
    }

	function initRegionCanvas(src) {
	  console.log('initRegionCanvas(', src, ')');
	  return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
		  console.log('image loaded');
		  const canvas = document.getElementById('regions-canvas');
		  canvas.width  = img.width;
		  canvas.height = img.height;
		  const ctx = canvas.getContext('2d');
		  ctx.drawImage(img, 0, 0);
		  resolve(ctx);
		};
		img.onerror = reject;
		img.src = src;
	  });
	}

	//Кнопка включения МЕТ
    btnActivate.addEventListener('click', () => {
      metActive = true;
	  btnActivate.disabled = true;
	  (async () => {
	    ctx = await initRegionCanvas('Regions.png');
	  })();
	  btnExit.disabled = false;
	  btnAdd.disabled = false;
      btnActivate.classList.add('disabled')
      btnExit.classList.remove('disabled')
      btnAdd.classList.remove('disabled')
      btnExit.classList.add('open');
      btnAdd.classList.add('open');
      btnSave.classList.add('open');
	  addingMarker = false;
      setAddMode();
      existingMarkers.forEach(m => {
        m.off('click');
        m.on('click', onMarkerClick);
      });
    });
	

	
	
	//Кнопка выключения МЕТ
    btnExit.addEventListener('click', () => {
	  const exitModal      = document.getElementById('exit-modal');
	  const exitText       = document.getElementById('exit-modal-text');
	  const exitButtons    = document.getElementById('exit-modal-buttons');
	  const exitYes        = document.getElementById('exit-yes');
	  const exitNo         = document.getElementById('exit-no');
	  const exitLoader     = document.getElementById('exit-modal-loader');
	  const exitLoaderText = document.getElementById('exit-modal-loader-text');
	  //Exit Modal
	  //START
	  exitLoader.classList.add('exit-hidden');
	  exitButtons.classList.remove('exit-hidden');
	  
	  if (!exitSave) {
		// --------------------------------------------------
		// 2A) Выход БЕЗ сохранения
		exitText.textContent = 'Are you sure you want to exit without saving the changes? ' + 'All edits will be lost.';
	  } else {
		// --------------------------------------------------
		// 2B) Выход С сохранением
		const h = new Intl.DateTimeFormat('en-US', {
		  hour:     'numeric',
		  hour12:   false,
		  timeZone: 'Europe/Kiev'
		}).format(new Date());
		const peakStart = 16, peakEnd = 22;
		const waitMin   = (h >= peakStart && h < peakEnd) ? 7 : 2;
		const minutesWord = waitMin === 1 ? 'minute' :
							(waitMin >= 2 && waitMin <= 4) ? 'minutes' : 'minutes';

		exitText.innerHTML = 'Are you sure you want to save the changes and exit?<br>' +
							 `Processing time can take up to ${waitMin} ${minutesWord}.`;
	  }
	  
	  exitModal.classList.remove('exit-hidden');
	  const baseMessage = 'The changes you make are sent to the server, ' + 'please don`t close the tab.<br>' + 'Once the server processes the changes, the page will refresh automatically and they will take effect. ' + 'Please note: during peak hours processing time can be up to 7 minutes.<br>';
	  exitNo.addEventListener('click', () => {
	    exitModal.classList.add('exit-hidden');
	  });
	  
	  function startDeployPolling() {
	    const intervalId = setInterval(async () => {
		  try {
		    const res = await fetch('https://testproxyserveroauth.onrender.com/api/deploy-status', {
			  method: 'GET',
			  credentials: 'include'
		    });
		    if (!res.ok) throw new Error(`HTTP ${res.status}`);

		    const { status } = await res.json();

		    // Обновляем текст
		    exitLoaderText.innerHTML = baseMessage + `Deploy status: <strong>${status}</strong>`;

		    if (status === 'built') {
			  clearInterval(intervalId);
			  exitLoaderText.innerHTML += '<br style="color:green">Page will refresh in 5 seconds...';
			  //setTimeout(() => location.reload(), 15_000);
			  setTimeout(() => {
			    const url = new URL(window.location.href);
			    url.searchParams.set('_', Date.now());
			    window.location.replace(url.toString());
			  }, 15_000);
		    }
		    else if (status === 'errored') {
			  clearInterval(intervalId);
			  exitLoaderText.innerHTML += '<br style="color:red">Error during deployment. Please try again later.';
		    }
		  }
		  catch (err) {
		    console.error('Deploy status check failed:', err);
		    exitLoaderText.innerHTML = baseMessage + 'Deploy status: <em>unknown (error)</em>';
		  }
	    }, 5_000);
	  }
	  
	  exitYes.addEventListener('click', () => {
	    if (!exitSave) {
		  // Выход без сохранения
		  exitModal.classList.add('exit-hidden');
		  metActive = false;
		  btnActivate.classList.remove('disabled')
		  btnExit.classList.add('disabled')
		  btnAdd.classList.add('disabled')
		  btnActivate.disabled = false;
		  btnExit.disabled = true;
		  btnAdd.disabled = true;
		  btnExit.classList.remove('open');
		  btnAdd.classList.remove('open');
		  btnSave.classList.remove('open');
		  addingMarker = false;
		  setAddMode();
		  discardChanges();
	    } else {
		  exitText.innerHTML = '';
		  exitButtons.classList.add('exit-hidden');
		  exitLoader.classList.remove('exit-hidden');
		  
		  console.log('Diff перед отправкой:', diff);
		  
		  exitLoaderText.innerHTML = baseMessage + 'Deploy status: <em>checking…</em>';
		  startDeployPolling();
		  fetch('https://testproxyserveroauth.onrender.com/api/update-markers', {
		    method: 'POST',
		    credentials: 'include',
		    headers: { 'Content-Type': 'application/json' },
		    body: JSON.stringify(diff)
		  })
		  .catch(err => console.error(err));
	    }
	  });
	  //END
	  //Exit Modal
	  
    });
	
	//Переключатель кнопки btnAdd
    btnAdd.addEventListener('click', () => {
      if (!metActive) return;
	  editPopup.remove();
	  addingMarker = !addingMarker;
      setAddMode();
    });
	
	//Функция добаления маркера
    function onMapClick(e) {
      if (!addingMarker) return;
	  const newIcon = icons.default || icons["default"];
      const marker = L.marker(e.latlng, {icon: newIcon}).addTo(map);
      openEditPopup(marker, true);
	  addingMarker = !addingMarker;
	  existingMarkers.forEach(m => {
		m.on('click', onMarkerClick);
	  });
	  setAddMode();
    }
	
	function shiftLatLng(latlng, offsetYInPixels) {
	  const point = map.latLngToLayerPoint(latlng);
	  point.y -= offsetYInPixels;
	  return map.layerPointToLatLng(point);
	}
	
	/////////////////////////////////////
	/////////////////////////////////////
	//Функция открытия и обработки попапа
    function openEditPopup(marker, isNew) {
	  console.log("Edit Popap Open");
	  popapsaved = false;
	  editPopup = L.popup({
	    autoClose: false,
	    closeOnClick: false,
	    autoPan: false,
		closeButton: false,
	    className: 'edit-popup-class'
	  });
	  if (isNew) {
		exitchecker = true;
	  } else {
		exitchecker = false;
	  };
      marker.unbindPopup();
	  marker.setZIndexOffset(1000);
      const content = tpl.content.cloneNode(true);
      const form = content.querySelector('#marker-form');
      const titleIn = form.querySelector('input[name="title"]');
      const descIn = form.querySelector('textarea[name="description"]');
      const iconSel = form.querySelector('select[name="icon"]');
	  const regSel = form.querySelector('select[name="region"]');
	  const levelIn = form.querySelector('input[name="underground"]');
	  
      const latIn = form.querySelector('input[name="lat"]');
      const lngIn = form.querySelector('input[name="lng"]');
      const latlng = marker.getLatLng();
	  
	  const pickerEl = form.querySelector('.color-picker');
	  const colorIn = form.querySelector('.color-input');
	  
	  const colorPicker = new iro.ColorPicker(pickerEl, {
	    width: 200,
	    color: { r: 255, g: 255, b: 255 },
	    layout: [
		  {
		    component: iro.ui.Wheel,
		  }
	    ]
	  });
	  
	  function initFormColor(initial) {
	    // initial может быть строкой "#rrggbb" или {r,g,b}
	    colorPicker.color.set(initial);
	    const { r, g, b } = colorPicker.color.rgb;
	    colorIn.value = `${r},${g},${b}`;
	  }
	  
	  colorPicker.on('color:change', function(color) {
		const rgbColor = color.rgb;
		const { r, g, b } = color.rgb;
		colorIn.value = `${r},${g},${b}`;
		dynamicPaintSingleMarker(marker, rgbColor);
	  });
	 
	  
	  //Сборка попапа

      iconsData.forEach(ic => {
        const icOpt = document.createElement('option');
        icOpt.value = ic.id;
        icOpt.textContent = ic.name;
        iconSel.append(icOpt);
      });

      if (isNew) {
        titleIn.value = 'Name_PlaceHolder';
        descIn.value = 'Description_PlaceHolder';
        iconSel.value = 'default';
		marker.options.icon_id = 'default';
		regSel.value = 'auto';
		levelIn.checked = false;
		colorIn.value = '#fff';
        latIn.value = latlng.lat;
        lngIn.value = latlng.lng;
		initFormColor('#fff');
      } else {
        titleIn.value = marker.options.name;
        descIn.value = marker.options.description;
        iconSel.value = marker.options.icon_id || 'default';
		regSel.value = marker.options.region || 'auto';
		levelIn.checked = marker.options.level;
        latIn.value = marker.options.coords[0];
        lngIn.value = marker.options.coords[1];
		initFormColor(marker.options.custom_csscolor || '#fff');
      }
	  //END
	  //Сборка попапа
      console.log(form);
	  //Создание и открытие попапа
	  const defShiftedLatLng = shiftLatLng(marker.getLatLng(), 40);
	  editPopup.setLatLng(defShiftedLatLng);
	  editPopup.setContent(content);
	  if (!editPopupOpen) {
		editPopupOpen = true;
		editPopup.addTo(map);
	  }
	  editPopup.on('remove', () => {
		editPopupOpen = false;
		marker.off('mousedown', draggingEnable);
		marker.off('mouseup mouseleave', draggingCancel);
		map.off('zoom');
		marker.dragging.disable();
		marker.setZIndexOffset(0);
		if (exitchecker && !popapsaved) {
			exitchecker = false;
			map.removeLayer(marker);
		};
		if (exitchecker && popapsaved) {
		  exitchecker = false;
		  marker.setLatLng(marker.options.coords);
		  const ic = icons[marker.options.icon_id] || icons.default;
          marker.setIcon(ic);
		  paintSingleMarker(marker);
		  updateSaveState();
		};
		if (!exitchecker && popapsaved) {
		  exitchecker = false;
		  marker.setLatLng(marker.options.coords);
		  const ic = icons[marker.options.icon_id] || icons.default;
          marker.setIcon(ic);
		  paintSingleMarker(marker);
		  updateSaveState();
		};
	  });
      const popupEl = editPopup.getElement();
      const formEl = popupEl.querySelector('#marker-form');
      const submitBtn = popupEl.querySelector('#submit-btn');
      const discardBtn = popupEl.querySelector('#discard-btn');
	  const deleteBtn = popupEl.querySelector('#delete-btn');
	  const sel = popupEl.querySelector('select[name="region"]');
	  
	  //Динамическое изменение иконки
      iconSel.addEventListener('change', e => {
        const ic = icons[e.target.value] || icons.default;
        marker.setIcon(ic);
		marker.options.icon_id = ic;
		paintSingleMarker(marker);
      });
	  
	  // Функция активации перемещения иконки
	  marker.dragging.enable();
	  let dragTimer;
	  let cancelOnMove;
	  
	  draggingEnable = () => {
		timerProgress.classList.remove('timer-progress');
		void timerProgress.offsetWidth;
		timerProgress.classList.add('timer-progress');
		blueTimer.style.display = 'inline';
		cancelOnMove = () => {
		  clearTimeout(dragTimer);
		  timerProgress.classList.remove('timer-progress');
		  blueTimer.style.display = 'none';
		  marker.off('mousemove', cancelOnMove);
		  marker.dragging.disable();
		  marker.dragging.enable();
		};
		marker.on('mousemove', cancelOnMove);
		dragTimer = setTimeout(() => {
		  marker.off('mousemove', cancelOnMove);
		}, 400);
	  };
	  
	  draggingCancel = () => {
		clearTimeout(dragTimer);
		timerProgress.classList.remove('timer-progress');
		blueTimer.style.display = 'none';
		marker.off('mousemove', cancelOnMove);
		marker.dragging.enable();
	  };
	  
	  marker.on('mousedown', draggingEnable);
	  marker.on('mouseup mouseleave', draggingCancel);
	  
	  
	  
	  // Функция перемещения маркера
      marker.on('drag', e => {
        const { lat, lng } = e.target.getLatLng();
        latIn.value = lat.toFixed(6);
        lngIn.value = lng.toFixed(6);
        if (editPopupOpen) {
		  const dragShiftedLatLng = shiftLatLng(e.target.getLatLng(), 40);
		  editPopup.setLatLng(dragShiftedLatLng)//.update();
		  //editPopup.setContent(content).update();
        }
      });
      marker.on('dragend', () => { 
	    marker.dragging.enable();
		blueTimer.style.display = 'none';
	  });
	  
	  map.on('zoom', () => {
        if (!editPopupOpen) return;
		const zoomShiftedLatLng = shiftLatLng(marker.getLatLng(), 40);
		editPopup.setLatLng(zoomShiftedLatLng);
	  });
		  
	  
	  
	  function getRegionIndex(ctx, posX, posY) {
	    const x = Math.floor(posX * 32);
	    const y = 8192 - Math.floor(posY * 32);

	    // читаем единственный пиксель
	    const pixel = ctx.getImageData(x, y, 1, 1).data;
	    const [R, G, B, A] = pixel;
	    return R;  // reg_index
	  }
	  
	  
	  //Функция обработчик изменений маркера
	  //START
      submitBtn.addEventListener('click', ev => {
		const heightUp = 0;
		const heightDown = -1;
        ev.preventDefault();
        const data = new FormData(formEl);
        const name = data.get('title') || 'Name_PlaceHolder';
        const description = data.get('description') || 'Description_PlaceHolder';
        const icon_id = data.get('icon') || 'default';
        const lat = parseFloat(data.get('lat'));
        const lng = parseFloat(data.get('lng'));
		let reg_index = 7;
		const autoRegCheck = data.get('region') === 'auto';
		
		const reg_list = {
			0: "ocean",
			1: "fox_island",
			2: "misthaven",
			3: "mosswood",
			4: "stormvale",
			5: "frigid_peaks",
			6: "ashlands",
			7: "undefined"
		};
		if (autoRegCheck) {
		  try {
		    reg_index = getRegionIndex(ctx, lng, lat);
		    marker.options.reg_index = reg_index;
		    console.log('reg_index:', reg_index);
		  } catch (err) {
		    console.error('Loading Regions.png:', err);
		  }
		}
		
		const regionAuto_id = autoRegCheck && reg_list[reg_index];
		const reg_id = regionAuto_id || data.get('region');
		console.log('region:', reg_id);
		const height = (data.get('underground') && heightDown) || heightUp;
		
		const triple = data.get('color');
		const [r, g, b] = triple.split(',').map(n => Number(n));
		const color = { R: r, G: g, B: b };

        if (isNew) {
          const newId = genId(name, lat, lng);
          marker.options.id = newId;
          existingMarkers.set(newId, marker);
		  marker.on('click', onMarkerClick);
          diff.added.push({ id: newId, name, description, icon_id, coords: [lat, lng], reg_id, height, color });
        } else {
		  diff.updated = diff.updated.filter(u => u.id !== marker.options.id);
          diff.updated.push({ id: marker.options.id, name, description, icon_id, coords: [lat, lng], reg_id, height, color });
        }
		const cssColor = `rgb(${r}, ${g}, ${b})`;
		
        marker.options.name = name;
        marker.options.description = description;
        marker.options.icon_id = icon_id;
        marker.options.coords = [lat, lng];
		marker.options.region = reg_id;
		marker.options.level = height;
		marker.options.custom_rgbcolor = color;
		marker.options.custom_csscolor = cssColor;
		const rh = Math.floor(r / 2);
		const gh = Math.floor(g / 2);
		const bh = Math.floor(b / 2);
		marker.options.height_color = `rgb(${rh}, ${gh}, ${bh})`;
        marker.setLatLng([lat, lng]);
        const ic = icons[icon_id] || icons.default;
        marker.setIcon(ic);
		popapsaved = true;
        editPopup.remove();
        updateSaveState();
      });
	  //END
	  //Функция обработчик изменений маркера
	  
	  //Функция обработчик отмены изменений маркера
      discardBtn.addEventListener('click', () => {
        if (isNew) {
          map.removeLayer(marker);
          diff.added = diff.added.filter(o => o.id !== marker.options.id);
        } else {
		  marker.setLatLng(marker.options.coords);
		  const ic = icons[marker.options.icon_id] || icons.default;
          marker.setIcon(ic);
		  paintSingleMarker(marker);
        }
        editPopup.remove();
        updateSaveState();
      });
	  const confirmModal = document.getElementById('confirm-modal');
	  const btnConfirmYes = document.getElementById('confirm-yes');
	  const btnConfirmNo  = document.getElementById('confirm-no');
      deleteBtn.addEventListener('click', () => {
		confirmModal.classList.remove('confirm-hidden');
		btnConfirmYes.onclick = () => {
			
		  confirmModal.classList.add('confirm-hidden');
		  
		  if (isNew) {
		    map.removeLayer(marker);
		    diff.added = diff.added.filter(o => o.id !== marker.options.id);
		  } else {
		    diff.deleted.push(marker.options.id);
		    map.removeLayer(marker);
		  }
		  updateSaveState();
		  editPopup.remove();
		};
		btnConfirmNo.onclick = () => {
		  confirmModal.classList.add('confirm-hidden');
		};
      });
    }
	/////////////////////////////////////
	/////////////////////////////////////
	
	//Сохранение изменений в json
    btnSave.addEventListener('click', () => {
	  exitSave = true;
      btnSave.classList.add('disabled')
	  btnSave.disabled = true;
	  btnExit.textContent = 'Exit and save';
	  editPopup.remove();
    });

  })();
}
//END
//Блок MET