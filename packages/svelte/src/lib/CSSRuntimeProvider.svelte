<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { initCSSRuntime, resolveRuntimeConfig } from '@master/css-runtime';
    import type { CSSRuntime } from '@master/css-runtime';
    import { CSS_RUNTIME_CONTEXT_KEY } from './get-css-runtime.js';
    import type { CSSRuntimeProviderProps } from './types/provider-props.js';

    export let config: CSSRuntimeProviderProps['config'] = undefined;
    export let preloaded: CSSRuntimeProviderProps['preloaded'] = undefined;
    export let root: CSSRuntimeProviderProps['root'] = undefined;

    const cssRuntime = writable<CSSRuntime | undefined>(undefined);
    let mounted = false;

    const getRoot = () => root ?? document;

    onMount(() => {
        mounted = true;
        cssRuntime.set(initCSSRuntime({ config, root: getRoot(), preloaded }));
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
            currentCSSRuntime.refresh(resolveRuntimeConfig(config));
        }
    }

    $: if (mounted) {
        const currentCSSRuntime = get(cssRuntime);
        const nextRoot = getRoot();
        if (currentCSSRuntime && currentCSSRuntime.root !== nextRoot) {
            currentCSSRuntime.destroy();
            cssRuntime.set(initCSSRuntime({ config, root: nextRoot, preloaded }));
        }
    }

    setContext(CSS_RUNTIME_CONTEXT_KEY, cssRuntime);
</script>

<slot />
