import Dep from './dep.js';
import { parsePath } from './utils';
class Watcher {
  constructor(vm, exp, cb) {
    this.vm = vm;
    this.exp = exp;
    // 执行 this.getter() 就可以读取 vm.a.b.c 的内容
    this.getter = parsePath(exp);
    this.cb = cb;
    this.value = this.get();
  }

  get() {
    Dep.target = this;
    const value = this.getter.call(this.vm, this.vm); // 触发 getter
    Dep.target = undefined;
    return value;
  }

  update() {
    const value = this.getter.call(this.vm, this.vm);
    const oldValue = this.value;

    if (value !== oldValue) {
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }
}

export default Watcher;