import tailwindcss from '../../public/images/tailwindcss.svg'
import bootstrap from '../../public/images/bootstrap.svg'
import mui from '../../public/images/mui.svg'
import styledComponents from '../../public/images/styled-components.svg'
import emotion from '../../public/images/emotion.svg'
import cssIcon from '../../public/icons/css.svg'
import sass from '../../public/icons/sass.svg'
import nextjs from '../../public/images/frameworks/nextjs.svg'
import svelte from '../../public/images/frameworks/svelte.svg'
import nuxtjs from '../../public/images/frameworks/nuxtjs.svg'
import laravel from '../../public/images/frameworks/laravel.svg'
import wordpress from '../../public/images/frameworks/wordpress.svg'
import php from '../../public/icons/php.svg'
import shopify from '../../public/images/frameworks/shopify.svg'
import aspnetCore from '../../public/icons/csharp.svg'
import express from '../../public/images/frameworks/express.svg'
import rails from '../../public/images/frameworks/rails.svg'
import lineLiff from '../../public/images/frameworks/line-liff.svg'
import astro from '../../public/images/frameworks/astro.svg'
import remix from '../../public/images/frameworks/remix.svg'
import blazor from '../../public/images/frameworks/blazor.svg'
import react from '../../public/images/frameworks/react.svg'
import lit from '../../public/images/frameworks/lit.svg'
import vuejs from '../../public/images/frameworks/vuejs.svg'
import angular from '../../public/images/frameworks/angular.svg'
import eslint from '../../public/icons/eslint.svg'
import storybook from '../../public/icons/storybook.svg'
import vite from '../../public/images/build-tools/vite.svg'
import webpack from '../../public/images/build-tools/webpack.svg'
import rspack from '../../public/images/build-tools/rspack.svg'
import rsbuild from '../../public/images/build-tools/rsbuild.svg'
import tanstack from '../../public/images/frameworks/tanstack.svg'
import esmSh from '../../public/images/cdns/esm-sh.svg'
import html from '../../public/icons/html.svg'
import vscode from '../../public/icons/visualstudiocode.svg'
import logo from '../../public/images/logo.svg'

const brands = {
  tailwindcss: { name: 'Tailwind CSS', src: tailwindcss, path: 'tailwindcss', color: 'cyan', className: 'transform:scale(.85)' },
  bootstrap: { name: 'Bootstrap', src: bootstrap, color: 'purple', disabled: true, className: 'transform:scale(.85)' },
  mui: { name: 'Material UI', src: mui, color: 'sky' },
  'styled-components': { name: 'Styled Components', src: styledComponents, path: 'styled-components', className: 'transform:scale(.9)' },
  emotion: { name: 'Emotion', src: emotion, path: 'emotion', className: 'transform:scale(.9)', disabled: true },
  css: { name: 'CSS', src: cssIcon, className: 'transform:scale(.9)', disabled: true },
  eslint: { name: 'ESLint', src: eslint, className: 'transform:scale(.9)', disabled: true },
  sass: { name: 'Sass', src: sass, className: 'transform:scale(.9)', disabled: true },
  nextjs: { name: 'Next.js', src: nextjs, className: 'transform:scale(1.3) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark', path: 'nextjs', color: 'gray' },
  svelte: { name: 'Svelte', src: svelte, className: 'transform:scale(.85)', color: 'orange' },
  nuxtjs: { name: 'Nuxt.js', src: nuxtjs, className: 'transform:scale(1.15)', path: 'nuxtjs', color: 'beryl' },
  laravel: { name: 'Laravel', src: laravel, className: 'transform:scale(.8)' },
  wordpress: { name: 'WordPress', src: wordpress, className: 'transform:scale(.85)', path: 'wordpress', color: 'blue' },
  php: { name: 'PHP', src: php, className: 'transform:scale(.9)', path: 'php', color: 'purple' },
  shopify: { name: 'Shopify', src: shopify, className: 'transform:scale(.9)', path: 'shopify', color: 'green' },
  'aspnet-core': { name: 'ASP.NET Core', src: aspnetCore, className: 'transform:scale(.9)', path: 'aspnet-core', color: 'sky' },
  express: { name: 'Express', src: express, className: 'transform:scale(.9)', path: 'express', color: 'gray' },
  rails: { name: 'Rails', src: rails, className: 'transform:scale(.85)', path: 'rails', color: 'red' },
  'line-liff': { name: 'LINE LIFF', src: lineLiff, className: 'transform:scale(.85)', path: 'line-liff', color: 'green' },
  astro: { name: 'Astro', src: astro, className: 'transform:scale(.9) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark' },
  remix: { name: 'Remix', src: remix, className: 'transform:scale(1.2) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark', disabled: true },
  'react-router': { name: 'React Router', src: remix, className: 'transform:scale(1.2) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark', path: 'react-router' },
  blazor: { name: 'Blazor', src: blazor, className: 'transform:scale(1.05)' },
  react: { name: 'React', src: react, className: 'transform:scale(.85)', color: 'cyan' },
  lit: { name: 'Lit', src: lit, className: 'transform:scale(.85)', color: 'cyan' },
  vuejs: { name: 'Vue.js', src: vuejs, className: 'transform:scale(.85)', path: 'vuejs', color: 'green' },
  angular: { name: 'Angular', src: angular, className: 'transform:scale(.85)', color: 'pink' },
  vite: { name: 'Vite', src: vite, className: 'transform:scale(.85)' },
  webpack: { name: 'Webpack', src: webpack, className: 'transform:scale(.9)' },
  rspack: { name: 'Rspack', src: rspack, className: 'transform:scale(.85)' },
  rsbuild: { name: 'Rsbuild', src: rsbuild, className: 'transform:scale(.85)' },
  'tanstack-start': { name: 'TanStack Start', src: tanstack, path: 'tanstack-start', className: 'transform:scale(.85) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark' },
  storybook: { name: 'Storybook', src: storybook, className: 'transform:scale(.85)', path: 'storybook', color: 'pink' },
  'esm-sh': { name: 'esm.sh', src: esmSh, className: 'transform:scale(.8) filter:invert(1)@dark', headerClassName: 'filter:invert(1)@dark', path: 'esm-sh' },
  html: { name: 'HTML', src: html, path: 'html' },
  vscode: { name: 'Visual Studio Code', src: vscode, className: 'transform:scale(.8)', path: 'vscode' },
  v1: { name: 'v1.0', src: logo, path: 'v1', className: 'transform:scale(.85)' },
  mastercss: { name: 'Master CSS', src: logo, color: 'yellow' },
} as Record<string, { name: string; src: any; path?: string; className?: string; headerClassName?: string; disabled?: boolean; color?: string }>

export default brands
