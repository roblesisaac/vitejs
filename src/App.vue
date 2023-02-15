<template>
  <nav>
    <router-link to="/" class="p10r">Home</router-link>
    <router-link to="/swiper" class="p10r">Swiper</router-link>
    <router-link to="/login" class="p10r">Login</router-link>
    <a href="/logout"  class="p10r">Logout</a>
    <a href="/login/protected" class="p10r">Protected</a>
  </nav>
  <router-view />
</template>

<script>

export default {
  name: "App"
};
</script>

<style>
@import "/src/css/grid.css";
@import "/src/css/utils.css";
@import "/src/css/style.css";
</style>