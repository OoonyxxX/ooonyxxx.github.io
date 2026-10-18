import { ICON_SIZE } from './markerGeometry.js';

const FALLBACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M16 2 30 16 16 30 2 16Z" fill="currentColor" stroke="black" stroke-width="2"/></svg>';

export class MarkerIconStore {
  constructor(onReady, maxBytes = 32 * 1024 * 1024) {
    this.onReady = onReady;
    this.maxBytes = maxBytes;
    this.icons = {};
    this.cache = new Map();
    this.bytes = 0;
  }

  async load(descriptors) {
    await Promise.all(descriptors.map(async descriptor => {
      let svg = FALLBACK;
      try {
        const response = await fetch(descriptor.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const document = new DOMParser().parseFromString(text, 'image/svg+xml');
        if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('Invalid SVG');
        svg = text;
      } catch (error) { console.warn(`Marker icon ${descriptor.id}: using fallback`, error); }
      this.icons[descriptor.id] = { id: descriptor.id, svg };
    }));
    this.icons.default ||= { id: 'default', svg: FALLBACK };
    await this.warm(Object.values(this.icons));
    return this.icons;
  }

  get(icon, color = '#fff', dpr = window.devicePixelRatio || 1) {
    icon = icon || this.icons.default;
    if (!icon) return null;
    const pixels = Math.max(1, Math.ceil(ICON_SIZE * dpr));
    const key = JSON.stringify([icon.id, color, pixels]);
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, entry);
      return entry;
    }
    const entry = { image: null, bytes: pixels * pixels * 4 };
    this.cache.set(key, entry);
    entry.promise = this.rasterize(icon.svg, color, pixels).catch(error => {
      console.warn(`Cannot decode marker icon ${icon.id}`, error);
      return this.rasterize(FALLBACK, color, pixels);
    }).then(image => {
      // A cleared cache must not be repopulated by an old asynchronous decode.
      if (this.cache.get(key) !== entry) return;
      entry.image = image;
      this.bytes += entry.bytes;
      this.trim();
      this.onReady?.();
    }).catch(error => { this.cache.delete(key); console.error('Marker fallback could not be decoded', error); });
    return entry;
  }

  async rasterize(svg, color, pixels) {
    const document = new DOMParser().parseFromString(svg.replaceAll('currentColor', color), 'image/svg+xml');
    document.documentElement.setAttribute('width', String(pixels));
    document.documentElement.setAttribute('height', String(pixels));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(document)], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = window.document.createElement('canvas');
      canvas.width = canvas.height = pixels;
      canvas.getContext('2d').drawImage(image, 0, 0, pixels, pixels);
      return canvas;
    } finally { URL.revokeObjectURL(url); }
  }

  warm(icons, color = '#fff', dpr = window.devicePixelRatio || 1) {
    return Promise.all(icons.map(icon => this.get(icon, color, dpr).promise));
  }

  trim() {
    for (const [key, entry] of this.cache) {
      if (this.bytes <= this.maxBytes) break;
      if (!entry.image) continue;
      this.cache.delete(key);
      this.bytes -= entry.bytes;
    }
  }

  clear() { this.cache.clear(); this.bytes = 0; }
}
