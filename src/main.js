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
    console.log({ to, from })
    if (to.fullPath === '/login/auth/google') {
        window.location.assign('/login/auth/google?redirect=' + encodeURIComponent(to.fullPath));
        return;
    } else {
        next();
    }
});




createApp(App)
    .use(router)
    .mount("#app");