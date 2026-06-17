<script lang="ts">
    import plan from 'virtual:master-css-plan';
    import preloaded from 'virtual:master-css-preloaded';
    import CSSRuntimeProvider from './CSSRuntimeProvider.svelte';
</script>

<CSSRuntimeProvider {plan} {preloaded}>
    <slot />
</CSSRuntimeProvider>
