import { USERSETTINGS, USERINFO, USERSESSION } from "../core/state.js";
import { subscribeUI, sanitizeUsername } from "./UIUtilities.js"
import { requestPatchDisplayName, saveOption } from "../api/users_api.js"
import { logoutUser } from "../api/auth_api.js"
export const MODAL = {}

const USERMODALCONFIG = {
  tabsNames: {
    "account_info": "Account Info",
    "user_options": "User Options",
    "user_statistics": "User Statistics",
  },
  tabsHTMLClass: {
    "account_info": "account-info",
    "user_options": "user-options",
    "user_statistics": "user-statistics",
  },

  themes: {
    "White": "white", 
    "Dark": "dark", 
    "Northern Lights": "northern-lights", 
    "Red Death": "red-death"
  },
}

const USERMODALPARTS = {
  content: {},
}


export function cacheModalElements() {
  MODAL.ui                = {};
  MODAL.met               = {};
  MODAL.ui.modalBlock     = document.getElementById('UI-modal-block');
  MODAL.met.modalBlock    = document.getElementById('MET-modal-block');

  MODAL.ui.userModal      = null;
  MODAL.ui.authModal      = null;
  MODAL.met.exitModal     = null;
  MODAL.met.confirmModal  = null;
}

export function initModals() {
  MODAL.ui.authModal = new AuthModal
  MODAL.ui.userModal = new UserModal
  MODAL.met.exitModal = new METExitModal
  MODAL.met.confirmModal = new MarkerDeleteModal
}

export function toggleVisible(element, is_visible) {
  element.classList.toggle('hidden', !is_visible);
}

export function setUpTextContent(textContainer, text) {
  if (!textContainer) return
  if (!text) text = '';
  textContainer.textContent = text;
}

function toggleModalVisible(modal, is_visible) {
  if (!modal) return
  if (modal.visible === is_visible) return
  modal.visible = is_visible;
  toggleVisible(modal.container, is_visible);
}


class AuthModal {
  constructor(){
    this.modalName          = "Auth Modal"
    this.openHendler        = null;
    this.closeHendler       = null;
    this.openTarget         = null;
    this.closeTarget        = null;
    this.visible            = false;
    this.generated          = false;
    this.initialized        = false;
    this.container          = MODAL.ui.modalBlock.querySelector('#login-modal-container');
    this.googleLoginHendler = null;
  }

  _generateModal() {
    this.container.innerHTML = `
	      <div class="login-modal-content modal-content no-select">
          <button id="login-modal-exit" class="modal-exit-btn">
            <img id="login-modal-exit-img" class="modal-exit-img no-drag" src="/othersvg/cancel.svg">
          </button>
		      <p id="login-modal-text-h" class="modal-text-h">
		        Select your authorization method
		      </p>
		      <div id="login-modal-providerlist" class="login-modal-providerlist">
		        <img id="login-modal-google-img" class="login-modal-google-img login-modal-element action-img no-drag" src="/svglogin/google_dark.svg">
		      </div>
	      </div>
    `;
    this.closeBtn      = this.container.querySelector('.modal-exit-btn');
    this.closeImg      = this.closeBtn.querySelector('.modal-exit-img');
    this.innerText     = this.container.querySelector('.modal-text-h');
    this.providerlist  = this.container.querySelector('#login-modal-providerlist');
    this.googleLogin   = this.providerlist.querySelector('#login-modal-google-img');
    this.generated     = true;
  }
  _deleteModal() {
    this.container.innerHTML = ``;
    this.generated = false;
  }

  setOuterHandlers(handlerIn = () => {}, handlerOut = () => {}) {
    this.openHendler = () => {
      if (handlerIn) handlerIn();
      this.openModal()
    }
    this.closeHendler = () => {
      this.closeModal()
      if (handlerOut) handlerOut();
    }
  }
  setInnerHandlers(googleLogin = () => {}) {
    this.googleLoginHendler = () => {
      if (googleLogin) googleLogin();
    }
  }
  setOuterTargets({open, close}) {
    this.openTarget    = open;
    this.closeTarget   = close ?? null;
  }

