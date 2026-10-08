// Leaflet's dimensions and pan padding use CSS pixels. These theme values
// are deliberately px. Read the header's computed height even while the
// startup .hide-i utility still hides it during marker loading.
export function popupViewportOptions(editor = false) {
  const theme = getComputedStyle(document.documentElement);
  const padding = parseFloat(theme.getPropertyValue('--popup-pan-padding'));
  const header = document.querySelector('.header-container');
  const headerHeight = header ? parseFloat(getComputedStyle(header).height) : 0;
  return {
    autoPan: !editor,
    keepInView: true,
    autoPanPaddingTopLeft: [padding, headerHeight + padding],
    autoPanPaddingBottomRight: [padding, padding],
    ...(editor ? { maxWidth: parseFloat(theme.getPropertyValue('--met-form-width')) } : {})
  };
}
