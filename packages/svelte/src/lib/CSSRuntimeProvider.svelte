<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import type { Config } from '@master/css';
    import { CSSRuntime } from '@master/css-runtime';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    export let config: Config | Promise<any> | undefined;
    export let root: Document | ShadowRoot | undefined | null; // null for Element.shadowRoot

    const runtimeCSSSymbol = Symbol('runtime-css');
    const cssRuntime = writable<CSSRuntime | undefined>(undefined);

    const resolveConfig = async () => {
        const configModule = await config;
        return configModule?.config || configModule?.default || configModule;
    };

    const initialize = async (signal: AbortSignal) => {
        const resolvedConfig = await resolveConfig();
        if (signal.aborted) return;
        cssRuntime.set(new CSSRuntime(root ?? document, resolvedConfig).observe());
    };

    let controller: AbortController | null = null;

    onMount(() => {
        controller = new AbortController();
        initialize(controller.signal);

        return () => {
            controller?.abort();
            const currentRuntimeCSS = get(cssRuntime);
            currentRuntimeCSS?.destroy();
            cssRuntime.set(undefined);
        };
    });

    $: (async () => {
        if (!config) return;
        const controller = new AbortController();
        const resolvedConfig = await resolveConfig();
        if (controller.signal.aborted) return;
        const currentRuntimeCSS = get(cssRuntime);
        if (currentRuntimeCSS) {
            currentRuntimeCSS.refresh(resolvedConfig);
        }
    })();

    $: (async () => {
        if (!root) return;
        const controller = new AbortController();
        const currentRuntimeCSS = get(cssRuntime);
        if (controller.signal.aborted) return;
        if (currentRuntimeCSS) {
            currentRuntimeCSS.destroy();
            cssRuntime.set(undefined);
            initialize(controller.signal);
        }
    })();

    setContext(runtimeCSSSymbol, cssRuntime);
</script>

<slot />
