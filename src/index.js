import Observer from './observer.js';
import Compile from './compile.js';
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

  $mount(el) {
    this.$el = el;
    new Compile(this, this.$el);
  }
}

export default Vue;