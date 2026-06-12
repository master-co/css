<script setup lang="ts">
    import { CSSRuntimeProvider } from '../src/runtime-provider'
    import { ref, onMounted } from 'vue'
    import type { MasterCSSPlan } from '@master/css-runtime'
    import RuntimeConsumer from './RuntimeConsumer.vue'

    const plan = ref<MasterCSSPlan>({
        version: 1,
        utilities: [
            {
                name: 'btn',
                type: -4,
                layer: 'components',
                rules: [
                    { selector: '&', declarations: { border: '0.125rem var(--color-red) solid' } }
                ]
            }
        ]
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
    <CSSRuntimeProvider :root="root" :plan="plan">
        <RuntimeConsumer />
        <button id="config-btn" class="btn" @click="plan = { version: 1 }"></button>
        <button id="root-btn" @click="root = shadowRoot"></button>
        <div id="container" :ref="el => containerRef = el"></div>
    </CSSRuntimeProvider>
</template>
