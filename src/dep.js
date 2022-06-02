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

export default Dep;