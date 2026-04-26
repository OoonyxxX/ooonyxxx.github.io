import { MAPDATA, paintMarkers, createMarker, loadMarkersData, markerBuilder, markerMap, bindMarkerPopup } from "./markers.js"
import { METRequest } from "../api/markers_api.js"
import { map } from "../core/map.js"
import { APPSTATE, USERSESSION, USERSETTINGS } from "../core/state.js"
import { REGION_LIST, ALLOWED_MET_ROLE, ALLOWED_MET_DELETE_ROLE } from "../core/config.js"
import { attachColorPicker } from "../ui/colorPicker.js"
import { setDraggingMode } from "../ui/cursor.js"
import { MODAL } from "../ui/modal.js"
import { subscribeUI } from "../ui/UIUtilities.js"

//Переменные блока MET
//START

export const METSTATE = {
  METAllow: false,
  METInited: false,
  met: null,
}

// Переменные интерфейса
export const METUI = {};

export function METActiveController() {
  if (METSTATE.met === null) METSTATE.met = new MetEditor;
  METSTATE.METAllow = ALLOWED_MET_ROLE.includes(USERSESSION.role)
  if (!METSTATE.METAllow) {
    toggleMETControls(false);
    if (METSTATE.met && METUI.metInited) {
      METSTATE.met.destroy()
    }
    return
  }
  if (APPSTATE.isMobile) {
    toggleMETControls(false);
    return
  }
  if ((USERSETTINGS.METVisible)) {
    toggleMETControls(true);
    if (!METSTATE.METInited) METSTATE.met.init();
  } else {
    toggleMETControls(false);
  }
}

