import { initFilters } from "./features/filters.js"
import { initMETUIElements } from "./features/metEditor.js"
import { initOptElements, initFilterElements, initAuthElements, initHeaderElements } from "./ui/sidebar.js"
import { initUI } from "./ui/adaptability.js"
import { initCursor } from "./ui/cursor.js"
import { initOptToggle, loadMapData } from "./features/markers.js"



document.addEventListener('DOMContentLoaded', () => {
    initAuthElements();
    initUI();
    initCursor();
    initOptElements();
    initOptToggle();
    initFilterElements();
    initHeaderElements();
    
    initMETUIElements();
    
    loadMapData();
    
    
    initFilters();

});