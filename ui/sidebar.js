import { APPSTATE, USERSESSION, TOOLSTATE } from "../core/state.js"
import { paintMarkers } from "../features/markers.js"
import { subscribeUI } from "./UIUtilities.js"
import { htmlGenerator } from "../features/utilities.js"
import { startPointShareMode, stopPointShareMode } from "../features/URLRouter.js"

// Обьявление объектов панелей 
export const OPTSIDEBAR = {};
export const FILTERSIDEBAR = {};
export const AUTHTOPBAR = {};
export const TOOLSIDEBAR = {};

/*
export const INFOPOPAP = {};

export function cacheInfoElements() {
  INFOPOPAP.infoSection       = document.getElementById('info-section');
  INFOPOPAP.infoPopap         = INFOPOPAP.infoSection.querySelector('.info-popap');
  INFOPOPAP.closeButton       = INFOPOPAP.infoPopap.querySelector('.info-popap-close-button');
  INFOPOPAP.closeImg          = INFOPOPAP.closeButton.querySelector('.info-popap-close-img');
  INFOPOPAP.popapBody         = INFOPOPAP.infoPopap.querySelector('.info-popap-body');
}

export function initInfoElements(){
  INFOPOPAP.popapBody
}*/

export function cacheToolElements() {
  TOOLSIDEBAR.toolSection       = document.getElementById('tool-section');
  TOOLSIDEBAR.toolPanel         = TOOLSIDEBAR.toolSection.querySelector('.tool-panel');
  TOOLSIDEBAR.pointShareButton  = TOOLSIDEBAR.toolPanel.querySelector('.point-share-tool');
  TOOLSIDEBAR.pointShareImg     = TOOLSIDEBAR.pointShareButton.querySelector('.share-img');
}

export function initToolElements(){
  TOOLSIDEBAR.pointShareButton.addEventListener("click", togglePointShareMode)
  subscribeUI("pointShare", () => {
    TOOLSIDEBAR.pointShareButton.classList.toggle('active', TOOLSTATE.pointShare)
  })
}


function togglePointShareMode() {
  TOOLSTATE.pointShare = !TOOLSTATE.pointShare
  if (TOOLSTATE.pointShare) {
    startPointShareMode();
  } else {
    stopPointShareMode();
  }
}

// Кешироние DOM елементов панели параметров
export function cacheOptElements() {
  OPTSIDEBAR.optionsSection       = document.getElementById('options-section');
  OPTSIDEBAR.optionsHeader        = OPTSIDEBAR.optionsSection.querySelector('.optionheader');
  OPTSIDEBAR.optionsHeaderText    = OPTSIDEBAR.optionsHeader.querySelector('.optheader');
  OPTSIDEBAR.optHideBtn           = OPTSIDEBAR.optionsHeader.querySelector('.option-hide');
  OPTSIDEBAR.optHideBtnImg        = OPTSIDEBAR.optHideBtn.querySelector('.option-hide-img');
  OPTSIDEBAR.optHideBtnText       = OPTSIDEBAR.optHideBtn.querySelector('.option-hide-text');
  OPTSIDEBAR.optionsBody          = OPTSIDEBAR.optionsSection.querySelector('.options-body');
  OPTSIDEBAR.optionsParams        = OPTSIDEBAR.optionsBody.querySelector('.optparam');
  OPTSIDEBAR.customCursorToggle   = OPTSIDEBAR.optionsParams.querySelector('.toggle-cursor-checkbox');
  OPTSIDEBAR.coloredRegionsToggle = OPTSIDEBAR.optionsParams.querySelector('.toggle-regions-checkbox');
  OPTSIDEBAR.heightDisplayToggle  = OPTSIDEBAR.optionsParams.querySelector('.toggle-height-checkbox');
  OPTSIDEBAR.coloredMarkersToggle = OPTSIDEBAR.optionsParams.querySelector('.toggle-color-checkbox');
  OPTSIDEBAR.customColorsToggle   = OPTSIDEBAR.optionsParams.querySelector('.toggle-customcolor-checkbox');
  OPTSIDEBAR.instantFilterToggle  = OPTSIDEBAR.optionsParams.querySelector('.toggle-instantf-checkbox');
}

