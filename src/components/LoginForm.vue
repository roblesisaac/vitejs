<template>
<div>
    <h1>Login</h1>
    <p v-if="user">Hello {{ user.name }}</p>
    <button @click="login">Login with Google</button>
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
        window.location.href = '/auth/google';
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
  