  initModal() {
    if (this.openTarget === null) {
      console.log(`The targets for opening the ${this.modalName} have not been specified. Use setTargets(openTarget, closeTarget)`);
      return
    }
    if ((this.openHendler === null) || (this.closeHendler === null)) {
      console.log(`No opening and closing hendler have been defined for the ${this.modalName}. Use setOuterHandlers(openHendler, closeHendler)`);
      return
    }
    if (!this.generated) this._generateModal();
    this.openTarget.addEventListener('click', this.openHendler);
    if (this.closeTarget !== null) this.closeTarget.addEventListener('click', this.closeHendler);
    this.closeBtn.addEventListener('click', this.closeHendler);
    this.initialized    = true;
  }

  deinitModal() {
    this.openTarget.removeEventListener('click', this.openHendler);
    this.closeBtn.removeEventListener('click', this.closeHendler);
    if (this.closeTarget !== null) this.closeTarget.removeEventListener('click', this.closeHendler);
    if (this.generated) this._deleteModal();
    this.openTarget         = null
    this.closeTarget        = null
    this.openHendler        = null
    this.closeHendler       = null
    this.generated          = false;
    this.initialized        = false;
    this.googleLoginHendler = null
  }

  openModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    if (this.googleLogin === null) {
      console.log(`No buttons handlers have been defined for the ${this.modalName}`);
      return
    }
    this.googleLogin.addEventListener('click', this.googleLoginHendler);
    toggleModalVisible(this, true);
    this.modalOpened = true;
  }
  closeModal() {
    if (!this.modalOpened) return
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    toggleModalVisible(this, false);
    this.googleLogin.removeEventListener('click', this.googleLoginHendler);
    this.modalOpened = false;
  }
}


class MarkerDeleteModal {
  constructor(){
    this.modalName     = "Marker Delete Modal"
    this.openHendler   = null;
    this.closeHendler  = null;
    this.openTarget    = null;
    this.closeTarget   = null;
    this.visible       = false;
    this.generated     = false;
    this.initialized   = false;
    this.container     = MODAL.met.modalBlock.querySelector('#confirm-modal-container');
    this.btnYesHendler = null;
    this.btnNoHendler  = null;
  }

  _generateModal() {
    this.container.innerHTML = `
        <div class="confirm-modal-content modal-content">
          <button id="confirm-modal-exit" class="modal-exit-btn">
            <img id="confirm-modal-exit-img" class="modal-exit-img no-drag" src="/othersvg/cancel.svg">
          </button>
          <p id="confirm-modal-text-h" class="modal-text-h">Are you sure you want to remove this marker?</p>
          <div id="confirm-modal-buttons" class="modal-buttons">
            <button id="confirm-yes" class="confirm-yes warning-btn">Yes</button>
            <button id="confirm-no" class="confirm-no base-btn">NO</button>
          </div>
        </div>
    `;
    this.closeBtn      = this.container.querySelector('.modal-exit-btn');
    this.closeImg      = this.closeBtn.querySelector('.modal-exit-img');
    this.innerText     = this.container.querySelector('#confirm-modal-text-h');
    this.buttons       = this.container.querySelector('#confirm-modal-buttons');
    this.btnYes        = this.buttons.querySelector('#confirm-yes');
    this.btnNo         = this.buttons.querySelector('#confirm-no');
    this.generated     = true;
  }
  _deleteModal() {
    this.container.innerHTML = ``;
    this.generated = false;
  }

  setOuterHandlers(handlerIn = () => {}, handlerOut = () => {}) {
    this.openHendler = () => {
      if (handlerIn) handlerIn();
      this.openModal()
    }
    this.closeHendler = () => {
      this.closeModal()
      if (handlerOut) handlerOut();
    }
  }
  setInnerHandlers(handlerYes = () => {}, handlerNo = () => {}) {
    this.btnYesHendler = () => {
      this.closeModal()
      if (handlerYes) handlerYes();
    }
    this.btnNoHendler = () => {
      this.closeModal()
      if (handlerNo) handlerNo();
    }
  }
  setOuterTargets({open, close}) {
    this.openTarget    = open;
    this.closeTarget   = close ?? null;
  }

