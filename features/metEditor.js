import { MAPDATA, dynamicPaintSingleMarker, paintSingleMarker } from "./markers.js"
import { map } from "../core/map.js"
import { DEPLOY_STATUS, UPDATE_MARKERS, REGION_LIST } from "../core/config.js"
import { PICKER_ITEM, attachColorPicker } from "../ui/colorPicker.js"


//Переменные блока MET
//START

// Переменные интерфейса
export const METUI = {};

export function initMETUIElements() {
    METUI.metControls   = document.getElementById('met-controls');
    METUI.btnActivate   = document.getElementById('activate-met');
    METUI.btnExit       = document.getElementById('exit-met');
    METUI.btnAdd        = document.getElementById('add-marker');
    METUI.btnSave       = document.getElementById('save-changes');
    METUI.timerProgress = document.getElementById('timerProgressCircle');
    METUI.blueTimer     = document.getElementById('TimerBlue');
    METUI.redTimer      = document.getElementById('TimerRed');

    // Начальное состояние
    if (METUI.btnActivate) {
        METUI.btnActivate.disabled = true;
        METUI.btnActivate.classList.add('disabled')
    }
    if (METUI.btnExit) {
        METUI.btnExit.disabled = true;
        METUI.btnExit.classList.add('disabled')
    }
    if (METUI.btnAdd) {
        METUI.btnAdd.disabled = true;
        METUI.btnAdd.classList.add('disabled')
    }
    if (METUI.btnSave) {
        METUI.btnSave.disabled = true;
        METUI.btnSave.classList.add('disabled')
    }
}

export function toggleMET(isOpen) {
  METUI.metControls.classList.toggle('open',     isOpen);
  METUI.btnActivate.classList.toggle('open',     isOpen);
  METUI.btnActivate.classList.toggle('disabled', !isOpen);
  METUI.btnActivate.disabled = !isOpen;
}

//Блок MET
//START

export class MetEditor {
  constructor(){
    this.editPopup = L.popup({
      autoClose: false,
      closeOnClick: false,
      autoPan: false,
      closeButton: false,
      className: 'edit-popup-class'
    });

    this.icons = MAPDATA.icons
    this.originalMarkersData = MAPDATA.originalMarkersData
    this.existingMarkers = MAPDATA.existingMarkers

    this.map = map

    this.exitchecker = false;
    this.popapsaved = false;
    this.metActive = false;
    this.addingMarker = false;
    this.editPopupOpen = false;
    this.diff = { added: [], updated: [], deleted: [] };

    //UI кнопки
    this.btnActivate = METUI.btnActivate;
    this.btnExit = METUI.btnExit;
    this.btnAdd = METUI.btnAdd;
    this.btnSave = METUI.btnSave;
    
    this.ctx = 0;
    this.tpl = document.getElementById('marker-form-template');
    this.exitSave = false;

    //Пути к бекенд серверу(Из config.js)
    this.deploy_status = DEPLOY_STATUS;
    this.update_markers = UPDATE_MARKERS;

    //Переменные модалки выхода
    this.exitModal      = document.getElementById('exit-modal');
    this.exitText       = document.getElementById('exit-modal-text');
    this.exitButtons    = document.getElementById('exit-modal-buttons');
    this.exitYes        = document.getElementById('exit-yes');
    this.exitNo         = document.getElementById('exit-no');
    this.exitLoader     = document.getElementById('exit-modal-loader');
    this.exitLoaderText = document.getElementById('exit-modal-loader-text');

  }
/*
	discardChanges() {
	    this.editPopup.remove();
	  
	    this.existingMarkers.clear();
	  
	  if (this.icons["default"]) {
		this.icons.default = this.icons["default"];
	  } else {
		this.icons.default = Object.values(this.icons)[0];
	  }

	  this.originalMarkersData.forEach(m => {
		const icon = this.icons[m.icon_id] || this.icons.default;
		const marker = L.marker(m.coords, { icon });
		marker.options.id = m.id;
		marker.options.name = m.name;
		marker.options.description = m.description;
		marker.options.icon_id = m.icon_id;
		marker.options.coords = m.coords;
		marker.options.region = m.reg_id;
		marker.options.level = m.level;
		marker._$visible = true;
		
		const { R, G, B } = m.custom_color;
		const cssColor = `rgb(${R}, ${G}, ${B})`;
		marker.options.custom_rgbcolor = color;
		marker.options.custom_csscolor = cssColor;
		const Rh = Math.floor(R / 2);
		const Gh = Math.floor(G / 2);
		const Bh = Math.floor(B / 2);
		marker.options.height_color = `rgb(${Rh}, ${Gh}, ${Bh})`;
		marker.bindPopup(`<b>${m.name}</b><br>${m.description}`);
		this.existingMarkers.set(m.id, marker);
	  });

	  this.diff.added   = [];
	  this.diff.updated = [];
	  this.diff.deleted = [];
	  updateSaveState();
	}
*/

