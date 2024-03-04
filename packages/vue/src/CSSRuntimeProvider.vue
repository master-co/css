<script setup lang="ts">

import type { Config } from '@master/css'
import RuntimeCSS from '@master/css-runtime'
import { onMounted, onBeforeUnmount, ref, provide, onUpdated } from 'vue'

const props = defineProps<{
    config?: Config | Promise<Config> | Promise<any>
    root?: Document | ShadowRoot
}>()

const initializing = ref(false)
const identifier = ref(0)
const runtimeCSS = ref()
const isExternalRuntimeCSS = ref(false)

const getResolvedConfig = async () => {
    if (props.config instanceof Promise) {
        const configModule: any = await props.config
        return configModule?.config || configModule?.default || configModule
    } else {
        return props.config
    }
}
const init = async (resolvedConfig?: Config | undefined) => {
    initializing.value = true

    const root = props.root ?? document
    const existingCSSRuntime = (globalThis as any).runtimeCSSs.find((eachCSS: RuntimeCSS) => eachCSS.root === root)
    if (existingCSSRuntime) {
        runtimeCSS.value = existingCSSRuntime
        isExternalRuntimeCSS.value = true
    } else {
        runtimeCSS.value = new RuntimeCSS(root, resolvedConfig ?? await getResolvedConfig()).observe()
    }

    initializing.value = false
}
const waitInitialized = async () => {
    if (initializing.value) {
        await new Promise<void>((resolve) => {
            const interval = setInterval(() => {
                if (!initializing.value) {
                    clearInterval(interval)
                    resolve()
                }
            }, 10)
        })
    }
}

onMounted(async () => {
    if (typeof window === 'undefined')
        return

    // in HMR, runtimeCSS will have a value
    await init()
})

onUpdated(async () => {
    const currentIdentifier = ++identifier.value
    await waitInitialized()
    if (currentIdentifier !== identifier.value)
        return

    const resolvedConfig = await getResolvedConfig()
    if (
        runtimeCSS.value.root !== props.root
        && (props.root || runtimeCSS.value.root !== document)
    ) {
        runtimeCSS.value.destroy()
        await init(resolvedConfig)
    } else {
        runtimeCSS.value.refresh(resolvedConfig)
    }
})

onBeforeUnmount(async () => {
    if (!isExternalRuntimeCSS.value) {
        runtimeCSS.value?.destroy()
    }
})

provide('runtime-css', runtimeCSS)

</script>

<template>
    <slot></slot>
</template>