<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const CSSRuntimeProvider = defineAsyncComponent(async () => (await import('@master/css.vue')).CSSRuntimeProvider)
</script>

<template>
    <CSSRuntimeProvider :config="import('./master.css')">
        <NuxtWelcome class="{font:32!;font:heavy!;my:20;ls:-.02em}_h1@sm" />
    </CSSRuntimeProvider>
</template>
