<script setup lang="ts">
import { CSSProvider } from '@master/css.vue'
import config from '../master.css'
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
    <CSSProvider :config="config">
        <HelloWorld />
    </CSSProvider>
</template>