  initModal() {
    if (this.openTarget === null) {
      console.log(`The targets for opening the ${this.modalName} have not been specified. Use setTargets(openTarget, closeTarget)`);
      return
    }
    if ((this.openHendler === null) || (this.closeHendler === null)) {
      console.log(`No opening and closing hendler have been defined for the ${this.modalName}. Use setOuterHandlers(openHendler, closeHendler)`);
      return
    }
    if (!this.generated) this._generateModal();
    this.openTarget.addEventListener('click', this.openHendler);
    if (this.closeTarget !== null) this.closeTarget.addEventListener('click', this.closeHendler);
    this.closeBtn.addEventListener('click', this.closeHendler);
    this.initialized    = true;
  }

  deinitModal() {
    this.openTarget.removeEventListener('click', this.openHendler);
    this.closeBtn.removeEventListener('click', this.closeHendler);
    if (this.closeTarget !== null) this.closeTarget.removeEventListener('click', this.closeHendler);
    if (this.generated) this._deleteModal();
    this.openTarget     = null
    this.closeTarget    = null
    this.openHendler    = null
    this.closeHendler   = null
    this.generated      = false;
    this.initialized    = false;
    this.btnYesHendler = null;
    this.btnNoHendler  = null;
  }

  openModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    if ((this.btnYesHendler === null) || (this.btnNoHendler === null)) {
      console.log(`No buttons handlers have been defined for the ${this.modalName}`);
      return
    }
    this.btnYes.addEventListener('click', this.btnYesHendler);
    this.btnNo.addEventListener('click', this.btnNoHendler);
    toggleModalVisible(this, true);
    this.modalOpened = true;
  }
  closeModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    if (!this.modalOpened) return
    toggleModalVisible(this, false);
    this.btnYes.removeEventListener('click', this.btnYesHendler);
    this.btnNo.removeEventListener('click', this.btnNoHendler);
    this.modalOpened = false;
  }
}

class METExitModal {
  constructor(){
    this.modalName     = "MET Exit Modal"
    this.openHendler   = null;
    this.closeHendler  = null;
    this.openTarget    = null;
    this.closeTarget   = null;
    this.visible       = false;
    this.generated     = false;
    this.initialized   = false;
    this.container     = MODAL.met.modalBlock.querySelector('#exit-modal-container');
    this.btnYesHendler = null;
    this.btnNoHendler  = null;
  }

  _generateModal() {
    this.container.innerHTML = `
        <div class="exit-modal-content modal-content">
          <button id="exit-modal-exit" class="modal-exit-btn">
            <img id="exit-modal-exit-img" class="modal-exit-img no-drag" src="/othersvg/cancel.svg">
          </button>
          <p id="exit-modal-text-h" class="modal-text-h">
            <span>Are you sure you want to exit without saving the changes?</span>
            <span class="text-warning">All edits will be lost.</span>
          </p>
          <div id="exit-modal-buttons" class="modal-buttons">
            <button id="exit-yes" class="exit-yes warning-btn">Yes</button>
            <button id="exit-no" class="exit-no base-btn">No</button>
          </div>
        </div>
    `;
    this.closeBtn      = this.container.querySelector('.modal-exit-btn');
    this.closeImg      = this.closeBtn.querySelector('.modal-exit-img');
    this.innerText     = this.container.querySelector('#exit-modal-text-h');
    this.buttons       = this.container.querySelector('#exit-modal-buttons');
    this.btnYes        = this.buttons.querySelector('#exit-yes');
    this.btnNo         = this.buttons.querySelector('#exit-no');
    this.generated     = true;
  }
  _deleteModal() {
    this.container.innerHTML = ``;
    this.generated = false;
  }

