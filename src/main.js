import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from 'pinia';
import App from "./App.vue";

import HelloWorld from "./views/HelloWorld.vue";
import SwiperVue from "./components/SwiperVue.vue";
import LoginView from "./views/LoginView.vue";

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
            component: LoginView
        }
    ]
});

const pinia = createPinia();

const app = createApp(App)
    .use(router).use(pinia)
    .mount("#app");