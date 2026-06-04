<script lang="ts">
    import type { Config } from "@master/css";
    import { CSSRuntimeProvider } from "../lib/runtime-provider.js";

    let containerRef = $state<HTMLDivElement>();
    let config = $state<Config>({
        utilities: [
            {
                name: "btn",
                type: -4,
                layer: "main",
                rules: [
                    { selector: "&", declarations: { border: "0.125rem var(--color-red) solid" } },
                ],
            },
        ],
    });
    let root = $state<ShadowRoot | Document | undefined | null>();
    let destroy = $state(false);

    $effect(() => {
        if (containerRef) {
            containerRef.attachShadow({ mode: "open" });
        } else {
            root = null
        }
    });

    $effect(() => {
        if (!destroy) {
            const shadowContent = document.createElement("div");
            shadowContent.innerHTML = "SHADOW CONTENT";
            shadowContent.className = "fg:red-60";
            containerRef?.shadowRoot?.appendChild(shadowContent);
        }
    });
</script>

{#if destroy}
    <button onclick={() => (destroy = false)}>INIT</button>
{/if}

{#if !destroy}
    <CSSRuntimeProvider {config} {root}>
        <button onclick={() => (destroy = true)}>DESTROY</button>
        <button
            id="config-btn"
            class="btn bg:blue-50"
            onclick={() => (config = {})}>CONFIG</button
        >
        <button
            id="root-btn"
            onclick={() => {
                root = containerRef?.shadowRoot;
            }}>ROOT</button
        >
        <div bind:this={containerRef}></div>
    </CSSRuntimeProvider>
{/if}