  setOuterHandlers(handlerIn = () => {}, handlerOut = () => {}) {
    this.openHendler = () => {
      if (handlerIn) handlerIn();
      this.openModal()
    }
    this.closeHendler = () => {
      this.closeModal()
      if (handlerOut) handlerOut();
    }
  }
  setInnerHandlers(handlerYes = () => {}, handlerNo = () => {}) {
    this.btnYesHendler = () => {
      this.closeModal()
      if (handlerYes) handlerYes();
    }
    this.btnNoHendler = () => {
      this.closeModal()
      if (handlerNo) handlerNo();
    }
  }
  setOuterTargets({open, close}) {
    this.openTarget    = open;
    this.closeTarget   = close ?? null;
  }

  initModal() {
    if (this.openTarget === null) {
      console.log(`The targets for opening the ${this.modalName} have not been specified. Use setTargets(openTarget, closeTarget)`);
      return
    }
    if ((this.openHendler === null) || (this.closeHendler === null)) {
      console.log(`No opening and closing hendler have been defined for the ${this.modalName}. Use setOuterHandlers(openHendler, closeHendler)`);
      return
    }
    if (!this.generated) this._generateModal();
    this.openTarget.addEventListener('click', this.openHendler);
    if (this.closeTarget !== null) this.closeTarget.addEventListener('click', this.closeHendler);
    this.closeBtn.addEventListener('click', this.closeHendler);
    this.initialized    = true;
  }

  deinitModal() {
    this.openTarget.removeEventListener('click', this.openHendler);
    this.closeBtn.removeEventListener('click', this.closeHendler);
    if (this.closeTarget !== null) this.closeTarget.removeEventListener('click', this.closeHendler);
    if (this.generated) this._deleteModal();
    this.openTarget     = null
    this.closeTarget    = null
    this.openHendler    = null
    this.closeHendler   = null
    this.generated      = false;
    this.initialized    = false;
    this.btnYesHendler = null;
    this.btnNoHendler  = null;
  }

  openModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    if ((this.btnYesHendler === null) || (this.btnNoHendler === null)) {
      console.log(`No buttons handlers have been defined for the ${this.modalName}`);
      return
    }
    this.btnYes.addEventListener('click', this.btnYesHendler);
    this.btnNo.addEventListener('click', this.btnNoHendler);
    toggleModalVisible(this, true);
    this.modalOpened = true;
  }
  closeModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    if (!this.modalOpened) return
    toggleModalVisible(this, false);
    this.btnYes.removeEventListener('click', this.btnYesHendler);
    this.btnNo.removeEventListener('click', this.btnNoHendler);
    this.modalOpened = false;
  }
}

class UserModal {
  constructor(){
    this.modalName     = "User Modal"
    this.openHendler   = null;
    this.closeHendler  = null;
    this.openTarget    = null;
    this.closeTarget   = null;
    this.visible       = false;
    this.activeTab     = 0;
    this.generated     = false;
    this.initialized   = false;
    this.UIsubscribed  = false;
    this.container     = MODAL.ui.modalBlock.querySelector('#user-modal-container');
    this.accountInfo   = {
      displayName: {},
      role: {},
      provider: {},
      email: {},
      logout: {},
    };
    this.options       = {};
    this.statistics    = {};
  }

