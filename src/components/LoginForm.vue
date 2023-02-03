<template>
    <div>
      <h1>Login Below</h1>
      <p v-if="user">Hello {{ user.name }}</p>
      <button v-if="!user" @click="login">Login with Google</button>
    </div>
  </template>
  
  <script>
  export default {
    setup() {
      return {
        user: null,
        login() {
          window.location.pathname += "/auth/google";
        },
      };
    }
  };
  </script>
  