<template>
<div>
    <h1>Login</h1>
    <p v-if="user">Hello {{ user.name }}</p>
    <button v-if="!user" @click="login">Login with Google</button>
</div>
</template>
  
  <script>
  export default {
    data() {
      return {
        user: null,
      };
    },
    methods: {
      login() {
        window.location.href = '/login/auth/google?redirect=' + encodeURIComponent(path) + '&ts=' + Date.now();

      },
    },
    created() {
    //   fetch('/api/user')
    //     .then(res => res.json())
    //     .then(user => {
    //       this.user = user;
    //     });
    },
  };
  </script>
  