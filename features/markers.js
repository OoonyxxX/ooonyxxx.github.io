import { map } from "../core/map.js"
import { checkAuth } from "../api/auth.js"
import { APPSTATE } from "../core/state.js"
import { REGION_COLORS, REGION_UNDERGROUND_COLORS, REGION_LIST } from "../core/config.js"
import { OPTSIDEBAR } from "../ui/sidebar.js"


export const MAPDATA = {
    icons: {},
    originalMarkersData: [],
    existingMarkers: new Map(),
    markers: [],
    iconsData: [],
    markersData: [],
};
export function initOptToggle() {
  OPTSIDEBAR.coloredRegionsToggle.addEventListener('change', () => {
    APPSTATE.coloredRegionsEnabled = !APPSTATE.coloredRegionsEnabled;
    paintingAllMarkers();
  });

  OPTSIDEBAR.heightDisplayToggle.addEventListener('change', () => {
    APPSTATE.heightDisplayEnabled = !APPSTATE.heightDisplayEnabled;
    paintingAllMarkers();
  });

  OPTSIDEBAR.coloredMarkersToggle.addEventListener('change', () => {
    APPSTATE.coloredMarkersEnabled = !APPSTATE.coloredMarkersEnabled;
    paintingAllMarkers();
  });

  OPTSIDEBAR.customColorsToggle.addEventListener('change', () => {
    APPSTATE.customColorsEnabled = !APPSTATE.customColorsEnabled;
    //paintingAllMarkers();
  });
};

export async function loadMapData() {
  try{
    [MAPDATA.iconsData, MAPDATA.markersData] = await Promise.all([
        fetch(`svgicons.json?_=${Date.now()}`).then(r => r.json()),
        fetch(`markers.json?_=${Date.now()}`).then(r => r.json())
    ]);

    MAPDATA.iconsData.forEach(ic => {
        const img = new Image();
        img.src = ic.url;
    });

    await Promise.all(MAPDATA.iconsData.map(async ic => {
        const svgText = await fetch(ic.url).then(r => r.text());
        const html = `<div class="svg-icon" data-icon-id="${ic.id}">${svgText}</div>`;
        MAPDATA.icons[ic.id] = L.divIcon({
            html,
            className: '',
            iconSize:   [32, 32],
            iconAnchor: [16, 32],
            popupAnchor:[0, -32]
        });
    }));
    MAPDATA.icons.default = MAPDATA.icons.default || Object.values(MAPDATA.icons)[0];

    MAPDATA.originalMarkersData = MAPDATA.markersData.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        icon_id: m.icon_id,
        coords: [m.coords[0], m.coords[1]],
        reg_id: m.reg_id,
        level: m.height,
        color: [m.color.R ,m.color.G ,m.color.B]
    }));

    MAPDATA.markersData.forEach(m => {
        const {id, name, description, icon_id, coords, reg_id, level, color} = m;
        const icon  = MAPDATA.icons[icon_id] || MAPDATA.icons.default;
        const marker = L.marker(coords, { icon }).bindPopup(`<b>${name}</b><br>${description}`);
        marker.options.id = id;
        marker.options.name = name;
        marker.options.description = description;
        marker.options.icon_id = icon_id;
        marker.options.coords = coords;
        marker.options.region = reg_id;
        marker.options.level = level;
        marker._$visible = true;

        const { R, G, B } = color;
        const cssColor = `rgb(${R}, ${G}, ${B})`;
        marker.options.custom_rgbcolor = color;
        marker.options.custom_csscolor = cssColor;
        const Rh = Math.floor(R / 2);
        const Gh = Math.floor(G / 2);
        const Bh = Math.floor(B / 2);
        marker.options.height_color = `rgb(${Rh}, ${Gh}, ${Bh})`;
        marker.addTo(map);
        paintSingleMarker(marker);
        MAPDATA.existingMarkers.set(id, marker);
    });

    checkAuth();
  } catch (err) {
    console.error("JSON reading error:", err);
  }
}

//Функция перекрашивания маркеров
export function paintingAllMarkers() {
  MAPDATA.existingMarkers.forEach(marker => {
    const markerHeightGround = !marker.options.level;
    const markerUnderground = APPSTATE.heightDisplayEnabled && !markerHeightGround;
    const cssHexColor = REGION_COLORS[marker.options.region] || '#fff';
    const cssHeightHexColor = REGION_UNDERGROUND_COLORS[marker.options.region] || '#7f7f7f';
    
    const el = marker.getElement();
    const path = el.querySelector(`#${marker.options.icon_id}_svg`);
    const { R, G, B } = marker.options.custom_rgbcolor;
    
    const white = [R, G, B].every(v => v === 255);
    const cWhite = '#fff';
    const cGray = '#7f7f7f';

    path.style.color = (APPSTATE.coloredMarkersEnabled && APPSTATE.coloredRegionsEnabled && markerUnderground && ((white && cssHeightHexColor) || marker.options.height_color)) || (APPSTATE.coloredMarkersEnabled && APPSTATE.coloredRegionsEnabled && ((white && cssHexColor) || marker.options.custom_csscolor)) || (APPSTATE.coloredMarkersEnabled && markerUnderground && marker.options.height_color) || (APPSTATE.coloredRegionsEnabled && markerUnderground && cssHeightHexColor) || (APPSTATE.coloredMarkersEnabled && marker.options.custom_csscolor) || (APPSTATE.coloredRegionsEnabled && cssHexColor) || (markerUnderground && cGray) || cWhite;
  });
}

export function paintSingleMarker(marker) {
	const markerHeightGround = !marker.options.level;
	const markerUnderground = APPSTATE.heightDisplayEnabled && !markerHeightGround;
  const cssHexColor = REGION_COLORS[marker.options.region] || '#fff';
	const cssHeightHexColor = REGION_UNDERGROUND_COLORS[marker.options.region] || '#7f7f7f';
	
  const el = marker.getElement();
	const path = el.querySelector(`#${marker.options.icon_id}_svg`);
	const { R, G, B } = marker.options.custom_rgbcolor;
	
	const white = [R, G, B].every(v => v === 255);
	const cWhite = '#fff';
	const cGray = '#7f7f7f';

  path.style.color = (APPSTATE.coloredMarkersEnabled && APPSTATE.coloredRegionsEnabled && markerUnderground && ((white && cssHeightHexColor) || marker.options.height_color)) || (APPSTATE.coloredMarkersEnabled && APPSTATE.coloredRegionsEnabled && ((white && cssHexColor) || marker.options.custom_csscolor)) || (APPSTATE.coloredMarkersEnabled && markerUnderground && marker.options.height_color) || (APPSTATE.coloredRegionsEnabled && markerUnderground && cssHeightHexColor) || (APPSTATE.coloredMarkersEnabled && marker.options.custom_csscolor) || (APPSTATE.coloredRegionsEnabled && cssHexColor) || (markerUnderground && cGray) || cWhite;
}

export function dynamicPaintSingleMarker(marker, rgbColor) {
  const { r, g, b } = rgbColor;
  const dynamicColor = `rgb(${r}, ${g}, ${b})`;
  const el = marker.getElement();
  const path = el.querySelector(`#${marker.options.icon_id}_svg`);
  path.style.color = dynamicColor;
}


