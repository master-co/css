<script setup lang="ts">
import config from 'virtual:master-css-config'
import preloaded from 'virtual:master-css-preloaded'
import CSSRuntimeProvider from './CSSRuntimeProvider.vue'

defineOptions({
    inheritAttrs: false
})
</script>

<template>
    <CSSRuntimeProvider :config="config" :preloaded="preloaded">
        <slot />
    </CSSRuntimeProvider>
</template>
