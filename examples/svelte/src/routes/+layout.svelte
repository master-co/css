<script lang="ts">
    import { onMount, type ComponentType } from "svelte";
    import { type CSSRuntimeProvider as CSSProviderType, Fragment } from "@master/css.svelte";
    import Header from "./Header.svelte";
    import "./styles.css";

    let CSSRuntimeProvider: ComponentType<CSSProviderType> = Fragment as any;

    onMount(async () => {
        CSSRuntimeProvider = (await import("@master/css.svelte")).default;
    });
</script>

<svelte:component this={CSSRuntimeProvider} config={import("../../master.css")}>
    <div class="app">
        <Header />

        <main>
            <slot />
        </main>

        <footer>
            <p>
                visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn
                SvelteKit
            </p>
        </footer>
    </div>
</svelte:component>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        max-width: 64rem;
        margin: 0 auto;
        box-sizing: border-box;
    }

    footer {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 12px;
    }

    footer a {
        font-weight: bold;
    }

    @media (min-width: 480px) {
        footer {
            padding: 12px 0;
        }
    }
</style>
