<script setup lang="ts">

import { type Options, type ThemeValue, ThemeService } from 'theme-service'
import { onMounted, onBeforeUnmount, ref, provide, readonly } from 'vue'

const props = defineProps<{
    host?: HTMLElement,
    options?: Options
}>()

const themeService = ref<ThemeService>()
const current = ref<ThemeService['current']>()
const value = ref<ThemeService['value']>()

const onThemeChange = () => {
    if (themeService.value) {
        current.value = themeService.value.current
        value.value = themeService.value.value
    }
}

onMounted(() => {
    if (typeof window === 'undefined')
        return

    if (!themeService.value) {
        themeService.value = new ThemeService(props.options, props.host)
        themeService.value.init()
        current.value = themeService.value.current
        value.value = themeService.value.value
        themeService.value.host?.addEventListener('themeChange', onThemeChange)
    }
})

onBeforeUnmount(() => {
    if (themeService.value) {
        themeService.value.host?.removeEventListener('themeChange', onThemeChange)
        themeService.value.destroy(false)
    }
})

provide('theme-service', {
    current: readonly(current),
    value: readonly(value),
    switch: readonly((
        _value: ThemeValue,
        // options?: { store?: boolean, emit?: boolean }
    ) => {
        if (themeService.value) {
            themeService.value.switch(_value)
            current.value = themeService.value.current
            value.value = themeService.value.value
        }
    })
})

</script>

<template>
    <slot></slot>
</template>