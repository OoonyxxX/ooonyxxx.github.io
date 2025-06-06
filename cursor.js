const customCursor = document.getElementById('custom-cursor');
const scaleGroup = document.getElementById('scaleSup');
const customCursorMode   = document.getElementById('toggle-cursor');
// обновление позиции курсора
let customCursorEnabled = true;
document.body.classList.add('custom-cursor-on');

document.addEventListener('mousemove', e => {
  if (customCursorEnabled) {
    customCursor.style.left = (e.clientX - 26) + 'px';
    customCursor.style.top  = (e.clientY - 26) + 'px';
  }
});

customCursorMode.addEventListener('change', () => {
  customCursorEnabled = !customCursorEnabled;
  customCursor.style.display = customCursorEnabled ? 'block' : 'none';
  customCursorMode.textContent = customCursorEnabled ? 'Disable Cursor' : 'Enable Cursor';
  document.body.classList.toggle('custom-cursor-on', customCursorEnabled);
});
customCursorMode.textContent = 'Disable Cursor';

// элемент карты из scriptv2.js
const mapContainer = document.getElementById('map');

// показываем базовый курсор при наведении на карту
//mapContainer.addEventListener('mouseenter', () => {
//  customCursor.classList.remove('cursor-base--hover');
//});

// скрываем кастомный курсор при уходе с карты
//mapContainer.addEventListener('mouseleave', () => {
//  customCursor.classList.remove('cursor-base--hover');
//});

// активные элементы, для которых нужно показывать анимацию hover
const activeSelectors = '.leaflet-marker-icon, a, button, .leaflet-popup-close-button';

document.addEventListener('mouseover', e => {
  if (e.target.closest(activeSelectors) && !e.relatedTarget?.closest(activeSelectors)) {
	customCursor.classList.remove('cursor-base');
    customCursor.classList.add('cursor-base--hover');
	scaleGroup.style.transform = 'scale(1)';
  }
});

document.addEventListener('mouseout', e => {
  if (e.target.closest(activeSelectors) && !e.relatedTarget?.closest(activeSelectors)) {
    customCursor.classList.remove('cursor-base--hover');
    customCursor.classList.add('cursor-base');
    scaleGroup.style.transform = 'scale(0.7)';
  }
});