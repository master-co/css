<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import type { Config } from '@master/css';
    import { CSSRuntime, initCSSRuntime } from '@master/css-runtime';

    export let config: Config | undefined;
    export let root: Document | ShadowRoot | undefined | null = undefined;

    const cssRuntimeSymbol = Symbol('css-runtime');
    const cssRuntime = writable<CSSRuntime | undefined>(undefined);

    onMount(() => {
        cssRuntime.set(initCSSRuntime(config, root ?? document));
        return () => {
            const currentCSSRuntime = get(cssRuntime);
            currentCSSRuntime?.destroy();
            cssRuntime.set(undefined);
        };
    });

    $: (async () => {
        if (!config) return;
        const currentCSSRuntime = get(cssRuntime);
        if (currentCSSRuntime) {
            currentCSSRuntime.refresh(config);
        }
    })();

    $: (async () => {
        if (!root) return;
        const currentCSSRuntime = get(cssRuntime);
        if (currentCSSRuntime) {
            currentCSSRuntime.destroy();
            cssRuntime.set(undefined);
        }
    })();

    setContext(cssRuntimeSymbol, cssRuntime);
</script>

<slot />
