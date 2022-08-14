import MiniVue from './index.js';

const vm = new MiniVue({
  data: {
    message: 'Hello Vue!',
    obj: {
      name: 'w2xi',
      age: 12,
    }
  },
  methods: {
    onClick() {
      console.log('clicked');
      this.$set(this.obj, 'address', 'China');
    },
  }
}).$mount('#app');

// const unwatch = vm.$watch('message', (newVal, oldVal) => {
//   console.log('[new value]', newVal);
//   console.log('[old value]', oldVal);
// });
// // 取消观察数据
// unwatch();

// todo#1 bug
// deep: true 参数无法深度监听
// vm.$watch('obj', (newVal, oldVal) => {
//   console.log('[new value]', newVal);
//   console.log('[old value]', oldVal);
// }, { deep: true, immediate: true });

window.vm = vm;