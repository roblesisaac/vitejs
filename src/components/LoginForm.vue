<template>
  <transition>
  <div v-if="action" class="grid p30">
    <div class="cell-1">
      <form class="grid r10">         
        <fieldset class="cell-1">
            <div class="grid">
              <div class="cell-1">                
                <legend class="proper center">{{ action }}</legend>
              </div>
              <div class="cell-1 p10b">
                <div class="grid middle">
                  <div class="cell-1">
                    <label for="email">Email</label>
                    <input id="email" v-model="login.email" autocomplete="email" type="text" />
                  </div>
                </div>
              </div>
              <div class="cell-1 p30b">
                <div class="grid">
                  <div class="cell-1">                  
                    <label for="password">Password</label>
                    <input id="password" v-model="login.password" autocomplete="current-password" type="password" />
                  </div>
                </div>
              </div>
              <div v-if="action=='signup'" class="cell-1 p30b">
                <div class="grid">
                  <div class="cell-1">                  
                    <label for="retype">Re-Type Password</label>
                    <input id="retype" v-model="login.retype" autocomplete="current-password" type="password" />
                  </div>
                </div>
              </div>
            </div>
        </fieldset>
        <div class="cell-1 p10b center">
          <button class="expanded proper" @click="loginNative">
            {{ action }} <i class="fi-arrow-right"></i>
          </button>
        </div>
        <div v-if="action=='login'" class="cell-1 center">
          <span>Don't have an account? <a href="#" @click="changeAction('signup')">Sign up »</a></span>
        </div>
        <div v-else class="cell-1 center">
          <span>Already have an account? <a href="#" @click="changeAction('login')">Login »</a></span>
        </div>
        <br /><br />
        <Transition>
          <div v-if="notification" class="cell-1 center bgLightRed colorF1 r3 shadow p15">
            {{  notification }}
          </div>
        </Transition>
      </form>
    </div>
    <div class="cell-1 center bold p20y">- OR -</div>
    <div class="cell-1 center">
      <button class="bgF3 colorDarkBlue expanded" @click="loginWithGoogle">
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

import { isValidEmail } from "../utils"

const login = ref({
  email: "",
  password: "",
  retype: ""
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
  if(!message) {
    return;
  }

  notification.value = message.message || message;

  setTimeout(() => {
    notification.value = false;
  }, 4000);
};

function loginNative(e) {
  e.preventDefault();
  
  const method = action.value;
  const { email, password, retype } = login.value;

  if(!email || !password) {
    return notify("Missing email or password");
  }

  if(password.length<8) {
    return notify("Password must be at least 8 character.");
  }

  if(method == "signup" && password !== retype) {
    return notify("Passwords must match.");
  }

  if(!isValidEmail(email)) {
    return notify(`Email: "${ email }" is invalid. Please enter a valid email address.`);
  }

  if(method) {
    delete method.retype;
  }
  
  const url =  `/${method}/native`;
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
  