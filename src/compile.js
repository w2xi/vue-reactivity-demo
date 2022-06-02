import { query, parsePath } from './utils';
import Watcher from './watcher';

export default class Compile {
  constructor(vm, el) {
    this.vm = vm;
    this.el = query(el);
    this.fragment = null;
    this.interpolate = /\{\{\s*(.+?)\s*\}\}/;
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
      const reg = this.interpolate;
      const text = node.textContent;

      if (this.isElementNode(node)) {
        this.compile(node);
      } else if (this.isTextNode(node) && reg.test(text)) {
        this.compileText(node, reg.exec(text)[1]);
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
    const text = node.textContent;

    node.textContent = text.replace(this.interpolate, value);

    new Watcher(this.vm, exp, (newValue) => {
      node.textContent = text.replace(this.interpolate, newValue);
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