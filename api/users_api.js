import { API_RAW } from "./config_api.js";
import { apiRequest, buildJsonOptions } from "./request.js";

export async function requestPatchDisplayName(name) {
  const data = await apiRequest(API_RAW.users.displayName, buildJsonOptions({
    method: "PATCH",
    data: { newName: name }
  }), []);
  return data.display_name;
}

export async function requestPatchUserOptions(options) {
  const data = await apiRequest(API_RAW.users.options, buildJsonOptions({
    method: "PATCH",
    data: options
  }), []);
  return data.options;
}

export async function requestGetUserOptions() {
  const data = await apiRequest(API_RAW.users.options, {}, []);
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