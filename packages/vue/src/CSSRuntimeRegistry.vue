<script setup lang="ts">
import manifest from 'virtual:master-css-manifest'
import emittedGlobals from 'virtual:master-css-emitted-globals'
import CSSRuntimeProvider from './CSSRuntimeProvider.vue'

defineOptions({
    inheritAttrs: false
})
</script>

<template>
    <CSSRuntimeProvider :manifest="manifest" :emittedGlobals="emittedGlobals">
        <slot />
    </CSSRuntimeProvider>
</template>
