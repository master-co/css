const vite = '/guide/installation/vite'
const webpack = '/guide/installation/webpack'
const server = '/guide/installation/server-rendered'

/** Brand key, display name and guide URL; several brands share one consolidated page. */
export const installationGuides = [
  ['vscode', 'Visual Studio Code', '/guide/language-service#set-up-vs-code'],
  ['react', 'React', `${vite}#react`],
  ['vite', 'Vite', vite],
  ['nextjs', 'Next.js', '/guide/installation/nextjs'],
  ['express', 'Express', `${server}#express`],
  ['aspnet-core', 'ASP.NET Core', `${server}#aspnet-core`],
  ['php', 'PHP', `${server}#php`],
  ['webpack', 'Webpack', webpack],
  ['angular', 'Angular', '/guide/installation/angular'],
  ['vuejs', 'Vue.js', `${vite}#vue`],
  ['wordpress', 'WordPress', `${server}#wordpress`],
  ['laravel', 'Laravel', `${server}#laravel`],
  ['svelte', 'Svelte', '/guide/installation/svelte'],
  ['blazor', 'Blazor', `${server}#blazor`],
  ['rails', 'Rails', `${server}#rails`],
  ['astro', 'Astro', '/guide/installation/astro'],
  ['nuxtjs', 'Nuxt.js', '/guide/installation/nuxtjs'],
  ['storybook', 'Storybook', '/guide/installation/storybook'],
  ['shopify', 'Shopify', `${server}#shopify`],
  ['react-router', 'React Router', `${vite}#react-router`],
  ['lit', 'Lit', '/guide/installation/lit'],
  ['rspack', 'Rspack', `${webpack}#rspack`],
  ['rsbuild', 'Rsbuild', `${webpack}#rsbuild`],
  ['tanstack-start', 'TanStack Start', `${vite}#tanstack-start`]
] as const

export const installationGuidesMarkdown = () => installationGuides.map(([, title, href]) => `- [${title}](${href})`).join('\n')
