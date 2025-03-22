<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, watch } from 'vue';
import type { Config } from '@master/css';
import { CSSRuntime, initCSSRuntime } from '@master/css-runtime';

const cssRuntimeSymbol = Symbol('css-runtime');
const props = defineProps<{
    config?: Config;
    root?: Document | ShadowRoot | null; // null for Element.shadowRoot
}>();

const cssRuntime = ref<CSSRuntime | undefined>(undefined);

onMounted(() => {
    cssRuntime.value = initCSSRuntime(props.config, props.root ?? document)
    onUnmounted(() => {
        cssRuntime.value?.destroy()
        cssRuntime.value = undefined
    })
})

watch(() => props.config, () => {
    if (cssRuntime.value) {
        cssRuntime.value.refresh(props.config)
    }
})

watch(() => props.root, () => {
    if (cssRuntime.value) {
        cssRuntime.value.destroy()
        cssRuntime.value = initCSSRuntime(props.config, props.root ?? document)
    }
})

provide(cssRuntimeSymbol, cssRuntime.value)
</script>

<template>
    <slot />
</template>
