<template>
  <div class="grid p30">
    <div class="col-1">
      <h1>Login Bellow</h1>
    </div>
    <div class="col-1">
      <div class="grid"> 
        <div class="col-1 p10b">
          <b>Username:</b> <input v-model="login.username" type="text" />
        </div>
        <div class="col-1 p10b">
          <b>Password:</b> <input v-model="login.password" type="password" />
        </div>
        <div class="col-1 p10">
          <button class="expanded" @click="loginNative">Login</button>
        </div>
      </div>
    </div>
    <div class="col-1">
      <button class="button" @click="loginWithGoogle">Login with Google</button>
    </div>
  </div>
</template>
  
<script>
import { ref } from "vue";
import { Pipe } from "peachmap";

export default {
  created() {
    //
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
  