import { APPSTATE, USERSETTINGS } from "../core/state.js"
import { OPTSIDEBAR } from "./sidebar.js"
import { subscribeUI } from "./UIUtilities.js"
import { switchAgentTarget } from "../features/contentPreview.js"

const CURSORITEM = {
  activeSelectors: null,
  ticking: false,
}

export function cacheCursor() {
  CURSORITEM.customCursor = document.getElementById('custom-cursor');
  CURSORITEM.customCursorActive = false;
  CURSORITEM.customCursorAllowed = false;
  CURSORITEM.activeSelectors = `
  .leaflet-marker-icon, 
  a, 
  button, 
  option,
  input[type="checkbox"], 
  .leaflet-popup-close-button, 
  .action-img,
  .icon-item, 
  .underground, 
  .collected, 
  .region`;
  CURSORITEM.markerSelector = `.leaflet-marker-icon`;
  CURSORITEM.ticking = false;
  const center = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cursor-size')) / 2;
  CURSORITEM.cursorCenter = { X: center, Y: center };
  CURSORITEM.mouse = { X: 0, Y: 0 };

  CURSORITEM.timerProgress = document.getElementById('timerProgressCircle');
  CURSORITEM.blueTimer     = document.getElementById('TimerBlue');
  CURSORITEM.redTimer      = document.getElementById('TimerRed');
  CURSORITEM.timer         = { dragTimer: null, cancelOnMove: null };
}


export function initCursor() {
  OPTSIDEBAR.customCursorToggle.checked = USERSETTINGS.customCursor;
  cursorConductor(APPSTATE.hasTouch);
  document.addEventListener('pointermove', handleMouseMove);
  window.addEventListener("resize", () => {
    cursorConductor(APPSTATE.hasTouch);
  });
  subscribeUI("customCursor", () => {
    OPTSIDEBAR.customCursorToggle.checked = USERSETTINGS.customCursor;
    cursorConductor(APPSTATE.hasTouch);
  })
  OPTSIDEBAR.customCursorToggle.addEventListener("change", (e) => {
    USERSETTINGS.customCursor = e.target.checked;
    cursorConductor(APPSTATE.hasTouch);
  });
  CURSORITEM.customCursor.popover = 'manual';
  CURSORITEM.customCursor.showPopover();
  document.addEventListener('pointerover', pointerOverHendler);
  document.addEventListener('pointerout', pointerOutHendler);
}

function cursorConductor(touch) {
  CURSORITEM.customCursorAllowed = !touch && USERSETTINGS.customCursor;
  if (!CURSORITEM.customCursorAllowed && CURSORITEM.customCursorActive) {
    CURSORITEM.customCursorActive = false;
    cursorActive(CURSORITEM.customCursorAllowed);
  };
}

function cursorActive(isActive) {
  document.body.classList.toggle('custom-cursor-on', isActive);
  CURSORITEM.customCursor.classList.toggle('is-active', isActive);
}

function handleMouseMove(e) {
  CURSORITEM.mouse.X = e.clientX;
  CURSORITEM.mouse.Y = e.clientY;
  if (!CURSORITEM.customCursorAllowed && !CURSORITEM.customCursorActive) return;
  if (!CURSORITEM.customCursorAllowed && CURSORITEM.customCursorActive) {
    CURSORITEM.customCursorActive = false;
    cursorActive(CURSORITEM.customCursorAllowed);
  };
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
  } else {
    CURSORITEM.customCursor.classList.remove('cursor-base--hover');
    CURSORITEM.customCursor.classList.add('cursor-base');
  }
}

function pointerOverHendler(e){
  if (USERSETTINGS.contentPreview) {
    const target = e.target
    const marker = target.closest(CURSORITEM.markerSelector);
    switchAgentTarget(marker);
  }
  
  if (!CURSORITEM.customCursorAllowed) return
  cursorHoverStart(e)
}

function cursorHoverStart(e) {
  const target = e.target
  const relatedTarget = e.relatedTarget
  const isNowActive = target.closest(CURSORITEM.activeSelectors);
  const wasActive = relatedTarget?.closest(CURSORITEM.activeSelectors);

  if (isNowActive && !wasActive) {
    cursorHoverSet(true);
  }
}

function pointerOutHendler(e) {
  if (USERSETTINGS.contentPreview) {
    const relatedTarget = e.relatedTarget
    const marker = relatedTarget?.closest(CURSORITEM.markerSelector);
    switchAgentTarget(marker);
  }
  
  if (!CURSORITEM.customCursorAllowed) return
  cursorHoverStop(e)
}


function cursorHoverStop(e) {
  const target = e.target
  const relatedTarget = e.relatedTarget
  const wasActive = target.closest(CURSORITEM.activeSelectors);
  const isNowActive = relatedTarget?.closest(CURSORITEM.activeSelectors);

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

export function raiseCursor() {
  requestAnimationFrame(() => {
    if (!this.icon.matches(':open')) return;

    CURSORITEM.customCursor.hidePopover();
    CURSORITEM.customCursor.showPopover();
  });
}