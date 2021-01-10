import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import "./firebase"
import { auth } from "./firebase";
import VueConfetti from 'vue-confetti'

//Disable "You are running Vue in development mode" warning
Vue.config.productionTip = false;
//this will prevent user from being logged out on page refresh
let app;

auth.onAuthStateChanged(() => {
  if (!app) {
    app = new Vue({
      vuetify,
      router,
      VueConfetti,
      render: h => h(App)
    }).$mount('#app')
  }
})