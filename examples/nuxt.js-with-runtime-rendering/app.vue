<script setup lang="ts">
import { CSSRuntimeProvider } from '@master/css.vue'
import config from './master.css'
</script>

<template>
    <CSSRuntimeProvider :config="config">
        <NuxtWelcome class="{font:32!;font:heavy!;my:20;ls:-.02em}_h1@sm" />
    </CSSRuntimeProvider>
</template>