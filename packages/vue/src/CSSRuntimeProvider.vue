<script setup lang="ts">

import type { Config } from '@master/css'
import CSSRuntime from '@master/css-runtime'
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'

const props = defineProps<{
    config?: Config | Promise<Config> | Promise<any>
    root?: Document | ShadowRoot
}>()

const cssRuntime = ref()
const newCSSRuntime = ref()

onMounted(() => {
    if (typeof window === 'undefined') { return }
    if (!cssRuntime.value) {
        const init = (resolvedConfig: Config | undefined) => {
            const existingCSSRuntime = (globalThis as any).cssRuntimes.find((eachCSS: CSSRuntime) => eachCSS.root === props.root)
            if (existingCSSRuntime) {
                cssRuntime.value = existingCSSRuntime
            } else {
                newCSSRuntime.value = new CSSRuntime(props.root, resolvedConfig).observe()
                cssRuntime.value = newCSSRuntime.value
            }
        }

        if (props.config instanceof Promise) {
            (async () => {
                const configModule: any = await props.config
                init(configModule?.config || configModule?.default || configModule)
            })()
        } else {
            init(props.config)
        }
    } else if (!cssRuntime.value.observing) {
        cssRuntime.value.observe(props.root)
    }
})

onBeforeUnmount(() => {
    if (cssRuntime.value && newCSSRuntime) {
        newCSSRuntime.value?.destroy()
    }
})

provide('css', cssRuntime)

</script>

<template>
    <slot></slot>
</template>