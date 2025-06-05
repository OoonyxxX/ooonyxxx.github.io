const targetGroup = document.getElementById('pointArrayToHover');

let angle = 0;
let scale = 0.7;
let targetScale = 0.7;
let isAnimating = false;

// Константы
const rotationDuration = 8000;  // 8s (в мс)
const scaleDuration    = 200;   // 0.2s (в мс)

let lastTimestamp = null;

function animateCursor(timestamp) {
  if (!isAnimating) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Обновляем угол
  const degreesPerMs = 360 / rotationDuration;
  angle = (angle + delta * degreesPerMs) % 360;

  // Обновляем масштаб — через линейное приближение
  const scaleDiff = targetScale - scale;
  const maxStep = delta / scaleDuration;  // прогресс от 0 до 1
  scale += scaleDiff * Math.min(1, maxStep);

  // Применяем трансформацию
  targetGroup.setAttribute('transform', `translate(26,26) rotate(${angle},26,26) scale(${scale}) translate(-26,-26)`);

  requestAnimationFrame(animateCursor);
}

function startHoverEffect() {
  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(animateCursor) // запускаем цикл
  }
  targetScale = 1.0; // хотим увеличить
}

function stopHoverEffect() {
  targetScale = 0.7; // хотим уменьшить
  setTimeout(() => {
    if (Math.abs(scale - 0.7) < 0.01) {
      isAnimating = false; // останавливаем цикл, когда закончит
    } else {
      requestAnimationFrame(animateCursor); // продолжаем пока не закончит
    }
  }, 200); // немного подождать перед остановкой
}

const customCursor = document.getElementById('custom-cursor');
// обновление позиции курсора
document.addEventListener('mousemove', e => {
  customCursor.style.left = (e.clientX - 26) + 'px';
  customCursor.style.top  = (e.clientY - 26) + 'px';
});

// элемент карты из scriptv2.js
const mapContainer = document.getElementById('map');

// показываем базовый курсор при наведении на карту
mapContainer.addEventListener('mouseenter', () => {
  customCursor.classList.add('cursor-base');
  customCursor.classList.remove('cursor-base--hover');
});

// скрываем кастомный курсор при уходе с карты
mapContainer.addEventListener('mouseleave', () => {
  customCursor.classList.remove('cursor-base', 'cursor-base--hover');
});

// активные элементы, для которых нужно показывать анимацию hover
const activeSelectors = '.leaflet-marker-icon, a, button, .leaflet-popup-close-button';

document.addEventListener('mouseover', e => {
  if (e.target.closest(activeSelectors)) {
    customCursor.classList.add('cursor-base--hover');
	startHoverEffect();
  }
});

document.addEventListener('mouseout', e => {
  if (e.target.closest(activeSelectors)) {
    customCursor.classList.remove('cursor-base--hover');
	stopHoverEffect();
  }
});