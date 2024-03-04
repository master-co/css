<script lang="ts">
    import type { Config } from "@master/css";
    import RuntimeCSS from "@master/css-runtime";
    import { onMount, setContext, afterUpdate, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    export let config: Config | Promise<Config> | Promise<any> | undefined =
        undefined;
    export let root: Document | ShadowRoot | undefined = undefined;
    const runtimeCSS = writable<RuntimeCSS>();

    let initializing = false;
    let isExternalRuntimeCSS = false;
    let identifier = 0;

    const getResolvedConfig = async () => {
        if (config instanceof Promise) {
            const configModule: any = await config;
            return (
                configModule?.config || configModule?.default || configModule
            );
        } else {
            return config;
        }
    };
    const init = async (resolvedConfig?: Config | undefined) => {
        initializing = true;

        const currentRoot = root ?? document;
        const existingCSSRuntime = (globalThis as any).runtimeCSSs.find(
            (eachCSS: RuntimeCSS) => eachCSS.root === currentRoot,
        );
        if (existingCSSRuntime) {
            runtimeCSS.set(existingCSSRuntime);
            isExternalRuntimeCSS = true;
        } else {
            runtimeCSS.set(
                new RuntimeCSS(
                    root,
                    resolvedConfig ?? (await getResolvedConfig()),
                ).observe(),
            );
            isExternalRuntimeCSS = false;
        }

        initializing = false;
    };
    const waitInitialized = async () => {
        const currentIdentifier = ++identifier;
        if (initializing) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (!initializing) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }
        return currentIdentifier === identifier
    };

    onMount(async () => await init());

    const getRuntimeCSS = () => $runtimeCSS
    $: {
        const currentRuntimeCSS = getRuntimeCSS()
        if (currentRuntimeCSS) {
            (async () => {
                if (!await waitInitialized())
                    return

                if (
                    currentRuntimeCSS.root !== root &&
                    (root || currentRuntimeCSS.root !== document)
                ) {
                    currentRuntimeCSS.destroy();
                    await init(await getResolvedConfig());
                }
            })()
        }
    }

    $: {
        const currentRuntimeCSS = getRuntimeCSS()
        if (currentRuntimeCSS) {
            (async () => {
                if (!await waitInitialized())
                    return

                currentRuntimeCSS.refresh(config && await getResolvedConfig());
            })()
        }
    }

    onDestroy(() => {
        if (!isExternalRuntimeCSS) {
            $runtimeCSS?.destroy();
        }
    });

    setContext("runtime-css", runtimeCSS);
</script>

<slot />
