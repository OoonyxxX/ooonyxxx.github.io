import { API_RAW } from "./config_api.js"


export async function checkAppState() {
  const data = await apiRequest(API_RAW.app.status, {}, []);
  return data;  
  // data = { maintenance: maintenance }; where ->
  // -> ['normal', 'maintenance', 'admin_maintenance'].includes(maintenance);
}