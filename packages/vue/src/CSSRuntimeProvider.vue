<script setup lang="ts">
import { shallowRef, provide, onMounted, onUnmounted, watch } from 'vue'
import { initCSSRuntime, resolveRuntimePlan } from '@master/css-runtime'
import type { CSSRuntime, MasterCSSPlan } from '@master/css-runtime'
import { CSS_RUNTIME_INJECTION_KEY } from './use-css-runtime'
import type { CSSRuntimeProviderProps } from './types/provider-props'

const props = defineProps<CSSRuntimeProviderProps>()

const cssRuntime = shallowRef<CSSRuntime | undefined>(undefined)
const DEFAULT_PLAN: MasterCSSPlan = { version: 1 }

function getRoot() {
    return props.root ?? document
}

function initRuntime() {
    cssRuntime.value = initCSSRuntime({
        plan: props.plan || DEFAULT_PLAN,
        root: getRoot(),
        preloaded: props.preloaded
    })
}

function destroyRuntime() {
    cssRuntime.value?.destroy()
    cssRuntime.value = undefined
}

onMounted(() => {
    initRuntime()
})

onUnmounted(destroyRuntime)

watch(() => props.plan, () => {
    if (cssRuntime.value) {
        cssRuntime.value.refresh(resolveRuntimePlan(props.plan || DEFAULT_PLAN))
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
