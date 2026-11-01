const vite = '/guide/installation/vite'
const webpack = '/guide/installation/webpack'
const server = '/guide/installation/server-rendered'

/** Brand key, display name and guide URL, grouped by the setup the reader owns. */
export const installationGuideGroups = [
  { title: 'Frameworks', entries: [
    ['react', 'React', `${vite}#react`],
    ['vuejs', 'Vue.js', `${vite}#vue`],
    ['svelte', 'SvelteKit', '/guide/installation/svelte'],
    ['nextjs', 'Next.js', '/guide/installation/nextjs'],
    ['nuxtjs', 'Nuxt.js', '/guide/installation/nuxtjs'],
    ['astro', 'Astro', '/guide/installation/astro'],
    ['angular', 'Angular', '/guide/installation/angular'],
    ['react-router', 'React Router', `${vite}#react-router`],
    ['tanstack-start', 'TanStack Start', `${vite}#tanstack-start`],
    ['lit', 'Lit', '/guide/installation/lit']
  ] },
  { title: 'Build tools', entries: [
    ['vite', 'Vite', vite],
    ['webpack', 'Webpack', webpack],
    ['rspack', 'Rspack', `${webpack}#rspack`],
    ['rsbuild', 'Rsbuild', `${webpack}#rsbuild`]
  ] },
  { title: 'Server-rendered apps', entries: [
    ['express', 'Express', `${server}#express`],
    ['php', 'PHP', `${server}#php`],
    ['laravel', 'Laravel', `${server}#laravel`],
    ['rails', 'Rails', `${server}#rails`],
    ['aspnet-core', 'ASP.NET Core', `${server}#aspnet-core`],
    ['blazor', 'Blazor', `${server}#blazor`],
    ['wordpress', 'WordPress', `${server}#wordpress`],
    ['shopify', 'Shopify', `${server}#shopify`]
  ] },
  { title: 'Development tools', entries: [
    ['storybook', 'Storybook', '/guide/installation/storybook'],
    ['vscode', 'Visual Studio Code', '/guide/language-service#set-up-vs-code']
  ] }
] as const

export const installationGuidesMarkdown = () => installationGuideGroups.map(group =>
  `**${group.title}**\n\n${group.entries.map(([, title, href]) => `- [${title}](${href})`).join('\n')}`
).join('\n\n')
