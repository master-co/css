<script lang="ts">
    import { MasterCSS, type Config } from "@master/css";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssSymbol } from "./css";
    export let config: Config | Promise<Config> | Promise<any>;
    export let root: Document | ShadowRoot | null =
        typeof document !== "undefined" ? document : null;
    const css = writable<MasterCSS>();
    onMount(() => {
        let newCSS: MasterCSS;
        if (!$css) {
            const init = (resolvedConfig?: Config) => {
                const existingCSS = (globalThis as any).masterCSSs.find(
                    (eachCSS: MasterCSS) => eachCSS.root === root
                );
                if (existingCSS) {
                    css.set(existingCSS);
                } else {
                    newCSS = new MasterCSS(resolvedConfig).observe(root);
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
