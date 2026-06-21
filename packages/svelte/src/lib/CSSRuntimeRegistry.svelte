<script lang="ts">
    import manifest from 'virtual:master-css-manifest';
    import emittedGlobals from 'virtual:master-css-emitted-globals';
    import CSSRuntimeProvider from './CSSRuntimeProvider.svelte';
</script>

<CSSRuntimeProvider {manifest} {emittedGlobals}>
    <slot />
</CSSRuntimeProvider>
