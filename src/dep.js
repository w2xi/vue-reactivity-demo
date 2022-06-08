// Dep 实例的id
let uid = 0;
class Dep {
  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  depend() {
    // Dep.target 为 Watcher 的实例
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  addSub(sub) {
    this.subs.push(sub);
  }

  notify() {
    this.subs.forEach(watcher => {
      watcher.update();
    });
  }

  // 移除订阅的依赖，即 watcher
  removeSub(sub) {
    const index = this.subs.indexOf(sub);
    if (index > -1) {
      this.subs.splice(index, 1);
    }
  }
}

export default Dep;