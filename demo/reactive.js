class Vue {
  constructor(options) {
    this.$options = options.data;
    this.$data = options.data;
    this.$el = options.el;
    // 数据劫持
    new Observer(this.$data);
    // 代理 vm.xxx 到 vm.$data.xxx
    proxy(this, this.$data);
    new Compile(this, this.$el);
  }
}

function proxy(vm, data) {
  for (let key in data) {
    if (Reflect.has(data, key)) {
      Object.defineProperty(vm, key, {
        configurable: true,
        enumerable: true,
        get() {
          return vm.$data[key];
        },
        set(value) {
          console.log(1);
          vm.$data[key] = value;
        },
      });
    }
  }
}

class Observer {
  constructor(data) {
    this.data = data;
    this.observe(data);
  }

  observe(data) {
    for (let key in data) {
      if (Reflect.has(data, key)) {
        this.defineReactive(data, key, data[key]);
      }
    }
  }

  defineReactive(data, key, value) {
    if (value && typeof value === 'object') {
      // 递归遍历子属性
      this.observe(value);
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
      }
    });
  }
}

// 订阅器
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
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

// 订阅者
class Watcher {
  construtor(vm, exp, cb) {
    this.vm = vm;
    this.exp = exp;
    this.cb = cb;
    this.value = this.get();
  }

  update() {
    const value = this.vm.$data[this.exp];
    const oldValue = this.value;

    if (value !== oldValue) {
      this.value = value;
      this.cb.call(this.vm, value, oldValue);
    }
  }

  get() {
    Dep.target = this;
    const value = this.vm.$data[this.exp]; // 触发数据劫持的 getter
    Dep.target = undefined;
    return value;
  }

  update() { }
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
    console.log(this.fragment)
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

  compile(node) {}

  compileText(node, exp) {
    node.textContent = this.vm[exp] || '';
    new Watcher(this.vm, exp, (newValue) => {
      node.textContent = newValue;
    })
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }

  isTextNode(node) {
    return node.nodeType === 3;
  }
}

function query(el) {
  if (typeof el === 'string') {
    return document.querySelector(el);
  } else if (el.nodeType === 3) { // dom node
    return el;
  }
  throw new Error('[el]: Dom元素不存在');
}