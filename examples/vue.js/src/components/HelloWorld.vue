<script setup lang="ts">
import { ref } from 'vue'

const count = ref<number>(0)
</script>

<template>
    <div>
        <div class='grid-cols:2 w:fit mx:auto'>
            <a href="https://rc.css.master.co" target="_blank">
                <img src="../assets/master.svg" class="logo size:24x scale(2)" alt="Master logo" />
            </a>
            <a href="https://vitejs.dev" target="_blank">
                <img src="../assets/vue.svg" class="logo size:24x" alt="Vite logo" />
            </a>
        </div>
        <h1 class="font:56 fg:white@dark font:heavy my:8x">
            <span>Master CSS</span> <span class="fg:#42b883">Vue</span>
        </h1>
    </div>

    <div class="card">
        <button type="button" @click="count++">count is {{ count }}</button>
        <p>
            Edit
            <code>components/HelloWorld.vue</code> to test HMR
        </p>
    </div>

    <p>
        Check out
        <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite
        starter
    </p>
    <p>
        Install
        <a href="https://github.com/vuejs/language-tools" target="_blank">Volar</a>
        in your IDE for a better DX
    </p>
    <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}

.read-the-docs {
    color: #888;
}
</style>
