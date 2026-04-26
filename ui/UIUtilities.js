const subscribers = new Map();
const dirtyKeys = new Set();
let scheduled = false;

export function subscribeUI(key, callback) {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key).add(callback);
}

function notify(key) {
  dirtyKeys.add(key);

  if (!scheduled) {
    scheduled = true;
    queueMicrotask(flushUI);
  }
}

function flushUI() {
  scheduled = false;

  for (const key of dirtyKeys) {
    const set = subscribers.get(key);
    if (!set) continue;

    for (const callback of set) {
      callback();
    }
  }

  dirtyKeys.clear();
}


export function proxifyObjToUpdateUI(obj) {
  const proxy = new Proxy(obj, {
    set(target, key, value) {
      if (target[key] === value) return true;

      target[key] = value;
      notify(key);
      return true;
    }
  });
  return proxy
}

export function sanitizeUsername(raw) {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9 _.-]/g, '')
    .slice(0, 32);
}