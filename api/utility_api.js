import { apiRequest } from "./request.js"
import { API_RAW } from "../api/config_api.js"

export async function getStatus() {
  return await apiRequest(API_RAW.status, {}, [503]);
}