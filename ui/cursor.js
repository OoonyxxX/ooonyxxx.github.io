import { APPSTATE } from "../core/state.js"

const CURSORITEM = {
    customCursor: null,
    scaleGroup: null,
    customCursorMode: null,
    activeSelectors: null,
    mouseX: 0,
    mouseY: 0,
    ticking: false,
}

export function initCursor() {
    CURSORITEM.customCursor = document.getElementById('custom-cursor');
    CURSORITEM.scaleGroup = document.getElementById('scaleSup');
    CURSORITEM.customCursorMode   = document.getElementById('toggle-cursor');
    CURSORITEM.activeSelectors = '.leaflet-marker-icon, a, button, .leaflet-popup-close-button, .auth-img, .icon-item, .collected, .region';
    APPSTATE.customCursorEnabled = true;

    document.body.classList.add('custom-cursor-on');

    CURSORITEM.customCursor.style.opacity = '0';

    cursorTouchTester(APPSTATE.hasTouch);

    window.addEventListener("resize", () => {
        cursorTouchTester(APPSTATE.hasTouch);
    });

}


function cursorTouchTester(touch) {
    if (!touch) {
        if (APPSTATE.customCursorEnabled) {
            document.addEventListener('mousemove', handleMouseMove);
        }
        document.body.classList.toggle('custom-cursor-on', APPSTATE.customCursorEnabled);
        CURSORITEM.customCursor.style.display = APPSTATE.customCursorEnabled ? 'block' : 'none';
        CURSORITEM.customCursorMode.addEventListener('change', cursorToggle);
        document.addEventListener('mouseover', cursorHoverStart);
        document.addEventListener('mouseout', cursorHoverStop);
        CURSORITEM.customCursorMode.removeEventListener('change', customCursorLock);
    } else {
        CURSORITEM.customCursor.style.display = 'none';
        CURSORITEM.customCursorMode.removeEventListener('change', cursorToggle);
        CURSORITEM.customCursorMode.addEventListener('change', customCursorLock);
    }
}

function cursorToggle() {
    APPSTATE.customCursorEnabled = !APPSTATE.customCursorEnabled;
    CURSORITEM.customCursor.style.display = APPSTATE.customCursorEnabled ? 'block' : 'none';
    document.body.classList.toggle('custom-cursor-on', APPSTATE.customCursorEnabled);
    if (APPSTATE.customCursorEnabled) {
        document.addEventListener('mousemove', handleMouseMove);
    } else {
        document.removeEventListener('mousemove', handleMouseMove)
    }
}


function cursorHoverStart(e) {
    if (e.target.closest(CURSORITEM.activeSelectors) && !e.relatedTarget?.closest(CURSORITEM.activeSelectors)) {
        CURSORITEM.customCursor.classList.remove('cursor-base');
        CURSORITEM.customCursor.classList.add('cursor-base--hover');
        CURSORITEM.scaleGroup.style.transform = 'scale(1)';
    }
}

function cursorHoverStop(e) {
    if (e.target.closest(CURSORITEM.activeSelectors) && !e.relatedTarget?.closest(CURSORITEM.activeSelectors)) {
        CURSORITEM.customCursor.classList.remove('cursor-base--hover');
        CURSORITEM.customCursor.classList.add('cursor-base');
        CURSORITEM.scaleGroup.style.transform = 'scale(0.7)';
    }
}

function customCursorLock() {
    APPSTATE.customCursorEnabled = !APPSTATE.customCursorEnabled;
    CURSORITEM.customCursor.style.display = 'none';
}

function handleMouseMove(e) {
    CURSORITEM.mouseX = e.clientX;
    CURSORITEM.mouseY = e.clientY;
    if (!CURSORITEM.ticking) {
        requestAnimationFrame(() => {
        if (APPSTATE.customCursorEnabled) {
            CURSORITEM.customCursor.style.transform = `translate(${CURSORITEM.mouseX - 26}px, ${CURSORITEM.mouseY - 26}px)`;
        }
        CURSORITEM.ticking = false;
        CURSORITEM.customCursor.style.opacity = '1';
        });
        CURSORITEM.ticking = true;
    }
}