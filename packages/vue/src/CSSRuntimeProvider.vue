<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, watch, onWatcherCleanup } from 'vue';
import type { Config } from '@master/css';
import { CSSRuntime } from '@master/css-runtime';

const runtimeCSSSymbol = Symbol('runtime-css');
const props = defineProps<{
    config?: Config | Promise<any>;
    root?: Document | ShadowRoot | null; // null for Element.shadowRoot
}>();

const cssRuntime = ref<CSSRuntime | undefined>(undefined);

const resolveConfig = async () => {
    const configModule = await props.config;
    return configModule?.config || configModule?.default || configModule;
}

const initialize = async (signal: AbortSignal) => {
    const resolvedConfig = await resolveConfig();
    if (signal.aborted) return;
    cssRuntime.value = new CSSRuntime(props.root ?? document, resolvedConfig).observe();
}

onMounted(() => {
    const controller = new AbortController()
    initialize(controller.signal)
    onUnmounted(() => {
        controller.abort()
        cssRuntime.value?.destroy()
        cssRuntime.value = undefined
    })
})

watch(() => props.config, () => {
    const controller = new AbortController();
    (async () => {
        const resolvedConfig = await resolveConfig()
        if (controller.signal.aborted) return;
        if (cssRuntime.value) {
            cssRuntime.value.refresh(resolvedConfig)
        }
    })()
    onWatcherCleanup(controller.abort)
})

watch(() => props.root, () => {
    const controller = new AbortController();
    (async () => {
        if (controller.signal.aborted) return
        if (cssRuntime.value) {
            cssRuntime.value.destroy()
            cssRuntime.value = undefined
            initialize(controller.signal)
        }
    })()
    onWatcherCleanup(controller.abort)
})

provide(runtimeCSSSymbol, cssRuntime.value)
</script>

<template>
    <slot />
</template>
