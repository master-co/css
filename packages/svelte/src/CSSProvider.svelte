<script lang="ts">
    import { MasterCSS, initRuntime, type Config } from "@master/css";
    import { onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssSymbol } from "./css";
    export let config: Config;
    export let root: Document | ShadowRoot | null =
        typeof document !== "undefined" ? document : null;
    const existingCSS = MasterCSS.instances.find(
        (eachCSS) => eachCSS.root === root
    );
    const css = writable<MasterCSS>(existingCSS || initRuntime(config));
    onMount(() => {
        if (!$css.observing) {
            $css.observe(root);
            return () => $css.destroy();
        }
    });
    setContext(cssSymbol, css);
</script>

<slot />
