import Dep from './dep.js';

// 劫持重写数组的原型方法，而为了污染污染 Array.prototype，可以对需要观测的数组进行特殊处理
// 通过 Object.create(Array.prototype) 创建一个中间对象(委托自 Array.prototype)，
// 在这个中间对象上重写 push、pop、shift、unshift、splice、sort、reverse 等方法，
// 就不会污染 Array.prototype，然后让这个中间对象成为 待观测数组的原型( targetArray.__proto__ = arrayMethods)

const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

methodsToPatch.forEach(method => {
  // 缓存原型自身的方法
  const original = arrayProto[method];

  Object.defineProperty(arrayMethods, method, {
    value: function mutator(...args) {
      // 调用原型方法
      const result = original.apply(this, args);
      return result;
    },
    enumerable: false,
    writable: true,
    configurable: true,
  });
})

class Observer {
  constructor(data) {
    this.data = data;

    if (Array.isArray(data)) {
      this.observeArray(data);
    } else {
      this.walk(data);
    }
  }

  walk(data) {
    for (let key in data) {
      if (hasOwnProperty.call(data, key)) {
        defineReactive(data, key, data[key]);
      }
    }
  }

  observeArray(data) {
    data.__proto__ = arrayMethods;
    data.forEach(item => {
      if (item && typeof item === 'object') {
        this.walk(item);
      } else {
        defineReactive(data, item, data[item]);
      }
    });
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

export default Observer;