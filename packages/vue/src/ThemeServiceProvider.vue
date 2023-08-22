<script setup lang="ts">

import { type Options, type ThemeValue, ThemeService } from 'theme-service'
import { onMounted, onBeforeUnmount, ref, provide } from 'vue'

const props = defineProps<{
    host?: HTMLElement,
    options?: Options
}>()

const themeService = ref<ThemeService>()
const content = ref<Partial<ThemeService> & { current?: string, value?: ThemeValue, switch: (value: ThemeValue, options?: { store?: boolean, emit?: boolean }) => void }>({ 
    switch: (
        value, 
        // options
    ) => {
        if (themeService.value) {
            themeService.value.switch(value)
            content.value = { ...content.value, current: themeService.value.current, value: themeService.value.value }
        }
    }  
})

const onThemeChange = () => {
    if (themeService.value) {
        content.value = { ...content.value, current: themeService.value.current, value: themeService.value.value }
    }
}

onMounted(() => {
    if (typeof window === 'undefined')
        return

    if (!themeService.value) {
        themeService.value = new ThemeService(props.options, props.host)
        themeService.value.init()
        content.value = { ...content.value, ...themeService.value, current: themeService.value.current, value: themeService.value.value }
        themeService.value.host.addEventListener('themeChange', onThemeChange)
    }
})

onBeforeUnmount(() => {
    if (themeService.value) {
        themeService.value.host.removeEventListener('themeChange', onThemeChange)
        themeService.value.destroy(false)
    }
})

provide('themeService', content)

</script>

<template>
    <slot></slot>
</template>