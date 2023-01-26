<template>
  <div class="hello">
    <h1>Hola World!!</h1>
    <p>
      <img alt="Vue logo" src="../assets/van.jpeg" height="100" />
    </p>
    <p>
      The information below is being fetched from your Serverless Cloud API:
    </p>
    <button @click="addUser">Add A User</button>
    <div v-if="loading">Loading users...</div>
    <div v-else-if="users.length == 0"><strong>No users found</strong></div>
    <div v-else id="users">
      <div v-for="user in users" v-bind:key="user.id">
        <strong>{{ user.name }}: </strong>
        <span :class="user.status">{{ user.status }}</span>
      </div>
    </div>

    <h3>Edit this Vue.js app:</h3>
    <p>
      Open your terminal to the project directory and run <code>npm i</code> to
      install the Vue.js dependencies. Then run <code>cloud dev</code> to launch
      the local Vue.js dev server. You can access the API on your personal
      developer sandbox by appending <code>/api</code> to the local dev server's
      localhost address.
    </p>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "HelloWorld",
  // props: {
  //   msg: String,
  // },
  setup() {
    const loading = ref(true);
    const users = ref([]);

    return {
      loading,
      users,
    };
  },
  created() {
    fetch("/users/db")
      .then(res => res.json()).then((response) => {
        this.users = response;
        this.loading = false;
      })
      .catch((error) => {
        console.log(error);
        this.loading = false;
      });
  },
  methods: {
    addUser() {
      this.users.push({ 
        name: "joe"+this.users.length,
        status: "active" 
       });
    }
  }
};
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
a {
  color: #fe5750;
}

#users {
  margin: 0 auto;
}

.active {
  color: #42b983;
}
.inactive {
  color: #fe5750;
}

p {
  max-width: 600px;
  margin: 1em auto;
}

code {
  background: #f1f1f1;
  padding: 0.2em;
  color: #fe5750;
}
</style>