<script setup lang="ts">

import { MasterCSS, type Config } from '@master/css'
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'

const props = defineProps<{
    config?: Config | Promise<Config> | Promise<any>
    root?: Document | ShadowRoot | undefined | null
}>()

const css = ref()
const newCSS = ref()

onMounted(() => {
    if (typeof window === 'undefined') { return }
    if (!css.value) {
        const init = (resolvedConfig: Config | undefined) => {
            const existingCSS = (globalThis as any).masterCSSs.find((eachCSS: MasterCSS) => eachCSS.root === props.root)
            if (existingCSS) {
                css.value = existingCSS
            } else {
                newCSS.value = new MasterCSS(resolvedConfig).observe(props.root)
                css.value = newCSS.value
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
    } else if (!css.value.observing) {
        css.value.observe(props.root)
    }
})

onBeforeUnmount(() => {
    if (css.value && newCSS) {
        newCSS.value?.destroy()
    }
})

provide('css', css)

</script>

<template>
    <slot></slot>
</template>