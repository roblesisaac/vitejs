<template>
    <div class="grid">
        <div class="cell-1"><AdminBar /></div>
        <div class="cell-1 cell-md-1-3"><LoginForm /></div>
        <div class="auto">{{ message }}</div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import LoginForm from "../components/LoginForm.vue";
import AdminBar from "../components/AdminBar.vue";

const message = "hello worlds";
</script>