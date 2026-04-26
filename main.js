import { cacheFilterData, initFilters } from "./features/filters.js"
import { cacheMETUIElements } from "./features/metEditor.js"
import { cacheOptElements, 
        initOptElements,
        initOptToggle, 
        cacheFilterElements, 
        initFilterElements, 
        cacheAuthElements, 
        cacheHeaderElements,
        } from "./ui/sidebar.js"
import { cacheModalElements, initModals } from "./ui/modal.js"
import { cacheWindowMatches, initWindowEvents } from "./ui/adaptability.js"
import { cacheCursor, initCursor } from "./ui/cursor.js"
import { loadMapData } from "./features/markers.js"

import { checkAuth, loadAuthorizationModals } from "./api/auth_api.js"


document.addEventListener('DOMContentLoaded', async () => {
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

    initWindowEvents();
    initFilters();
    initCursor();
    await checkAuth();

    await loadMapData();
    loadAuthorizationModals()
});