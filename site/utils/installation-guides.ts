export const installationGuides = [
  ['vscode', 'Visual Studio Code'], ['react', 'React'], ['vite', 'Vite'], ['nextjs', 'Next.js'],
  ['express', 'Express'], ['aspnet-core', 'ASP.NET Core'], ['php', 'PHP'], ['webpack', 'Webpack'],
  ['angular', 'Angular'], ['vuejs', 'Vue.js'], ['wordpress', 'WordPress'], ['laravel', 'Laravel'],
  ['svelte', 'Svelte'], ['blazor', 'Blazor'], ['rails', 'Rails'], ['astro', 'Astro'],
  ['nuxtjs', 'Nuxt.js'], ['storybook', 'Storybook'], ['shopify', 'Shopify'], ['react-router', 'React Router'],
  ['lit', 'Lit'], ['rspack', 'Rspack'], ['rsbuild', 'Rsbuild'], ['tanstack-start', 'TanStack Start']
] as const

export const installationGuidesMarkdown = () => installationGuides.map(([slug, title]) => `- [${title}](/guide/installation/${slug})`).join('\n')
