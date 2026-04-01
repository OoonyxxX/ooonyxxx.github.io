import { MAPDATA, paintMarkers, createMarker, loadMarkersData, markerBuilder, markerMap, bindMarkerPopup } from "./markers.js"
import { METRequest } from "../api/markers_api.js"
import { map } from "../core/map.js"
import { USERSESSION } from "../core/state.js"
import { REGION_LIST, ALLOWED_MET_DELETE_ROLE } from "../core/config.js"
import { attachColorPicker } from "../ui/colorPicker.js"

//Переменные блока MET
//START

// Переменные интерфейса
export const METUI = {};

export function cacheMETUIElements() {
  METUI.metControls   = document.getElementById('met-controls');
  METUI.timerProgress = document.getElementById('timerProgressCircle');
  METUI.blueTimer     = document.getElementById('TimerBlue');
  METUI.redTimer      = document.getElementById('TimerRed');
  METUI.metInited     = false;

  //Переменные модалки выхода
  METUI.exitModal      = document.getElementById('exit-modal');
  METUI.exitText       = document.getElementById('exit-modal-text');
  METUI.exitButtons    = document.getElementById('exit-modal-buttons');
  METUI.exitYes        = document.getElementById('exit-yes');
  METUI.exitNo         = document.getElementById('exit-no');
  METUI.exitLoader     = document.getElementById('exit-modal-loader');
  METUI.exitLoaderText = document.getElementById('exit-modal-loader-text');
}

function applyButtonState(button, state = {}) {
  if (!button || !state) return;
  const {
    open,
    disabled
  } = state;

  if (disabled !== undefined) {
    button.disabled = disabled;
    button.classList.toggle('disabled', disabled);
  }

  if (open !== undefined) {
    button.classList.toggle('open', open);
  }
} // btn: ['open', 'disabled']

