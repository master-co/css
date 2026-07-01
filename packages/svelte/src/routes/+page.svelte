<script lang="ts">
    const items = [
        'SvelteKit Vite plugin',
        'Server hook rendering',
        'Automatic .svelte source extraction'
    ];
</script>

<main class="max-w:40rem mx:auto p:2rem font:system">
    <h1 class="font:700 font:2rem m:0 mb:1rem">Master CSS Svelte</h1>
    <p class="fg:gray-60 mb:1.5rem">
        This local page exercises Svelte source extraction without runtime provider APIs.
    </p>
    <ul class="list-style:none p:0 m:0 d:grid gap:.75rem">
        {#each items as item (item)}
            <li class="p:1rem r:.5rem bg:gray-5 fg:gray-90">{item}</li>
        {/each}
    </ul>
</main>
