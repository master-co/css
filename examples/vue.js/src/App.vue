<script setup lang="ts">
import { CSSRuntimeProvider, ThemeServiceProvider } from '@master/css.vue'
import config from '../master.css'
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
    <CSSRuntimeProvider :config="config">
        <ThemeServiceProvider :options="{ default: 'system' }">
            <HelloWorld />
        </ThemeServiceProvider>
    </CSSRuntimeProvider>
</template>