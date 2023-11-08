<script setup lang="ts">

import { RuntimeCSS, type Config } from '@master/css'
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'

const props = defineProps<{
    config?: Config | Promise<Config> | Promise<any>
    root?: Document | ShadowRoot
}>()

const runtimeCSS = ref()
const newRuntimeCSS = ref()

onMounted(() => {
    if (typeof window === 'undefined') { return }
    if (!runtimeCSS.value) {
        const init = (resolvedConfig: Config | undefined) => {
            const existingRuntimeCSS = (globalThis as any).runtimeCSSs.find((eachCSS: RuntimeCSS) => eachCSS.root === props.root)
            if (existingRuntimeCSS) {
                runtimeCSS.value = existingRuntimeCSS
            } else {
                newRuntimeCSS.value = new RuntimeCSS(props.root, resolvedConfig).observe()
                runtimeCSS.value = newRuntimeCSS.value
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
    if (runtimeCSS.value && newRuntimeCSS) {
        newRuntimeCSS.value?.destroy()
    }
})

provide('css', runtimeCSS)

</script>

<template>
    <slot></slot>
</template>