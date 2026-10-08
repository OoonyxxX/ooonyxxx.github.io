import { METActiveController } from "../features/metEditor.js"
import { APPSTATE } from "../core/state.js"
import { AUTHTOPBAR, optmenuStyleSet, filtermenuStyleSet } from "../ui/sidebar.js"


export function cacheWindowMatches() {
  APPSTATE.isMobileC = window.matchMedia("(max-width: 400px)").matches;
  APPSTATE.isMobile = window.matchMedia("(max-width: 768px)").matches;
  APPSTATE.isTablet = window.matchMedia("(min-width: 769px) and (max-width: 1024px)").matches;
  APPSTATE.isDesktop_HD = window.matchMedia("(min-width: 1025px) and (max-width: 1280px)").matches;
  APPSTATE.isDesktop_HDPlus = window.matchMedia("(min-width: 1281px) and (max-width: 1600px)").matches;
  APPSTATE.isDesktop_FullHD = window.matchMedia("(min-width: 1601px) and (max-width: 1920px)").matches;
  APPSTATE.isDesktop_2K = window.matchMedia("(min-width: 1921px) and (max-width: 2560px)").matches;
  APPSTATE.isDesktop_4K = window.matchMedia("(min-width: 2560px) and (max-width: 3840px)").matches;
  APPSTATE.hasTouch = navigator.maxTouchPoints > 0;
}

export function initWindowEvents() {
  // Initialization can finish after window.load because it waits for the API.
  // CSS owns transitions; refresh state immediately and on viewport changes.
  let previousMobile = APPSTATE.isMobile;
  const refresh = () => {
    cacheWindowMatches();
    if (APPSTATE.isMobile !== previousMobile) {
      APPSTATE.optMenuState = !APPSTATE.isMobile;
      APPSTATE.filterMenuState = !APPSTATE.isMobile;
      previousMobile = APPSTATE.isMobile;
    }
    optmenuStyleSet(APPSTATE.optMenuState, APPSTATE.isMobile && APPSTATE.filterMenuState);
    filtermenuStyleSet(APPSTATE.filterMenuState, APPSTATE.isMobile && APPSTATE.optMenuState);
    AUTHTOPBAR.loginButton.textContent = APPSTATE.isMobile ? '' : 'Login';
    METActiveController();
  };
  window.addEventListener('resize', refresh);
  refresh();
}
