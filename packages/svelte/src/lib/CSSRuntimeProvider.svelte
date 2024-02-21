<script lang="ts">
    import type { Config } from "@master/css";
    import RuntimeCSS from "@master/css-runtime";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssRuntimeSymbol } from "./css-runtime";
    export let config: Config | Promise<Config> | Promise<any> | undefined = undefined;
    export let root: Document | ShadowRoot | undefined = undefined;
    const runtimeCSS = writable<RuntimeCSS>();
    onMount(() => {
        let newCSSRuntime: RuntimeCSS;
        if (!$runtimeCSS) {
            const init = (resolvedConfig?: Config) => {
                const existingCSSRuntime = (globalThis as any).runtimeCSSs.find(
                    (eachCSS: RuntimeCSS) => eachCSS.root === root
                );
                if (existingCSSRuntime) {
                    runtimeCSS.set(existingCSSRuntime);
                } else {
                    newCSSRuntime = new RuntimeCSS(root, resolvedConfig).observe();
                    runtimeCSS.set(newCSSRuntime);
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
        } else if (!$runtimeCSS.observing) {
            $runtimeCSS.observe();
        }
        return () => {
            newCSSRuntime?.destroy();
        };
    });
    setContext(cssRuntimeSymbol, runtimeCSS);
</script>

<slot />
