import { APPSTATE} from "../core/state.js"

// Обьявление объектов панелей 
export const OPTSIDEBAR = {};
export const FILTERSIDEBAR = {};
export const AUTHTOPBAR = {};
export const HEADERTOPBAR = {};

// Инициализация панели параметров
export function initOptElements() {
    OPTSIDEBAR.optHideBtn           = document.getElementById('option-hide');
    OPTSIDEBAR.optionsContainer     = document.getElementById('options-container');
    OPTSIDEBAR.optionsHeader        = OPTSIDEBAR.optionsContainer.querySelector('.optionheader');
    OPTSIDEBAR.optionsHeaderText    = OPTSIDEBAR.optionsHeader.querySelector('.optheader');
    OPTSIDEBAR.optHideBtnImg        = document.getElementById('option-hide-img');
    OPTSIDEBAR.optHideBtnText       = document.getElementById('option-hide-text');
    OPTSIDEBAR.coloredRegionsToggle = document.getElementById('toggle-regions');
    OPTSIDEBAR.heightDisplayToggle  = document.getElementById('toggle-height');
    OPTSIDEBAR.coloredMarkersToggle = document.getElementById('toggle-color');
    OPTSIDEBAR.customColorsToggle   = document.getElementById('toggle-customcolor');
    OPTSIDEBAR.instantFilterToggle  = document.getElementById('toggle-instantf');

    optmenuStyleSet(!APPSTATE.isMobile, false);
    //Слушатель адаптации панели параметров
    OPTSIDEBAR.optHideBtn.addEventListener('click', () => {
        APPSTATE.optMenuState = !APPSTATE.optMenuState;
        if (APPSTATE.isMobile) {
            APPSTATE.filterMenuState = false;
            filtermenuStyleSet(APPSTATE.filterMenuState, APPSTATE.optMenuState);
        };
        optmenuStyleSet(APPSTATE.optMenuState, false);
    });

}

// Инициализация панели фильтров
export function initFilterElements() {
    FILTERSIDEBAR.filterHideBtn     = document.getElementById('filter-hide');
    FILTERSIDEBAR.filterClearBtn    = document.getElementById('filter-reset');
    FILTERSIDEBAR.filterContainer   = document.getElementById('filter-container');
    FILTERSIDEBAR.filterHeader      = FILTERSIDEBAR.filterContainer.querySelector('.filterheader');
    FILTERSIDEBAR.filterHeaderText  = FILTERSIDEBAR.filterHeader.querySelector('.filheader');
    FILTERSIDEBAR.filterHideBtnImg  = document.getElementById('filter-hide-img');
    FILTERSIDEBAR.filterHideBtnText = document.getElementById('filter-hide-text');

    filtermenuStyleSet(!APPSTATE.isMobile, false);
    //Слушатель адаптации панели фильтров
    FILTERSIDEBAR.filterHideBtn.addEventListener('click', () => {
        APPSTATE.filterMenuState = !APPSTATE.filterMenuState;
        if (APPSTATE.isMobile) {
            APPSTATE.optMenuState = false;
            optmenuStyleSet(APPSTATE.optMenuState, APPSTATE.filterMenuState);
        };
        filtermenuStyleSet(APPSTATE.filterMenuState, false);
    });

}

// Иницаилизация панели авторизации(верхняя панель)
export function initAuthElements() {
    AUTHTOPBAR.authContainer         = document.getElementById('auth-container');
    AUTHTOPBAR.loginButton           = document.getElementById('login-button');
    AUTHTOPBAR.usernameDisplay       = document.getElementById('username-display');
    AUTHTOPBAR.authImg               = document.getElementById('auth-img');
    AUTHTOPBAR.authHfilterContainer  = document.getElementById('auth-hfilter-container');
}

export function initHeaderElements() {
    HEADERTOPBAR.header = document.getElementById('filterheader');
}


APPSTATE.optMenuState = !APPSTATE.isMobile;
APPSTATE.filterMenuState = !APPSTATE.isMobile;

// Переключатель состояния панели параметров
export function optmenuStyleSet(ostate, fstate) {
    OPTSIDEBAR.optionsContainer.classList.toggle('hide', !ostate);
    OPTSIDEBAR.optionsContainer.classList.toggle('close', fstate);
    OPTSIDEBAR.optionsHeader.classList.toggle('hide', !ostate);
    OPTSIDEBAR.optHideBtn.classList.toggle('hide', !ostate);
    
    OPTSIDEBAR.optionsHeaderText.classList.toggle('hide', !ostate);
    
    if (APPSTATE.isMobileC) {
        OPTSIDEBAR.optHideBtnText.textContent = ostate ? "Hide" : "";
        OPTSIDEBAR.optHideBtnImg.classList.toggle('open', !ostate);
    } else {
        OPTSIDEBAR.optHideBtnText.textContent = ostate ? "Hide" : "Open";
    }
}
// Переключатель состояния панели фильтров
export function filtermenuStyleSet(fstate, ostate) {
    AUTHTOPBAR.authHfilterContainer.classList.toggle('open', fstate);
    FILTERSIDEBAR.filterContainer.classList.toggle('hide', !fstate);
    FILTERSIDEBAR.filterContainer.classList.toggle('close', ostate);
    FILTERSIDEBAR.filterHeader.classList.toggle('hide', !fstate);

    FILTERSIDEBAR.filterHideBtn.classList.toggle('hide', !fstate);
    FILTERSIDEBAR.filterClearBtn.classList.toggle('hide', !fstate);
    FILTERSIDEBAR.filterHeaderText.classList.toggle('hide', !fstate);

    if (APPSTATE.isMobileC) {
        FILTERSIDEBAR.filterHideBtnText.textContent = fstate ? "Hide" : "";
        FILTERSIDEBAR.filterHideBtnImg.classList.toggle('open', !fstate);
    } else {
        FILTERSIDEBAR.filterHideBtnText.textContent = fstate ? "Hide" : "Open";
    }
}

export function startHeaderAnim(ms) {
  HEADERTOPBAR.header.style.setProperty('--debounce-ms', ms + 'ms');
  HEADERTOPBAR.header.classList.remove('debouncing');
  HEADERTOPBAR.header.offsetWidth;
  HEADERTOPBAR.header.classList.add('debouncing');
}

export function stopHeaderAnim() {
  HEADERTOPBAR.header.classList.remove('debouncing');
  HEADERTOPBAR.header.style.removeProperty('--debounce-ms');
}