export function toggleMETControls(isOpen) {
  if (isOpen && !METUI.METControlsState) {
    if (!METUI.metInited) {
      METUI.metControls.innerHTML = `
        <div class="met-controls-container">
          <h3 class="optheader">MET Controllers</h3>
          <div class="met-button-container">
            <button id="activate-met" class="btn-met btn-start open">Activate MET</button>
            <button id="exit-met" class="btn-met btn-exit disabled" disabled>Exit MET</button>
            <button id="add-marker" class="btn-met btn-add disabled" disabled>Add Marker</button>
            <button id="save-changes" class="btn-met btn-save disabled" disabled>Save Changes</button>
          </div>
        </div>
      `;
      METUI.btnActivate = METUI.metControls.querySelector('#activate-met');
      METUI.btnExit     = METUI.metControls.querySelector('#exit-met');
      METUI.btnAdd      = METUI.metControls.querySelector('#add-marker');
      METUI.btnSave     = METUI.metControls.querySelector('#save-changes');
    }
    METUI.metControls.classList.toggle('open', true);
    METUI.METControlsState = true;
  }
  
  if (!isOpen && METUI.METControlsState) {
    if (!METUI.metInited) {
      METUI.metControls.innerHTML = ``;
      METUI.btnActivate = null;
      METUI.btnExit = null;
      METUI.btnAdd = null;
      METUI.btnSave = null;
    }
    METUI.metControls.classList.toggle('open', false);
    METUI.METControlsState = false;
  }
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

    this.map = map

    this.exitchecker = false;
    this.popapsaved = false;
    this.addingMarker = false;
    this.editPopupOpen = false;
    this.diff = { added: [], updated: [], deleted: [] };

    
    this.ctx;
    this.tpl = document.getElementById('marker-form-template');
    this.exitSave;

    this.btnActivateInit_Handle_Click = this.btnActivateInit.bind(this);
    this.btnAddInit_Handle_Click = this.btnAddInit.bind(this);
    this.btnSaveInit_Handle_Click = this.btnSaveInit.bind(this);
    this.btnExitInit_Handle_Click = this.btnExitInit.bind(this);

    this.onMarkerClick_Handle_Click = this.onMarkerClick.bind(this);
    this.onMapClick_Handle_Click = this.onMapClick.bind(this);

  }


  //Обработчик маски регионов
	initRegionCanvas(src) {
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

  // Генератор id для новых маркеров
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

  getRegionIndex(ctx, posX, posY) {
    const x = Math.floor(posX * 32);
    const y = 8192 - Math.floor(posY * 32);

    // читаем единственный пиксель
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [R, G, B, A] = pixel;
    return R;  // reg_index
  }

  metControlsToggler(buttonStates = {}) {
    applyButtonState(METUI.btnActivate, buttonStates.btnActivate);
    applyButtonState(METUI.btnExit,     buttonStates.btnExit);
    applyButtonState(METUI.btnAdd,      buttonStates.btnAdd);
    applyButtonState(METUI.btnSave,     buttonStates.btnSave);
  } // btn: ['open', 'disabled']



  // Метод активации МЕТ
  init() {
    METUI.metInited = true;
    METUI.btnActivate.addEventListener('click', this.btnActivateInit_Handle_Click);
    METUI.btnAdd.addEventListener('click', this.btnAddInit_Handle_Click);
    METUI.btnSave.addEventListener('click', this.btnSaveInit_Handle_Click);
    METUI.btnExit.addEventListener('click', this.btnExitInit_Handle_Click);
  }

  destroy() {
    METUI.btnActivate.removeEventListener('click', this.btnActivateInit_Handle_Click);
    METUI.btnAdd.removeEventListener('click', this.btnAddInit_Handle_Click);
    METUI.btnSave.removeEventListener('click', this.btnSaveInit_Handle_Click);
    METUI.btnExit.removeEventListener('click', this.btnExitInit_Handle_Click);
  }

  //Кнопка включения МЕТ
  btnActivateInit() {
    if (!this.ctx) {
      (async () => {
        this.ctx = await this.initRegionCanvas('Regions.png');
      })();
    }
    this.metControlsToggler({
      btnActivate: {open: true, disabled: true},
      btnExit: {open: true, disabled: false},
      btnAdd: {open: true, disabled: false},
      btnSave: {open: true, disabled: true},
    });

    this.setAddMode();
    
    MAPDATA.existingMarkers.forEach((marker, id) => {
      marker.off('click');
      marker.on('click', this.onMarkerClick_Handle_Click);
    });
  }

  //Кнопка добавления маркера
  btnAddInit() {
    this.editPopup.remove();
    this.setAddMode(!this.addingMarker);
  }

  //Кнопка сохранения изменений
  btnSaveInit() {
    this.editPopup.remove();
    METRequest(this.diff);
	  this.diff.added   = [];
	  this.diff.updated = [];
	  this.diff.deleted = [];
    this.updateSaveState();
  }

  //Кнопка выключения МЕТ
  btnExitInit() {
    if (!this.exitSave && (this.exitSave !== undefined)) {
      METUI.exitText.textContent = 'Are you sure you want to exit without saving the changes? ' + 'All edits will be lost.';
      this.openExitModal();
      return
    } else {
      this.unbindEditPopap();
      this.exitWithoutModal();
      return
    }
  }

  openExitModal() {
    METUI.exitModal.classList.remove('exit-hidden');
    const exitNoHandler = () => {
      METUI.exitModal.classList.add('exit-hidden');
      this.unbindEditPopap();
    };
    METUI.exitNo.addEventListener('click', exitNoHandler, { once: true });

    const exitYesHandler = () => {
      METUI.exitModal.classList.add('exit-hidden');
      this.globalDiscardChanges();
      this.exitWithoutModal();
    };
    METUI.exitYes.addEventListener('click', exitYesHandler, { once: true });
  }

  exitWithoutModal() {
    this.setAddMode();
    this.metControlsToggler({
      btnActivate: {open: true, disabled: false},
      btnExit: {open: false, disabled: true},
      btnAdd: {open: false, disabled: true},
      btnSave: {open: false, disabled: true},
    });

    this.editPopup.remove();
  }

  unbindEditPopap() {
    MAPDATA.existingMarkers.forEach((marker, id) => {
      marker.off('click');
      bindMarkerPopup(marker, {
        id: marker.$data.id, 
        name: marker.$data.name,
        description: marker.$data.description
      });
    });
  }

  async globalDiscardChanges() {
    for (const marker of MAPDATA.existingMarkers.values()) {
      marker.remove();
    }

    MAPDATA.existingMarkers.clear();

    await loadMarkersData();

    this.diff.added.length = 0;
    this.diff.updated.length = 0;
    this.diff.deleted.length = 0;

    this.updateSaveState();
  }

  onMarkerClick(e) {
    if (this.editPopupOpen) return;
    if (this.addingMarker) return;
    const marker = e.target;
    this.openEditPopup(marker, false);
  };

  onMapClick(e) {
    if (!this.addingMarker) return;
    this.addingMarker = !this.addingMarker
    const { lat, lng } = e.latlng;
    const marker = createMarker({
      icon_id: 'default', 
      coords: { lat, lng }, 
    });
    marker.addTo(map);
    this.setAddMode()
    this.openEditPopup(marker, true);
    marker.on('click', this.onMarkerClick_Handle_Click);
  }

  setAddMode(addingMarker) {
    this.addingMarker = addingMarker ?? false;

    // всегда сначала снимаем
    this.map.off('click', this.onMapClick_Handle_Click);

    if (this.addingMarker) {
      METUI.btnAdd.classList.add('btnAddMode');
      this.map.once('click', this.onMapClick_Handle_Click);
    } else {
      METUI.btnAdd.classList.remove('btnAddMode');
    }
  }

  updateSaveState() {
    const hasChanges = !(this.diff.added.length || this.diff.updated.length || this.diff.deleted.length);
    this.exitSave = hasChanges;
    this.metControlsToggler({
      btnSave: {disabled: hasChanges},
    });
  }

  buildPopup(marker) {
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
    const colorPicker = attachColorPicker(form, marker);

    //Сборка попапа
    MAPDATA.iconsData.forEach(ic => {
      const icOpt = document.createElement('option');
      icOpt.value = ic.id;
      icOpt.textContent = ic.name;
      iconSel.append(icOpt);
    });

    titleIn.value     = marker.$data?.name ?? 'Name_PlaceHolder';
    descIn.value      = marker.$data?.description ?? 'Description_PlaceHolder';
    iconSel.value     = marker.$data?.icon_id || 'default';
    regSel.value      = marker.$data?.reg_id || 'auto';
    levelIn.checked   = marker.$data?.under_ground ?? false;
    latIn.value       = marker.$data?.coords.lat ?? latlng.lat;
    lngIn.value       = marker.$data?.coords.lng ?? latlng.lng;
    colorPicker.color.set(marker.$data?.raw_rgbcolor ?? '#fff');
    return content
  }

  openEditPopup(editingMarker, isNew) {
    this.popapsaved = false;
    this.editPopup = L.popup({
      autoClose: false,
      closeOnClick: false,
      autoPan: false,
      closeButton: false,
      className: 'edit-popup-class'
    });
    if (!isNew) {
      this.oldMarkerData = {...editingMarker.$data}
    }
    editingMarker.unbindPopup();
    editingMarker.setZIndexOffset(1000);
    const content = this.buildPopup(editingMarker);
    const form = content.querySelector('#marker-form');
    
    const iconSel = form.querySelector('select[name="icon"]');
    const latIn = form.querySelector('input[name="lat"]');
    const lngIn = form.querySelector('input[name="lng"]');

	  //Создание и открытие попапа
	  const defShiftedLatLng = this.shiftLatLng(editingMarker.getLatLng(), 40);
	  this.editPopup.setLatLng(defShiftedLatLng);
	  this.editPopup.setContent(content);
	  if (!this.editPopupOpen) {
      this.editPopupOpen = true;
      this.editPopup.addTo(this.map);
	  }
	  this.editPopup.on('remove', () => {
      this.editPopupOpen = false;
      editingMarker.off('mousedown', draggingEnable);
      editingMarker.off('mouseup mouseleave', draggingCancel);
      this.map.off('zoom');
      editingMarker.dragging.disable();
      editingMarker.setZIndexOffset(0);
      if (isNew && !this.popapsaved) {
        this.map.removeLayer(editingMarker);
      } else if (!isNew && !this.popapsaved) {
        this.diff.added = this.diff.added.filter(u => u.id !== editingMarker.$data.id);
        this.diff.updated = this.diff.updated.filter(u => u.id !== editingMarker.$data.id);
        const originalMarkerData = markerMap(this.oldMarkerData)
        const originalMarker = markerBuilder(originalMarkerData.baseData, originalMarkerData.fullData);
        MAPDATA.existingMarkers.delete(editingMarker.$data.id);
        MAPDATA.existingMarkers.delete(originalMarker.$data.id);
        editingMarker.remove();
        originalMarker.addTo(map);
        MAPDATA.existingMarkers.set(originalMarker.$data.id, originalMarker);
        paintMarkers(originalMarker);
        originalMarker.unbindPopup();
        originalMarker.on('click', this.onMarkerClick_Handle_Click);
        this.updateSaveState();
      } else {
        editingMarker.setLatLng([editingMarker.$data.coords.lat, editingMarker.$data.coords.lng]);
        editingMarker.setIcon(MAPDATA.icons[editingMarker.$data.icon_id]);
        paintMarkers(editingMarker);
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
      const ic = MAPDATA.icons[e.target.value] || MAPDATA.icons.default;
      editingMarker.setIcon(ic);
      editingMarker.$data.icon_id = e.target.value;
      paintMarkers(editingMarker);
    });
	  
	  // Функция активации перемещения иконки
	  let dragTimer;
	  let cancelOnMove;
	  
	  const draggingEnable = (e) => {
      const editingMarker = e.target
      METUI.timerProgress.classList.remove('timer-progress');
      void METUI.timerProgress.offsetWidth;
      METUI.timerProgress.classList.add('timer-progress');
      METUI.blueTimer.style.display = 'inline'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
      cancelOnMove = () => {
        clearTimeout(dragTimer);
        METUI.timerProgress.classList.remove('timer-progress');
        METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
        editingMarker.off('mousemove', cancelOnMove);
        editingMarker.dragging.disable();
        editingMarker.dragging.enable();
      };
      editingMarker.on('mousemove', cancelOnMove);
      dragTimer = setTimeout(() => {
        editingMarker.off('mousemove', cancelOnMove);
      }, 400);
	  };
	  
	  const draggingCancel = (e) => {
      const editingMarker = e.target
      clearTimeout(dragTimer);
      METUI.timerProgress.classList.remove('timer-progress');
      METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
      editingMarker.off('mousemove', cancelOnMove);
      editingMarker.dragging.enable();
	  };
	  
	  editingMarker.on('mousedown', draggingEnable);
	  editingMarker.on('mouseup mouseleave', draggingCancel);
	  
	  // Функция перемещения маркера
    editingMarker.on('drag', e => {
      const { lat, lng } = e.target.getLatLng();
      latIn.value = lat.toFixed(6);
      lngIn.value = lng.toFixed(6);
      e.target.$data.coords = { lat: latIn.value, lng: lngIn.value };
      const dragShiftedLatLng = this.shiftLatLng(e.target.getLatLng(), 40);
      this.editPopup.setLatLng(dragShiftedLatLng)
    });
    editingMarker.on('dragend', () => { 
      editingMarker.dragging.enable();
      METUI.blueTimer.style.display = 'none'; //заменить style.display на classList.toggle('Имя класса(например, .is-active, .is-hidden)', Булевое значение(True\False))
	  });
	  
	  this.map.on('zoom', () => {
      if (!this.editPopupOpen) return;
      const zoomShiftedLatLng = this.shiftLatLng(editingMarker.getLatLng(), 40);
      this.editPopup.setLatLng(zoomShiftedLatLng);
	  });
	  
	  
	  //Функция обработчик изменений маркера
	  //START
    submitBtn.addEventListener('click', ev => {
      ev.preventDefault();
      const data = new FormData(formEl);
      editingMarker.$data.name = data.get('title') || 'Name_PlaceHolder';
      editingMarker.$data.description = data.get('description') || 'Description_PlaceHolder';
      editingMarker.$data.icon_id = data.get('icon') || 'default';
      editingMarker.$data.coords = { lat: parseFloat(data.get('lat')), lng: parseFloat(data.get('lng')) }
      const region = data.get('region')
      let regionAuto_id;
      if (region === 'auto') {
        const reg_index = this.getRegionIndex(this.ctx, editingMarker.$data.coords.lng, editingMarker.$data.coords.lat);
        regionAuto_id = REGION_LIST[reg_index] ?? REGION_LIST[7];
      }
      editingMarker.$data.reg_id = regionAuto_id ?? data.get('region');
      
      editingMarker.$data.under_ground = data.get('underground') === 'on';

      const triple = data.get('color') || '255,255,255';
      const [r, g, b] = triple.split(',').map(n => Number(n));
      editingMarker.$data.raw_rgbcolor = { r: r, g: g, b: b };
      const isNow = new Date().toISOString();
      if (isNew) {
        editingMarker.$data.is_collected = false;
        editingMarker.$data.edit_info = { created_at: isNow, updated_at: isNow };

        const oldId = editingMarker.$data.id; // например "temp"

        const newId = this.genId(
          editingMarker.$data.name,
          editingMarker.$data.coords.lat,
          editingMarker.$data.coords.lng
        );

        editingMarker.$data.id = newId;

        if (oldId && oldId !== newId) {
          MAPDATA.existingMarkers.delete(oldId);
          this.diff.added = this.diff.added.filter(u => u.id !== oldId);
          this.diff.updated = this.diff.updated.filter(u => u.id !== oldId);
        }

        MAPDATA.existingMarkers.set(newId, editingMarker);
        this.diff.added.push({ id: newId, marker: editingMarker });
      } else {
        editingMarker.$data.edit_info = { created_at: editingMarker.$data.edit_info.created_at ?? isNow, updated_at: isNow };
        this.diff.added = this.diff.added.filter(u => u.id !== editingMarker.$data.id);
        this.diff.updated = this.diff.updated.filter(u => u.id !== editingMarker.$data.id);
        this.diff.updated.push({ id: editingMarker.$data.id, marker: editingMarker });
        MAPDATA.existingMarkers.set(editingMarker.$data.id, editingMarker);
      }

      editingMarker.setLatLng([editingMarker.$data.coords.lat, editingMarker.$data.coords.lng]);
      const ic = MAPDATA.icons[editingMarker.$data.icon_id] || MAPDATA.icons.default;
      editingMarker.setIcon(ic);
      this.popapsaved = true;
      this.editPopup.remove();
      this.updateSaveState();
    });
	  //END
	  //Функция обработчик изменений маркера
	  
	  //Функция обработчик отмены изменений маркера
    discardBtn.addEventListener('click', () => {
      this.popapsaved = false;
      this.editPopup.remove();
    });

    const allowed_role = ALLOWED_MET_DELETE_ROLE.includes(USERSESSION.role);
    deleteBtn.disabled = !allowed_role;
    if (!isNew) {
      const confirmModal = document.getElementById('confirm-modal');
      const btnConfirmYes = document.getElementById('confirm-yes');
      const btnConfirmNo  = document.getElementById('confirm-no');

      deleteBtn.classList.toggle('hide', false);
      deleteBtn.addEventListener('click', () => {
        confirmModal.classList.remove('confirm-hidden');

        btnConfirmYes.onclick = () => {
          confirmModal.classList.add('confirm-hidden');
          this.editPopup.remove();
          const originalMarker = MAPDATA.existingMarkers.get(this.oldMarkerData.id);
          this.diff.deleted.push(originalMarker.$data.id);
          originalMarker.remove();
          MAPDATA.existingMarkers.delete(originalMarker.$data.id);
          this.updateSaveState();
        };

        btnConfirmNo.onclick = () => {
          confirmModal.classList.add('confirm-hidden');
        };
      });
    } else {
      deleteBtn.classList.toggle('hide', true);
    }
  }
}