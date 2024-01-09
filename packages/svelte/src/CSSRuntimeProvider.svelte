<script lang="ts">
    import type { Config } from "@master/css";
    import CSSRuntime from "@master/css-runtime";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssRuntimeSymbol } from "./css-runtime";
    export let config: Config | Promise<Config> | Promise<any>;
    export let root: Document | ShadowRoot | undefined = undefined;
    const cssRuntime = writable<CSSRuntime>();
    onMount(() => {
        let newCSSRuntime: CSSRuntime;
        if (!$cssRuntime) {
            const init = (resolvedConfig?: Config) => {
                const existingCSSRuntime = (globalThis as any).cssRuntimes.find(
                    (eachCSS: CSSRuntime) => eachCSS.root === root
                );
                if (existingCSSRuntime) {
                    cssRuntime.set(existingCSSRuntime);
                } else {
                    newCSSRuntime = new CSSRuntime(root, resolvedConfig).observe();
                    cssRuntime.set(newCSSRuntime);
                }
            };
            if (config instanceof Promise) {
                (async () => {
                    const configModule = await config;
                    init(
                        configModule?.config ||
                            configModule?.default ||
                            configModule
                    );
                })();
            } else {
                init(config);
            }
        } else if (!$cssRuntime.observing) {
            $cssRuntime.observe();
        }
        return () => {
            newCSSRuntime?.destroy();
        };
    });
    setContext(cssRuntimeSymbol, cssRuntime);
</script>

<slot />
