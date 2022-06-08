import Observer from './observer.js';
import Compile from './compile.js';
import Watcher from './watcher.js';

class Vue {
  constructor(options) {
    this.$options = options.data;
    this.$data = options.data;
    this.$el = options.el;
    this.$methods = options.methods;
    // 数据劫持
    new Observer(this.$data);
    // 代理 vm.xxx 到 vm.$data.xxx
    this.proxy(this, this.$data);
    
    // 模板编译
    this.$el && new Compile(this, this.$el);
  }

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

  $mount(el) {
    this.$el = el;
    new Compile(this, this.$el);
    return this;
  }
}

export default Vue;