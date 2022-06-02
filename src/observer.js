export default class Observer {
  constructor(data) {
    this.data = data;

    if (!Array.isArray(data)) {
      this.walk(data);
    }
  }

  walk(data) {
    for (let key in data) {
      if (Reflect.has(data, key)) {
        defineReactive(data, key, data[key]);
      }
    }
  }
}

export function defineReactive(data, key, value) {
  if (value && typeof value === "object") {
    // 递归遍历子属性
    new Observer(value);
  }
  const dep = new Dep();
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      dep.depend();
      return value;
    },
    set(newValue) {
      if (value !== newValue) {
        value = newValue;
        dep.notify();
      }
    },
  });
}