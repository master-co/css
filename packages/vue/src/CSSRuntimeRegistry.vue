<script setup lang="ts">
import config from 'virtual:master-css-config'
import CSSRuntimeProvider from './CSSRuntimeProvider.vue'

defineOptions({
    inheritAttrs: false
})
</script>

<template>
    <CSSRuntimeProvider :config="config">
        <slot />
    </CSSRuntimeProvider>
</template>
