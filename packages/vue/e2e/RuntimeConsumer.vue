<script setup lang="ts">
    import { computed } from 'vue'
    import { useCSSRuntime } from '../src'

    const cssRuntime = useCSSRuntime()
    const status = computed(() => cssRuntime?.value ? 'ready' : 'pending')
</script>

<template>
    <span id="runtime-context">{{ status }}</span>
</template>
