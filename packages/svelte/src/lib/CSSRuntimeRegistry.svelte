<script lang="ts">
    import config from 'virtual:master-css-config';
    import CSSRuntimeProvider from './CSSRuntimeProvider.svelte';
</script>

<CSSRuntimeProvider {config}>
    <slot />
</CSSRuntimeProvider>
