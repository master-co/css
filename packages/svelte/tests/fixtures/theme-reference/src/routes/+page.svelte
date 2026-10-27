<script lang="ts">
  import { resolve } from '$app/paths'
  import './globals.css'
  // Package checks use the host app's route types, which exclude this fixture route.
  const unloadedRoute = '/unloaded' as '/'
</script>

<main class="probe">Loaded project entry</main>
<a href={resolve(unloadedRoute)}>Unloaded entry route</a>

<style>
  .probe { color:var(--color-probe); animation: project-pulse 1s linear infinite; }
</style>
