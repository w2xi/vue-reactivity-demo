export function query(el) {
  if (typeof el === "string") {
    return document.querySelector(el);
  } else if (el.nodeType === 3) {
    // dom node
    return el;
  }
  throw new Error("[el]: Dom元素不存在");
}

// 简单路径解析
// a.b.c => data[a][b][c]
export function parsePath(path) {
  if (/[^\w.$]/.test(path)) {
    return;
  }
  const segment = path.split('.')
  return (obj) => {
    for (let i = 0; i < segment.length; i++) {
      if (!obj) return;
      obj = obj[segment[i]];
    }
    return obj;
  }
}

export function isObject(obj) {
  return obj !== null && typeof obj === "object";
}

export function def(obj, key, value, enumerable) {
  Object.defineProperty(obj, key, {
    value,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

export function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function noop() {}