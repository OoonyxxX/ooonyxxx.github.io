import { proxifyObjToUpdateUI } from "../ui/UIUtilities.js"
import { USERSESSIONDEFAULT } from "../api/config_api.js";

export const APPSTATE = {
    isMobile: false,
    isMobileC: false,
    optMenuState: true,
    filterMenuState: true,
    coloredRegionsEnabled: false,
    heightDisplayEnabled: false,
    coloredMarkersEnabled: true,
    customColorsEnabled: false,
    instantFilterEnabled: true,
    hasTouch: false,
    isDesktop_HD: false,
    isDesktop_HDPlus: false,
    isDesktop_FullHD: false,
    isDesktop_2K: false,
    isDesktop_4K: false,
};

export const USERSESSION = proxifyObjToUpdateUI(...USERSESSIONDEFAULT)

export const USERINFO = proxifyObjToUpdateUI({
    collected: 0,
    collectedAll: 0,
})

export const USERSETTINGS = proxifyObjToUpdateUI({
  METVisible: true,
  customCursor: true,
  instantFilter: true,
  theme: "Northern Lights"
})