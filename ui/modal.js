import { AUTHTOPBAR } from "./sidebar.js"
export const MODAL = {}

export function cacheModalElements() {
  MODAL.ui                         = {};
  MODAL.met                        = {};
  //Переменные модалки пользователя
  MODAL.ui.userModal               = {};
  MODAL.ui.userModal.visible       = false;
  MODAL.ui.userModal.activeTab     = 0;
  MODAL.ui.userModal.container     = document.getElementById('user-modal-container');
  MODAL.ui.userModal.btnExit       = MODAL.ui.userModal.container.querySelector('#user-modal-exit');
  MODAL.ui.userModal.imgExit       = MODAL.ui.userModal.btnExit.querySelector('#user-modal-exit-img');
  MODAL.ui.userModal.tablist       = MODAL.ui.userModal.container.querySelector('#user-modal-tablist');
  MODAL.ui.userModal.content       = MODAL.ui.userModal.container.querySelector('#user-modal');

  
  //Переменные модалки авторизации
  MODAL.ui.authModal               = {};
  MODAL.ui.authModal.visible       = false;
  MODAL.ui.authModal.content       = document.getElementById('login-modal');
  MODAL.ui.authModal.btnExit       = MODAL.ui.authModal.content.querySelector('#login-modal-exit');
  MODAL.ui.authModal.imgExit       = MODAL.ui.authModal.btnExit.querySelector('#login-modal-exit-img');
  MODAL.ui.authModal.innerText     = MODAL.ui.authModal.content.querySelector('#login-modal-text');
  MODAL.ui.authModal.providerlist  = MODAL.ui.authModal.content.querySelector('#login-modal-providerlist');
  MODAL.ui.authModal.googleImg     = MODAL.ui.authModal.providerlist.querySelector('#login-modal-google-img');


  //Переменные модалки выхода MET
  MODAL.met.exitModal              = {};
  MODAL.met.exitModal.visible      = false;
  MODAL.met.exitModal.content      = document.getElementById('exit-modal');
  MODAL.met.exitModal.innerText    = MODAL.met.exitModal.content.querySelector('#exit-modal-text');
  MODAL.met.exitModal.buttons      = MODAL.met.exitModal.content.querySelector('#exit-modal-buttons');
  MODAL.met.exitModal.btnYes       = MODAL.met.exitModal.buttons.querySelector('#exit-yes');
  MODAL.met.exitModal.btnNo        = MODAL.met.exitModal.buttons.querySelector('#exit-no');

  //Переменные модалки удаления маркера MET
  MODAL.met.confirmModal           = {};
  MODAL.met.confirmModal.visible   = false;
  MODAL.met.confirmModal.content   = document.getElementById('confirm-modal');
  MODAL.met.confirmModal.innerText = MODAL.met.confirmModal.content.querySelector('#confirm-modal-text');
  MODAL.met.confirmModal.buttons   = MODAL.met.confirmModal.content.querySelector('#confirm-modal-buttons');
  MODAL.met.confirmModal.btnYes    = MODAL.met.confirmModal.buttons.querySelector('#confirm-yes');
  MODAL.met.confirmModal.btnNo     = MODAL.met.confirmModal.buttons.querySelector('#confirm-no');
}

export function toggleModalVisible(modal, is_visible) {
  if (!modal) return
  if (modal.visible === is_visible) return
  modal.visible = is_visible;
  modal.content.classList.toggle('hidden', !is_visible);
}

export function setUpTextContent(textContainer, text) {
  if (!textContainer) return
  if (!text) text = '';
  textContainer.textContent = text;
}

export function initAuthModal(handlerIn = () => {}, handlerOut = () => {}) {
  const openHendler = () => {
    toggleModalVisible(MODAL.ui.authModal, true);
    if (handlerIn) handlerIn();
  }
  const closeHendler = () => {
    toggleModalVisible(MODAL.ui.authModal, false);
    if (handlerOut) handlerOut();
  }
  AUTHTOPBAR.loginButton.addEventListener('click', openHendler);
  MODAL.ui.authModal.btnExit.addEventListener('click', closeHendler);
}

export function openExitModal(yesHandler = () => {}, noHandler = () => {}) {
  const text = 'Are you sure you want to exit without saving the changes? ' + 'All edits will be lost.';
  setUpTextContent(MODAL.met.exitModal.innerText, text)
  toggleModalVisible(MODAL.met.exitModal, true);
  const exitYesHandler = () => {
    toggleModalVisible(MODAL.met.exitModal, false);
    setUpTextContent(MODAL.met.exitModal.innerText);
    if (yesHandler) yesHandler();
  };
  const exitNoHandler = () => {
    toggleModalVisible(MODAL.met.exitModal, false);
    setUpTextContent(MODAL.met.exitModal.innerText);
    if (noHandler) noHandler();
  };
  MODAL.met.exitModal.btnYes.addEventListener('click', exitYesHandler, { once: true });
  MODAL.met.exitModal.btnNo.addEventListener('click', exitNoHandler, { once: true });
}
export function deleteModal(handlerYes = () => {}, handlerNo = () => {}) {
  toggleModalVisible(MODAL.met.confirmModal, true);
  const deleteYesHandler = () => {
    toggleModalVisible(MODAL.met.confirmModal, false);
    MODAL.met.confirmModal.btnYes.removeEventListener('click', deleteYesHandler);
    if (handlerYes) handlerYes();
  }
  const deleteNoHandler = () => {
    toggleModalVisible(MODAL.met.confirmModal, false);
    MODAL.met.confirmModal.btnNo.removeEventListener('click', deleteNoHandler);
    if (handlerNo) handlerNo();
  }
  MODAL.met.confirmModal.btnYes.addEventListener('click', deleteYesHandler);
  MODAL.met.confirmModal.btnNo.addEventListener('click', deleteNoHandler);
}

