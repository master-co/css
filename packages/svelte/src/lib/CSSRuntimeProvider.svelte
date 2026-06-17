<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { initCSSRuntime, resolveRuntimePlan } from '@master/css-runtime';
    import type { CSSRuntime } from '@master/css-runtime';
    import { CSS_RUNTIME_CONTEXT_KEY } from './get-css-runtime.js';
    import type { CSSRuntimeProviderProps } from './types/provider-props.js';

    export let plan: CSSRuntimeProviderProps['plan'];
    export let preloaded: CSSRuntimeProviderProps['preloaded'] = undefined;
    export let manifest: CSSRuntimeProviderProps['manifest'] = undefined;
    export let root: CSSRuntimeProviderProps['root'] = undefined;

    const cssRuntime = writable<CSSRuntime | undefined>(undefined);
    let mounted = false;

    const getRoot = () => root ?? document;

    onMount(() => {
        mounted = true;
        cssRuntime.set(initCSSRuntime({ plan, root: getRoot(), preloaded, manifest }));
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
            currentCSSRuntime.refresh(resolveRuntimePlan(plan));
        }
    }

    $: if (mounted) {
        const currentCSSRuntime = get(cssRuntime);
        const nextRoot = getRoot();
        if (currentCSSRuntime && currentCSSRuntime.root !== nextRoot) {
            currentCSSRuntime.destroy();
            cssRuntime.set(initCSSRuntime({ plan, root: nextRoot, preloaded, manifest }));
        }
    }

    setContext(CSS_RUNTIME_CONTEXT_KEY, cssRuntime);
</script>

<slot />