// Инициализация панели параметров
export function initOptElements() {
  APPSTATE.optMenuState = !APPSTATE.isMobile;
  optmenuStyleSet(APPSTATE.optMenuState, false);
  OPTSIDEBAR.optHideBtn.addEventListener('click', () => {
    APPSTATE.optMenuState = !APPSTATE.optMenuState;
    if (APPSTATE.isMobile) {
      APPSTATE.filterMenuState = false;
      filtermenuStyleSet(APPSTATE.filterMenuState, APPSTATE.optMenuState);
    };
    optmenuStyleSet(APPSTATE.optMenuState, false);
  });
}

export function initOptToggle() {
  OPTSIDEBAR.coloredRegionsToggle.addEventListener('change', () => {
    APPSTATE.coloredRegionsEnabled = !APPSTATE.coloredRegionsEnabled;
    paintMarkers();
  });

  OPTSIDEBAR.heightDisplayToggle.addEventListener('change', () => {
    APPSTATE.heightDisplayEnabled = !APPSTATE.heightDisplayEnabled;
    paintMarkers();
  });

  OPTSIDEBAR.coloredMarkersToggle.addEventListener('change', () => {
    APPSTATE.coloredMarkersEnabled = !APPSTATE.coloredMarkersEnabled;
    paintMarkers();
  });

  OPTSIDEBAR.customColorsToggle.addEventListener('change', () => {
    APPSTATE.customColorsEnabled = !APPSTATE.customColorsEnabled;
    //paintMarkers();
  });
};


// Кешироние DOM елементов панели фильтров
export function cacheFilterElements() {
  FILTERSIDEBAR.filterHideBtn     = document.getElementById('filter-hide');
  FILTERSIDEBAR.filterClearBtn    = document.getElementById('filter-reset');
  FILTERSIDEBAR.filterContainer   = document.getElementById('filter-container');
  FILTERSIDEBAR.filterBody        = FILTERSIDEBAR.filterContainer.querySelector('.filters-body');
  FILTERSIDEBAR.filterHeader      = FILTERSIDEBAR.filterContainer.querySelector('.filterheader');
  FILTERSIDEBAR.filterHeaderText  = FILTERSIDEBAR.filterHeader.querySelector('.filheader');
  FILTERSIDEBAR.filterSections    = FILTERSIDEBAR.filterContainer.querySelector('.filter-sections');
  prepareFilterHTML(FILTERSIDEBAR.filterSections);
  FILTERSIDEBAR.filterHideBtnImg  = document.getElementById('filter-hide-img');
  FILTERSIDEBAR.filterHideBtnText = document.getElementById('filter-hide-text');
  FILTERSIDEBAR.undergroundSwitch = document.getElementById('underground');
  FILTERSIDEBAR.collectedSwitch   = document.getElementById('collected');
}

function prepareFilterHTML(parent) {
  parent.querySelector('.filter-icon').innerHTML = `${htmlGenerator("content-grid")}\n${htmlGenerator("collectible-grid")}\n${htmlGenerator("icon-grid")}`;
  parent.querySelector('.filter-region').innerHTML = htmlGenerator("region-list");
}

// Инициализация панели фильтров
export function initFilterElements() {
  APPSTATE.filterMenuState = !APPSTATE.isMobile;
  filtermenuStyleSet(APPSTATE.filterMenuState, false);
  FILTERSIDEBAR.filterHideBtn.addEventListener('click', () => {
    APPSTATE.filterMenuState = !APPSTATE.filterMenuState;
    if (APPSTATE.isMobile) {
        APPSTATE.optMenuState = false;
        optmenuStyleSet(APPSTATE.optMenuState, APPSTATE.filterMenuState);
    };
    filtermenuStyleSet(APPSTATE.filterMenuState, false);
  });
}

