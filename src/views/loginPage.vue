<template>
    <div class="grid">
        <div class="cell-1 cell-md-1-3"><LoginForm /></div>
        <div class="auto">{{ message }}</div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import LoginForm from "../components/LoginForm.vue";

const message = "hello worlds";

// export default {
//     name: "LoginPage",
//     created() {
//         console.log("his")
//     },
//     components: {
//         LoginForm
//     }
// }
</script>