import { map } from "../core/map.js"
import { getAllMarkers, postCollectedMarker } from "../api/markers_api.js"
import { fastCollectedFilterReRender } from "./filters.js"
import { APPSTATE, USERSESSION, USERINFO } from "../core/state.js"
import { REGION_COLORS, REGION_UNDERGROUND_COLORS } from "../core/config.js"

export const MAPDATA = {
  icons: {},
  markersData: [],
  existingMarkers: new Map(),
  markers: [],
  iconsData: [],
  prevVisibleSet: new Set(),
  allVisibleSet: new Set(),
};

const collectibleList = ['extraWisp', 'loreSeeker', 'skillPoint', 'chest', 'skinChest', 'runeChest', 'lostMelody']

export function markerMap(m) {
  const baseData = {
      id: m.id ?? 'temp', 
      name: m.name ?? 'Name_PlaceHolder', 
      description: m.description ?? 'Description_PlaceHolder', 
      icon_id: m.icon_id ?? 'default', 
      coords: {
        lat: m.lat ?? m.coords?.lat ?? 0,
        lng: m.lng ?? m.coords?.lng ?? 0
      }, 
      is_collectible: m.is_collectible ?? collectibleList.includes(m.icon_id),
      is_collected: m.is_collected ?? false
    }
  const fullData = {
    ...baseData,
    reg_id: m.reg_id ?? 'auto',
    under_ground: m.under_ground ?? false,
    height: m.height ?? 0,
    raw_rgbcolor: {
      r: m.color_r ?? m.raw_rgbcolor?.r ?? 255,
      g: m.color_g ?? m.raw_rgbcolor?.g ?? 255,
      b: m.color_b ?? m.raw_rgbcolor?.b ?? 255
    },
    edit_info: {
      created_at: m.created_at ?? null,
      updated_at: m.updated_at ?? null
    }
  }
  return {
    baseData: baseData,
    fullData: fullData
  }
}

