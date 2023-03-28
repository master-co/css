<script lang="ts">
    import { MasterCSS, type Config } from "@master/css";
    import { onDestroy, onMount, setContext } from "svelte";
    import { writable } from "svelte/store";
    import { cssSymbol } from "./css";
    export let config: Config;
    export let root: Document | ShadowRoot | null =
        typeof document !== "undefined" ? document : null;
    const existingCSS = MasterCSS.instances.find(
        (eachCSS) => eachCSS.root === root
    );
    const css = writable<MasterCSS>(
        existingCSS || new MasterCSS({ ...config, observe: false })
    );
    onMount(() => $css.observe(root));
    onDestroy(() => $css?.destroy());
    setContext(cssSymbol, css);
</script>

<slot />