export function cacheMETUIElements() {
  METUI.metControls   = document.getElementById('met-controls');
  subscribeUI("METVisible", () => {
    METActiveController()
  })
  METUI.metInited     = false;
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
    if (METUI.metInited) {
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

    this.btnActivateInit_Handle_Click = this._btnActivateInit.bind(this);
    this.btnAddInit_Handle_Click = this._btnAddInit.bind(this);
    this.btnSaveInit_Handle_Click = this._btnSaveInit.bind(this);

    this.onMarkerClick_Handle_Click = this._onMarkerClick.bind(this);
    this.onMapClick_Handle_Click = this._onMapClick.bind(this);

  }


  //Обработчик маски регионов
	_initRegionCanvas(src) {
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
  _genId(title, lat, lng) {
    const safeTitle = title.trim().replace(/\s+/g, '_');
    const rand = String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const latPart = String(Math.round(lat * 1000)).padStart(6, '0');
    const lngPart = String(Math.round(lng * 1000)).padStart(6, '0');
    return `${safeTitle}_${rand}_${latPart}_${lngPart}`;
  }


	_shiftLatLng(latlng, offsetYInPixels) {
	  const point = this.map.latLngToLayerPoint(latlng);
	  point.y -= offsetYInPixels;
	  return this.map.layerPointToLatLng(point);
	}

  _getRegionIndex(ctx, posX, posY) {
    const x = Math.floor(posX * 32);
    const y = 8192 - Math.floor(posY * 32);

    // читаем единственный пиксель
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [R, G, B, A] = pixel;
    return R;  // reg_index
  }

  _metControlsToggler(buttonStates = {}) {
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
    this._btnExitInit();
  }

  destroy() {
    METUI.metInited = false;
    METUI.btnActivate.removeEventListener('click', this.btnActivateInit_Handle_Click);
    METUI.btnAdd.removeEventListener('click', this.btnAddInit_Handle_Click);
    METUI.btnSave.removeEventListener('click', this.btnSaveInit_Handle_Click);
    this._btnExitDeinit();
  }

  //Кнопка включения МЕТ
  _btnActivateInit() {
    if (!this.ctx) {
      (async () => {
        this.ctx = await this._initRegionCanvas('Regions.png');
      })();
    }
    this._metControlsToggler({
      btnActivate: {open: true, disabled: true},
      btnExit: {open: true, disabled: false},
      btnAdd: {open: true, disabled: false},
      btnSave: {open: true, disabled: true},
    });

    this._setAddMode();
    
    MAPDATA.existingMarkers.forEach((marker, id) => {
      marker.closePopup?.();
      marker.unbindPopup();
      marker.off('click');
      marker.on('click', this.onMarkerClick_Handle_Click);
    });
  }

  //Кнопка добавления маркера
  _btnAddInit() {
    this.editPopup.remove();
    this._setAddMode(!this.addingMarker);
  }

  //Кнопка сохранения изменений
  _btnSaveInit() {
    this.editPopup.remove();
    METRequest(this.diff);
	  this.diff.added   = [];
	  this.diff.updated = [];
	  this.diff.deleted = [];
    this._updateSaveState();
  }

  //Кнопка выключения МЕТ
  _btnExitInit() {
    MODAL.met.exitModal.setOuterTargets({open: METUI.btnExit});
    const handlerIn = () => {
      if (this.exitSave) {
        this._exitWithoutModal();
        this._unbindEditPopap();
      }
    }
    MODAL.met.exitModal.setOuterHandlers(handlerIn);
    const handlerYes = () => {
      this._globalDiscardChanges();
      this._exitWithoutModal();
    };
    MODAL.met.exitModal.setInnerHandlers(handlerYes);
    MODAL.met.exitModal.initModal();
  }
  _btnExitDeinit() {
    MODAL.met.exitModal.deinitModal()
  }
  
  _exitWithoutModal() {
    this._setAddMode();
    this._metControlsToggler({
      btnActivate: {open: true, disabled: false},
      btnExit: {open: false, disabled: true},
      btnAdd: {open: false, disabled: true},
      btnSave: {open: false, disabled: true},
    });
    this.diff.added.length = 0;
    this.diff.updated.length = 0;
    this.diff.deleted.length = 0;

    this.editPopup.remove();
  }

  _unbindEditPopap() {
    MAPDATA.existingMarkers.forEach((marker, id) => {
      marker.off('click');
      bindMarkerPopup(marker, {
        id: marker.$data.id, 
        name: marker.$data.name,
        description: marker.$data.description
      });
    });
  }

  async _globalDiscardChanges() {
    for (const marker of MAPDATA.existingMarkers.values()) {
      marker.remove();
    }

    MAPDATA.existingMarkers.clear();

    await loadMarkersData();

    this.diff.added.length = 0;
    this.diff.updated.length = 0;
    this.diff.deleted.length = 0;

    this._updateSaveState();
  }

  _onMarkerClick(e) {
    if (this.editPopupOpen) return;
    if (this.addingMarker) return;
    const marker = e.target;
    this._openEditPopup(marker, false);
  };

  _onMapClick(e) {
    if (!this.addingMarker) return;
    this.addingMarker = !this.addingMarker
    const { lat, lng } = e.latlng;
    const marker = createMarker({
      icon_id: 'default', 
      coords: { lat, lng }, 
    });
    marker.addTo(map);
    this._setAddMode()
    this._openEditPopup(marker, true);
    marker.on('click', this.onMarkerClick_Handle_Click);
  }

  _setAddMode(addingMarker) {
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

  _updateSaveState() {
    const hasChanges = !(this.diff.added.length || this.diff.updated.length || this.diff.deleted.length);
    this.exitSave = hasChanges;
    this._metControlsToggler({
      btnSave: {disabled: hasChanges},
    });
  }

  _buildPopup(marker) {
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

  _draggingEnable = (e) => {setDraggingMode(e, true)}
  _draggingDisable = (e) => {setDraggingMode(e, false)}

  _openEditPopup(editingMarker, isNew) {
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
    const content = this._buildPopup(editingMarker);
    const form = content.querySelector('#marker-form');
    
    const iconSel = form.querySelector('select[name="icon"]');
    const latIn = form.querySelector('input[name="lat"]');
    const lngIn = form.querySelector('input[name="lng"]');

	  //Создание и открытие попапа
	  const defShiftedLatLng = this._shiftLatLng(editingMarker.getLatLng(), 40);
	  this.editPopup.setLatLng(defShiftedLatLng);
	  this.editPopup.setContent(content);
	  if (!this.editPopupOpen) {
      this.editPopupOpen = true;
      this.editPopup.addTo(this.map);
	  }
	  this.editPopup.on('remove', () => {
      this.editPopupOpen = false;
      editingMarker.off('mousedown', this._draggingEnable);
      editingMarker.off('mouseup mouseleave', this._draggingDisable);
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
        this._updateSaveState();
      } else {
        editingMarker.setLatLng([editingMarker.$data.coords.lat, editingMarker.$data.coords.lng]);
        editingMarker.setIcon(MAPDATA.icons[editingMarker.$data.icon_id]);
        paintMarkers(editingMarker);
        this._updateSaveState();
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
	  

    editingMarker.on('mousedown', this._draggingEnable);
    editingMarker.on('mouseup mouseleave', this._draggingDisable);

	  // Функция перемещения маркера
    editingMarker.on('drag', e => {
      const { lat, lng } = e.target.getLatLng();
      latIn.value = lat.toFixed(6);
      lngIn.value = lng.toFixed(6);
      e.target.$data.coords = { lat: latIn.value, lng: lngIn.value };
      const dragShiftedLatLng = this._shiftLatLng(e.target.getLatLng(), 40);
      this.editPopup.setLatLng(dragShiftedLatLng)
    });
    editingMarker.on('dragend', () => { 
      editingMarker.dragging.disable();
      editingMarker.dragging.enable();
	  });
	  editingMarker.dragging.enable();
    
	  this.map.on('zoom', () => {
      if (!this.editPopupOpen) return;
      const zoomShiftedLatLng = this._shiftLatLng(editingMarker.getLatLng(), 40);
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
        const reg_index = this._getRegionIndex(this.ctx, editingMarker.$data.coords.lng, editingMarker.$data.coords.lat);
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

        const newId = this._genId(
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
      this._updateSaveState();
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
      MODAL.met.confirmModal.setOuterTargets({open: deleteBtn});
      MODAL.met.confirmModal.setOuterHandlers();
      deleteBtn.classList.toggle('hide', false);
      const handlerYes = () => {
        this.editPopup.remove();
        const originalMarker = MAPDATA.existingMarkers.get(this.oldMarkerData.id);
        this.diff.deleted.push(originalMarker.$data.id);
        originalMarker.remove();
        MAPDATA.existingMarkers.delete(originalMarker.$data.id);
        this._updateSaveState();
      }
      MODAL.met.confirmModal.setInnerHandlers(handlerYes);
      MODAL.met.confirmModal.initModal();
    } else {
      deleteBtn.classList.toggle('hide', true);
    }
  }
}