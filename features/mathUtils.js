export function vectorSubtract(a, b) {
  return {
    X: a.X - b.X,
    Y: a.Y - b.Y
  };
}

export function vectorEqual(a, b) {
  return a.X === b.X && a.Y === b.Y;
}

export function vectorAdd(a, b) {
  return {X: a.X + b.X, Y: a.Y + b.Y};
}

export function vectorScalar(a) {
  return Math.hypot(a.X, a.Y)
}