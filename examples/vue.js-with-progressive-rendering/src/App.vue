
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { defineAsyncComponent } from 'vue'
const CSSRuntimeProvider = defineAsyncComponent(async () => (await import('@master/css.vue')).CSSRuntimeProvider)
</script>

<template>
    <CSSRuntimeProvider :config="import('../master.css')">
        <HelloWorld />
    </CSSRuntimeProvider>
</template>