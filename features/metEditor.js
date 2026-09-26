import { MAPDATA, paintMarkers, createMarker, loadMarkersData, markerBuilder, bindMarkerPopup } from "./markers.js"
import { METRequest } from "../api/markers_api.js"
import { map } from "../core/map.js"
import { APPSTATE, USERSESSION, USERSETTINGS } from "../core/state.js"
import { REGION_LIST, ALLOWED_MET_ROLE, ALLOWED_MET_DELETE_ROLE } from "../core/config.js"
import { attachColorPicker } from "../ui/colorPicker.js"
import { setDraggingMode } from "../ui/cursor.js"
import { MODAL } from "../ui/modal.js"
import { subscribeUI } from "../ui/UIUtilities.js"
import { markerMap, getWealthPreset, RUNE_NAMES, COSMETIC_NAMES, MELODY_NAMES, COLLECTIBLELIST } from "./marker_data.js"

//Переменные блока MET
//START

export const METSTATE = {
  met: null,
  METAllow: false,
  METInited: false,
  METGenerated: false,
}

const CONTENT_TAG_OPTIONS = {
  runes: [],
  cosmetics: []
}

// Переменные интерфейса
export const METUI = {};

export function METActiveController() {
  if (METSTATE.met === null) METSTATE.met = new MetEditor;
  METSTATE.METAllow = ALLOWED_MET_ROLE.includes(USERSESSION.role)
  if (!METSTATE.METAllow) {
    toggleMETControls(false);
    if (METSTATE.METInited) METSTATE.met.destroy()
    if (METSTATE.METGenerated) removeMETUIControls()
    return
  }
  if (APPSTATE.isMobile) {
    toggleMETControls(false);
    return
  }
  if (USERSETTINGS.METVisible) {
    toggleMETControls(true);
    if (!METSTATE.METGenerated) generateMETUIControls();
    if (!METSTATE.METInited) METSTATE.met.init();
  } else {
    toggleMETControls(false);
  }
}

export function cacheMETUIElements() {
  CONTENT_TAG_OPTIONS.runes = Object.entries(RUNE_NAMES).map(
    ([id, name]) => ({id, name})
  )
  CONTENT_TAG_OPTIONS.cosmetics = Object.entries(COSMETIC_NAMES).map(
    ([id, name]) => ({id, name})
  )
  CONTENT_TAG_OPTIONS.melody = Object.entries(MELODY_NAMES).map(
    ([id, name]) => ({id, name})
  )
  METUI.metControls   = document.getElementById('met-controls');
  subscribeUI("METVisible", () => {
    METActiveController()
  })
  METSTATE.METInited     = false;
}

function generateMETUIControls() {
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
  METSTATE.METGenerated = true;
}

function removeMETUIControls() {
  METUI.metControls.innerHTML = ``;
  METUI.btnActivate = null;
  METUI.btnExit = null;
  METUI.btnAdd = null;
  METUI.btnSave = null;
  METSTATE.METGenerated = false;
}

