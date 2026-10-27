<script lang="ts">
  const items = [
    'SvelteKit Vite plugin',
    'Server hook rendering',
    'Automatic .svelte source extraction'
  ];
</script>

<main class="max-width:40rem margin-inline:auto padding:2rem font-sans">
  <h1 class="font-weight:700 font-size:2rem margin:0 margin-bottom:1rem">Master CSS Svelte</h1>
  <p class="fg-gray-60 margin-bottom:1.5rem">
    This local page exercises Svelte source extraction without runtime provider APIs.
  </p>
  <ul class="list-style:none padding:0 margin:0 display:grid gap:.75rem">
    {#each items as item (item)}
      <li class="padding:1rem border-radius:.5rem bg-gray-10 fg-gray-90">{item}</li>
    {/each}
  </ul>
</main>
