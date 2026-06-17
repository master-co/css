<script lang="ts">
    import plan from 'virtual:master-css-plan.json';
    import preloaded from 'virtual:master-css-preloaded';
    import CSSRuntimeProvider from './CSSRuntimeProvider.svelte';
</script>

<CSSRuntimeProvider {plan} {preloaded}>
    <slot />
</CSSRuntimeProvider>
