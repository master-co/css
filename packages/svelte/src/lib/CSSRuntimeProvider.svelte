<script lang="ts">
    import { onMount, setContext } from 'svelte';
    import { writable, get } from 'svelte/store';
    import * as MasterCSSRuntime from '@master/css-runtime';
    import type { CSSRuntime } from '@master/css-runtime';
    import { CSS_RUNTIME_CONTEXT_KEY } from './get-css-runtime.js';
    import type { CSSRuntimeProviderProps } from './types/provider-props.js';

    export let manifest: CSSRuntimeProviderProps['manifest'];
    export let emittedGlobals: CSSRuntimeProviderProps['emittedGlobals'] = undefined;
    export let hydrationManifest: CSSRuntimeProviderProps['hydrationManifest'] = undefined;
    export let root: CSSRuntimeProviderProps['root'] = undefined;

    const cssRuntime = writable<CSSRuntime | undefined>(undefined);
    const cssRuntimeModule = MasterCSSRuntime as typeof MasterCSSRuntime & {
        initCSSRuntimeAsync?: typeof MasterCSSRuntime.initCSSRuntime;
    };
    let mounted = false;
    let runtimeVersion = 0;
    let activeRoot: Document | ShadowRoot | undefined = undefined;

    const getRoot = () => root ?? document;

    async function createRuntime(nextRoot: Document | ShadowRoot) {
        const options = { manifest, root: nextRoot, emittedGlobals, hydrationManifest };
        return hydrationManifest === undefined
            ? await (cssRuntimeModule.initCSSRuntimeAsync || cssRuntimeModule.initCSSRuntime)(options)
            : cssRuntimeModule.initCSSRuntime(options);
    }

    function startRuntime(nextRoot: Document | ShadowRoot) {
        const version = ++runtimeVersion;
        activeRoot = nextRoot;
        void createRuntime(nextRoot).then((nextCSSRuntime) => {
            if (!mounted || version !== runtimeVersion) {
                nextCSSRuntime.destroy();
                return;
            }
            cssRuntime.set(nextCSSRuntime);
        });
    }

    onMount(() => {
        mounted = true;
        startRuntime(getRoot());
        return () => {
            mounted = false;
            runtimeVersion++;
            activeRoot = undefined;
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
            cssRuntime.set(undefined);
            startRuntime(nextRoot);
        } else if (!currentCSSRuntime && activeRoot && activeRoot !== nextRoot) {
            startRuntime(nextRoot);
        }
    }

    setContext(CSS_RUNTIME_CONTEXT_KEY, cssRuntime);
</script>

<slot />
