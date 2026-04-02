import { initFilters } from "./features/filters.js"
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
import { cacheWindowMatches, initWindowEvents } from "./ui/adaptability.js"
import { initCursor } from "./ui/cursor.js"
import { loadMapData } from "./features/markers.js"

import { checkAuth } from "./api/auth_api.js"


document.addEventListener('DOMContentLoaded', () => {
    cacheAuthElements();
    cacheOptElements();
    cacheFilterElements();
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