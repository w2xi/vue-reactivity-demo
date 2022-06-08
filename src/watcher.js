import Dep from './dep.js';
import { parsePath, isObject } from './utils';

class Watcher {
  constructor(vm, expOrFn, cb, options) {
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.deep = options ? !!options.deep : false;
    // 订阅的 Dep，即 watcher 实例被收集到哪些Dep里
    this.deps = [];
    this.depIds = new Set();
    // 执行 this.getter() 就可以读取 vm.a.b.c 的内容
    this.getter = typeof expOrFn === 'function' ? expOrFn : parsePath(expOrFn);
    this.cb = cb;
    this.value = this.get();
  }

  get() {
    Dep.target = this;
    const value = this.getter.call(this.vm, this.vm); // 触发 getter

    if (this.deep) {
      traverse(value);
    }
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

  // Dep 会记录数据发生变化时，需要通知哪些 Wacther，
  // 而 Watcher 中也记录了自己会被哪些 Dep 通知
  // Dep 和 Watcher 的关系是 多对多 的关系
  addDep(dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addSub(this); 
    }
  }

  // 从所有依赖项的Dep列表中将自己移除
  teardown() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
  }
}

export default Watcher;

const seenObjects = new Set();

function traverse(value) {
  _traverse(value, seenObjects);
}

function _traverse(value, seen) {
  const isA = Array.isArray(value);
  if (!isA && !isObject(value) || Object.isFrozen(value)) {
    return;
  }

  if (value.__ob__) {
    const depId = value.__ob__.dep.id;

    if (!seen.has(depId)) {
      seen.add(depId);
    }
  }

  if (isA) {
    let i = value.length;
    while (i--) {
      _traverse(value[i], seen);
    }
  } else {
    const keys = Object.keys(value);
    keys.forEach(key => {
      // value[key] 触发 getter，即触发收集依赖的操作
      _traverse(value[key], seen);
    });
  }
}