<script setup lang="ts">
import { shallowRef, provide, onMounted, onUnmounted, watch } from 'vue'
import { CSSRuntime } from '@master/css-runtime'
import { CSS_RUNTIME_INJECTION_KEY } from './use-css-runtime'
import type { CSSRuntimeProviderProps } from './types/provider-props'

const props = defineProps<CSSRuntimeProviderProps>()

const cssRuntime = shallowRef<CSSRuntime | undefined>(undefined)
let mounted = false
let runtimeVersion = 0

function getRoot() {
    return props.root ?? document
}

async function initRuntime() {
    const version = ++runtimeVersion
    const nextRuntime = CSSRuntime.create({
        manifest: props.manifest,
        root: getRoot(),
        emittedGlobals: props.emittedGlobals,
        hydrationManifest: props.hydrationManifest
    })
    if (nextRuntime.needsHydrationManifest()) {
        await nextRuntime.loadHydrationManifest()
    }
    if (!mounted || version !== runtimeVersion) {
        if (cssRuntime.value !== nextRuntime) nextRuntime.destroy()
        return
    }
    cssRuntime.value = nextRuntime.observe()
}

function destroyRuntime() {
    runtimeVersion++
    cssRuntime.value?.destroy()
    cssRuntime.value = undefined
}

onMounted(() => {
    mounted = true
    void initRuntime()
})

onUnmounted(() => {
    mounted = false
    destroyRuntime()
})

watch(() => props.manifest, () => {
    if (cssRuntime.value) {
        cssRuntime.value.refresh(props.manifest)
    }
})

watch(() => props.root, () => {
    if (!mounted) return
    const nextRoot = getRoot()
    if (cssRuntime.value?.root === nextRoot) return
    destroyRuntime()
    void initRuntime()
})

provide(CSS_RUNTIME_INJECTION_KEY, cssRuntime)
</script>

<template>
    <slot />
</template>
