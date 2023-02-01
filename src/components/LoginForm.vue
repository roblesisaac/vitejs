<template>
    <div>
      <h1>Login</h1>
      <p v-if="user">Hello {{ user.name }}</p>
      <button v-if="!user" @click="login">Login with Google</button>
    </div>
  </template>
  
  <script>
  import { useRoute } from 'vue-router';
  
  export default {
    setup() {
      const { path } = useRoute();
      return {
        user: null,
        login() {
          window.location.href = '/login/auth/google?redirect=' + encodeURIComponent(path);
        },
      };
    }
  };
  </script>
  