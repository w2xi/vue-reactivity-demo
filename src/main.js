import Vue from './index.js';

const vm = new Vue({
  data: {
    message: 'Hello Vue!',
    obj: {
      name: 'w2xi',
      age: 12,
    }
  }
}).$mount('#app');

// const unwatch = vm.$watch('message', (newVal, oldVal) => {
//   console.log('[new value]', newVal);
//   console.log('[old value]', oldVal);
// });
// // 取消观察数据
// unwatch();

// vm.$watch('obj', (newVal, oldVal) => {
//   console.log('[new value]', newVal);
//   console.log('[old value]', oldVal);
// }, { deep: true, immediate: false });

window.vm = vm;