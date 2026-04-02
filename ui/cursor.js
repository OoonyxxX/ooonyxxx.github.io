import { APPSTATE, USERSETTINGS } from "../core/state.js"
import { OPTSIDEBAR } from "./sidebar.js"

const CURSORITEM = {
    scaleGroup: null,
    activeSelectors: null,
    ticking: false,
}

export function cacheCursor() {
  CURSORITEM.customCursor = document.getElementById('custom-cursor');
  CURSORITEM.customCursorEnabled = USERSETTINGS.customCursor ?? true;
  CURSORITEM.customCursorActive = false;
  CURSORITEM.customCursorAllowed = false;
  CURSORITEM.scaleGroup = document.getElementById('scaleSup');
  CURSORITEM.activeSelectors = '.leaflet-marker-icon, a, button, input[type="checkbox"], .leaflet-popup-close-button, .auth-img, .icon-item, .collected, .region';
  CURSORITEM.ticking = false;
  CURSORITEM.cursorCenter = { X: 26, Y: 26 };
  CURSORITEM.mouse = { X: 0, Y: 0 };

  CURSORITEM.timerProgress = document.getElementById('timerProgressCircle');
  CURSORITEM.blueTimer     = document.getElementById('TimerBlue');
  CURSORITEM.redTimer      = document.getElementById('TimerRed');
  CURSORITEM.timer         = { dragTimer: null, cancelOnMove: null };
}


export function initCursor() {
  OPTSIDEBAR.customCursorToggle.checked = CURSORITEM.customCursorEnabled;
  cursorConductor(APPSTATE.hasTouch);
  document.addEventListener('pointermove', handleMouseMove);
  window.addEventListener("resize", () => {
    cursorConductor(APPSTATE.hasTouch);
  });
  OPTSIDEBAR.customCursorToggle.addEventListener("change", (e) => {
    CURSORITEM.customCursorEnabled = e.target.checked;
    cursorConductor(APPSTATE.hasTouch);
  });
}

function cursorConductor(touch) {
  if (touch) {
    CURSORITEM.customCursorAllowed = false;
    return
  }
  if (CURSORITEM.customCursorEnabled) {
    CURSORITEM.customCursorAllowed = true;
  }
  if (!CURSORITEM.customCursorAllowed && CURSORITEM.customCursorActive) cursorActive(false);
}

function cursorActive(isActive) {
  document.body.classList.toggle('custom-cursor-on', isActive);
  CURSORITEM.customCursor.classList.toggle('active', isActive);
  if (isActive) {
    document.addEventListener('pointerover', cursorHoverStartHendler);
    document.addEventListener('pointerout', cursorHoverStopHendler);
  } else {
    document.removeEventListener('pointerover', cursorHoverStartHendler);
    document.removeEventListener('pointerout', cursorHoverStopHendler);
  }
}

function handleMouseMove(e) {
  CURSORITEM.mouse.X = e.clientX;
  CURSORITEM.mouse.Y = e.clientY;
  if (!CURSORITEM.customCursorAllowed && !CURSORITEM.customCursorActive) return;
  if (!CURSORITEM.customCursorAllowed && CURSORITEM.customCursorActive) cursorActive(CURSORITEM.customCursorAllowed);
  if (!CURSORITEM.customCursorActive) {
    CURSORITEM.customCursorActive = true;
    moveCursor();
    cursorActive(CURSORITEM.customCursorAllowed);
  } else {
    moveCursor();
  }
}

function moveCursor() {
  if (CURSORITEM.ticking) return;

  CURSORITEM.ticking = true;

  requestAnimationFrame(() => {
    CURSORITEM.customCursor.style.transform = `translate(
      ${CURSORITEM.mouse.X - CURSORITEM.cursorCenter.X}px, 
      ${CURSORITEM.mouse.Y - CURSORITEM.cursorCenter.Y}px
    )`;

    CURSORITEM.ticking = false;
  });
}

function cursorHoverSet(isHover) {
  if (isHover) {
    CURSORITEM.customCursor.classList.remove('cursor-base');
    CURSORITEM.customCursor.classList.add('cursor-base--hover');
    CURSORITEM.scaleGroup.style.transform = 'scale(0.85)';
  } else {
    CURSORITEM.customCursor.classList.remove('cursor-base--hover');
    CURSORITEM.customCursor.classList.add('cursor-base');
    CURSORITEM.scaleGroup.style.transform = 'scale(0.6)';
  }
}

function cursorHoverStartHendler(e) {
  const isNowActive = e.target.closest(CURSORITEM.activeSelectors);
  const wasActive = e.relatedTarget?.closest(CURSORITEM.activeSelectors);

  if (isNowActive && !wasActive) {
    cursorHoverSet(true);
  }
}

function cursorHoverStopHendler(e) {
  const wasActive = e.target.closest(CURSORITEM.activeSelectors);
  const isNowActive = e.relatedTarget?.closest(CURSORITEM.activeSelectors);

  if (wasActive && !isNowActive) {
    cursorHoverSet(false);
  }
}



export function setDraggingMode(e, dragging) {
  const editingMarker = e.target;
  if (dragging) {
    CURSORITEM.timer.cancelOnMove = () => {
      stopTimerAnim();
      editingMarker.off('mousemove', CURSORITEM.timer.cancelOnMove);
      editingMarker.dragging.disable();
      editingMarker.dragging.enable();
    };
    startTimerAnim();
    editingMarker.on('mousemove', CURSORITEM.timer.cancelOnMove);
    CURSORITEM.timer.dragTimer = setTimeout(() => {
      editingMarker.off('mousemove', CURSORITEM.timer.cancelOnMove);
    }, 350);
  } else {
    stopTimerAnim();
    if (CURSORITEM.timer.cancelOnMove) {
      editingMarker.off('mousemove', CURSORITEM.timer.cancelOnMove);
    }
    editingMarker.dragging.enable();
  }
}

function startTimerAnim() {
  if (!CURSORITEM.timerProgress || !CURSORITEM.blueTimer) return;
  restartTimerAnim();
  CURSORITEM.timerProgress.classList.add('timer-progress');
  CURSORITEM.blueTimer.style.display = 'inline';
}

function restartTimerAnim() {
  CURSORITEM.timerProgress.classList.remove('timer-progress');
  void CURSORITEM.timerProgress.offsetWidth;
}

function stopTimerAnim() {
  if (!CURSORITEM.timerProgress || !CURSORITEM.blueTimer) return;
  clearTimeout(CURSORITEM.timer.dragTimer);
  CURSORITEM.timerProgress.classList.remove('timer-progress');
  CURSORITEM.blueTimer.style.display = 'none';
}