import { readJSONFileSync } from '@techor/fs'
import { existsSync } from 'fs'

export default (): 'nextjs' | 'nuxtjs' | 'remix' | 'svelte' | 'laravel' | 'astro' | 'angular' | 'react' | 'vuejs' | 'vite' | 'webpack' | undefined => {
    if (
        existsSync('next.config.js') ||
        existsSync('next.config.cjs') ||
        existsSync('next.config.mjs') ||
        existsSync('next.config.ts')
    ) {
        return 'nextjs'
    }

    if (
        existsSync('nuxt.config.js') ||
        existsSync('nuxt.config.cjs') ||
        existsSync('nuxt.config.mjs') ||
        existsSync('nuxt.config.ts')
    ) {
        return 'nuxtjs'
    }

    if (
        existsSync('remix.config.js') ||
        existsSync('remix.config.cjs') ||
        existsSync('remix.config.mjs') ||
        existsSync('remix.config.ts')
    ) {
        return 'remix'
    }

    if (
        existsSync('svelte.config.js') ||
        existsSync('svelte.config.cjs') ||
        existsSync('svelte.config.mjs') ||
        existsSync('svelte.config.ts')
    ) {
        return 'svelte'
    }

    if (
        existsSync('astro.config.js') ||
        existsSync('astro.config.cjs') ||
        existsSync('astro.config.mjs') ||
        existsSync('astro.config.ts')
    ) {
        return 'astro'
    }

    if (
        existsSync('composer.json')
    ) {
        return 'laravel'
    }

    if (
        existsSync('angular.json')
    ) {
        return 'angular'
    }

    const pkg = readJSONFileSync('package.json')

    if (pkg?.dependencies?.['@remix-run/react'] || pkg?.devDependencies?.['@remix-run/react']) {
        return 'remix'
    }

    if (pkg?.dependencies?.['@sveltejs/kit'] || pkg?.devDependencies?.['@sveltejs/kit']) {
        return 'svelte'
    }

    if (pkg?.dependencies?.['astro'] || pkg?.devDependencies?.['astro']) {
        return 'astro'
    }

    if (pkg?.dependencies?.['next'] || pkg?.devDependencies?.['next']) {
        return 'nextjs'
    }

    if (pkg?.dependencies?.['nuxt'] || pkg?.devDependencies?.['nuxt']) {
        return 'nuxtjs'
    }

    if (pkg?.dependencies?.['@angular/core'] || pkg?.devDependencies?.['@angular/core']) {
        return 'angular'
    }

    if (pkg?.dependencies?.['react'] || pkg?.devDependencies?.['react']) {
        return 'react'
    }

    if (pkg?.dependencies?.['vue'] || pkg?.devDependencies?.['vue']) {
        return 'vuejs'
    }

    if (
        existsSync('vite.config.js') ||
        existsSync('vite.config.cjs') ||
        existsSync('vite.config.mjs') ||
        existsSync('vite.config.ts')
    ) {
        return 'vite'
    }

    if (
        existsSync('webpack.config.js') ||
        existsSync('webpack.config.cjs') ||
        existsSync('webpack.config.mjs') ||
        existsSync('webpack.config.ts')
    ) {
        return 'webpack'
    }
}