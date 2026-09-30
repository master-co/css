import type { ImgHTMLAttributes } from 'react'

type Props = {
  name: string
  ext?: string
  lang?: string
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>

export default function FileIcon({ name, ext, lang, ...props }: Props) {
  let icon = ''
  if (name) {
    switch (true) {
      case name.includes('react'):
        icon = 'tsx'
        break
      case name.includes('eslint.config'):
      case name.includes('.eslintrc'):
        icon = 'eslint'
        break
      case name.includes('.component.'):
      case name.includes('angular'):
      case name == 'angular.json':
        icon = 'angular'
        break
      case name.includes('Tailwind'):
      case name.includes('tailwind.config'):
        icon = 'tailwindcss'
        break
      case name.endsWith('blade.php'):
        icon = 'laravel'
        break
      case name === 'PHP':
        icon = 'php'
        break
      case name.includes('astro'):
        icon = 'astro'
        break
      case name.includes('vue'):
      case name.endsWith('vue'):
        icon = 'vue'
        break
      case name == 'npx':
        icon = 'npm'
        break
      case name === 'HTML':
        icon = 'html'
        break
      case name === 'CSS':
        icon = 'css'
        break
      case name.includes('json'):
        icon = 'json'
        break
      case name.includes('webpack'):
        icon = 'webpack'
        break
      case name.includes('vite'):
      case name.startsWith('Vite'):
        icon = 'vite'
        break
      case name.includes('master'):
      case name.includes('Master'):
        icon = 'master'
        break
      case name.includes('next.config'):
        icon = 'nextConfig'
        break
      case name.includes('nuxt.config'):
        icon = 'nuxtjs'
        break
      case name.includes('Bootstrap'):
        icon = 'bootstrap'
        break
      case name.includes('.'):
        icon = name.slice(name.lastIndexOf('.') + 1)
        break
    }
  }
  const icons = {
    svelte: '/icons/svelte.svg',
    angular: '/icons/angular.svg',
    astro: '/icons/astro.svg',
    php: '/icons/php.svg',
    eslint: '/icons/eslint.svg',
    ts: '/icons/typescript.svg',
    js: '/icons/javascript.svg',
    tsx: '/icons/react.svg',
    jsx: '/icons/react.svg',
    css: '/icons/css.svg',
    html: '/icons/html.svg',
    npm: '/icons/npm.svg',
    yarn: '/icons/yarn.svg',
    pnpm: '/icons/pnpm.svg',
    bun: '/icons/bun.svg',
    deno: '/icons/deno.svg',
    laravel: '/icons/laravel.svg',
    vue: '/icons/vue.svg',
    json: '/icons/json.svg',
    master: '/images/logo.svg',
    webpack: '/icons/webpack.svg',
    styledComponent: '/images/styled-components.svg',
    tailwindcss: '/images/tailwindcss.svg',
    nextjs: '/images/frameworks/nextjs.svg',
    nuxtjs: '/images/frameworks/nuxtjs.svg',
    parcel: '/images/build-tools/parcel.svg',
    reactFramework: '/images/frameworks/react.svg',
    angularFramework: '/images/frameworks/angular.svg',
    remix: '/images/frameworks/remix.svg',
    vite: '/images/build-tools/vite.svg',
    vuejs: '/images/frameworks/vuejs.svg',
    webpackBuildTool: '/images/build-tools/webpack.svg',
    nextConfig: '/icons/next.svg',
    bootstrap: '/images/bootstrap.svg'
  } as Record<string, string>
  let source = icons[icon]
  if (!source) source = icons[name]
  if (!source && ext) source = icons[ext]
  if (!source && lang) source = icons[lang]
  if (!source) return null
  // Public file badges have fixed colors and do not need a React SVG module.
  // eslint-disable-next-line @next/next/no-img-element -- Tiny local SVG badges need no image resizing.
  return <img {...props} src={source} alt="" />
}
