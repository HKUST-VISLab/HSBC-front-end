import Vue from 'vue'
import App from './App'

/*
 * By extending the Vue prototype with a new '$bus' property
 * we can easily access our global event bus from any child component.
 */
Object.defineProperty(Vue.prototype, '$bus', {
  get() {
    return this.$root.bus;
  }
});

var bus = new Vue({}) // This empty Vue model will serve as our event bus.

new Vue({
  el: '#app',
  data: {
    bus: bus
  },
  template: '<App/>',
  components: { App }
})

