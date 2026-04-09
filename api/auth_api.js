import { API_RAW, API } from "../api/config_api.js"
import { apiRequest } from "../api/request.js"
import { ALLOWED_MET_ROLE } from "../core/config.js"
import { AUTHTOPBAR, AUTHMODAL } from "../ui/sidebar.js"
import { toggleMETControls, MetEditor } from "../features/metEditor.js"
import { APPMETSTATE, APPSTATE, USERSESSION, USERSETTINGS} from "../core/state.js"

export async function checkAuth() {
  const data = await apiRequest(API_RAW.auth.me, {}, [401]);
  if (data.authorized) {
    USERSESSION.user_id = data.user_id ?? "";
    USERSESSION.display_name = data.display_name ?? "Unknown";
    USERSESSION.role = data.role ?? "user";
    AUTHTOPBAR.usernameDisplay.textContent = `${USERSESSION.display_name}`;
    AUTHTOPBAR.usernameDisplay.classList.add('authorized');

    AUTHTOPBAR.loginButton.classList.add('hide');
    AUTHTOPBAR.authImg.classList.add('authorized');
    if (ALLOWED_MET_ROLE.includes(USERSESSION.role)) {
      APPMETSTATE.METStart = true;
      if ((USERSETTINGS.METActive) && (!APPSTATE.isMobile)) {
        toggleMETControls(true)
        const MET = new MetEditor();
        MET.init()
        APPMETSTATE.METInited = true;
      }
    }
  } else {
    enableAuthModal();
  }
}

export function enableAuthModal() {
  AUTHTOPBAR.loginButton.addEventListener('click', openAuthModal)
  AUTHMODAL.loginModalExit.addEventListener('click', closeAuthModal)
  AUTHMODAL.loginModalGoogleImg.addEventListener('click', loginGoogle)
}
export function disableAuthModal() {
  AUTHTOPBAR.loginButton.removeEventListener('click', openAuthModal)
  AUTHMODAL.loginModalExit.removeEventListener('click', closeAuthModal)
  AUTHMODAL.loginModalGoogleImg.removeEventListener('click', loginGoogle)
}

function openAuthModal() {
  AUTHTOPBAR.loginModalContainer.classList.toggle('login-hidden', false);

}

function closeAuthModal() {
  AUTHTOPBAR.loginModalContainer.classList.toggle('login-hidden', true);

}

function loginGoogle() {
  window.location.assign(API.auth.googleLogin);
}

