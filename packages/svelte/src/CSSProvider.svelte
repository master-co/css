<script lang="ts">
    import { RuntimeCSS, type Config } from "@master/css";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssSymbol } from "./css";
    export let config: Config | Promise<Config> | Promise<any>;
    export let root: Document | ShadowRoot | undefined = undefined;
    const runtimeCSS = writable<RuntimeCSS>();
    onMount(() => {
        let newRuntimeCSS: RuntimeCSS;
        if (!$runtimeCSS) {
            const init = (resolvedConfig?: Config) => {
                const existingRuntimeCSS = (globalThis as any).runtimeCSSs.find(
                    (eachCSS: RuntimeCSS) => eachCSS.root === root
                );
                if (existingRuntimeCSS) {
                    runtimeCSS.set(existingRuntimeCSS);
                } else {
                    newRuntimeCSS = new RuntimeCSS(root, resolvedConfig).observe();
                    runtimeCSS.set(newRuntimeCSS);
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
            newRuntimeCSS?.destroy();
        };
    });
    setContext(cssSymbol, runtimeCSS);
</script>

<slot />
