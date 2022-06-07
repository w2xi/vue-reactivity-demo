import Dep from './dep.js';
import { isObject, def } from './utils';

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
  def(arrayMethods, method, function mutator(...args) {
    // 调用原型方法
    const result = original.apply(this, args);
    // 当前 Observer 实例
    const ob = this.__ob__;

    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        inserted = args.slice(2);
        break;
    }
    // 将新增的数据转为响应式的
    if (inserted) ob.observeArray(inserted);
    // 向依赖发送消息
    ob.dep.notify();

    return result;
  })
})

class Observer {
  constructor(data) {
    this.data = data;
    this.dep = new Dep();
    // 给每个属性都加上 __ob__ 属性，用来标识他们是响应式的
    def(data, '__ob__', this);

    if (Array.isArray(data)) {
      data.__proto__ = arrayMethods;
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
    // 对于数组 在 getter 中收集依赖，在 拦截器中触发依赖 
    data.forEach(item => {
      observe(item);
    });
  }
}

export function observe(data) {
  if (!isObject(data)) {
    return;
  }
  
  let ob;
  if (hasOwnProperty.call(data, '__ob__') && data.__ob__ instanceof Observer) {
    ob = data.__ob__;
  } else {
    ob = new Observer(data);
  }
  return ob;
}

export function defineReactive(data, key, value) {
  let childOb = observe(value);
  const dep = new Dep();

  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      dep.depend();
      // 收集 Array 的依赖
      if (childOb) {
        childOb.dep.depend();
      }
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