  _generateModal() {
    this.container.innerHTML = `
        <div id="user-modal-content" class="user-modal-content modal-content">
          <button id="user-modal-exit" class="modal-exit-btn">
            <img id="user-modal-exit-img" class="modal-exit-img no-drag" src="/othersvg/cancel.svg">
          </button>
          <div role="tablist" id="user-modal-tablist" class="user-modal-tablist"></div>
          <div id="user-modal-tabcontent" class="user-modal-tabcontent"></div>
        </div>
    `;
    this.closeBtn      = this.container.querySelector('.modal-exit-btn');
    this.closeImg      = this.closeBtn.querySelector('.modal-exit-img');
    this.tablist       = this.container.querySelector('#user-modal-tablist');
    this.tabcontent    = this.container.querySelector('#user-modal-tabcontent');
    const { tabsContent, tabsButtons } = this._generateUserModalContent();
    this.tablist.innerHTML    = tabsButtons;
    this.tabcontent.innerHTML = tabsContent;
    this.accountInfo.cont     = this.tabcontent.querySelector("#account-info-body");
    this.accountInfo.displayName.cont     = this.accountInfo.cont.querySelector("#account-info-display-name-container");
    this.accountInfo.displayName.text     = this.accountInfo.displayName.cont.querySelector(".account-info-text-display-name");
    this.accountInfo.displayName.change_button = this.accountInfo.displayName.cont.querySelector(".account-info-button-change-display-name");
    this.accountInfo.displayName.save_button = this.accountInfo.displayName.cont.querySelector(".account-info-button-save-display-name");
    this.accountInfo.displayName.cancel_button = this.accountInfo.displayName.cont.querySelector(".account-info-button-cancel-display-name");
    this.accountInfo.displayName.text_input = this.accountInfo.displayName.cont.querySelector(".account-info-input-set-display-name");
    this.accountInfo.role.cont = this.accountInfo.cont.querySelector("#account-info-user-role-container");
    this.accountInfo.role.text = this.accountInfo.role.cont.querySelector(".account-info-text-user-role");
    this.accountInfo.provider.cont = this.accountInfo.cont.querySelector("#account-info-auth-provider-container");
    this.accountInfo.provider.text = this.accountInfo.provider.cont.querySelector(".account-info-text-auth-provider");
    this.accountInfo.email.cont = this.accountInfo.cont.querySelector("#account-info-user-email-container");
    this.accountInfo.email.text = this.accountInfo.email.cont.querySelector(".account-info-text-user-email");
    this.accountInfo.logout.cont = this.accountInfo.cont.querySelector("#account-info-logout-button-container");
    this.accountInfo.logout.btn = this.accountInfo.logout.cont.querySelector(".user-logout-button");

    this.options.cont               = this.tabcontent.querySelector("#user-options-body");
    this.options.customCursor       = this.options.cont.querySelector(".cursor-toggle");
    this.options.customCursorToggle = this.options.cont.querySelector(".toggle-cursor-checkbox");
    this.options.METVisible          = this.options.cont.querySelector(".met-toggle");
    this.options.METVisibleToggle    = this.options.cont.querySelector(".toggle-met-checkbox");

    this.statistics.cont            = this.tabcontent.querySelector("#user-statistics-body");
    this.statistics.collected       = this.statistics.cont.querySelector(".statistics-collected-text")

    if (!this.UIsubscribed) this._subscribeUIElements();
    this.generated = true;
  }
  _generateUserModalContent() {
    const account_info_class = USERMODALCONFIG.tabsHTMLClass["account_info"]
    USERMODALPARTS.content["account_info"] = {
      "display_name": `
        <div id="${account_info_class}-display-name-container" class="${account_info_class}-label-container">
          <span class="user-modal-content-title content-title">Username</span>
          <label class="${account_info_class}-parameter display-name">
            <span class="${account_info_class}-text-display-name parameter-value">${USERSESSION.display_name || 'Unknown'}</span>
            <input class="${account_info_class}-input-set-display-name hidden" type="text">
            <span class="text-warning hidden">(Placeholder)</span>
            <button class="${account_info_class}-button-change-display-name">Change</button>
            <button class="${account_info_class}-button-save-display-name hidden">Save</button>
            <button class="${account_info_class}-button-cancel-display-name hidden">Cancel</button>
          </label>
        </div>
      `,
      "user_role": `
        <div id="${account_info_class}-user-role-container" class="${account_info_class}-label-container">
          <span class="user-modal-content-title content-title">Role</span>
          <label class="${account_info_class}-parameter user-role">
            <span class="${account_info_class}-text-user-role parameter-value">${USERSESSION.role}</span>
          </label>
        </div>
      `,
      "auth_provider": `
        <div id="${account_info_class}-auth-provider-container" class="${account_info_class}-label-container">
          <span class="user-modal-content-title content-title">Authentication Provider</span>
          <label class="${account_info_class}-parameter auth-provider">
            <span class="${account_info_class}-text-auth-provider parameter-value">${USERSESSION.provider}</span>
          </label>
        </div>
      `,
      "email": `
        <div id="${account_info_class}-user-email-container" class="${account_info_class}-label-container">
          <span class="user-modal-content-title content-title">Authenticated Email</span>
          <label class="${account_info_class}-parameter user-email">
            <span class="${account_info_class}-text-user-email parameter-value">${USERSESSION.email}</span>
          </label>
        </div>
      `,
      "logout_button": `
        <div id="${account_info_class}-logout-button-container" class="${account_info_class}-logout-button-container">
          <label class="${account_info_class}-button user-email">
            <button id="user-logout-button" class="user-logout-button warning-btn">Logout</button>
          </label>
        </div>
      `,
    }
  
    const themeBlock = () => {
      const currentTheme = USERSETTINGS.theme
      const themeRows = Object.entries(USERMODALCONFIG.themes).map(([name, value]) => `
        <div class="theme-row">
          <input type='radio' id="${value}" value="${value}" ${name === currentTheme ? 'checked' : ''}><label for="${value}">${name}</label>
        </div>
      `);
      return `
        <fieldset id="themes">
          <legend>Themes</legend>
          ${themeRows.join("")}
        </fieldset>
      `
    }
  
    USERMODALPARTS.content["user_options"] = {
      //"theme": themeBlock(),
      "customCursor": `
        <label class="option-parameter cursor-toggle">
          <input type="checkbox" class="toggle-cursor-checkbox" id="toggle-cursor" ${USERSETTINGS.customCursor ? 'checked' : ''}>
          <span class="toggle-text toggle-cursor-text">Custom Cursor</span>
        </label>
      `,
      "METVisible": `
        <label class="option-parameter met-toggle">
          <input type="checkbox" class="toggle-met-checkbox" id="toggle-met" ${USERSETTINGS.METVisible ? 'checked' : ''}>
          <span class="toggle-text-container toggle-met-text-container">
            <span class="toggle-text toggle-met-text">Enable MET</span>
          </span>
        </label>
      `
    }
  
    USERMODALPARTS.content["user_statistics"] = {
      "collected": `
        <label class="statistics-parameter statistics-collected">
          <span class="statistics-collected-title content-title">Collected</span>
          <span class="statistics-text statistics-collected-text">${USERINFO.collected}/${USERINFO.collectedAll}</span>
        </label>
        <label class="statistics-parameter statistics-visited">
          <span class="statistics-visited-title content-title">Collected</span>
          <span class="statistics-text statistics-visited-text">${USERINFO.visited}/${USERINFO.visitedAll}</span>
        </label>
      `,
    }
  
    const classMap = USERMODALCONFIG.tabsHTMLClass
    const fillContentMap = () => {
      const contentMap = {}
      for (const id of Object.keys(USERMODALCONFIG.tabsNames)) {
        const contentPart = Object.values(USERMODALPARTS.content[id]).join('')
        const contentBlock = `
          <div id="${classMap[id]}-body" class="${classMap[id]}-body tab-body">
                ${contentPart}
          </div>
        `;
        contentMap[id] = contentBlock;
      }
      return contentMap
    }
  
    const contentMap = fillContentMap();
  
    const tabsNamesEntries = Object.entries(USERMODALCONFIG.tabsNames)
    const tabsContent = tabsNamesEntries.map(([id, name], i) => `
      <div role="tabpanel" id="tab-content-${i}" class="tab-content" data-index="${i}">
        <div id="${classMap[id]}-container" class="${classMap[id]}-container tab-container">
          <h2 id="${classMap[id]}-header" class="${classMap[id]}-header tab-header">${name}</h2>
          ${contentMap[id]}
        </div>
      </div>
    `).join('');
  
    const tabsButtons = tabsNamesEntries.map(([id, name], i) => `
      <button role="tab"
        id="user-modal-tab-${i}"
        class="tab-button no-select"
        data-index="${i}">
        ${name}
      </button>
    `).join('');
  
    return { tabsContent, tabsButtons }
  }

