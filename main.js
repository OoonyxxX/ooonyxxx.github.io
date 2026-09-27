import { checkAppState } from "./api/app_api.js"

await waitForDOM();

const status = await checkAppState();
switch (status.maintenance) {
    case "normal":
        normalStart();
        break;
    case "maintenance":
        maintenanceStart();
        break;
    case "admin_maintenance":
        await normalStart();
        document.getElementById('maintenanceTag').classList.remove("hide-i");
        break;
    default:
        break;
}

async function normalStart(){
    const { cacheFilterData, initFilters } = await import ("./features/filters.js")
    const { cacheMETUIElements } = await import ("./features/metEditor.js")
    const { cacheOptElements, 
            initOptElements,
            initOptToggle, 
            cacheFilterElements, 
            initFilterElements, 
            cacheAuthElements, 
            cacheHeaderElements,
            } = await import ("./ui/sidebar.js")
    const { cacheModalElements, initModals } = await import ("./ui/modal.js")
    const { cacheWindowMatches, initWindowEvents } = await import ("./ui/adaptability.js")
    const { cacheCursor, initCursor } = await import ("./ui/cursor.js")
    const { loadMapData } = await import ("./features/markers.js")
    const { initContentPreview } = await import ("./features/contentPreview.js")
    const { checkAuth, loadAuthorizationModals } = await import ("./api/auth_api.js")

    cacheAuthElements();
    cacheModalElements();
    cacheOptElements();
    cacheFilterElements();
    cacheFilterData()
    cacheHeaderElements();
    cacheMETUIElements();
    cacheWindowMatches();
    cacheCursor();
    initModals();
    initOptElements();
    initOptToggle();
    initFilterElements();
    initContentPreview();

    initWindowEvents();
    initFilters();
    initCursor();
    await checkAuth();

    await loadMapData();
    loadAuthorizationModals()

    document.querySelector('.header-container').classList.remove("hide-i");
    document.querySelector('.met').classList.remove("hide-i");
    document.querySelector('#map-controls').classList.remove("hide-i");
    document.querySelector('#map').classList.remove("hide-i");
    document.querySelector('.footer-container').classList.remove("hide-i");
    document.querySelector('#marker-form-template').classList.remove("hide-i");
    document.querySelector('#custom-cursor').classList.remove("hide-i");
}

async function maintenanceStart(){
    document.querySelector('#maintenanceModal').classList.remove("hide-i");
    document.querySelector('#map').classList.remove("hide-i");
}


function waitForDOM() {
    if (document.readyState !== "loading") {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    });
}