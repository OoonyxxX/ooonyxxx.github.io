import { cacheFilterData, initFilters } from "./features/filters.js"
import { cacheMETUIElements } from "./features/metEditor.js"
import { cacheOptElements, 
        initOptElements,
        initOptToggle, 
        cacheFilterElements, 
        initFilterElements, 
        cacheAuthElements, 
        cacheHeaderElements,
        cacheLoginModalElements 
        } from "./ui/sidebar.js"
import { cacheModalElements } from "./ui/modal.js"
import { cacheWindowMatches, initWindowEvents } from "./ui/adaptability.js"
import { cacheCursor, initCursor } from "./ui/cursor.js"
import { loadMapData } from "./features/markers.js"

import { checkAuth } from "./api/auth_api.js"


document.addEventListener('DOMContentLoaded', () => {
    cacheAuthElements();
    cacheModalElements();
    cacheOptElements();
    cacheFilterElements();
    cacheFilterData()
    cacheHeaderElements();
    cacheMETUIElements();
    cacheWindowMatches();
    cacheLoginModalElements();
    cacheCursor();

    initOptElements();
    initOptToggle();
    initFilterElements();

    initWindowEvents();
    initFilters();
    initCursor();
    checkAuth();

    loadMapData();
});