import { iconBounds, ICON_SIZE, ScreenIndex } from './markerGeometry.js';
import { MarkerIconStore } from './markerIcons.js';

// Leaflet layers retain popup/event behavior without creating marker elements.
export const CanvasMarker = L.Layer.extend({
  initialize(latlng, options) {
    L.setOptions(this, options);
    this._latlng = L.latLng(latlng);
    this._$visible = true;
    this.color = '#fff';
    this.draggable = false;
  },
  onAdd() { this.options.renderer.addTo(this._map); this.options.renderer.addMarker(this); },
  onRemove() { this.closePopup(); this.closeTooltip(); this.options.renderer.removeMarker(this); },
  getLatLng() { return this._latlng; },
  setLatLng(latlng) {
    const oldLatLng = this._latlng;
    this._latlng = L.latLng(latlng);
    this.options.renderer.invalidate();
    return this.fire('move', { oldLatLng, latlng: this._latlng });
  },
  setIcon(icon) { this.options.icon = icon; this.options.renderer.invalidate(); return this; },
  setColor(color) { this.color = color; this.options.renderer.invalidate(); return this; },
  setZIndexOffset(offset) { this.options.zIndexOffset = offset; this.options.renderer.invalidate(); return this; },
  setVisible(visible) {
    if (this._$visible === visible) return this;
    this._$visible = visible;
    if (!visible) { this.closePopup(); this.closeTooltip(); this.options.renderer.releaseMarker(this); }
    this.options.renderer.invalidate();
    return this.fire('visibilitychange', { visible });
  },
  setDraggable(enabled) {
    this.draggable = enabled;
    if (!enabled) this.options.renderer.cancelDrag(this);
    return this;
  },
  getScreenBounds() { return this._map ? this.options.renderer.boundsFor(this) : null; },
  // Popup's documented icon anchor has no L.Icon on this layer. This is the
  // Leaflet 1.9.4 Popup source-layer hook; keep it isolated here.
  _getPopupAnchor() { return L.point(0, -32); },
});

