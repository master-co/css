import { CANONICAL_ESLINT_CONFIG } from './constants'

function addImport(content: string, statement: string) {
    if (content.includes(statement)) return content
    const lines = content.split('\n')
    let insertIndex = 0
    while (insertIndex < lines.length && /^import\s/.test(lines[insertIndex])) {
        insertIndex++
    }
    lines.splice(insertIndex, 0, statement)
    return lines.join('\n').replace(/\n{3,}/, '\n\n')
}

function ensureCSSImport(content: string) {
    if (/^\s*@import\s+['"]@master\/css['"]\s*;/m.test(content)) return content
    return `@import '@master/css';\n${content ? `\n${content}` : ''}`
}

function replaceFirst(content: string, pattern: RegExp, replacement: string) {
    return pattern.test(content) ? content.replace(pattern, replacement) : content
}

export function addMasterCSSImportToStylesheet(content: string) {
    return ensureCSSImport(content)
}

export function createMasterCSSStylesheet() {
    return "@import '@master/css';\n"
}

export function addMasterCSSVitePlugin(content: string) {
    if (content.includes('@master/css.vite')) return content
    let next = addImport(content, "import masterCSS from '@master/css.vite'")
    if (/plugins\s*:\s*\[/.test(next)) {
        return replaceFirst(next, /plugins\s*:\s*\[/, 'plugins: [\n            masterCSS(),')
    }
    if (/defineConfig\(\s*\{/.test(next)) {
        return replaceFirst(next, /defineConfig\(\s*\{/, 'defineConfig({\n    plugins: [masterCSS()],')
    }
    return next
}

export function createViteConfig() {
    return `import { defineConfig } from 'vite'
import masterCSS from '@master/css.vite'

export default defineConfig({
    plugins: [
        masterCSS()
    ]
})
`
}

export function createNextConfig() {
    return `import { withMasterCSS } from '@master/css.next'

const nextConfig = withMasterCSS({})

export default nextConfig
`
}

export function addMasterCSSNuxtModule(content: string) {
    if (content.includes('@master/css.nuxt')) return content
    if (/modules\s*:\s*\[/.test(content)) {
        return replaceFirst(content, /modules\s*:\s*\[/, "modules: [\n        '@master/css.nuxt',")
    }
    if (/defineNuxtConfig\(\s*\{/.test(content)) {
        return replaceFirst(content, /defineNuxtConfig\(\s*\{/, "defineNuxtConfig({\n    modules: ['@master/css.nuxt'],")
    }
    return content
}

export function createNuxtConfig() {
    return `export default defineNuxtConfig({
    modules: ['@master/css.nuxt'],
    css: ['~/assets/css/master.css']
})
`
}

export function addMasterCSSAstroIntegration(content: string) {
    if (content.includes('@master/css.astro')) return content
    let next = addImport(content, "import masterCSS from '@master/css.astro'")
    if (/integrations\s*:\s*\[/.test(next)) {
        return replaceFirst(next, /integrations\s*:\s*\[/, 'integrations: [\n        masterCSS(),')
    }
    if (/defineConfig\(\s*\{/.test(next)) {
        return replaceFirst(next, /defineConfig\(\s*\{/, 'defineConfig({\n    integrations: [masterCSS()],')
    }
    return next
}

export function createAstroConfig() {
    return `import { defineConfig } from 'astro/config'
import masterCSS from '@master/css.astro'

export default defineConfig({
    integrations: [
        masterCSS()
    ]
})
`
}

export function addMasterCSSEslintConfig(content: string) {
    if (content.includes('@master/eslint-config-css')) return content
    if (!content.trim()) return CANONICAL_ESLINT_CONFIG

    let next = addImport(content, "import { defineConfig } from 'eslint/config'")
    next = addImport(next, "import css from '@master/eslint-config-css'")

    if (/export\s+default\s+defineConfig\(\s*\[/.test(next)) {
        return replaceFirst(next, /export\s+default\s+defineConfig\(\s*\[/, 'export default defineConfig([\n    ...css,')
    }

    if (/export\s+default\s+\[/.test(next)) {
        next = replaceFirst(next, /export\s+default\s+\[/, 'export default defineConfig([\n    ...css,')
        const closeIndex = next.lastIndexOf(']')
        return closeIndex === -1
            ? next
            : `${next.slice(0, closeIndex + 1)})${next.slice(closeIndex + 1)}`
    }

    return `${next.trimEnd()}

// Master CSS recommended config:
// export default defineConfig([
//     ...css
// ])
`
}
