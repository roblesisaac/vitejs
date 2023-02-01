import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";

import HelloWorld from "./components/HelloWorld.vue";
import SwiperVue from "./components/SwiperVue.vue";
import LoginForm from "./components/LoginForm.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/",
            component: HelloWorld
        },
        {
            path: "/swiper/",
            component: SwiperVue
        },
        {
            path: "/login",
            component: LoginForm
        }
    ]
});

router.beforeEach((to, from, next) => {
    if (to.path === '/login/auth/google') {
      window.location.replace('/login/auth/google?redirect=' + encodeURIComponent(to.fullPath));
      next(false);
    } else {
      next();
    }
  });


createApp(App)
    .use(router)
    .mount("#app");