  init() {
    //Кнопка включения МЕТ
    this.btnActivate.addEventListener('click', () => {
      this.metActive = true;
      (async () => {
        this.ctx = await this.initRegionCanvas('Regions.png');
      })();

      this.btnActivate.disabled = true;
      this.btnActivate.classList.add('disabled')

      this.btnExit.disabled = false;
      this.btnExit.classList.remove('disabled')
      this.btnExit.classList.add('open');

      this.btnSave.classList.add('open');

      this.btnAdd.disabled = false;
      this.btnAdd.classList.remove('disabled')
      this.btnAdd.classList.add('open');
      this.addingMarker = false;
      this.setAddMode();
      
      this.existingMarkers.forEach(m => {
        m.off('click');
        m.on('click', this.onMarkerClick);
      });
    });

    //Кнопка выключения МЕТ
    this.btnExit.addEventListener('click', () => {
      //Exit Modal
      //START
      this.exitLoader.classList.add('exit-hidden');
      this.exitButtons.classList.remove('exit-hidden');
      
      if (!this.exitSave) {
        // --------------------------------------------------
        // Выход БЕЗ сохранения
        this.exitText.textContent = 'Are you sure you want to exit without saving the changes? ' + 'All edits will be lost.';
      } else {
        // --------------------------------------------------
        // Выход С сохранением
        const h = new Intl.DateTimeFormat('en-US', {
          hour:     'numeric',
          hour12:   false,
          timeZone: 'Europe/Kiev'
        }).format(new Date());

        const peakStart = 16, peakEnd = 22;
        const waitMin   = (h >= peakStart && h < peakEnd) ? 7 : 2;
        const minutesWord = waitMin === 1 ? 'minute' :
                            (waitMin >= 2 && waitMin <= 4) ? 'minutes' : 'minutes';
        this.exitText.innerHTML = 'Are you sure you want to save the changes and exit?<br>' +
                            `Processing time can take up to ${waitMin} ${minutesWord}.`;
      }
      
      this.exitModal.classList.remove('exit-hidden');
      const baseMessage = 'The changes you make are sent to the server, ' + 'please don`t close the tab.<br>' + 
                          'Once the server processes the changes, the page will refresh automatically and they will take effect. ' + 
                          'Please note: during peak hours processing time can be up to 7 minutes.<br>';
      
      //Слушатель отмены выхода
      this.exitNo.addEventListener('click', () => {
        this.exitModal.classList.add('exit-hidden');
      });

      this.exitYes.addEventListener('click', () => {
        if (!this.exitSave) {
          // Выход без сохранения
          this.exitModal.classList.add('exit-hidden');

          this.metActive = false;

          this.btnActivate.classList.remove('disabled')
          this.btnActivate.disabled = false;

          this.btnExit.classList.add('disabled')
          this.btnExit.disabled = true;
          this.btnExit.classList.remove('open');

          this.btnSave.classList.remove('open');

          this.btnAdd.classList.add('disabled')
          this.btnAdd.disabled = true;
          this.btnAdd.classList.remove('open');
          this.addingMarker = false;
          this.setAddMode();
          
          this.discardChanges();
        } else {
          //Сохраняем и выходим
          this.exitText.innerHTML = '';
          this.exitButtons.classList.add('exit-hidden');
          this.exitLoader.classList.remove('exit-hidden');
          
          console.log('Diff before sending:', this.diff);
          
          this.exitLoaderText.innerHTML = baseMessage + 'Deploy status: <em>checking…</em>';
          this.startDeployPolling();
          fetch(this.update_markers, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.diff)
          }).catch(err => console.error(err));
        }
      });
      //END
      //Exit Modal
    });
        
    //Переключатель кнопки btnAdd
    this.btnAdd.addEventListener('click', () => {
      if (!this.metActive) return;
      this.editPopup.remove();
      this.addingMarker = !this.addingMarker;
      this.setAddMode();
    });

    this.btnSave.addEventListener('click', () => {
      this.exitSave = true;
      this.btnSave.classList.add('disabled')
      this.btnSave.disabled = true;
      this.btnExit.textContent = 'Exit and save';
      this.editPopup.remove();
    });
  }

  updateSaveState() {
    const hasChanges = !(this.diff.added.length || this.diff.updated.length || this.diff.deleted.length);
    this.btnSave.classList.toggle('disabled', hasChanges);
    this.btnSave.disabled = !(this.diff.added.length || this.diff.updated.length || this.diff.deleted.length);
  }

  onMarkerClick = (e) => {
    if (this.editPopupOpen) return;
    if (this.addingMarker) return;
    const marker = e.target;
    this.openEditPopup(marker, false);
  };

  onMapClick(e) {
    if (!this.addingMarker) return;
    const newIcon = this.icons.default || this.icons["default"];
    const marker = L.marker(e.latlng, {icon: newIcon}).addTo(this.map);
    this.openEditPopup(marker, true);
    this.addingMarker = !this.addingMarker;
    this.existingMarkers.forEach(m => {
      m.on('click', this.onMarkerClick);
    });
    this.setAddMode();
  }

  setAddMode() {
    if (this.addingMarker) {
      this.btnAdd.classList.add('btnAddMode');
      this.map.on('click', this.onMapClick);
    } else {
      this.btnAdd.classList.remove('btnAddMode');
      this.map.off('click', this.onMapClick);
    }
  }

  //Обработчик маски регионов
	initRegionCanvas(src) {
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

  genId(title, lat, lng) {
    const safeTitle = title.trim().replace(/\s+/g, '_');
    const rand = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const latPart = String(Math.round(lat * 1000)).padStart(6, '0');
    const lngPart = String(Math.round(lng * 1000)).padStart(6, '0');
    return `${safeTitle}_${rand}_${latPart}_${lngPart}`;
  }

	shiftLatLng(latlng, offsetYInPixels) {
	  const point = this.map.latLngToLayerPoint(latlng);
	  point.y -= offsetYInPixels;
	  return this.map.layerPointToLatLng(point);
	}

  startDeployPolling() {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(this.deploy_status, {
          method: 'GET',
          credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { status } = await res.json();

        // Обновляем текст
        this.exitLoaderText.innerHTML = baseMessage + `Deploy status: <strong>${status}</strong>`;

        if (status === 'built') {
          clearInterval(intervalId);
          this.exitLoaderText.innerHTML += '<br style="color:green">Page will refresh in 5 seconds...';
          setTimeout(() => {
              const url = new URL(window.location.href);
              url.searchParams.set('_', Date.now());
              window.location.replace(url.toString());
          }, 5_000);
        }
        else if (status === 'errored') {
          clearInterval(intervalId);
          this.exitLoaderText.innerHTML += '<br style="color:red">Error during deployment. Please try again later.';
        }
      } catch (err) {
        console.error('Deploy status check failed:', err);
        this.exitLoaderText.innerHTML = baseMessage + 'Deploy status: <em>unknown (error)</em>';
      }
    }, 5_000);
  }

  getRegionIndex(ctx, posX, posY) {
    const x = Math.floor(posX * 32);
    const y = 8192 - Math.floor(posY * 32);

    // читаем единственный пиксель
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [R, G, B, A] = pixel;
    return R;  // reg_index
  }

  openEditPopup(marker, isNew) {
    console.log("Edit Popap Open");
    this.popapsaved = false;
    this.editPopup = L.popup({
      autoClose: false,
      closeOnClick: false,
      autoPan: false,
      closeButton: false,
      className: 'edit-popup-class'
    });
    if (isNew) {
      this.exitchecker = true;
    } else {
      this.exitchecker = false;
    };
    marker.unbindPopup();
    marker.setZIndexOffset(1000);
    const content = this.tpl.content.cloneNode(true);
    const form = content.querySelector('#marker-form');
    const titleIn = form.querySelector('input[name="title"]');
    const descIn = form.querySelector('textarea[name="description"]');
    const iconSel = form.querySelector('select[name="icon"]');
    const regSel = form.querySelector('select[name="region"]');
    const levelIn = form.querySelector('input[name="underground"]');
    
    const latIn = form.querySelector('input[name="lat"]');
    const lngIn = form.querySelector('input[name="lng"]');
    const latlng = marker.getLatLng();


    //Инициализация colorPicker
    const colorPicker = attachColorPicker(form, marker.custom_rgbcolor)

    //Сборка попапа
    MAPDATA.iconsData.forEach(ic => {
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
      latIn.value = latlng.lat;
      lngIn.value = latlng.lng;
      colorPicker.color.set('#fff');
      dynamicPaintSingleMarker(marker, PICKER_ITEM.colorIn.value);
    } else {
      titleIn.value = marker.options.name;
      descIn.value = marker.options.description;
      iconSel.value = marker.options.icon_id || 'default';
      regSel.value = marker.options.region || 'auto';
      levelIn.checked = marker.options.level;
      latIn.value = marker.options.coords[0];
      lngIn.value = marker.options.coords[1];
      colorPicker.color.set(marker.options.custom_csscolor || '#fff');
      dynamicPaintSingleMarker(marker, PICKER_ITEM.colorIn.value);
    }
	  //END
	  //Сборка попапа
      console.log(form);
	  //Создание и открытие попапа
	  const defShiftedLatLng = this.shiftLatLng(marker.getLatLng(), 40);
	  this.editPopup.setLatLng(defShiftedLatLng);
	  this.editPopup.setContent(content);
	  if (!this.editPopupOpen) {
      this.editPopupOpen = true;
      this.editPopup.addTo(this.map);
	  }
	  this.editPopup.on('remove', () => {
      this.editPopupOpen = false;
      marker.off('mousedown', draggingEnable);
      marker.off('mouseup mouseleave', draggingCancel);
      this.map.off('zoom');
      marker.dragging.disable();
      marker.setZIndexOffset(0);
      if (this.exitchecker && !this.popapsaved) {
        this.exitchecker = false;
        this.map.removeLayer(marker);
      };
      if (this.exitchecker && this.popapsaved) {
        this.exitchecker = false;
        marker.setLatLng(marker.options.coords);
        const ic = this.icons[marker.options.icon_id] || this.icons.default;
        marker.setIcon(ic);
        paintSingleMarker(marker);
        this.updateSaveState();
      };
      if (!this.exitchecker && this.popapsaved) {
        this.exitchecker = false;
        marker.setLatLng(marker.options.coords);
        const ic = this.icons[marker.options.icon_id] || this.icons.default;
        marker.setIcon(ic);
        paintSingleMarker(marker);
        this.updateSaveState();
      };
	  });
    const popupEl = this.editPopup.getElement();
    const formEl = popupEl.querySelector('#marker-form');
    const submitBtn = popupEl.querySelector('#submit-btn');
    const discardBtn = popupEl.querySelector('#discard-btn');
    const deleteBtn = popupEl.querySelector('#delete-btn');
    const sel = popupEl.querySelector('select[name="region"]');
	  
	  //Динамическое изменение иконки
    iconSel.addEventListener('change', e => {
      const ic = this.icons[e.target.value] || this.icons.default;
      marker.setIcon(ic);
      marker.options.icon_id = ic;
      paintSingleMarker(marker);
    });
	  
	  // Функция активации перемещения иконки
	  marker.dragging.enable();
	  let dragTimer;
	  let cancelOnMove;
	  
	  const draggingEnable = (e) => {
      const marker = e.target
      METUI.timerProgress.classList.remove('timer-progress');
      void METUI.timerProgress.offsetWidth;
      METUI.timerProgress.classList.add('timer-progress');
      METUI.blueTimer.style.display = 'inline'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
      cancelOnMove = () => {
        clearTimeout(dragTimer);
        METUI.timerProgress.classList.remove('timer-progress');
        METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
        marker.off('mousemove', cancelOnMove);
        marker.dragging.disable();
        marker.dragging.enable();
      };
      marker.on('mousemove', cancelOnMove);
      dragTimer = setTimeout(() => {
        marker.off('mousemove', cancelOnMove);
      }, 400);
	  };
	  
	  const draggingCancel = (e) => {
      const marker = e.target
      clearTimeout(dragTimer);
      METUI.timerProgress.classList.remove('timer-progress');
      METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
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
      if (this.editPopupOpen) {
        const dragShiftedLatLng = this.shiftLatLng(e.target.getLatLng(), 40);
        this.editPopup.setLatLng(dragShiftedLatLng)//.update();
        //editPopup.setContent(content).update();
      }
    });
    marker.on('dragend', () => { 
      marker.dragging.enable();
      METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
	  });
	  
	  this.map.on('zoom', () => {
      if (!this.editPopupOpen) return;
      const zoomShiftedLatLng = this.shiftLatLng(marker.getLatLng(), 40);
      this.editPopup.setLatLng(zoomShiftedLatLng);
	  });
	  
	  
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
      
      if (autoRegCheck) {
        try {
          reg_index = this.getRegionIndex(ctx, lng, lat);
          marker.options.reg_index = reg_index;
          console.log('reg_index:', reg_index);
        } catch (err) {
          console.error('Loading Regions.png:', err);
        }
      }
		
      const regionAuto_id = autoRegCheck && REGION_LIST.reg_list[reg_index];
      const reg_id = regionAuto_id || data.get('region');
      console.log('region:', reg_id);
      const height = (data.get('underground') && heightDown) || heightUp;
      
      const triple = data.get('color');
      const [r, g, b] = triple.split(',').map(n => Number(n));
      const color = { R: r, G: g, B: b };

      if (isNew) {
        const newId = this.genId(name, lat, lng);
        marker.options.id = newId;
        this.existingMarkers.set(newId, marker);
        marker.on('click', this.onMarkerClick);
        this.diff.added.push({ id: newId, name, description, icon_id, coords: [lat, lng], reg_id, height, color });
      } else {
        this.diff.updated = this.diff.updated.filter(u => u.id !== marker.options.id);
        this.diff.updated.push({ id: marker.options.id, name, description, icon_id, coords: [lat, lng], reg_id, height, color });
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
      const ic = this.icons[icon_id] || this.icons.default;
      marker.setIcon(ic);
      this.popapsaved = true;
      this.editPopup.remove();
      this.updateSaveState();
    });
	  //END
	  //Функция обработчик изменений маркера
	  
	  //Функция обработчик отмены изменений маркера
    discardBtn.addEventListener('click', () => {
      this.editPopup.remove();
      if (isNew) {
        this.map.removeLayer(marker);
        this.diff.added = this.diff.added.filter(o => o.id !== marker.options.id);
      } else {
        marker.setLatLng(marker.options.coords);
        const ic = this.icons[marker.options.icon_id] || this.icons.default;
        marker.setIcon(ic);
        paintSingleMarker(marker);
      }
      this.updateSaveState();
    });
	  const confirmModal = document.getElementById('confirm-modal');
	  const btnConfirmYes = document.getElementById('confirm-yes');
	  const btnConfirmNo  = document.getElementById('confirm-no');

    deleteBtn.addEventListener('click', () => {
      confirmModal.classList.remove('confirm-hidden');

      btnConfirmYes.onclick = () => {
        confirmModal.classList.add('confirm-hidden');

		    this.editPopup.remove();

        if (isNew) {
          this.map.removeLayer(marker);
          this.diff.added = this.diff.added.filter(o => o.id !== marker.options.id);
        } else {
          this.diff.deleted.push(marker.options.id);
          this.map.removeLayer(marker);
        }
        this.updateSaveState();
      };

      btnConfirmNo.onclick = () => {
        confirmModal.classList.add('confirm-hidden');
      };
    });
  }
}