import SvelteSvg from '../../public/icons/svelte.svg'
import TypescriptSvg from '../../public/icons/typescript.svg'
import CssSvg from '../../public/icons/css.svg'
import AngularSvg from '../../public/icons/angular.svg'
import HtmlSvg from '../../public/icons/html.svg'
import JavascriptSvg from '../../public/icons/javascript.svg'
import NpmSvg from '../../public/icons/npm.svg'
import YarnSvg from '../../public/icons/yarn.svg'
import PnpmSvg from '../../public/icons/pnpm.svg'
import BunSvg from '../../public/icons/bun.svg'
import DenoSvg from '../../public/icons/deno.svg'
import ReactSvg from '../../public/icons/react.svg'
import LaravelSvg from '../../public/icons/laravel.svg'
import PhpSvg from '../../public/icons/php.svg'
import VueSvg from '../../public/icons/vue.svg'
import AstroSvg from '../../public/icons/astro.svg'
import NextConfigSvg from '../../public/icons/next.svg'
import JsonSvg from '../../public/icons/json.svg'
import WebpackSvg from '../../public/icons/webpack.svg'
import MasterSvg from '../../public/images/logo.svg'
import ESLintSvg from '../../public/icons/eslint.svg'
import StyledComponentsSvg from '../../public/images/styled-components.svg'
import TailwindCSSSvg from '../../public/images/tailwindcss.svg'
import NextjsSvg from '../../public/images/frameworks/nextjs.svg'
import NuxtjsSvg from '../../public/images/frameworks/nuxtjs.svg'
import ParcelSvg from '../../public/images/build-tools/parcel.svg'
import ReactFrameworkSvg from '../../public/images/frameworks/react.svg'
import AngularFrameworkSvg from '../../public/images/frameworks/angular.svg'
import RemixSvg from '../../public/images/frameworks/remix.svg'
import ViteSvg from '../../public/images/build-tools/vite.svg'
import VuejsSvg from '../../public/images/frameworks/vuejs.svg'
import WebpackBuildToolSvg from '../../public/images/build-tools/webpack.svg'
import BootstrapSvg from '../../public/images/bootstrap.svg'
import { SVGProps } from 'react'

type Props = {
  name: string
  ext?: string
  lang?: string
} & SVGProps<SVGSVGElement>

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
  const Icons = {
    svelte: SvelteSvg,
    angular: AngularSvg,
    astro: AstroSvg,
    php: PhpSvg,
    eslint: ESLintSvg,
    ts: TypescriptSvg,
    js: JavascriptSvg,
    tsx: ReactSvg,
    jsx: ReactSvg,
    css: CssSvg,
    html: HtmlSvg,
    npm: NpmSvg,
    yarn: YarnSvg,
    pnpm: PnpmSvg,
    bun: BunSvg,
    deno: DenoSvg,
    laravel: LaravelSvg,
    vue: VueSvg,
    json: JsonSvg,
    master: MasterSvg,
    webpack: WebpackSvg,
    styledComponent: StyledComponentsSvg,
    tailwindcss: TailwindCSSSvg,
    nextjs: NextjsSvg,
    nuxtjs: NuxtjsSvg,
    parcel: ParcelSvg,
    reactFramework: ReactFrameworkSvg,
    angularFramework: AngularFrameworkSvg,
    remix: RemixSvg,
    vite: ViteSvg,
    vuejs: VuejsSvg,
    webpackBuildTool: WebpackBuildToolSvg,
    nextConfig: NextConfigSvg,
    bootstrap: BootstrapSvg
  } as any
  let Icon = Icons[icon]
  if (!Icon) Icon = Icons[name]
  if (!Icon && ext) Icon = Icons[ext]
  if (!Icon && lang) Icon = Icons[lang]
  if (!Icon) return <></>
  return <Icon {...props} />
}