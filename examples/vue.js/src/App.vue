<script setup lang="ts">
import CSSRuntimeProvider from '@master/css.vue'
import config from '../master.css'
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
    <CSSRuntimeProvider :config="config">
        <HelloWorld />
    </CSSRuntimeProvider>
</template>