export const CanvasMarkerLayer = L.Layer.extend({
  options: { pane: 'markerPane' },
  initialize() {
    this.markers = new Set();
    this.index = new ScreenIndex();
    this.icons = new MarkerIconStore(() => this.invalidate());
    this.frame = null;
    this.hovered = null;
    this.focused = null;
    this.drawCount = 0;
    this.dirty = true;
    this.painted = new Set();
  },
  onAdd(map) {
    this.container = map.getContainer();
    this.canvas = L.DomUtil.create('canvas', 'canvas-markers', this.getPane());
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    // A single invisible CSS-transition probe follows Leaflet's zoom camera.
    // Read its transform each animation frame, then draw glyphs at fixed size.
    this.probe = L.DomUtil.create('div', 'canvas-marker-camera', this.getPane());
    this.probe.setAttribute('aria-hidden', 'true');
    this.navigator = L.DomUtil.create('button', 'canvas-marker-navigator', this.container);
    this.navigator.type = 'button';
    this.navigator.textContent = 'Map markers: arrow keys to browse, Enter to open, Escape to close';
    this.navigator.setAttribute('aria-label', 'Map markers');
    this._onKey = e => this.keyDown(e);
    this._onFocus = () => { this.keyboardActive = true; this.updateFocus(); this.invalidate(); };
    this._onBlur = () => { this.keyboardActive = false; this.invalidate(); };
    this.navigator.addEventListener('keydown', this._onKey);
    this.navigator.addEventListener('focus', this._onFocus);
    this.navigator.addEventListener('blur', this._onBlur);
    this.handlers = {
      pointermove: e => this.pointerMove(e), pointerdown: e => this.pointerDown(e),
      pointerup: e => this.pointerUp(e), pointercancel: e => this.pointerCancel(e),
      lostpointercapture: e => this.pointerCancel(e),
      pointerleave: e => { if (e.target === this.container) { this.pointer = null; if (!this.drag) this.setHover(null); } },
      click: e => this.click(e), dblclick: e => this.doubleClick(e),
    };
    for (const [type, handler] of Object.entries(this.handlers)) this.container.addEventListener(type, handler, true);
    this._onResize = () => { this.watchDpr(); this.invalidate(); };
    window.addEventListener('resize', this._onResize);
    this.watchDpr();
    this.invalidate();
  },
  onRemove() {
    this.cancelDrag();
    this.setHover(null);
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.animation = null;
    for (const [type, handler] of Object.entries(this.handlers)) this.container.removeEventListener(type, handler, true);
    window.removeEventListener('resize', this._onResize);
    this.dprQuery?.removeEventListener('change', this._onResize);
    this.navigator.removeEventListener('keydown', this._onKey);
    this.navigator.removeEventListener('focus', this._onFocus);
    this.navigator.removeEventListener('blur', this._onBlur);
    this.canvas.remove(); this.probe.remove(); this.navigator.remove();
    this.index.clear(); this.icons.clear();
    for (const marker of this.painted) delete marker._lastRaster;
    this.painted.clear();
  },
  getEvents() {
    return { move: this.invalidate, zoom: this.invalidate, resize: this.invalidate, zoomstart: this.beginZoom,
      viewreset: this.invalidate, zoomanim: this.animateZoom, zoomend: this.endZoom };
  },
  watchDpr() {
    this.dprQuery?.removeEventListener('change', this._onResize);
    this.dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    this.dprQuery.addEventListener('change', this._onResize, { once: true });
  },
  addMarker(marker) { this.markers.add(marker); this.invalidate(); },
  removeMarker(marker) { this.releaseMarker(marker); this.markers.delete(marker); this.invalidate(); },
  releaseMarker(marker) {
    delete marker._lastRaster;
    this.cancelDrag(marker);
    if (this.hovered === marker) this.setHover(null);
    if (this.focused === marker) this.focused = null;
  },
  invalidate() {
    this.dirty = true;
    if (this._map && this.frame === null) this.frame = requestAnimationFrame(() => this.draw());
  },
  beginZoom() { this.cancelDrag(); this.setHover(null); },
  animateZoom(e) {
    this.cancelDrag();
    this.setHover(null);
    const origin = this._map.containerPointToLayerPoint([0, 0]);
    this.probe.classList.remove('leaflet-zoom-animated');
    L.DomUtil.setTransform(this.probe, origin, 1);
    const points = new Map([...this.markers].map(m => [m, this._map.latLngToContainerPoint(m.getLatLng())]));
    const anchor = this._map.containerPointToLatLng([0, 0]);
    void this.probe.offsetWidth;
    this.probe.classList.add('leaflet-zoom-animated');
    // The only camera compatibility hook, matching Leaflet 1.9.4 markers.
    const destination = this._map._latLngToNewLayerPoint(anchor, e.zoom, e.center);
    L.DomUtil.setTransform(this.probe, destination, this._map.getZoomScale(e.zoom));
    this.animation = { points };
    this.invalidate();
  },
  endZoom() { this.animation = null; this.probe.classList.remove('leaflet-zoom-animated'); this.invalidate(); },
  pointFor(marker) {
    const base = this.animation?.points.get(marker);
    return base && this.camera ? L.point(base.x * this.camera.scale + this.camera.x, base.y * this.camera.scale + this.camera.y)
      : this._map.latLngToContainerPoint(marker.getLatLng());
  },
  boundsFor(marker) { return iconBounds(this.pointFor(marker)); },
  draw() {
    this.frame = null;
    if (!this._map) return;
    const start = performance.now();
    this.dirty = false;
    const size = this._map.getSize(), dpr = window.devicePixelRatio || 1;
    if (this.canvas.width !== Math.ceil(size.x * dpr) || this.canvas.height !== Math.ceil(size.y * dpr)) {
      this.canvas.width = Math.ceil(size.x * dpr); this.canvas.height = Math.ceil(size.y * dpr);
      this.canvas.style.width = `${size.x}px`; this.canvas.style.height = `${size.y}px`;
    }
    L.DomUtil.setPosition(this.canvas, this._map.containerPointToLayerPoint([0, 0]));
    if (this.animation) {
      const probe = this.probe.getBoundingClientRect(), rect = this.container.getBoundingClientRect();
      this.camera = { scale: probe.width, x: probe.left - rect.left, y: probe.top - rect.top };
    }
    const ctx = this.ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);
    this.index.clear();
    this.visible = [...this.markers].filter(m => m._$visible).map(marker => {
      const point = this.pointFor(marker);
      return { marker, bounds: iconBounds(point), z: Math.round(point.y) + (marker.options.zIndexOffset || 0) };
    }).filter(({ bounds: b }) => b.x + b.width >= 0 && b.y + b.height >= 0 && b.x <= size.x && b.y <= size.y)
      .sort((a, b) => a.z - b.z);
    const painted = new Set(this.visible.map(item => item.marker));
    for (const marker of this.painted) if (!painted.has(marker)) delete marker._lastRaster;
    this.painted = painted;
    for (const item of this.visible) {
      const { marker, bounds: b } = item;
      const entry = this.icons.get(marker.options.icon, marker.color, dpr);
      if (entry?.image) marker._lastRaster = entry.image;
      // Keep the last painted glyph while a new color/icon decodes, avoiding
      // empty frames during rapid color-picker input. Offscreen references are
      // released above, so only the current viewport's working set is retained.
      const raster = entry?.image || marker._lastRaster;
      if (raster) ctx.drawImage(raster, this.animation ? b.x : Math.round(b.x), this.animation ? b.y : Math.round(b.y), ICON_SIZE, ICON_SIZE);
      this.index.add(item);
    }
    this.updateFocus();
    if (this.keyboardActive && this.focused) {
      const b = this.boundsFor(this.focused);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
    }
    this.drawCount++;
    this.lastDrawMs = performance.now() - start;
    if (!this.animation && !this.drag && this.pointer) this.setHover(this.hit(this.pointer), true);
    if (this.animation) this.invalidate();
  },
  hit(event) {
    if (this.dirty) this.drawNow();
    if (!this.isSurface(event)) return null;
    return this.index.hit(this.eventPoint(event));
  },
  drawNow() { cancelAnimationFrame(this.frame); this.frame = null; this.draw(); },
  eventPoint(e) { return this._map.mouseEventToContainerPoint(e); },
  isSurface(e) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    return target && this.container.contains(target) && !target.closest('.leaflet-popup, .leaflet-control, button, a, input, select, textarea');
  },
  setHover(marker, moved = false) {
    const previous = this.hovered;
    if (previous !== marker) {
      previous?.fire('mouseout');
      this.hovered = marker;
      marker?.fire('mouseover');
      this.container.classList.toggle('canvas-marker-hover', !!marker);
    }
    if (previous !== marker || moved && marker) this.fire('hoverchange', { marker, previous });
  },
  pointerMove(e) {
    this.pointer = e.pointerType === 'touch' ? null : { clientX: e.clientX, clientY: e.clientY };
    if (this.drag && this.drag.pointerId === e.pointerId) {
      e.preventDefault(); e.stopImmediatePropagation();
      const drag = this.drag, point = this.eventPoint(e);
      if (!drag.moved && point.distanceTo(drag.start) < 3) return;
      if (!drag.moved) { drag.moved = true; drag.marker.fire('dragstart', { originalEvent: e }); }
      drag.marker.setLatLng(this._map.containerPointToLatLng(point.subtract(drag.offset)));
      drag.marker.fire('drag', { originalEvent: e, latlng: drag.marker.getLatLng() });
      return;
    }
    const marker = this.animation ? null : this.hit(e);
    this.setHover(marker);
    marker?.fire('mousemove', { originalEvent: e, latlng: marker.getLatLng() });
  },
  pointerDown(e) {
    if (!e.isPrimary && this.drag) this.cancelDrag();
    if (!e.isPrimary || e.button !== 0 || this.animation) return;
    this.suppressClick = false;
    const marker = this.hit(e);
    marker?.fire('mousedown', { originalEvent: e, latlng: marker.getLatLng() });
    if (!marker?.draggable) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const start = this.eventPoint(e);
    this.drag = { marker, start, offset: start.subtract(this._map.latLngToContainerPoint(marker.getLatLng())),
      pointerId: e.pointerId, original: marker.getLatLng(), moved: false,
      mapDragging: this._map.dragging.enabled() };
    this._map.dragging.disable();
    this.container.setPointerCapture(e.pointerId);
  },
  pointerUp(e) {
    if (this.drag?.pointerId !== e.pointerId) {
      this.hit(e)?.fire('mouseup', { originalEvent: e }); return;
    }
    e.preventDefault(); e.stopImmediatePropagation();
    this.finishDrag(false, e);
  },
  pointerCancel(e) { if (this.drag?.pointerId === e.pointerId) this.finishDrag(true, e); },
  cancelDrag(marker) { if (this.drag && (!marker || this.drag.marker === marker)) this.finishDrag(true); },
  finishDrag(cancelled, event) {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    this.suppressClick = drag.moved || cancelled;
    if (this.container.hasPointerCapture(drag.pointerId)) this.container.releasePointerCapture(drag.pointerId);
    if (drag.mapDragging) this._map.dragging.enable();
    if (cancelled && drag.moved) {
      drag.marker.setLatLng(drag.original);
      drag.marker.fire('drag', { cancelled: true, latlng: drag.original });
    }
    if (drag.moved) drag.marker.fire('dragend', { cancelled, originalEvent: event });
    drag.marker.fire('mouseup', { cancelled, originalEvent: event });
    this.invalidate();
  },
  click(e) {
    if (this.suppressClick) { this.suppressClick = false; e.stopImmediatePropagation(); e.preventDefault(); return; }
    const marker = this.animation ? null : this.hit(e);
    if (!marker || this._map.dragging.moved()) return;
    e.stopImmediatePropagation();
    this._map.fire('preclick', { originalEvent: e });
    marker.fire('click', { originalEvent: e, latlng: marker.getLatLng(), containerPoint: this.eventPoint(e) });
  },
  doubleClick(e) {
    const marker = this.hit(e);
    if (marker) { e.stopImmediatePropagation(); marker.fire('dblclick', { originalEvent: e, latlng: marker.getLatLng() }); }
  },
  updateFocus() {
    const markers = this.visible?.map(i => i.marker) || [];
    if (!markers.includes(this.focused)) this.focused = markers[0] || null;
    const label = this.focused ? `${this.focused.$data?.name || 'Marker'}, ${markers.indexOf(this.focused) + 1} of ${markers.length}. Arrow keys to browse; Enter to open; Escape to close.` : 'No visible map markers';
    if (this.navigator.getAttribute('aria-label') !== label) {
      this.navigator.setAttribute('aria-label', label);
      this.navigator.textContent = label;
    }
    this.navigator.disabled = markers.length === 0;
  },
  keyDown(e) {
    const markers = this.visible?.map(i => i.marker) || [];
    if (!markers.length) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault(); e.stopPropagation();
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      this.focused = markers[(markers.indexOf(this.focused) + step + markers.length) % markers.length];
      this.updateFocus(); this.invalidate();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); e.stopPropagation();
      this.focused?.fire('click', { latlng: this.focused.getLatLng(), originalEvent: e });
    } else if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); this.focused?.closePopup();
    }
  },
});
