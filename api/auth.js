import { ALLOWED_EDITORS, CHECK_AUTH, REQUEST_AUTH } from "../core/config.js"
import { AUTHTOPBAR } from "../ui/sidebar.js"
import { toggleMET, MetEditor } from "../features/metEditor.js"
import { APPMETSTATE, APPSTATE} from "../core/state.js"

export function checkAuth() {
  fetch(CHECK_AUTH, {
    credentials: "include"
  })
  .then(res => res.json())
  .then(data => {
    if (data.authorized) {
      APPSTATE.username = data.username;
      AUTHTOPBAR.usernameDisplay.textContent = `Hello, ${APPSTATE.username}`;
  
      AUTHTOPBAR.loginButton.classList.add('hide');
      AUTHTOPBAR.authImg.classList.add('authorized');
      if (ALLOWED_EDITORS.includes(APPSTATE.username)) {
        console.log("Editor acepted");
    
    APPMETSTATE.METStart = true;
    if (!APPSTATE.isMobile) {
        toggleMET(true)
      const MET = new MetEditor();
      MET.init()
      APPMETSTATE.METInited = true;
    }
      } else {
        console.log(`The ${APPSTATE.username} is not an editor`);
      }
    } else {
      AUTHTOPBAR.loginButton.onclick = () => {
        window.location.href = REQUEST_AUTH;
      };
    }
  })
  .catch(err => {
    console.error("Auth Error:", err);
  });
}