function toggleMETControls(isOpen) {
  METUI.metControls.classList.toggle('open', isOpen);
  METUI.METControlsState = isOpen;
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
    METUI.METInited = true;
    METUI.btnActivate.addEventListener('click', this.btnActivateInit_Handle_Click);
    METUI.btnAdd.addEventListener('click', this.btnAddInit_Handle_Click);
    METUI.btnSave.addEventListener('click', this.btnSaveInit_Handle_Click);
    this._btnExitInit();
  }

  destroy() {
    METUI.METInited = false;
    METUI.btnActivate.removeEventListener('click', this.btnActivateInit_Handle_Click);
    METUI.btnAdd.removeEventListener('click', this.btnAddInit_Handle_Click);
    METUI.btnSave.removeEventListener('click', this.btnSaveInit_Handle_Click);
    this._btnExitDeinit();
  }

  //Кнопка включения МЕТ
  _btnActivateInit() {
    if (!this.ctx) {
      (async () => {
        this.ctx = await this._initRegionCanvas('/assets/other/Regions.png');
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
      bindMarkerPopup(marker);
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
 // IN DEV
  _makePopupForm(marker) {
    const markerForm = new MarkerForm();
    markerForm.fillTemplate(marker);
    return markerForm
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

    // Экземпляр формы
    const markerForm = this._makePopupForm(editingMarker);

	  //Создание и открытие попапа
	  const defShiftedLatLng = this._shiftLatLng(editingMarker.getLatLng(), 40);
	  this.editPopup.setLatLng(defShiftedLatLng);
	  this.editPopup.setContent(markerForm.template);
	  if (!this.editPopupOpen) {
      this.editPopupOpen = true;
      this.editPopup.addTo(this.map);
	  }
	  this.editPopup.on('remove', () => {
      this.editPopupOpen = false;
      editingMarker.off('mousedown', this._draggingEnable);
      editingMarker.off('mouseup mouseleave', this._draggingDisable);
      this.map.off('zoom', this.onMapZoom_Handle_Zoom);
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
	  
	  //Динамическое изменение иконки
    markerForm.icon.addEventListener('change', e => {
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
      markerForm.X.value = lng.toFixed(6);
      markerForm.Y.value = lat.toFixed(6);
      e.target.$data.coords = { lat: markerForm.Y.value, lng: markerForm.X.value };
      const dragShiftedLatLng = this._shiftLatLng(e.target.getLatLng(), 40);
      this.editPopup.setLatLng(dragShiftedLatLng)
    });
    editingMarker.on('dragend', () => { 
      editingMarker.dragging.disable();
      editingMarker.dragging.enable();
	  });
	  editingMarker.dragging.enable();
    
    this.onMapZoom_Handle_Zoom = () => {
      if (!this.editPopupOpen) return

      const shifted = this._shiftLatLng(
        editingMarker.getLatLng(),
        40
      )

      this.editPopup.setLatLng(shifted)
    }

	  this.map.on('zoom', this.onMapZoom_Handle_Zoom);
	  
	  
	  //Функция обработчик изменений маркера
	  //START
    markerForm.submit.addEventListener('click', ev => {
      ev.preventDefault();
      const {
        title, 
        description, 
        uaid, 
        icon_id,
        rgbColor, 
        reg_id,
        underground,
        coords,
        wealthId,
        runes,
        runesDropAll,
        cosmetics,
        cosmeticsDropAll,
        cosmeticsDropProbability,
        melody
      } = markerForm.retrieveFormData();
      let regionAuto_id;
      if (reg_id === 'auto') {
        const reg_index = this._getRegionIndex(this.ctx, coords.lng, coords.lat);
        regionAuto_id = REGION_LIST[reg_index] ?? REGION_LIST[7];
      }
      const isNow = new Date().toISOString();

      editingMarker.$data.name = title || 'Name_PlaceHolder';
      editingMarker.$data.description = description || 'Description_PlaceHolder';
      editingMarker.$data.uaid = uaid || 'Description_PlaceHolder';
      editingMarker.$data.icon_id = icon_id || 'default';
      editingMarker.$data.raw_rgbcolor = { ...rgbColor };
      editingMarker.$data.reg_id = regionAuto_id ?? reg_id;
      editingMarker.$data.under_ground = underground;
      editingMarker.$data.coords = { lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) }

      editingMarker.$data.is_collectible = COLLECTIBLELIST.includes(editingMarker.$data.icon_id);

      editingMarker.$data.content = {...editingMarker.$data.content};
      editingMarker.$data.content.wealthId = wealthId || null;
      editingMarker.$data.content.runes = runes || [];
      editingMarker.$data.content.runesDropAll = runesDropAll || false;
      editingMarker.$data.content.cosmetics = cosmetics || [];
      editingMarker.$data.content.cosmeticsDropAll = cosmeticsDropAll || false;
      editingMarker.$data.content.cosmeticsDropProbability = cosmeticsDropProbability ?? null;
      editingMarker.$data.content.melody = melody || "null";
      
      if (isNew) {
        const oldId = editingMarker.$data.id;
        const newId = this._genId(
          title,
          coords.lat,
          coords.lng
        );

        editingMarker.$data.id = newId;
        editingMarker.$data.is_collected = false;
        editingMarker.$data.edit_info = { created_at: isNow, updated_at: isNow };
        

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

      editingMarker.setLatLng([coords.lat, coords.lng]);
      const ic = MAPDATA.icons[icon_id] || MAPDATA.icons.default;
      editingMarker.setIcon(ic);
      this.popapsaved = true;
      this.editPopup.remove();
      this._updateSaveState();
    });
	  //END
	  //Функция обработчик изменений маркера
	  
	  //Функция обработчик отмены изменений маркера
    markerForm.discard.addEventListener('click', () => {
      this.popapsaved = false;
      this.editPopup.remove();
    });

    const allowed_role = ALLOWED_MET_DELETE_ROLE.includes(USERSESSION.role);
    markerForm.delete.disabled = !allowed_role;
    if (!isNew) {
      MODAL.met.confirmModal.setOuterTargets({open: markerForm.delete});
      MODAL.met.confirmModal.setOuterHandlers();
      markerForm.delete.classList.toggle('hide', false);
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
      markerForm.delete.classList.toggle('hide', true);
    }
  }
}

class MarkerForm {
  constructor(){
    this.templateRoot = document.getElementById('marker-form-template');
    this.template = this.templateRoot.content.cloneNode(true);
    this.form = this.template.querySelector('#marker-form');
    this.title = this.form.querySelector('[name="title"]');
    this.description = this.form.querySelector('[name="description"]');
    this.uaid = this.form.querySelector('[name="uaid"]');
    this.icon = this.form.querySelector('[name="icon"]');
    this.colorPicker = null;
    this.region = this.form.querySelector('[name="region"]');
    this.underground = this.form.querySelector('[name="underground"]');
    this.X = this.form.querySelector('[name="lng"]');
    this.Y = this.form.querySelector('[name="lat"]');
    this.content = this.form.querySelector('.content-fields');
    this.wealthId = this.content.querySelector('[name="content.wealth.presetId"]');
    this.wealthPreview = this.content.querySelectorAll('[data-wealth]');
    this.runesDropAll = this.content.querySelector('[name="content.runes.dropAll"]');

    this.cosmeticsDropAll = this.content.querySelector('[name="content.cosmetics.dropAll"]');
    this.cosmeticsDropProbability = this.content.querySelector('[name="content.cosmetics.dropProbability"]');

    this.melodySpecific = this.content.querySelector('[data-melody-specific]');

    this.callbacks = {
      runes: {
        setItems: () => {checkboxActivitiUpdate(this.runesDropAll, this.tagInputs.runes)},
        addItem: () => {checkboxActivitiUpdate(this.runesDropAll, this.tagInputs.runes)},
        removeItem: () => {checkboxActivitiUpdate(this.runesDropAll, this.tagInputs.runes)},
      },
      cosmetics: {
        setItems: () => {checkboxActivitiUpdate(this.cosmeticsDropAll, this.tagInputs.cosmetics)},
        addItem: () => {checkboxActivitiUpdate(this.cosmeticsDropAll, this.tagInputs.cosmetics)},
        removeItem: () => {checkboxActivitiUpdate(this.cosmeticsDropAll, this.tagInputs.cosmetics)},
      }
    }
    this.tagInputContainers = this.content.querySelectorAll(".tag-input")
    this.tagInputs = {}

    this.submit = this.form.querySelector('[data-action="save"]');
    this.discard = this.form.querySelector('[data-action="discard"]');
    this.delete = this.form.querySelector('[data-action="delete"]');

    this._init()
  }
  _init() {
    this.wealthId.addEventListener("change", () => {
      this._updateWealthPreview(this.wealthId.value || null)
    })

    for (const element of this.tagInputContainers) {
      const type = element.dataset.tagType

      this.tagInputs[type] = new TagInput(
        element,
        CONTENT_TAG_OPTIONS[type],
        this.callbacks[type]
      )
    }
    const {autocomplete, setMode, getMode} = initMelodyInput(this.content, CONTENT_TAG_OPTIONS.melody)
    this.melodyInput = autocomplete
    this.setMelodyMode = setMode
    this.getMelodyMode = getMode
  }

  fillTemplate(marker){
    this.title.value = marker.$data.name ?? "Name_PlaceHolder";
    this.description.value = marker.$data.description ?? "Description_PlaceHolder";
    this.uaid.value = marker.$data.uaid ?? "";
    MAPDATA.iconsData.forEach(ic => {
      const icOpt = document.createElement('option');
      icOpt.value = ic.id;
      icOpt.textContent = ic.name;
      this.icon.append(icOpt);
    });
    this.icon.value = marker.$data.icon_id || 'default';
    this.colorPicker = attachColorPicker(this.form, marker);
    this.colorPicker.color.set(marker.$data?.raw_rgbcolor ?? '#fff');
    
    this.region.value = marker.$data.reg_id || 'auto';
    this.underground.checked = marker.$data.under_ground || false;
    this.X.value = marker.$data.coords?.lng || 0;
    this.Y.value = marker.$data.coords?.lat || 0;

    const wealthId = marker.$data.content?.wealthId
    this.wealthId.value = wealthId ?? "";

    this._updateWealthPreview(wealthId)

    this.tagInputs.runes.setItems(marker.$data.content?.runes || null)
    this.runesDropAll.checked = marker.$data.content?.runesDropAll || false
    checkboxActivitiUpdate(this.runesDropAll, this.tagInputs.runes)

    this.tagInputs.cosmetics.setItems(marker.$data.content?.cosmetics || null)
    this.cosmeticsDropAll.checked = marker.$data.content?.cosmeticsDropAll || false
    checkboxActivitiUpdate(this.cosmeticsDropAll, this.tagInputs.cosmetics)

    const dropProbability = marker.$data.content?.cosmeticsDropProbability
    this.cosmeticsDropProbability.value = dropProbability != null ? dropProbability * 100 : ""

    this.setMelodyMode(marker.$data.content?.melody || "none")
    if ((marker.$data.content?.melody !== "none") && (marker.$data.content?.melody !== "any")) this.melodyInput.setValue(marker.$data.content?.melody || "")
  }
  retrieveFormData(){
    const title = this.title.value;
    const description = this.description.value;
    const uaid = this.uaid.value;
    const icon_id = this.icon.value;
    const rgbColor = this.colorPicker.color.rgb;
    const reg_id = this.region.value;
    const underground = this.underground.checked;
    const coords = {lng: this.X.value, lat: this.Y.value};
    const wealthId = this.wealthId.value;
    const runes = this.tagInputs.runes.getItems();
    const runesDropAll = this.runesDropAll.checked;
    const cosmetics = this.tagInputs.cosmetics.getItems();
    const cosmeticsDropAll = this.cosmeticsDropAll.checked;
    const cosmeticsDropProbability = this.cosmeticsDropProbability.value / 100;

    const mode = this.getMelodyMode()
    const melody = (mode == "specific") ? (this.melodyInput.getValue() || "none") : mode
    return {
      title, 
      description, 
      uaid, 
      icon_id,
      rgbColor, 
      reg_id,
      underground,
      coords,
      wealthId,
      runes,
      runesDropAll,
      cosmetics,
      cosmeticsDropAll,
      cosmeticsDropProbability,
      melody
    }
  }

  _updateWealthPreview(wealthId) {
    const {preset} = getWealthPreset(wealthId)

    for (const preview of this.wealthPreview) {
      const key = preview.dataset.wealth
      preview.value = preset[key] ?? 0
    }
  }
}


function checkboxActivitiUpdate(checkbox, input) {
  checkbox.disabled = (input.getItems().length <= 1)
}

class TagInput {
  /*
  callbacks = {
    setItems: f,
    addItem: f,
    removeItem: f,
    getItems: f,
    createTagElement: f,
    updateSuggestions: f,
    renderSuggestions: f
  }
  */

  constructor(element, options, callbacks) {
    this.callbacks = callbacks

    this.element = element
    this.input = element.querySelector(".tag-input__input")
    this.list = element.querySelector("[data-tag-list]")
    this.suggestions = element.querySelector(".tag-input__suggestions")

    this.options = options
    this.items = []           // порядок выбранных id
    this.itemIds = new Set()  // быстрый has(id)
    this.tagsById = new Map() // id -> DOM element
    this.optionsById = new Map(
      options.map(option => [option.id, option])
    )

    this.init()
  }

  init() {
    this.input.addEventListener("input", () => {
      this.updateSuggestions()
    })
    this.input.addEventListener("focus", () => {
      this.updateSuggestions()
    })
    this.input.addEventListener("focusout", () => {
      this.renderSuggestions([])
    })

    this.suggestions.addEventListener("mousedown", event => {
      const suggestion = event.target.closest(".tag-input__suggestion")

      if (!suggestion) {
        return
      }

      event.preventDefault()

      this.addItem(suggestion.dataset.id)

      this.input.value = ""
      this.renderSuggestions([])
      this.input.focus()
    })
  }

  useCallback(callbackName) {
    this.callbacks[callbackName]?.()
  }

  setItems(items = []) {
    const uniqueItems = [...new Set(items ?? [])]

    this.items = uniqueItems
    this.itemIds = new Set(uniqueItems)
    this.tagsById.clear()

    this.list.replaceChildren()

    const fragment = document.createDocumentFragment()

    for (const id of uniqueItems) {
      const tag = this.createTagElement(id)

      this.tagsById.set(id, tag)
      fragment.append(tag)
    }

    this.list.append(fragment)

    this.useCallback('setItems')
  }

  addItem(id) {
    if (this.itemIds.has(id)) {
      return
    }
    this.items.push(id)
    this.itemIds.add(id)
    const tag = this.createTagElement(id)
    this.tagsById.set(id, tag)
    this.list.append(tag)

    this.useCallback('addItem')
  }

  removeItem(id) {
    if (!this.itemIds.has(id)) {
      return
    }

    const index = this.items.indexOf(id)

    if (index !== -1) {
      this.items.splice(index, 1)
    }

    this.itemIds.delete(id)

    const tag = this.tagsById.get(id)

    if (tag) {
      tag.remove()
      this.tagsById.delete(id)
    }
    this.useCallback('removeItem')
  }

  getItems() {
    this.useCallback('getItems')
    return [...this.items]
  }

  createTagElement(id) {
    const option = this.optionsById.get(id)

    const tag = document.createElement("div")
    tag.className = "tag"
    tag.dataset.tagId = id

    const label = document.createElement("span")
    label.className = "tag__label"
    label.textContent = option?.name ?? id

    const remove = document.createElement("button")
    remove.type = "button"
    remove.className = "tag__remove"
    remove.textContent = "x"
    remove.ariaLabel = `Remove ${option?.name ?? id}`
    remove.addEventListener("click", () => {this.removeItem(id)})

    tag.append(label, remove)
    this.useCallback('createTagElement')

    return tag
  }

  updateSuggestions() {
    const query = this.input.value.trim().toLowerCase()

    const results = this.options
      .filter(option => !this.itemIds.has(option.id))
      .filter(option => {
        if (!query) {
          return true
        }

        return (
          option.name.toLowerCase().includes(query) ||
          option.id.toLowerCase().includes(query)
        )
      })
      .slice(0, 10)

    this.renderSuggestions(results)
    this.useCallback('updateSuggestions')
  }

  renderSuggestions(options) {
    this.suggestions.replaceChildren()

    if (options.length === 0) {
      this.suggestions.hidden = true
    } else {
      const fragment = document.createDocumentFragment()

      for (const option of options) {
        const item = document.createElement("button")

        item.type = "button"
        item.className = "tag-input__suggestion"
        item.dataset.id = option.id
        item.setAttribute("role", "option")

        const name = document.createElement("span")
        name.className = "tag-input__suggestion-name"
        name.textContent = option.name

        const id = document.createElement("span")
        id.className = "tag-input__suggestion-id"
        id.textContent = option.id

        item.append(name, id)
        fragment.append(item)
      }

      this.suggestions.append(fragment)
      this.suggestions.hidden = false
    }

    this.useCallback('renderSuggestions')
  }
}

class AutocompleteInput {
  constructor(element, options) {
    this.element = element
    this.input = element.querySelector(".autocomplete__input")
    this.suggestions = element.querySelector(".autocomplete__suggestions")

    this.options = options
    this.optionsById = new Map(
      options.map(option => [option.id, option])
    )

    this.value = null

    this.init()
  }

  init() {
    this.input.addEventListener("input", () => {
      this.clearSelection()
      this.updateSuggestions()
    })
    this.input.addEventListener("focus", () => {
      this.updateSuggestions()
    })
    this.input.addEventListener("focusout", () => {
      if (this.value) {
        this.renderSuggestions([])
        return
      }
      const query = this.input.value.trim().toLowerCase()
      
      if (!query) {
        this.value = null
        this.input.value = ""
        this.renderSuggestions([])
        return
      }
      const results = this.options.filter(option => {
        return (
          option.name.toLowerCase().includes(query) ||
          option.id.toLowerCase().includes(query)
        )
      })

      const perfectMatch = results.find(option =>
        option.name.toLowerCase() === query ||
        option.id.toLowerCase() === query
      )
      const option = perfectMatch ?? (results.length === 1 ? results[0] : null)

      this.value = option?.id ?? null
      this.input.value = option?.name ?? ""

      this.renderSuggestions([])
    })

    this.suggestions.addEventListener("mousedown", event => {
      const suggestion = event.target.closest(".autocomplete__suggestion")

      if (!suggestion) {
        return
      }

      event.preventDefault()

      this.setValue(suggestion.dataset.id)
      this.input.focus()
    })
  }

  setValue(id) {
    const option = this.optionsById.get(id)

    if (!option) {
      return
    }

    this.value = id
    this.input.value = option.name
    this.renderSuggestions([])
  }

  clearSelection(){
    this.value = null
  }

  getValue(){
    return this.value
  }

  updateSuggestions() {
    const query = this.input.value.trim().toLowerCase()

    const results = this.options
      .filter(option => option.id !== this.value)
      .filter(option => {
        if (!query) {
          return true
        }

        return (
          option.name.toLowerCase().includes(query) ||
          option.id.toLowerCase().includes(query)
        )
      })
      .slice(0, 10)

    this.renderSuggestions(results)
  }

  renderSuggestions(options) {
    this.suggestions.replaceChildren()

    if (options.length === 0) {
      this.suggestions.hidden = true
      return
    }

    const fragment = document.createDocumentFragment()

    for (const option of options) {
      const item = document.createElement("button")

      item.type = "button"
      item.className = "autocomplete__suggestion"
      item.dataset.id = option.id
      item.setAttribute("role", "option")

      const name = document.createElement("span")
      name.className = "autocomplete__suggestion-name"
      name.textContent = option.name

      const id = document.createElement("span")
      id.className = "autocomplete__suggestion-id"
      id.textContent = option.id

      item.append(name, id)
      fragment.append(item)
    }

    this.suggestions.append(fragment)
    this.suggestions.hidden = false
  }
}

function initMelodyInput(root, melodyOptions) {
  const modeInputs = root.querySelectorAll(
    '[name="content.melody.mode"]'
  )

  const specificElement = root.querySelector(
    "[data-melody-specific]"
  )

  const autocomplete = new AutocompleteInput(
    specificElement,
    melodyOptions
  )

  function updateMode() {
    const mode = root.querySelector(
      '[name="content.melody.mode"]:checked'
    ).value

    specificElement.hidden = mode !== "specific"
  }

  function setMode(mode) {
    const modeInputs = root.querySelectorAll('[name="content.melody.mode"]')
    if ((mode == "none") || (mode == "any")) {
      for (const mod of modeInputs){
        mod.checked = mod.value == mode
      }
    } else {
      for (const mod of modeInputs){
        mod.checked = mod.value == "specific"
      }
    }
    updateMode()
  }

  function getMode() {
    return root.querySelector(
      '[name="content.melody.mode"]:checked'
    ).value
  }

  for (const input of modeInputs) {
    input.addEventListener("change", updateMode)
  }

  updateMode()

  return {autocomplete, setMode, getMode}
}