<template>
    <div v-if="user">
        <p>Hello {{ user.name }}</p>
    </div>
    <div v-else class="pure-g">
      <div class="pure-u-1">
        <h1>Login Below</h1>
      </div>
      <div class="pure-u-1-3">
        <input v-model="login.username" type="text" />
      </div>
      <div class="pure-u-1-3">
        <input v-model="login.password" type="password" />
      </div>
      <div class="pure-u-1-3">
        <button @click="loginNative">Login</button>
      </div>
      <div class="pure-u-1">
        <button @click="loginWithGoogle">Login with Google</button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from "vue";
  import { Pipe } from "peachmap";

  export default {
    created() {
    },
    setup() {
      const login = ref({
        username: "",
        password: ""
      });

      return {
        user: null,
        login,
        loginNative() {
          const { value } = login;
          new Pipe({
            instruct: [{ log: "hi" }]
          }).run()
          // fetch("/login/native", login.value).then(r => r.json()).then(console.log);
        },
        loginWithGoogle() {
          window.location.pathname += "/auth/google";
        },
      };
    }
  };
  </script>
  