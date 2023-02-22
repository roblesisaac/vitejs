import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";

import HelloWorld from "./views/HelloWorld.vue";
import SwiperVue from "./components/SwiperVue.vue";
import LoginPage from "./views/LoginView.vue";

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

createApp(App)
.use(router)
.mount("#app");