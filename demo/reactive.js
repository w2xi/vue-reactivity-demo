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
    new Compile(this, this.$el);
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
}

class Observer {
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

function defineReactive(data, key, value) {
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

// 订阅器 收集依赖
class Dep {
  constructor() {
    this.subs = [];
  }

  depend() {
    this.addSub();
  }

  addSub() {
    if (Dep.target) {
      this.subs.push(Dep.target);
    }
  }

  notify() {
    this.subs.forEach((sub) => {
      sub.update();
    });
  }
}

// 订阅者
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

class Compile {
  constructor(vm, el) {
    this.vm = vm;
    this.el = query(el);
    this.fragment = null;
    this.init();
  }

  init() {
    // 文档片段
    // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createDocumentFragment
    this.fragment = this.nodeToFragment(this.el);
    this.compileElement(this.fragment);
    this.el.appendChild(this.fragment);
  }

  nodeToFragment(el) {
    const fragment = document.createDocumentFragment();
    let child = el.firstChild;

    while (child) {
      // 将Dom元素移入fragment中
      fragment.appendChild(child);
      child = el.firstChild;
    }
    return fragment;
  }

  compileElement(el) {
    const childNodes = el.childNodes;

    [].slice.call(childNodes).forEach((node) => {
      const reg = /\{\{(.*)\}\}/;
      const text = node.textContent;

      if (this.isElementNode(node)) {
        this.compile(node);
      } else if (this.isTextNode(node) && reg.test(text)) {
        this.compileText(node, reg.exec(text)[1].trim());
      }
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node);
      }
    });
  }

  compile(node) {
    const nodeAttrs = node.attributes;

    Array.prototype.forEach.call(nodeAttrs, (attr) => {
      const attrName = attr.name;
      
      if (this.isDirective(attrName)) {
        const exp = attr.value;
        const dir = attrName.slice(2);

        if (this.isEventDirective(dir)) {
          // 事件指令
          this.compileEvent(node, this.vm, exp, dir);
        } else {
          // v-model 指令
          this.compileModel(node, this.vm, exp, dir);
        }
        node.removeAttribute(attrName);
      }
    });
  }

  compileText(node, exp) {
    const getter = parsePath(exp);
    const value = getter.call(this.vm, this.vm);
    
    node.textContent = value || '';

    new Watcher(this.vm, exp, (newValue) => {
      node.textContent = newValue;
    });
  }

  compileEvent(node, vm, exp, dir) {
    // dir: on:click
    const eventType = dir.split(":")[1];
    const cb = vm.$methods && vm.$methods[exp];

    if (eventType && cb) {
      // 绑定事件
      node.addEventListener(eventType, cb.bind(vm), false);
    }
  }

  compileModel(node, vm, exp, dir) {
    let val = this.vm[exp];
    this.modelUpdater(node, val);

    new Watcher(this.vm, exp, (value) => {
      this.modelUpdater(node, value);
    });

    node.addEventListener("input", (e) => {
      const newValue = e.target.value;

      if (val === newValue) {
        return;
      }
      this.vm[exp] = newValue;
      val = newValue;
    });
  }

  modelUpdater(node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value;
  }

  isDirective(attr) {
    return attr.startsWith("v-");
  }

  isEventDirective(dir) {
    return dir.startsWith('on:');
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }

  isTextNode(node) {
    return node.nodeType === 3;
  }
}

function query(el) {
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
function parsePath(path) {
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
