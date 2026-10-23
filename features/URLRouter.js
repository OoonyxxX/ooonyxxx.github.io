import { validateCoord, validateMarkerId } from './utilities.js'
import { map } from '../core/map.js'
import { MAPDATA } from './markers.js'
import { TOOLSTATE } from '../core/state.js'
import { refreshMarkerFilters, filterMarkerManually } from './filters.js'

function parseURL() {
  const params = new URLSearchParams(window.location.search);

  const action = params.get('action');
  if (!action) return null

  switch (action) {
    case 'point': {
        const rawX = params.get('X') ?? params.get('lng');
        const rawY = params.get('Y') ?? params.get('lat');

        if (!rawX?.trim() || !rawY?.trim()) return null;

        const X = Number(rawX);
        const Y = Number(rawY);

        if (!validateCoord(X) || !validateCoord(Y)) return null;

        return {
          type: 'point',
          lat: Y,
          lng: X
        };
    }

    case 'marker':
      const markerId = params.get('id')
      if (validateMarkerId(markerId)){
        return {
          type: 'marker',
          id: markerId
        };
      } else {
        return null
      }

    default:
      return null;
  }
} 
//  mapofthenorth.com/?action=point&lat=100&lng=100
//  mapofthenorth.com/?action=point&X=100&Y=100
//  mapofthenorth.com/?action=marker&id=marker1

export function generateURL(action) {
  if (!action) return null;

  const url = new URL('/', window.location.origin);

  switch (action.type) {
    case 'point':
      if (!validateCoord(action.lat) || !validateCoord(action.lng)) return null;

      url.searchParams.set('action', 'point');
      url.searchParams.set('X', action.lng);
      url.searchParams.set('Y', action.lat);
      break;

    case 'marker':
      if (!validateMarkerId(action.id)) return null;

      url.searchParams.set('action', 'marker');
      url.searchParams.set('id', action.id);
      break;

    default:
      return null;
  }

  return url.href;
}


function mapZoomDelta(zoom) {
  return zoom + 2
}

function executeURLAction(action) {
  if (!action) return;

  switch (action.type) {
    case 'point':
      map.setView([action.lat, action.lng], mapZoomDelta(map.getZoom()));
      break;

    case 'marker':
      const focusedMarker = MAPDATA.existingMarkers.get(action.id);
      focusedOnMarker(focusedMarker);
      break;
  }
}

function focusedOnMarker(marker) {
  if (!marker) return false;

  map.once('moveend', () => {
    marker.openPopup();
    marker.once("popupclose", () => {
      refreshMarkerFilters();
    })
    filterMarkerManually([marker.$data.id]);
  });
  map.flyTo(marker.getLatLng(), mapZoomDelta(map.getZoom()), {duration: 1.5});

  return true;
}

export function prepareURLAction() {
  const action = parseURL();
  const execute = () => {executeURLAction(action)};
  document.addEventListener("executeURLAction", execute, { once: true });
}

export async function copyMarkerURL(marker_id) {
  const url = generateURL({
    type: 'marker',
    id: marker_id
  });

  if (!url) return false;

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}

export async function copyPointURL(point) {
  const url = generateURL({
    type: 'point',
    lat: point.lat,
    lng: point.lng
  });

  if (!url) return false;

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
}

const URLCopiedEvent = new Event("urlCopied");
const URLCopyErrorEvent = new Event("urlCopyError");

async function shareMapPointHendler(e) {
  TOOLSTATE.pointShare = false;
  const point = e.latlng;
  if(await copyPointURL(point)) {
    document.dispatchEvent(URLCopiedEvent);
  } else {
    document.dispatchEvent(URLCopyErrorEvent);
  }
}

export function startPointShareMode() {
  map.once("click", shareMapPointHendler);
}

export function stopPointShareMode() {
  map.off("click", shareMapPointHendler);
}