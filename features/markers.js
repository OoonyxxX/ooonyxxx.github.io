import { map } from "../core/map.js"
import { getAllMarkers, postCollectedMarker } from "../api/markers_api.js"
import { fastCollectedFilterReRender } from "./filters.js"
import { APPSTATE, USERSESSION, USERINFO } from "../core/state.js"
import { REGION_COLORS, REGION_UNDERGROUND_COLORS, ALLOWED_AGENT_CONTENT_CONFIG } from "../core/config.js"
import { standartPopup, popupWithContent, markerMap } from "./marker_data.js"
import { popupViewportOptions } from "../ui/popupLayout.js"


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
    const el = marker.getElement();
    el._id = marker.$data.id;
    el._previewIds = previewIdsMapping(marker);
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
  const point = map.latLngToContainerPoint(marker.getLatLng());
  const rect = map.getContainer().getBoundingClientRect();

  return {
    X: rect.left + point.x,
    Y: rect.top + point.y
  };
}

export function markerElementToViewportPoint(markerEl) {
  const point = markerEl.getBoundingClientRect()
  return {
    X: point.x,
    Y: point.y
  };
}
