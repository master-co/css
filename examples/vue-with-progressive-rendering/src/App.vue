
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { defineAsyncComponent } from 'vue'
const CSSProvider = defineAsyncComponent(async () => (await import('@master/css.vue')).CSSProvider)
</script>

<template>
    <CSSProvider :config="import('../master.css')">
        <HelloWorld />
    </CSSProvider>
</template>