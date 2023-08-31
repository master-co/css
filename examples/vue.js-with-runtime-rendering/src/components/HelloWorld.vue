<script setup lang="ts">
import { ref, inject } from 'vue'
import { styled } from '@master/css.vue'

const count = ref<number>(0)
const themeService = inject<any>('theme-service')
const Select = styled.select`abs full inset:0 r:inherit opacity:0 font:inherit`

</script>

<template>
    <div class='grid-cols:2 w:fit gap:20 mx:auto'>
        <a href="https://vitejs.dev" target="_blank">
            <img src="../assets/vue.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://beta.css.master.co" target="_blank">
            <img src="../assets/master.svg" class="logo scale(2)" alt="Master logo" />
        </a>
    </div>
    <h1 class="font:sans ls:-.25 fg:white@dark font:heavy">
        <span class="fg:#42b883">Vue</span>
        <span class="fg:slate-70 mx:10 font:semibold">+</span>
        <span>Master CSS</span>
    </h1>

    <div class="card">
        <button type="button" @click="count++">count is {{ count }}</button>
        <button className="h:40 bg:gray-20@dark bg:slate-90@light ml:10 rel">
            {{ themeService.current.value === 'dark' ? '🌜' : '☀️' }} {{ themeService.value.value }}
            <Select v-bind="themeService.value" @change="themeService.switch($event.target.value)">
                <option value="light">☀️ Light</option>
                <option value="dark">🌜 Dark</option>
                <option value="system">System</option>
            </Select>
        </button>
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