// Кешироние DOM елементов панели авторизации(верхняя панель)
export function cacheAuthElements() {
  AUTHTOPBAR.authHfilterContainer  = document.getElementById('auth-hfilter-container');
  AUTHTOPBAR.authContainer         = AUTHTOPBAR.authHfilterContainer.querySelector('#auth-container');
  AUTHTOPBAR.loginButton           = AUTHTOPBAR.authContainer.querySelector('#login-button');
  AUTHTOPBAR.usernameDisplay       = AUTHTOPBAR.authContainer.querySelector('#username-display');
  AUTHTOPBAR.userContainer         = AUTHTOPBAR.authContainer.querySelector('#user-container');
  AUTHTOPBAR.authImg               = AUTHTOPBAR.userContainer.querySelector('#auth-img');
  AUTHTOPBAR.userMenu              = AUTHTOPBAR.userContainer.querySelector('#user-menu');
  subscribeUI("display_name", () => {
    AUTHTOPBAR.usernameDisplay.textContent = USERSESSION.display_name || 'Unknown';
  })
}

export function toggleAuthorizationUI(authorized) {
  AUTHTOPBAR.usernameDisplay.classList.toggle('authorized', authorized);
  AUTHTOPBAR.loginButton.classList.toggle('hide', authorized);
  AUTHTOPBAR.authImg.classList.toggle('authorized', authorized);
}


// Переключатель состояния панели параметров
export function optmenuStyleSet(ostate, fstate) {
  const displaced = APPSTATE.isMobile && fstate;
  setPanelState(OPTSIDEBAR.optionsSection, OPTSIDEBAR.optHideBtn, ostate, displaced);
  OPTSIDEBAR.optHideBtnText.textContent = ostate ? "Hide" : "Open";
}

// Переключатель состояния панели фильтров
export function filtermenuStyleSet(fstate, ostate) {
  AUTHTOPBAR.authHfilterContainer.classList.toggle('open', fstate);
  FILTERSIDEBAR.filterHeader.classList.toggle('open', fstate);
  FILTERSIDEBAR.filterClearBtn.classList.toggle('open', fstate);
  FILTERSIDEBAR.filterHeaderText.classList.toggle('open', fstate);
  FILTERSIDEBAR.filterHideBtn.classList.toggle('open', fstate);
  const displaced = APPSTATE.isMobile && ostate;
  setPanelState(FILTERSIDEBAR.filterContainer, FILTERSIDEBAR.filterHideBtn, fstate, displaced);
  FILTERSIDEBAR.filterHideBtnText.textContent = fstate ? "Hide" : "Open";
}

function setPanelState(container, button, expanded, displaced) {
  container.classList.toggle('is-collapsed', !expanded);
  container.classList.toggle('is-displaced', displaced);
  container.toggleAttribute('inert', displaced);
  container.setAttribute('aria-hidden', String(displaced));
  button.setAttribute('aria-expanded', String(expanded));
  const body = container.querySelector('.sidebar-body');
  body.toggleAttribute('inert', !expanded);
  body.setAttribute('aria-hidden', String(!expanded));
}

export function startHeaderAnim(ms) {
  FILTERSIDEBAR.filterHeader.style.setProperty('--debounce-ms', ms + 'ms');
  FILTERSIDEBAR.filterHeader.classList.remove('debouncing');
  FILTERSIDEBAR.filterHeader.offsetWidth;
  FILTERSIDEBAR.filterHeader.classList.add('debouncing');
}

export function stopHeaderAnim() {
  FILTERSIDEBAR.filterHeader.classList.remove('debouncing');
  FILTERSIDEBAR.filterHeader.style.removeProperty('--debounce-ms');
}
