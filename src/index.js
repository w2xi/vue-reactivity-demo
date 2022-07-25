import Observer from './observer.js';
import Compile from './compile.js';
import Watcher from './watcher.js';
import { noop } from './utils';

export default class MiniVue {
  constructor(options) {
    this.$options = options.data;
    this.$data = options.data;
    this.$el = options.el;
    this.$methods = options.methods;
    // 存储事件
    this._events = {};
    // 数据劫持
    new Observer(this.$data);
    // 代理 vm.xxx 到 vm.$data.xxx
    this.proxy(this, this.$data);
    // 模板编译
    this.$el && new Compile(this, this.$el);
  }

  // 代理 vm.xxx 到 vm.$data.xxx
  proxy(vm, data) {
    for (let key in data) {
      if (Reflect.has(data, key)) {
        Object.defineProperty(vm, key, {
          configurable: true,
          enumerable: true,
          get() {
            return vm.$data[key];
          },
          set(value) {
            vm.$data[key] = value;
          },
        });
      }
    }
  }

  $watch(expOrFn, cb, options) {
    const vm = this;
    options = options || {};
    const watcher = new Watcher(vm, expOrFn, cb, options);
    
    if (options.immediate) { // 立即执行一次回调
      cb.call(vm, watcher.value);
    }
    // 返回 unwatchFn 用于取消观察数据
    return function unwatchFn() {
      // 在依赖列表中移除该watcher实例
      watcher.teardown();
    }
  }

  // 添加属性
  $set(obj, key, val) {
    obj[key] = val;
    // 派发通知 更新依赖 (e.g template)
    obj.__ob__.dep.notify();
  }

  // 删除属性
  $delete(obj, key) {
    if (Array.isArray(obj)) {
      obj.splice(key, 1);
    } else {
      delete obj[key];
      obj[key].__ob__.dep.notify();
    }
  }

  // EventEmitter 
  // 参考: https://github.com/Olical/EventEmitter

  // 监听事件
  $on(event, fn) {
    (this._events[event] || (this._events[event] = [])).push(fn);
  }

  // 触发事件
  $emit(event, ...args) {
    const cbs = this._events[event];
    if (!cbs) {
      this._events[event] = [];
      return;
    }
    cbs.forEach(cb => {
      cb.apply(this, args);
    });
  }

  // 销毁事件
  $off(event, fn) {
    const cbs = this._events[event];
    if (!fn) {
      cbs.length = [];
      return;
    }
    let size = cbs.length;
    while (size--) {
      if (fn === cbs[size]) {
        cbs.splice(size, 1);
      }
    }
  }

  // 监听一个一次性的事件，回调执行后 会自动销毁事件
  $once(event, fn) {
    const on = (...args) => {
      // 移除
      this.$off(event, on);
      // 执行
      fn.apply(this, args);
    }
    // 监听
    this.$on(event, on);
  }

  $mount(el) {
    this.$el = el;
    new Compile(this, this.$el);
    return this;
  }
}