# @master/css-svelte-addon

Svelte CLI add-on for one-command Master CSS setup in SvelteKit projects.

## Usage

```bash
npx sv add @master/css-svelte-addon
```

The add-on installs `@master/css` and `@master/css-svelte` at the same version as the add-on, wires the SvelteKit Vite plugin, creates or updates the project stylesheet entry, imports that stylesheet from the root layout, and defaults to `static` CSS without a server hook or browser runtime. Follow the [SvelteKit integration guide](https://css.master.co/guide/installation/svelte#rendering-modes) to switch to `runtime`, `prerender`, or `progressive`.

`@master/css-svelte-addon` is an installer only. User apps keep `@master/css-svelte` as the runtime and build integration package.

## Support

Only SvelteKit projects are supported.
