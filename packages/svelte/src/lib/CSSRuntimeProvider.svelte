<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import type { Config } from '@master/css';
    import { initCSSRuntime } from '@master/css-runtime';
    import type { CSSRuntime } from '@master/css-runtime';
    import { CSS_RUNTIME_CONTEXT_KEY } from './get-css-runtime.js';

    export let config: Config | undefined;
    export let root: Document | ShadowRoot | undefined | null = undefined;

    const cssRuntime = writable<CSSRuntime | undefined>(undefined);
    let mounted = false;

    const getRoot = () => root ?? document;

    onMount(() => {
        mounted = true;
        cssRuntime.set(initCSSRuntime(config, getRoot()));
        return () => {
            mounted = false;
            const currentCSSRuntime = get(cssRuntime);
            currentCSSRuntime?.destroy();
            cssRuntime.set(undefined);
        };
    });

    $: {
        const currentCSSRuntime = get(cssRuntime);
        if (currentCSSRuntime) {
            currentCSSRuntime.refresh(config);
        }
    }

    $: if (mounted) {
        const currentCSSRuntime = get(cssRuntime);
        const nextRoot = getRoot();
        if (currentCSSRuntime && currentCSSRuntime.root !== nextRoot) {
            currentCSSRuntime.destroy();
            cssRuntime.set(initCSSRuntime(config, nextRoot));
        }
    }

    setContext(CSS_RUNTIME_CONTEXT_KEY, cssRuntime);
</script>

<slot />
