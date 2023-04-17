<script lang="ts">
    import type { MasterCSS } from "@master/css";
    import { onDestroy, onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { lazyCSSSymbol } from "./lazy-css";
    export let config: Promise<any>;
    export let root = typeof document !== "undefined" ? document : null;
    const css = writable<MasterCSS>();
    onMount(async () => {
        if (!$css) {
            const [{ MasterCSS }, configModule] = await Promise.all([
                import("@master/css"),
                config,
            ]);
            const { instances } = MasterCSS;
            const existingCSS = instances.find(
                (eachCSS) => eachCSS.root === root
            );
            if (existingCSS) {
                css.set(existingCSS);
            } else {
                const resolvedConfig =
                    configModule?.config ||
                    configModule?.default ||
                    configModule;
                css.set(new MasterCSS(resolvedConfig));
            }
            return () => $css.destroy();
        }
    });
    setContext(lazyCSSSymbol, css);
</script>

<slot />
