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
@import "css/palette.css";
@import "css/grid.css";
@import "css/utils.css";
@import "css/colors.css";
@import "css/style.css";
@import "css/f-icons/foundation-icons.css";
</style>