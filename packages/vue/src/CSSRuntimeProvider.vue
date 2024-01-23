<script setup lang="ts">

import type { Config } from '@master/css'
import RuntimeCSS from '@master/css-runtime'
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'

const props = defineProps<{
    config?: Config | Promise<Config> | Promise<any>
    root?: Document | ShadowRoot
}>()

const runtimeCSS = ref()
const newCSSRuntime = ref()

onMounted(() => {
    if (typeof window === 'undefined') { return }
    if (!runtimeCSS.value) {
        const init = (resolvedConfig: Config | undefined) => {
            const existingCSSRuntime = (globalThis as any).runtimeCSSs.find((eachCSS: RuntimeCSS) => eachCSS.root === props.root)
            if (existingCSSRuntime) {
                runtimeCSS.value = existingCSSRuntime
            } else {
                newCSSRuntime.value = new RuntimeCSS(props.root, resolvedConfig).observe()
                runtimeCSS.value = newCSSRuntime.value
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
    } else if (!runtimeCSS.value.observing) {
        runtimeCSS.value.observe(props.root)
    }
})

onBeforeUnmount(() => {
    if (runtimeCSS.value && newCSSRuntime) {
        newCSSRuntime.value?.destroy()
    }
})

provide('css', runtimeCSS)

</script>

<template>
    <slot></slot>
</template>