  _subscribeUIElements() {
    subscribeUI("display_name", () => {
      if (this?.accountInfo?.displayName?.text) this.accountInfo.displayName.text.textContent = USERSESSION.display_name;
    })
    subscribeUI("role", () => {
      if (this?.accountInfo?.role?.text) this.accountInfo.role.text.textContent = USERSESSION.role;
    })
    subscribeUI("provider", () => {
      if (this?.accountInfo?.provider?.text) this.accountInfo.provider.text.textContent = USERSESSION.provider;
    })
    subscribeUI("email", () => {
      if (this?.accountInfo?.email?.text) this.accountInfo.email.text.textContent = USERSESSION.email;
    })
    subscribeUI("collected", () => {
      if (this?.statistics?.collected) this.statistics.collected.textContent = `${USERINFO.collected}/${USERINFO.collectedAll}`;
    })
    this.UIsubscribed = true;
  }

  _setUpStartState() {
    const buttons = this.tablist.querySelectorAll('[role="tab"]');
    const panels = this.tabcontent.querySelectorAll('[role="tabpanel"]');

    buttons.forEach(button => {
      const index = +button.dataset.index;
      const isActive = index === this.activeTab;

      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
      const index = +panel.dataset.index;
      const isActive = index === this.activeTab;

      panel.classList.toggle('hidden', !isActive);
    });
  }

