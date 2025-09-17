const customCursor = document.getElementById('custom-cursor');
const scaleGroup = document.getElementById('scaleSup');
const customCursorMode   = document.getElementById('toggle-cursor');
const activeSelectors = '.leaflet-marker-icon, a, button, .leaflet-popup-close-button, .auth-img, .icon-item, .collected, .region';


let customCursorEnabled = true;
document.body.classList.add('custom-cursor-on');

let mouseX = 0, mouseY = 0, ticking = false;
customCursor.style.opacity = '0';

/*
function cursorTouchClear(Touch) {
	if (!Touch) {
		if (customCursorEnabled) {
			document.removeEventListener('mousemove', handleMouseMove);
		}
		customCursorMode.removeEventListener('change', cursorToggle);
		document.removeEventListener('mouseover', cursorHoverStart);
		document.removeEventListener('mouseout', cursorHoverStop);
	} else {
		customCursor.style.display = 'block';
		customCursorMode.removeEventListener('change', customCursorLock);
	}
}
*/
 
function cursorTouchTester(Touch) {
	if (!Touch) {
		if (customCursorEnabled) {
			document.addEventListener('mousemove', handleMouseMove);
		}
		document.body.classList.toggle('custom-cursor-on', customCursorEnabled);
		customCursor.style.display = customCursorEnabled ? 'block' : 'none';
		customCursorMode.addEventListener('change', cursorToggle);
		document.addEventListener('mouseover', cursorHoverStart);
		document.addEventListener('mouseout', cursorHoverStop);
		customCursorMode.removeEventListener('change', customCursorLock);
	} else {
		customCursor.style.display = 'none';
		customCursorMode.removeEventListener('change', cursorToggle);
		customCursorMode.addEventListener('change', customCursorLock);
	}
}

function cursorToggle() {
  customCursorEnabled = !customCursorEnabled;
  customCursor.style.display = customCursorEnabled ? 'block' : 'none';
  document.body.classList.toggle('custom-cursor-on', customCursorEnabled);
	if (customCursorEnabled) {
		document.addEventListener('mousemove', handleMouseMove);
	} else {
		document.removeEventListener('mousemove', handleMouseMove)
	}
}


function cursorHoverStart(e) {
  if (e.target.closest(activeSelectors) && !e.relatedTarget?.closest(activeSelectors)) {
	customCursor.classList.remove('cursor-base');
	customCursor.classList.add('cursor-base--hover');
	scaleGroup.style.transform = 'scale(1)';
  }
}

function cursorHoverStop(e) {
  if (e.target.closest(activeSelectors) && !e.relatedTarget?.closest(activeSelectors)) {
	customCursor.classList.remove('cursor-base--hover');
	customCursor.classList.add('cursor-base');
	scaleGroup.style.transform = 'scale(0.7)';
  }
}

function customCursorLock() {
  customCursorEnabled = !customCursorEnabled;
  customCursor.style.display = 'none';
}

function handleMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!ticking) {
	requestAnimationFrame(() => {
	  if (customCursorEnabled) {
		customCursor.style.transform = `translate(${mouseX - 26}px, ${mouseY - 26}px)`;
	  }
	  ticking = false;
	  customCursor.style.opacity = '1';
	});
	ticking = true;
  }
}

cursorTouchTester (hasTouch)

window.addEventListener("resize", () => {
	cursorTouchTester(hasTouch)
});
