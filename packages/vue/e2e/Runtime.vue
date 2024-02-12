<script setup lang="ts">
    import { ref } from 'vue'
    import { CSSRuntimeProvider } from '../src/CSSRuntimeProvider'
    import config from './master.css'
    
    const destroyed = ref<boolean>(false)
</script>

<template>
    <CSSRuntimeProvider v-if="!destroyed" :config="config">
        <button id="my-btn" class="f:10" @click="destroyed = true"></button>
    </CSSRuntimeProvider>
</template>