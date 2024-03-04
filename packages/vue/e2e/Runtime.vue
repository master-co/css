<script setup lang="ts">
    import CSSRuntimeProvider from '../src'
    import { ref, onMounted } from 'vue'
    import type { Config } from '@master/css'

    const config = ref<Config>({
        styles: {
            btn: 'b:2|red'
        }
    })
    const root = ref()
    const containerRef = ref()

    let shadowRoot: any
    onMounted(() => {
        shadowRoot = containerRef.value.attachShadow({ mode: 'open' });

        const shadowContent = document.createElement('div');
        shadowContent.className = 'f:1000'
        shadowRoot.appendChild(shadowContent);
    })
</script>

<template>
    <CSSRuntimeProvider :root="root" :config="config">
        <button id="config-btn" class="btn" @click="config = {}"></button>
        <button id="root-btn" @click="root = shadowRoot"></button>
        <div :ref="el => containerRef = el"></div>
    </CSSRuntimeProvider>
</template>