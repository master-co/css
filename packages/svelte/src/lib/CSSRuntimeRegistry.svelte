<script lang="ts">
    import config from 'virtual:master-css-config';
    import preloaded from 'virtual:master-css-preloaded';
    import CSSRuntimeProvider from './CSSRuntimeProvider.svelte';
</script>

<CSSRuntimeProvider {config} {preloaded}>
    <slot />
</CSSRuntimeProvider>
