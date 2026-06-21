<script setup lang="ts">
    import { CSSRuntimeProvider } from '../src/runtime-provider'
    import { ref, onMounted } from 'vue'
    import type { MasterCSSManifest } from '@master/css-runtime'
    import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
    import UtilityType from 'shared/utility-type'
    import RuntimeConsumer from './RuntimeConsumer.vue'

    const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

    const manifest = ref<MasterCSSManifest>({
        version: 1,
        utilities: [
            {
                id: '.btn',
                name: 'btn',
                type: UtilityType.Semantic,
                order: 0,
                layer: 'components',
                emit: {
                    type: 'static',
                    rules: [
                        { selector: '&', declarations: { border: '0.125rem var(--color-red) solid' } }
                    ]
                },
                matchers: [{ type: 'static', name: 'btn' }]
            }
        ],
        utilityBuckets: {
            arbitrary: [0]
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
    <CSSRuntimeProvider :root="root" :manifest="manifest">
        <RuntimeConsumer />
        <button id="config-btn" class="btn" @click="manifest = defaultManifest"></button>
        <button id="root-btn" @click="root = shadowRoot"></button>
        <div id="container" :ref="el => containerRef = el"></div>
    </CSSRuntimeProvider>
</template>
