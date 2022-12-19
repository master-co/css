<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
    <div class="flex center-content">
        <a href="https://vuejs.org/" target="_blank">
            <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
        </a>
        <a href="https://css.master.co" target="_blank">
            <img src="/master.svg" class="172x172" alt="Master logo" />
        </a>
    </div>
    <HelloWorld msg="Vue + Master CSS" />
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