export function invertMarkerMap(m) {
  const baseData = {
      id: m.id, 
      name: m.name, 
      description: m.description, 
      icon_id: m.icon_id, 
      lat: m.coords?.lat,
      lng: m.coords?.lng,
      is_collectible: m.is_collectible,
    }
  const fullData = {
    ...baseData,
    reg_id: m.reg_id,
    under_ground: m.under_ground ?? false,
    height: m.height,
    color_r: m.raw_rgbcolor?.r,
    color_g: m.raw_rgbcolor?.g,
    color_b: m.raw_rgbcolor?.b,
  }
  return fullData
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function standartPopup(id, name, description, collectible) { 
  return `
    <b>${escapeHtml(name)}</b><br>
    ${escapeHtml(description)}<br>
    <label>
      <input 
        type="checkbox" 
        class="marker-collected" 
        data-id="${id}"
      >
      ${collectible ? 'Collected' : 'Visited'}
    </label>
    
  `
}

export function createMarker(marker_data) {
  const {
    coords,
    icon_id
  } = marker_data;
  const icon  = MAPDATA.icons[icon_id] || MAPDATA.icons.default;

  const marker = L.marker(coords, { icon })

  marker.$data = { coords, icon_id }

  return marker;
}

export function bindMarkerPopup(marker, p) {
  marker.unbindPopup();

  const {
    $data: {
      id,
      name,
      description = '',
      is_collectible: collectible = false,
    },
  } = marker;

  const popup = p ?? standartPopup(id, name, description, collectible);

  marker.bindPopup(popup);
  attachCollectedPopupHandler(marker);

  return marker;
}

function attachCollectedPopupHandler(marker) {
  marker.off('popupopen', handleCollectedPopupOpen);
  marker.on('popupopen', handleCollectedPopupOpen);
}

function handleCollectedPopupOpen(e) {
  const popupEl = e.popup.getElement();
  const checkbox = popupEl.querySelector('.marker-collected');
  if (!checkbox) return;

  const marker = e.target;
  const md = marker.$data;

  if (!USERSESSION.user_id) {
    checkbox.disabled = true;
    return;
  }

  checkbox.checked = md.is_collected;

  checkbox.onchange = async (ev) => {
    const id = ev.target.dataset.id;
    const checked = ev.target.checked;

    try {
      await postCollectedMarker(id);

      md.is_collected = checked;

      const delta = checked ? 1 : -1;

      md.is_collectible
        ? USERINFO.collected += delta
        : USERINFO.visited += delta;

      fastCollectedFilterReRender(marker);
    } catch (err) {
      console.error('Failed to update collected state:', err);
      md.is_collected = !checked;
      ev.target.checked = !checked;
    }
  };
}

export function setUpMarkerData(marker, data = {}, clear) {
  if (clear) {
    marker.$data = {}
  }
  if ((data && (Object.keys(data).length !== 0))) {
    marker.$data = {
      ...data
    };
    if (marker.$data.raw_rgbcolor) {
      const cssrgbColor = `rgb(${marker.$data.raw_rgbcolor.r}, ${marker.$data.raw_rgbcolor.g}, ${marker.$data.raw_rgbcolor.b})`;
      marker.$data.custom_cssrgbcolor = cssrgbColor;
      const Rh = Math.floor(marker.$data.raw_rgbcolor.r / 2);
      const Gh = Math.floor(marker.$data.raw_rgbcolor.g / 2);
      const Bh = Math.floor(marker.$data.raw_rgbcolor.b / 2);
      marker.$data.under_ground_cssrgbcolor = `rgb(${Rh}, ${Gh}, ${Bh})`;
    }
    marker._$visible = true;
  }
  return marker
}

export function markerBuilder(baseData = {}, fullData = {}) {
  const m = createMarker(baseData);
  const marker = setUpMarkerData(m, fullData, false);
  bindMarkerPopup(marker);
  return marker
}

export async function loadMarkersData() {
  MAPDATA.markersData = (await getAllMarkers()).map((m) => (markerMap(m)));
  MAPDATA.markersData.forEach(m => {
    const id = m.baseData.id
    MAPDATA.prevVisibleSet.add(id);
    MAPDATA.allVisibleSet.add(id);
    const marker = markerBuilder(m.baseData, m.fullData)
    const is_collectible = marker.$data.is_collectible
    if (marker.$data.is_collected) is_collectible ? USERINFO.collected += 1 : USERINFO.visited += 1
    is_collectible ? USERINFO.collectedAll += 1 : USERINFO.visitedAll += 1
    marker.addTo(map);
    paintMarkers(marker);
    MAPDATA.existingMarkers.set(marker.$data.id, marker);
  });
}

export async function loadMapData() {
  try{
    MAPDATA.iconsData = await fetch(`svgicons.json?_=${Date.now()}`)
      .then(r => r.json());

    await Promise.all(MAPDATA.iconsData.map(async (ic) => {
      const svgText = await fetch(ic.url).then(r => r.text());

      const html = `<div class="svg-icon" data-icon-id="${ic.id}">${svgText}</div>`;

      MAPDATA.icons[ic.id] = L.divIcon({
        html,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    }));
    MAPDATA.icons.default = MAPDATA.icons.default || Object.values(MAPDATA.icons)[0];

    await loadMarkersData();
  } catch (err) {
    console.error("JSON reading error:", err);
  }
}

function markerColorPick (marker) {
  const markerUnderground = APPSTATE.heightDisplayEnabled && marker.$data.under_ground;
  const cssHexColor = REGION_COLORS[marker.$data.reg_id] || '#fff';
  const cssHeightHexColor = REGION_UNDERGROUND_COLORS[marker.$data.reg_id] || '#7f7f7f';
  const {
    r = 255,
    g = 255,
    b = 255
  } = marker.$data.raw_rgbcolor ?? {};
  const white = [r, g, b].every(v => v === 255);
  const cWhite = '#fff';
  const cGray = '#7f7f7f';

  return (
    APPSTATE.coloredMarkersEnabled && 
    APPSTATE.coloredRegionsEnabled && 
    markerUnderground && 
    ((white && cssHeightHexColor) || marker.$data.height_color)
  ) || 
  (APPSTATE.coloredMarkersEnabled && 
    APPSTATE.coloredRegionsEnabled && 
    ((white && cssHexColor) || marker.$data.custom_csscolor)
  ) || 
  (APPSTATE.coloredMarkersEnabled && 
    markerUnderground && 
    marker.$data.height_color
  ) || 
  (APPSTATE.coloredRegionsEnabled && 
    markerUnderground && 
    cssHeightHexColor
  ) || 
  (APPSTATE.coloredMarkersEnabled && 
    marker.$data.custom_csscolor
  ) || 
  (APPSTATE.coloredRegionsEnabled && 
    cssHexColor
  ) || 
  (markerUnderground && 
    cGray
  ) || 
  cWhite;
}

//Функция перекрашивания маркеров
export function paintMarkers(marker = undefined) {
  if (marker === undefined) {
    MAPDATA.existingMarkers.forEach(m => {
      const el = m.getElement();
      el.style.color = markerColorPick(m);
    });
  } else {
    const el = marker.getElement();
    el.style.color = markerColorPick(marker);
  }
}

export function dynamicPaintMarker(marker, rgbColor) {
  const { r, g, b } = rgbColor;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;
  const el = marker.getElement();
  el.style.color = dynamicColor;
}


export function toggleMarkerVisible(id, visible) {
  const marker = MAPDATA.existingMarkers.get(id);
  if (!marker) return;

  if (marker._$visible === visible) return;
  marker._$visible = visible;

  const el = marker.getElement?.() || marker._icon;
  if (el) el.classList.toggle('is-hidden', !visible);
  if (!visible) {
    marker.closePopup?.();
    marker.closeTooltip?.();
  }
}
