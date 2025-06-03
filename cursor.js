const customCursor = document.getElementById('custom-cursor');
document.addEventListener('mousemove', e => {
  // Центрируем SVG под указателем (можно сместить по-другому)
  customCursor.style.left = (e.clientX - 26) + 'px';
  customCursor.style.top  = (e.clientY - 26) + 'px';
});