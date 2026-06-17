<script setup lang="ts">
import plan from 'virtual:master-css-plan.json'
import preloaded from 'virtual:master-css-preloaded'
import CSSRuntimeProvider from './CSSRuntimeProvider.vue'

defineOptions({
    inheritAttrs: false
})
</script>

<template>
    <CSSRuntimeProvider :plan="plan" :preloaded="preloaded">
        <slot />
    </CSSRuntimeProvider>
</template>
