<script lang="ts">
    import { MasterCSS, initRuntime, type Config } from "@master/css";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssSymbol } from "./css";
    export let config: Config | Promise<Config> | Promise<any>;
    export let root: Document | ShadowRoot | null =
        typeof document !== "undefined" ? document : null;
    const css = writable<MasterCSS>(
        MasterCSS.instances.find((eachCSS) => eachCSS.root === root)
    );
    onMount(async () => {
        let newCSS: MasterCSS;
        if (!$css) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = MasterCSS.instances.find(
                    (eachCSS) => eachCSS.root === root
                );
                if (existingCSS) {
                    css.set(existingCSS);
                } else {
                    newCSS = initRuntime(resolvedConfig);
                    css.set(newCSS);
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
        } else if (!$css.observing) {
            $css.observe(root);
        }
        return () => {
            newCSS?.destroy();
        };
    });
    setContext(cssSymbol, css);
</script>

<slot />
