<template>
    <div class="grid">
        <div class="col-1 col-md-1-3"><LoginForm /></div>
        <div class="auto">Hello</div>
    </div>
</template>

<script>
import LoginForm from "../components/LoginForm.vue";

export default {
    name: "LoginPage",
    created() {
        console.log("his")
    },
    components: {
        LoginForm
    }
}
</script>