<template>
  <transition>
  <div v-if="action" class="grid p30">
    <div class="cell-1">
      <form class="grid p30 shadow bgF2 r10">         
        <fieldset class="cell-1">
            <div class="grid">
              <div class="cell-1">                
                <legend class="proper center">{{ action }}</legend>
              </div>
              <div class="cell-1 p10b">
                <div class="grid middle">
                  <div class="shrink">
                    <label for="username">Username</label>
                  </div>
                  <div class="auto">
                    <input id="username" v-model="login.username" type="text" />
                  </div>
                </div>
              </div>
              <div class="cell-1 p30b">
                <div class="grid">
                  <div class="shrink">                  
                    <label for="password">Password</label>
                  </div>
                  <div class="auto">
                    <input id="password" v-model="login.password" type="password" />
                  </div>
                </div>
              </div>
            </div>
        </fieldset>
        <div class="cell-1 p10b center">
          <button class="bgF3 colorDarkBlue expanded proper" @click="loginNative">
            {{ action }} <i class="fi-arrow-right"></i>
          </button>
        </div>
        <div v-if="action=='login'" class="cell-1 center">
          <small>Don't have an account? <a href="#" @click="changeAction('signup')">Sign up »</a></small>
        </div>
        <div v-else class="cell-1 center">
          <small>Already have an account? <a href="#" @click="changeAction('login')">Login »</a></small>
        </div>
        <br /><br />
        <Transition>
          <div v-if="notification" class="cell-1 center bgRed colorF1 r3 shadow">
            {{  notification }}
          </div>
        </Transition>
      </form>
    </div>
    <div class="cell-1 center bold p20y">- OR -</div>
    <div class="cell-1 center">
      <button class="expanded" @click="loginWithGoogle">
        <img alt="Vue logo" src="../assets/google.svg" height="20" class="p10r" />
        <span class="proper">{{ action }}</span> with Google
      </button>
    </div>
  </div>
  </transition>
</template>
  
<script setup>
import { ref, nextTick } from "vue";
import { Pipe } from "peachmap";

const login = ref({
  username: "",
  password: ""
});

let action = ref("login");
let notification = ref("");

function changeAction(changeTo) {
  action.value = null;
  nextTick(() => {
    action.value = changeTo;
  });
}

function notify(message) {
  notification.value = message;
  setTimeout(() => {
    notification.value = false;
  }, 4000);
};

function loginNative(e) {
  e.preventDefault();
  const url =  `/${action.value}/native`;
  const payload = {
    method: "POST",
    body: JSON.stringify(login.value),
    headers: {
      "Content-Type": "application/json"
    }
  };
  const redirect = () => window.location = "/";

  fetch(url, payload).then((res) => {
    if(res.ok) {
      redirect();
      return;
    }
    
    return res.json();
  }).then(notify)
}

function loginWithGoogle() {
  window.location.pathname += "/auth/google";
}
</script>
  