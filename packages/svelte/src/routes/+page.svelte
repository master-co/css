<script lang="ts">
    import type { MasterCSSPlan } from "@master/css-runtime";
    import { defaultPlan } from "@master/css";
    import { CSSRuntimeProvider } from "../lib/runtime-provider.js";

    let containerRef = $state<HTMLDivElement>();
    let plan = $state<MasterCSSPlan>({
        version: 1,
        utilities: [
            {
                id: "btn",
                name: "btn",
                type: -4,
                order: 0,
                layer: "components",
                emit: {
                    type: "static",
                    rules: [
                        { selector: "&", declarations: { border: "0.125rem var(--color-red) solid" } },
                    ],
                },
                matchers: [{ type: "static", name: "btn" }],
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
    <CSSRuntimeProvider {plan} {root}>
        <button onclick={() => (destroy = true)}>DESTROY</button>
        <button
            id="config-btn"
            class="btn bg:blue-50"
            onclick={() => (plan = defaultPlan)}>CONFIG</button
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
