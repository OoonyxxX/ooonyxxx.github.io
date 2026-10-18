export const ICON_SIZE = 32;
export const ICON_ANCHOR = [16, 32];

export function iconBounds(point) {
  return { x: point.x - ICON_ANCHOR[0], y: point.y - ICON_ANCHOR[1],
    width: ICON_SIZE, height: ICON_SIZE };
}

export function contains(bounds, point) {
  return point.x >= bounds.x && point.x < bounds.x + bounds.width &&
    point.y >= bounds.y && point.y < bounds.y + bounds.height;
}

// The same rectangles and order feed both painting and pointer selection.
export class ScreenIndex {
  constructor(cellSize = 64) { this.cellSize = cellSize; this.cells = new Map(); }
  clear() { this.cells.clear(); }
  add(item) {
    const { x, y, width, height } = item.bounds;
    for (let row = Math.floor(y / this.cellSize); row <= Math.floor((y + height) / this.cellSize); row++) {
      for (let col = Math.floor(x / this.cellSize); col <= Math.floor((x + width) / this.cellSize); col++) {
        const key = `${col}:${row}`;
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(item);
      }
    }
  }
  hit(point) {
    const items = this.cells.get(`${Math.floor(point.x / this.cellSize)}:${Math.floor(point.y / this.cellSize)}`) || [];
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].marker._$visible && contains(items[i].bounds, point)) return items[i].marker;
    }
    return null;
  }
}
