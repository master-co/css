<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { initCSSRuntime } from '@master/css-runtime';
    import type { CSSRuntime } from '@master/css-runtime';
    import { CSS_RUNTIME_CONTEXT_KEY } from './get-css-runtime.js';
    import type { CSSRuntimeProviderProps } from './types/provider-props.js';

    export let manifest: CSSRuntimeProviderProps['manifest'];
    export let emittedGlobals: CSSRuntimeProviderProps['emittedGlobals'] = undefined;
    export let hydrationManifest: CSSRuntimeProviderProps['hydrationManifest'] = undefined;
    export let root: CSSRuntimeProviderProps['root'] = undefined;

    const cssRuntime = writable<CSSRuntime | undefined>(undefined);
    let mounted = false;

    const getRoot = () => root ?? document;

    onMount(() => {
        mounted = true;
        cssRuntime.set(initCSSRuntime({ manifest, root: getRoot(), emittedGlobals, hydrationManifest }));
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
            currentCSSRuntime.refresh(manifest);
        }
    }

    $: if (mounted) {
        const currentCSSRuntime = get(cssRuntime);
        const nextRoot = getRoot();
        if (currentCSSRuntime && currentCSSRuntime.root !== nextRoot) {
            currentCSSRuntime.destroy();
            cssRuntime.set(initCSSRuntime({ manifest, root: nextRoot, emittedGlobals, hydrationManifest }));
        }
    }

    setContext(CSS_RUNTIME_CONTEXT_KEY, cssRuntime);
</script>

<slot />
