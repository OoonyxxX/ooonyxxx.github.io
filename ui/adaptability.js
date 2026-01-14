import { toggleMET, MetEditor } from "../features/metEditor.js"
import { APPMETSTATE, APPSTATE} from "../core/state.js"
import { OPTSIDEBAR, FILTERSIDEBAR, AUTHTOPBAR, optmenuStyleSet, filtermenuStyleSet } from "../ui/sidebar.js"


export function initUI() {
  //Основные переменные и слушатели
  //START

  let mobileC = window.matchMedia("(max-width: 400px)");
  APPSTATE.isMobileC = mobileC.matches;

  let mobile = window.matchMedia("(max-width: 768px)");

  APPSTATE.isMobile = mobile.matches;
  APPSTATE.isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
  APPSTATE.isDesktop_HD = window.matchMedia("(min-width: 1025px) and (max-width: 1280px)").matches;
  APPSTATE.isDesktop_HDPlus = window.matchMedia("(min-width: 1281px) and (max-width: 1600px)").matches;
  APPSTATE.isDesktop_FullHD = window.matchMedia("(min-width: 1601px) and (max-width: 1920px)").matches;
  APPSTATE.isDesktop_2K = window.matchMedia("(min-width: 1921px) and (max-width: 2560px)").matches;
  APPSTATE.isDesktop_4K = window.matchMedia("(min-width: 2560px) and (max-width: 3840px)").matches;
  APPSTATE.hasTouch = navigator.maxTouchPoints > 0;

  window.addEventListener("load", () => {
    if (APPSTATE.isMobileC) {
      onEnterMobileC();
    }
    if (APPSTATE.isMobile && APPSTATE.isMobileC) {
      setTimeout(() => {
        document.querySelector(".options-container").classList.add("transition");
        document.querySelector(".optionheader").classList.add("transition");
        document.querySelector(".optparam").classList.add("transition");
        document.querySelector(".filter-container").classList.add("transition");
        document.querySelector(".filterheader").classList.add("ftransition");
        document.querySelector(".filheader").classList.add("transition");
        document.querySelector(".filter-hide").classList.add("transition");
        document.querySelector(".btn-reset").classList.add("transition");
      }, 200);
    } else {
      document.querySelector(".options-container").classList.add("transition");
      document.querySelector(".optionheader").classList.add("transition");
      document.querySelector(".optparam").classList.add("transition");
      document.querySelector(".filter-container").classList.add("transition");
      document.querySelector(".filterheader").classList.add("ftransition");
      document.querySelector(".filheader").classList.add("transition");
      document.querySelector(".filter-hide").classList.add("transition");
      document.querySelector(".btn-reset").classList.add("transition");
    }
  });

  window.addEventListener("resize", () => {
    APPSTATE.isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
    APPSTATE.isDesktop_HD = window.matchMedia("(min-width: 1025px) and (max-width: 1280px)").matches;
    APPSTATE.isDesktop_HDPlus = window.matchMedia("(min-width: 1281px) and (max-width: 1600px)").matches;
    APPSTATE.isDesktop_FullHD = window.matchMedia("(min-width: 1601px) and (max-width: 1920px)").matches;
    APPSTATE.isDesktop_2K = window.matchMedia("(min-width: 1921px) and (max-width: 2560px)").matches;
    APPSTATE.isDesktop_4K = window.matchMedia("(min-width: 2560px) and (max-width: 3840px)").matches;
    APPSTATE.hasTouch = navigator.maxTouchPoints > 0;
  });

  mobile.addEventListener('change', (e) => {
    const next = e.matches;
    if (next === APPSTATE.isMobile) return;
    APPSTATE.isMobile = next;
    if (APPSTATE.isMobile) onEnterMobile();
    else onExitMobile();
  });

  mobileC.addEventListener('change', (e) => {
    const next = e.matches;
    if (next === APPSTATE.isMobileC) return;
    APPSTATE.isMobileC = next;
    if (APPSTATE.isMobileC) onEnterMobileC();
    else onExitMobileC();
  });

  //END
  //Основные переменные и слушатели
  if (APPSTATE.isMobile) {
    AUTHTOPBAR.loginButton.textContent = "";
  } else {
    AUTHTOPBAR.loginButton.textContent = "Login";
  };

}



//Функции адаптивности
//START
function onEnterMobile() {
  APPSTATE.filterMenuState = false;
  filtermenuStyleSet(false, false);

  APPSTATE.optMenuState = false;
  optmenuStyleSet(false, false);

  toggleMET(false);
  
  AUTHTOPBAR.loginButton.textContent = "";
}

function onExitMobile() {
  if (APPMETSTATE.METStart) {
    if (!APPMETSTATE.METInited) {
      APPMETSTATE.METInited = true;
      const MET = MetEditor();
      MET.init()
    }
    toggleMET(true);
  } else {
    toggleMET(false);
  }
  AUTHTOPBAR.loginButton.textContent = "Login";
}

function onEnterMobileC() {
  OPTSIDEBAR.optHideBtnText.textContent = APPSTATE.optMenuState ? "Hide" : "";
  OPTSIDEBAR.optHideBtnImg.classList.toggle('open', !APPSTATE.optMenuState);
  FILTERSIDEBAR.filterHideBtnText.textContent = APPSTATE.filterMenuState ? "Hide" : "";
  FILTERSIDEBAR.filterHideBtnImg.classList.toggle('open', !APPSTATE.filterMenuState);
  
  AUTHTOPBAR.loginButton.textContent = "";
}

function onExitMobileC() {
  OPTSIDEBAR.optHideBtnText.textContent = APPSTATE.optMenuState ? "Hide" : "open";
  FILTERSIDEBAR.filterHideBtnText.textContent = APPSTATE.filterMenuState ? "Hide" : "open";
  OPTSIDEBAR.optHideBtnImg.classList.remove('open');
  FILTERSIDEBAR.filterHideBtnImg.classList.remove('open');
  
  AUTHTOPBAR.loginButton.textContent = "Login";
}
//END
//Функции адаптивности