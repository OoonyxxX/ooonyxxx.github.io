import { map } from "../core/map.js"
import { getAllMarkers, postCollectedMarker } from "../api/markers_api.js"
import { fastCollectedFilterReRender } from "./filters.js"
import { APPSTATE, USERSESSION, USERINFO } from "../core/state.js"
import { REGION_COLORS, REGION_UNDERGROUND_COLORS, ALLOWED_AGENT_CONTENT_CONFIG } from "../core/config.js"
import { standartPopup, popupWithContent, markerMap } from "./marker_data.js"
import { popupViewportOptions } from "../ui/popupLayout.js"
import { CanvasMarker, CanvasMarkerLayer } from './canvasMarkers.js'

export const markerLayer = new CanvasMarkerLayer();
let replacingMarkers = false;


export const MAPDATA = {
  icons: {},
  markersData: [],
  existingMarkers: new Map(),
  markers: [],
  iconsData: [],
  prevVisibleSet: new Set(),
  allVisibleSet: new Set(),
};

export function createMarker(marker_data) {
  const {
    coords,
    icon_id
  } = marker_data;
  const icon  = MAPDATA.icons[icon_id] || MAPDATA.icons.default;

  const marker = new CanvasMarker(coords, { icon, renderer: markerLayer })

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
      content,
    },
  } = marker;

  
  const popup = p ?? (content ? popupWithContent(id, name, description, content, collectible) : standartPopup(id, name, description, collectible));

  marker.bindPopup(popup, { ...popupViewportOptions(), className: 'marker-popup' });
  attachInitPopupHandler(marker);

  return marker;
}

function attachInitPopupHandler(marker) {
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
    checkbox.disabled = true;

    try {
      await postCollectedMarker(id);

      md.is_collected = checked;
      const currentMarker = MAPDATA.existingMarkers.get(id);
      if (currentMarker) currentMarker.$data.is_collected = checked;

      updateMarkerStats();

      fastCollectedFilterReRender(currentMarker);
    } catch (err) {
      console.error('Failed to update collected state:', err);
      md.is_collected = !checked;
      ev.target.checked = !checked;
    } finally { checkbox.disabled = !USERSESSION.user_id; }
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
  refreshMarkerMetadata(marker);
  return marker
}

export function refreshMarkerMetadata(marker) {
  marker._previewIds = previewIdsMapping(marker);
  markerLayer.invalidate();
}

export function updateMarkerStats() {
  let collected = 0, visited = 0, collectedAll = 0, visitedAll = 0;
  for (const marker of MAPDATA.existingMarkers.values()) {
    if (marker.$data.is_collectible) { collectedAll++; if (marker.$data.is_collected) collected++; }
    else { visitedAll++; if (marker.$data.is_collected) visited++; }
  }
  Object.assign(USERINFO, { collected, visited, collectedAll, visitedAll });
}

export function registerMarker(marker, updateStats = true) {
  if (marker._registryId && marker._registryId !== marker.$data.id) unregisterMarker(marker, false);
  const id = marker.$data.id;
  marker._registryId = id;
  MAPDATA.existingMarkers.set(id, marker);
  MAPDATA.allVisibleSet.add(id);
  if (marker._$visible) MAPDATA.prevVisibleSet.add(id);
  else MAPDATA.prevVisibleSet.delete(id);
  marker.off('remove', onRegisteredMarkerRemoved).on('remove', onRegisteredMarkerRemoved);
  refreshMarkerMetadata(marker);
  if (updateStats) updateMarkerStats();
  return marker;
}

function onRegisteredMarkerRemoved(e) { unregisterMarker(e.target, !replacingMarkers); }

export function unregisterMarker(marker, updateStats = true) {
  const id = marker._registryId;
  if (MAPDATA.existingMarkers.get(id) === marker) {
    MAPDATA.existingMarkers.delete(id);
    MAPDATA.allVisibleSet.delete(id);
    MAPDATA.prevVisibleSet.delete(id);
  }
  marker._registryId = null;
  marker.off('remove', onRegisteredMarkerRemoved);
  if (updateStats) updateMarkerStats();
}

export async function loadMarkersData() {
  const data = (await getAllMarkers()).map((m) => (markerMap(m)));
  replacingMarkers = true;
  try { for (const marker of [...markerLayer.markers]) marker.remove(); }
  finally { replacingMarkers = false; }
  MAPDATA.existingMarkers.clear();
  MAPDATA.prevVisibleSet.clear();
  MAPDATA.allVisibleSet.clear();
  MAPDATA.markersData = data;
  MAPDATA.markersData.forEach(m => {
    const marker = markerBuilder(m.baseData, m.fullData)
    marker.addTo(map);
    paintMarkers(marker);
    registerMarker(marker, false);
  });
  updateMarkerStats();
}

export async function loadMapData() {
  try{
    MAPDATA.iconsData = await fetch(`svgicons.json?_=${Date.now()}`)
      .then(r => r.json());

    MAPDATA.icons = await markerLayer.icons.load(MAPDATA.iconsData);

    await loadMarkersData();
  } catch (err) {
    console.error("JSON reading error:", err);
  }
}

export function markerColorPick (marker) {
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
      m.setColor(markerColorPick(m));
    });
  } else {
    marker.setColor(markerColorPick(marker));
  }
}

export function dynamicPaintMarker(marker, rgbColor) {
  const { r, g, b } = rgbColor;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;
  marker.setColor(dynamicColor);
}


export function toggleMarkerVisible(id, visible) {
  const marker = MAPDATA.existingMarkers.get(id);
  if (!marker) return;

  if (marker._$visible === visible) return;
  marker.setVisible(visible);
}

export function previewIdsMapping(marker) {
  return Object.entries(marker.$data.content ?? {})
  .filter(([key, value]) =>
    ALLOWED_AGENT_CONTENT_CONFIG.has(key) &&
    value != null &&
    value !== false &&
    value !== "null" &&
    (!Array.isArray(value) || value.length > 0)
  )
  .map(([key]) => key);
}

export function markerToViewportPoint(marker) {
  const bounds = marker.getScreenBounds();
  const rect = map.getContainer().getBoundingClientRect();

  return {
    X: rect.left + bounds.x + 16,
    Y: rect.top + bounds.y + 32
  };
}

export function markerBoundsToViewportPoint(marker) {
  const bounds = marker.getScreenBounds();
  const rect = map.getContainer().getBoundingClientRect();
  return { X: rect.left + bounds.x, Y: rect.top + bounds.y };
}
