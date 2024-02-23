<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store'
    import type { Config } from '@master/css'
    import CSSRuntimeProvider from '../src/lib/CSSRuntimeProvider.svelte'

    let containerRef: HTMLDivElement
    let shadowRoot: ShadowRoot

    const config = writable<Config>({
        styles: {
            btn: 'b:2|red'
        }
    })
    const root = writable<ShadowRoot>()

    onMount(() => {
        shadowRoot = containerRef.attachShadow({ mode: 'open' });
        
        const shadowContent = document.createElement('div');
        shadowContent.className = 'f:1000'
        shadowRoot.appendChild(shadowContent);
    })
</script>

<CSSRuntimeProvider config={$config} root={$root}>
    <button id="config-btn" class="btn" on:click={() => config.set({})}></button>
    <button id="root-btn" on:click={() => root.set(shadowRoot)}></button>
    <div bind:this={containerRef}></div>
</CSSRuntimeProvider>

