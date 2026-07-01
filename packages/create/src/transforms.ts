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
    return addMasterCSSVitePluginCall(content, 'masterCSS()')
}

export function addMasterCSSStaticVitePlugin(content: string) {
    return addMasterCSSVitePluginCall(content, "masterCSS({ mode: 'static' })")
}

function addMasterCSSVitePluginCall(content: string, pluginCall: string) {
    if (content.includes('@master/css.vite')) return content
    let next = addImport(content, "import masterCSS from '@master/css.vite'")
    if (/plugins\s*:\s*\[/.test(next)) {
        return replaceFirst(next, /plugins\s*:\s*\[/, `plugins: [\n            ${pluginCall},`)
    }
    if (/defineConfig\(\s*\{/.test(next)) {
        return replaceFirst(next, /defineConfig\(\s*\{/, `defineConfig({\n    plugins: [${pluginCall}],`)
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

export function createStaticViteConfig() {
    return `import { defineConfig } from 'vite'
import masterCSS from '@master/css.vite'

export default defineConfig({
    plugins: [
        masterCSS({ mode: 'static' })
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

export function addMasterCSSNextConfig(content: string) {
    if (content.includes('@master/css.next')) return content
    const next = addImport(content, "import { withMasterCSS } from '@master/css.next'")
    if (/export\s+default\s+/.test(next)) {
        return next.replace(/export\s+default\s+([^;\n]+)(;?)(\n|$)/, 'export default withMasterCSS($1)$2$3')
    }
    return `${next.trimEnd()}

export default withMasterCSS({})
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

export function addViteClientTypes(content: string) {
    let next = content
    if (!next.includes('/// <reference types="vite/client" />')) {
        next = `/// <reference types="vite/client" />\n${next}`
    }
    if (!next.includes('/// <reference types="@master/css-integration/client" />')) {
        const lines = next.split('\n')
        const viteReferenceIndex = lines.findIndex((line) => line.includes('/// <reference types="vite/client" />'))
        lines.splice(viteReferenceIndex + 1, 0, '/// <reference types="@master/css-integration/client" />')
        next = lines.join('\n')
    }
    return next
}

export function addLitShadowRuntime(content: string) {
    if (
        content.includes('@master/css-runtime')
        && content.includes('virtual:master-css-manifest')
        && content.includes('@cssRuntime({ manifest, emittedGlobals })')
        && content.includes('cssRuntime?: CSSRuntime')
    ) return content
    let next = addImport(content, "import { cssRuntime } from '@master/css-runtime'")
    next = addImport(next, "import type { CSSRuntime } from '@master/css-runtime'")
    next = addImport(next, "import manifest from 'virtual:master-css-manifest'")
    next = addImport(next, "import emittedGlobals from 'virtual:master-css-emitted-globals'")

    if (!next.includes('@cssRuntime({ manifest, emittedGlobals })')) {
        if (/@customElement\([^\n]+\)\nexport\s+class\s/.test(next)) {
            next = next.replace(/(@customElement\([^\n]+\)\n)(export\s+class\s)/, '$1@cssRuntime({ manifest, emittedGlobals })\n$2')
        } else {
            next = next.replace(/export\s+class\s/, '@cssRuntime({ manifest, emittedGlobals })\nexport class ')
        }
    }

    if (!next.includes('cssRuntime?: CSSRuntime')) {
        next = next.replace(/(export\s+class\s+\w+[^{]*\{)/, '$1\n\n    cssRuntime?: CSSRuntime')
    }

    return next
}

export function addAngularRuntimeSetup(content: string) {
    if (content.includes('@master/css-runtime')) return content
    let next = addImport(content, "import defaultManifestJSON from '@master/css-preset/default-manifest.json'")
    next = addImport(next, "import { CSSRuntime } from '@master/css-runtime'")
    next = addImport(next, "import type { MasterCSSManifest } from '@master/css-runtime'")
    const setup = `const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

CSSRuntime.create({ manifest: defaultManifest }).observe()

`
    if (/bootstrapApplication\s*\(/.test(next)) {
        return next.replace(/bootstrapApplication\s*\(/, `${setup}bootstrapApplication(`)
    }
    if (/platformBrowserDynamic\s*\(/.test(next)) {
        return next.replace(/platformBrowserDynamic\s*\(/, `${setup}platformBrowserDynamic(`)
    }
    return `${next.trimEnd()}

${setup}`
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
