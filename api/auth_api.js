import { API_RAW, API } from "../api/config_api.js"
import { apiRequest } from "../api/request.js"
import { ALLOWED_MET_ROLE } from "../core/config.js"
import { AUTHTOPBAR } from "../ui/sidebar.js"
import { toggleMETControls, MetEditor } from "../features/metEditor.js"
import { APPMETSTATE, APPSTATE, USERSESSION, USERSETTINGS} from "../core/state.js"
import { initAuthModal, MODAL } from "../ui/modal.js"

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
    const handlerIn = () => {
      MODAL.ui.authModal.googleImg.addEventListener('click', loginGoogle, { once: true });
    }
    const handlerOut = () => {
      MODAL.ui.authModal.googleImg.removeEventListener('click', loginGoogle);
    }
    initAuthModal(handlerIn, handlerOut);
  }
}

function loginGoogle() {
  window.location.assign(API.auth.googleLogin);
}