  _setUpButtonsEvents() {
    const buttons_list = this.tablist.querySelectorAll('[role="tab"]');
    for (const button of buttons_list) {
      this._tabButtonEventHandler = this._tabButtonEvent.bind(this);
      button.addEventListener("click", this._tabButtonEventHandler);
    }
    this._appendDisplayNameChangeEvents();
    this._appendCursorToggleEvent();
    this._appendMETToggleEvent();
    this._appendLogoutEvent();
  }
  _tabButtonEvent(e) {
    const button = e.currentTarget;
    const prevButton = this.tablist.querySelector('[aria-selected="true"]');
    if (button === prevButton) return
    if (prevButton) {
      prevButton.ariaSelected = "false";
    }
    const prevIndex = prevButton ? +prevButton.dataset.index : undefined;
    const newIndex = +button.dataset.index;
    this.activeTab = newIndex;
    button.ariaSelected = "true";
    this._toggleTabVisible(newIndex, true);
    this._toggleTabVisible(prevIndex, false);
  }


  _appendLogoutEvent() {
    const logout = this.accountInfo.logout;
    const logout_button_handler = async () => {
      this.closeModal();
      await logoutUser();
    }
    logout.btn.addEventListener("click", logout_button_handler);
  }

  _appendDisplayNameChangeEvents() {
    const name = this.accountInfo.displayName;
    const change_button_handler = () => {
      this._openChangeDisplayNameVisible(name);
    }

    const save_button_handler = async () => {
      try {
        await this._saveDisplayName(name);

        this._hideChangeDisplayNameVisible(name);
        name.text_input.value = '';
      } catch (err) {
        console.error("Failed to save display name:", err);
      }
    };
    const cancel_button_handler = () => {
      this._hideChangeDisplayNameVisible(name);
      name.text_input.value = '';
    }

    name.change_button.addEventListener("click", change_button_handler);
    name.save_button.addEventListener("click", save_button_handler);
    name.cancel_button.addEventListener("click", cancel_button_handler);
  }
  _openChangeDisplayNameVisible(CONT) {
    toggleVisible(CONT.change_button, false);
    toggleVisible(CONT.save_button, true);
    toggleVisible(CONT.cancel_button, true);
    toggleVisible(CONT.text_input, true);
  }

  _hideChangeDisplayNameVisible(CONT) {
    toggleVisible(CONT.text_input, false);
    toggleVisible(CONT.save_button, false);
    toggleVisible(CONT.cancel_button, false);
    toggleVisible(CONT.change_button, true);
  }

