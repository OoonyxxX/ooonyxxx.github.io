import { API_RAW, API, USERSESSIONDEFAULT } from "../api/config_api.js"
import { apiRequest } from "../api/request.js"
import { ALLOWED_MET_ROLE } from "../core/config.js"
import { AUTHTOPBAR, toggleAuthorizationUI } from "../ui/sidebar.js"
import { METActiveController, MetEditor, METSTATE } from "../features/metEditor.js"
import { APPSTATE, USERSESSION, USERSETTINGS} from "../core/state.js"
import { MODAL } from "../ui/modal.js"
import { requestGetUserOptions } from "../api/users_api.js"

export async function checkAuth() {
  const data = await apiRequest(API_RAW.auth.me, {}, [401]);
  await authorizeController(data);
}

export async function logoutUser() {
  const { success } = await apiRequest(API_RAW.auth.logout, buildJsonOptions({method: "POST"}), []);
  if (success) {
    authorizeController({authorized: false});
    loadAuthorizationModals();
  }
}

function initUserModal() {
  MODAL.ui.userModal.setOuterTargets({open: AUTHTOPBAR.userMenu});
  MODAL.ui.userModal.setOuterHandlers();
  //MODAL.ui.userModal.setInnerHandlers();
  MODAL.ui.userModal.initModal();
}

function initAuthModal() {
  MODAL.ui.authModal.setOuterTargets({open: AUTHTOPBAR.loginButton});
  MODAL.ui.authModal.setOuterHandlers();
  const googleLogin = () => {
    loginGoogle();
  }
  MODAL.ui.authModal.setInnerHandlers(googleLogin);
  MODAL.ui.authModal.initModal();
}

async function authorizeController(authorizationData) {
  toggleAuthorizationUI(authorizationData.authorized);
  fillSession(authorizationData);
  await fillSettings();
  /*
  if (authorizationData.authorized) {
    initUserModal();
    if (MODAL.ui.authModal.initialized) MODAL.ui.authModal.deinitModal();
  } else {
    if (MODAL.ui.userModal.initialized) MODAL.ui.userModal.deinitModal();
    initAuthModal();
  }
  */
  METActiveController();
}

async function fillSettings() {
  if (!USERSESSION.authorized) return
  const options = await requestGetUserOptions();

  Object.assign(USERSETTINGS, options);
}

function fillSession(authorizationData) {
  if (authorizationData.authorized) {
    Object.assign(USERSESSION, authorizationData);
  } else {
    Object.assign(USERSESSION, USERSESSIONDEFAULT);
  }
}

function loginGoogle() {
  window.location.assign(API.auth.googleLogin);
}

export function loadAuthorizationModals() {
  if (USERSESSION.authorized) {
    initUserModal();
    if (MODAL.ui.authModal.initialized) MODAL.ui.authModal.deinitModal();
  } else {
    if (MODAL.ui.userModal.initialized) MODAL.ui.userModal.deinitModal();
    initAuthModal();
  }
}