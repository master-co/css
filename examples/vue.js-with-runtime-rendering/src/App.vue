<script setup lang="ts">
import { CSSProvider, ThemeServiceProvider } from '@master/css.vue'
import config from '../master.css'
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
    <CSSProvider :config="config">
        <ThemeServiceProvider :options="{ default: 'system' }">
            <HelloWorld />
        </ThemeServiceProvider>
    </CSSProvider>
</template>