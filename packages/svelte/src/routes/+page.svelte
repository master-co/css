<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store'
    import type { Config } from '@master/css'
    import CSSRuntimeProvider from '../lib/CSSRuntimeProvider.svelte'

    let containerRef: HTMLDivElement
    let shadowRoot: ShadowRoot

    const config = writable<Config>({
        styles: {
            btn: 'b:2|red'
        }
    })
    const root = writable<ShadowRoot>()
    const destroy = writable<boolean>(false)

    onMount(() => {
        shadowRoot = containerRef.attachShadow({ mode: 'open' });

        const shadowContent = document.createElement('div');
        shadowContent.className = 'f:1000'
        shadowRoot.appendChild(shadowContent);
    })
</script>

{#if $destroy}
    <button on:click={() => destroy.set(false)}>INIT</button>
{/if}

{#if !$destroy}
    <CSSRuntimeProvider config={$config} root={$root}>
        <button on:click={() => destroy.set(true)}>DESTROY</button>
        <button id="config-btn" class="btn bg:blue-50" on:click={() => config.set({})}>CONFIG</button>
        <button id="root-btn" on:click={() => root.set(shadowRoot)}>ROOT</button>
        <div bind:this={containerRef}></div>
    </CSSRuntimeProvider>
{/if}


