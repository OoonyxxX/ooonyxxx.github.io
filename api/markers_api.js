import {apiRequest, buildJsonOptions} from "./request.js"
import { API_RAW } from "../api/config_api.js"
import { invertMarkerMap } from "./markers.js"

export async function getAllMarkers() {
  return await apiRequest(API_RAW.markers.all, {}, []);
}

export async function getFilteredMarkers(options = {}) {
  const params = new URLSearchParams();

  if (options.userIdToken != null) {
    params.set("userIdToken", options.userIdToken);
  }

  if (options.underGround != null) {
    params.set("underGround", String(options.underGround));
  }

  if (options.regionTokens != null) {
    params.set("regionTokens", options.regionTokens);
  }

  if (options.iconTokens != null) {
    params.set("iconTokens", options.iconTokens);
  }

  const query = params.toString();
  const path = query
    ? `${API_RAW.markers.filter}?${query}`
    : API_RAW.markers.filter;

  return await apiRequest(path);
}

function markersUpsertArrayBuilder(diff) {
  const map = new Map();

  [...diff.added, ...diff.updated].forEach(e => {
    const marker = invertMarkerMap(e.marker);
    map.set(marker.id, marker);
  });

  return Array.from(map.values());
}

async function postMarkersArray(markers) {
  return await apiRequest(API_RAW.markers.array, buildJsonOptions({
    method: "POST",
    data: markers
  }), []);
}

async function deleteMarkersArray(ids) {
  return await apiRequest(API_RAW.markers.array, buildJsonOptions({
    method: "DELETE",
    data: ids
  }), []);
}

export async function METRequest(diff) {
  const markers = markersUpsertArrayBuilder(diff);
  const ids = diff.deleted ?? [];

  const result = {
    postResult: null,
    deleteResult: null,
  };

  if (markers.length > 0) {
    result.postResult = await postMarkersArray(markers);
  }

  if (ids.length > 0) {
    result.deleteResult = await deleteMarkersArray(ids);
  }

  return result;
}

export async function postCollectedMarker(id) {
  return await apiRequest(API_RAW.markers.collected.single, buildJsonOptions({
    method: "POST",
    data: { markerId: id }
  }), []);
}