<script setup lang="ts">
import { shallowRef, provide, onMounted, onUnmounted, watch } from 'vue'
import type { Config } from '@master/css'
import { initCSSRuntime, resolveRuntimeConfig } from '@master/css-runtime'
import type { CSSRuntime } from '@master/css-runtime'
import { CSS_RUNTIME_INJECTION_KEY } from './use-css-runtime'

const props = defineProps<{
    config?: Config;
    root?: Document | ShadowRoot | null; // null for Element.shadowRoot
}>();

const cssRuntime = shallowRef<CSSRuntime | undefined>(undefined)

function getRoot() {
    return props.root ?? document
}

function initRuntime() {
    cssRuntime.value = initCSSRuntime(props.config, getRoot())
}

function destroyRuntime() {
    cssRuntime.value?.destroy()
    cssRuntime.value = undefined
}

onMounted(() => {
    initRuntime()
})

onUnmounted(destroyRuntime)

watch(() => props.config, () => {
    if (cssRuntime.value) {
        cssRuntime.value.refresh(resolveRuntimeConfig(props.config))
    }
})

watch(() => props.root, () => {
    if (cssRuntime.value) {
        const nextRoot = getRoot()
        if (cssRuntime.value.root === nextRoot) return
        destroyRuntime()
        initRuntime()
    }
})

provide(CSS_RUNTIME_INJECTION_KEY, cssRuntime)
</script>

<template>
    <slot />
</template>