  async _saveDisplayName(CONT) {
    const name = CONT.text_input.value;
    const clear_name = sanitizeUsername(name);
    USERSESSION.display_name = await requestPatchDisplayName(clear_name) || 'Unknown';
  }

  _appendCursorToggleEvent() {
    const customCursorHandler = async () => {
      const currentState = this.options.customCursorToggle.checked;
      USERSETTINGS.customCursor = currentState;
      const savedState = await saveOption("customCursor", currentState);
      if (savedState === "error") {
        this.options.customCursorToggle.checked = !currentState;
        USERSETTINGS.customCursor = !currentState;
      };
      USERSETTINGS.customCursor = this.options.customCursorToggle.checked;
    }
    this.options.customCursor.addEventListener("change", customCursorHandler);
  }
  _appendMETToggleEvent() {
    const METActiveHandler = async () => {
      const currentState = this.options.METVisibleToggle.checked;
      USERSETTINGS.METVisible = currentState;
      const savedState = await saveOption("METVisible", currentState);
      if (savedState === "error") {
        this.options.METVisibleToggle.checked = !currentState;
        USERSETTINGS.METVisible = !currentState;
      };
    }
    this.options.METVisible.addEventListener("change", METActiveHandler);
  }

  _toggleTabVisible(index, is_visible) {
    if (index === undefined) return
    const tabcontent = this.tabcontent.querySelector(`[data-index="${index}"]`);
    toggleVisible(tabcontent, is_visible);
  }

  _deleteModal() {
    this.container.innerHTML = ``;
    this.generated = false;
  }

  setOuterHandlers(handlerIn = () => {}, handlerOut = () => {}) {
    this.openHendler = () => {
      if (handlerIn) handlerIn();
      this.openModal();
    }
    this.closeHendler = () => {
      this.closeModal();
      if (handlerOut) handlerOut();
    }
  }
  setInnerHandlers() {
    this._setUpButtonsEvents();
  }
  setOuterTargets({open, close}) {
    this.openTarget    = open;
    this.closeTarget   = close ?? null;
  }

  initModal() {
    if (this.openTarget === null) {
      console.log(`The targets for opening the ${this.modalName} have not been specified. Use setTargets(openTarget, closeTarget)`);
      return
    }
    if ((this.openHendler === null) || (this.closeHendler === null)) {
      console.log(`No opening and closing hendler have been defined for the ${this.modalName}. Use setOuterHandlers(openHendler, closeHendler)`);
      return
    }
    if (!this.generated) this._generateModal();
    this._setUpStartState();
    this.setInnerHandlers()

    this.openTarget.addEventListener('click', this.openHendler);
    if (this.closeTarget !== null) this.closeTarget.addEventListener('click', this.closeHendler);
    this.closeBtn.addEventListener('click', this.closeHendler);
    this.initialized    = true;
  }

  deinitModal() {
    this.openTarget.removeEventListener('click', this.openHendler);
    this.closeBtn.removeEventListener('click', this.closeHendler);
    if (this.closeTarget !== null) this.closeTarget.removeEventListener('click', this.closeHendler);
    if (this.generated) this._deleteModal();
    this.openTarget     = null;
    this.closeTarget    = null;
    this.openHendler    = null;
    this.closeHendler   = null;
    this.generated      = false;
    this.initialized    = false;
    this.visible        = false;
    this.activeTab      = 0;
    this.accountInfo   = {
      displayName: {},
      role: {},
      provider: {},
      email: {},
    };
    this.options       = {};
    this.statistics    = {};
    this.container.innerHTML = "";
  }

  openModal() {
    if (!this.initialized) {
      console.log(`${this.modalName} not initialized`);
      return
    };
    toggleModalVisible(this, true);
    this.modalOpened = true;
  }
  closeModal() {
    if (!this.modalOpened) return
    toggleModalVisible(this, false);
    this.modalOpened = false;
  }
}