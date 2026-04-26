import { API_RAW } from "./config_api.js";
import { apiRequest, buildJsonOptions } from "./request.js";

export async function requestPatchDisplayName(name) {
  const res = await apiRequest(API_RAW.users.displayName, buildJsonOptions({
    method: "PATCH",
    data: { newName: name }
  }), []);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || "Failed to update display name");
  }

  return data.display_name;
}

export async function requestPatchUserOptions(options) {
  const res = await apiRequest(API_RAW.users.options, buildJsonOptions({
    method: "PATCH",
    data: options
  }), []);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || "Failed to update options");
  }

  return data.options;
}

export async function requestGetUserOptions() {
  const res = await apiRequest(API_RAW.users.options, {}, []);
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || "Failed to update options");
  }

  return data.options;
}

export async function saveOption(parameter, state) {
  const settingsPatch = {
    [parameter]: state
  };
  
  try {
    const options = await requestPatchUserOptions(settingsPatch);
    return options[parameter];
  } catch (error) {
    console.error("Failed to save option:", error);
    return "error";
  }
}