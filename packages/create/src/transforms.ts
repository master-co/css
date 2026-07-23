import { CANONICAL_ESLINT_CONFIG } from './constants'
import type { RenderingMode } from './modes'

function formatMasterCSSCall(mode?: RenderingMode) {
  return mode ? `masterCSS({ mode: '${mode}' })` : 'masterCSS()'
}

function formatWebpackPluginCall(mode?: RenderingMode) {
  return mode ? `new MasterCSSPlugin({ mode: '${mode}' })` : 'new MasterCSSPlugin()'
}

function formatNuxtModule(mode?: RenderingMode) {
  return mode ? `['@master/css-nuxt', { mode: '${mode}' }]` : "'@master/css-nuxt'"
}

function formatNextCall(target: string, mode?: RenderingMode) {
  const awaited = mode === 'static' ? 'await ' : ''
  return mode
    ? `${awaited}withMasterCSS(${target}, { mode: '${mode}' })`
    : `withMasterCSS(${target})`
}

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

export function addMasterCSSVitePlugin(content: string, mode?: RenderingMode) {
  return addMasterCSSVitePluginCall(content, formatMasterCSSCall(mode))
}

export function addReactRouterRootCSSImport(content: string) {
  if (/^\s*import\s+['"]\.\/app\.css['"]\s*;?/m.test(content)) return content
  return addImport(content, "import './app.css'")
}

export function addTanStackStartRootCSSImport(content: string) {
  if (/^\s*import\s+['"]\.\.\/styles\/app\.css['"]\s*;?/m.test(content)) return content
  return addImport(content, "import '../styles/app.css'")
}

export function addMasterCSSStaticVitePlugin(content: string) {
  return addMasterCSSVitePlugin(content, 'static')
}

export function addMasterCSSTanStackStartVitePlugin(content: string, mode: RenderingMode = 'static') {
  const pluginCall = formatMasterCSSCall(mode)
  if (content.includes('@master/css-vite')) return content
  let next = addImport(content, "import masterCSS from '@master/css-vite'")
  const tanStackStartPluginPattern = /^(\s*)tanstackStart\([^)]*\),?/m
  if (tanStackStartPluginPattern.test(next)) {
    return next.replace(tanStackStartPluginPattern, (match, indent: string) => {
      return `${match.endsWith(',') ? match : `${match},`}\n${indent}${pluginCall},`
    })
  }
  if (/plugins\s*:\s*\[/.test(next)) {
    return replaceFirst(next, /plugins\s*:\s*\[/, `plugins: [\n            ${pluginCall},`)
  }
  if (/defineConfig\(\s*\{/.test(next)) {
    return replaceFirst(next, /defineConfig\(\s*\{/, `defineConfig({\n    plugins: [${pluginCall}],`)
  }
  return next
}

export function addMasterCSSRspackPlugin(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-webpack')) return content
  const pluginCall = formatWebpackPluginCall(mode)
  let next = addImport(content, "import MasterCSSPlugin from '@master/css-webpack'")
  if (/plugins\s*:\s*\[/.test(next)) {
    return replaceFirst(next, /plugins\s*:\s*\[/, `plugins: [\n        ${pluginCall},`)
  }
  if (/export\s+default\s+\{/.test(next)) {
    return replaceFirst(next, /export\s+default\s+\{/, `export default {\n    plugins: [${pluginCall}],`)
  }
  return next
}

export function addMasterCSSWebpackPlugin(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-webpack')) return content
  const pluginCall = formatWebpackPluginCall(mode)
  let next = addImport(content, "import MasterCSSPlugin from '@master/css-webpack'")
  if (/plugins\s*:\s*\[/.test(next)) {
    return replaceFirst(next, /plugins\s*:\s*\[/, `plugins: [\n        ${pluginCall},`)
  }
  if (/export\s+default\s+\{/.test(next)) {
    return replaceFirst(next, /export\s+default\s+\{/, `export default {\n    plugins: [${pluginCall}],`)
  }
  return next
}

export function addMasterCSSRsbuildPlugin(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-webpack')) return content
  let next = addImport(content, "import MasterCSSPlugin from '@master/css-webpack'")
  const pluginCall = formatWebpackPluginCall(mode)
  const rspackSetupBody = `            config.plugins ||= []
      config.plugins.push(${pluginCall})
      return config`
  const rspackSetup = `rspack(config) {
${rspackSetupBody}
    }`

  if (/rspack\s*\(\s*config\s*\)\s*\{/.test(next)) {
    return replaceFirst(next, /rspack\s*\(\s*config\s*\)\s*\{/, `rspack(config) {
${rspackSetupBody}`)
  }
  if (/tools\s*:\s*\{/.test(next)) {
    return replaceFirst(next, /tools\s*:\s*\{/, `tools: {
    ${rspackSetup},`)
  }
  if (/defineConfig\(\s*\{/.test(next)) {
    return replaceFirst(next, /defineConfig\(\s*\{/, `defineConfig({
  tools: {
    ${rspackSetup}
  },`)
  }
  if (/export\s+default\s+\{/.test(next)) {
    return replaceFirst(next, /export\s+default\s+\{/, `export default {
  tools: {
    ${rspackSetup}
  },`)
  }
  return next
}

function addMasterCSSVitePluginCall(content: string, pluginCall: string) {
  if (content.includes('@master/css-vite')) return content
  let next = addImport(content, "import masterCSS from '@master/css-vite'")
  if (/plugins\s*:\s*\[/.test(next)) {
    return replaceFirst(next, /plugins\s*:\s*\[/, `plugins: [\n            ${pluginCall},`)
  }
  if (/defineConfig\(\s*\{/.test(next)) {
    return replaceFirst(next, /defineConfig\(\s*\{/, `defineConfig({\n    plugins: [${pluginCall}],`)
  }
  return next
}

export function createViteConfig(mode?: RenderingMode) {
  return `import { defineConfig } from 'vite'
import masterCSS from '@master/css-vite'

export default defineConfig({
  plugins: [
    ${formatMasterCSSCall(mode)}
  ]
})
`
}

export function createStaticViteConfig() {
  return createViteConfig('static')
}

export function createRspackConfig(mode?: RenderingMode) {
  return `import MasterCSSPlugin from '@master/css-webpack'

export default {
  module: {
    rules: [
      {
        test: /\\.css$/i,
        type: 'css/auto'
      }
    ]
  },
  plugins: [
    ${formatWebpackPluginCall(mode)}
  ]
}
`
}

export function createWebpackConfig(mode?: RenderingMode) {
  return `import MasterCSSPlugin from '@master/css-webpack'

export default {
  plugins: [
    ${formatWebpackPluginCall(mode)}
  ]
}
`
}

export function createRsbuildConfig(mode?: RenderingMode) {
  return `import { defineConfig } from '@rsbuild/core'
import MasterCSSPlugin from '@master/css-webpack'

export default defineConfig({
  tools: {
    rspack(config) {
      config.plugins ||= []
      config.plugins.push(${formatWebpackPluginCall(mode)})
      return config
    }
  }
})
`
}

export function createNextConfig(mode?: RenderingMode) {
  return `import { withMasterCSS } from '@master/css-next'

const nextConfig = ${formatNextCall('{}', mode)}

export default nextConfig
`
}

export function addMasterCSSNextConfig(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-next')) return mode ? addMasterCSSNextMode(content, mode) : content
  const next = addImport(content, "import { withMasterCSS } from '@master/css-next'")
  if (/export\s+default\s+/.test(next)) {
    return next.replace(/export\s+default\s+([^;\n]+)(;?)(\n|$)/, `export default ${formatNextCall('$1', mode)}$2$3`)
  }
  return `${next.trimEnd()}

export default ${formatNextCall('{}', mode)}
`
}

function addMasterCSSNextMode(content: string, mode: RenderingMode) {
  const callPattern = /(?:await\s+)?withMasterCSS\(\s*(\{\s*\}|[A-Za-z_$][\w$]*)\s*(?:,\s*\{[^)]*\})?\s*\)/g
  return content.replace(callPattern, (_match, target: string) => formatNextCall(target, mode))
}

export function addMasterCSSNuxtModule(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-nuxt')) return content
  const moduleEntry = formatNuxtModule(mode)
  if (/modules\s*:\s*\[/.test(content)) {
    return replaceFirst(content, /modules\s*:\s*\[/, `modules: [\n        ${moduleEntry},`)
  }
  if (/defineNuxtConfig\(\s*\{/.test(content)) {
    return replaceFirst(content, /defineNuxtConfig\(\s*\{/, `defineNuxtConfig({\n    modules: [${moduleEntry}],`)
  }
  return content
}

export function createNuxtConfig(mode?: RenderingMode) {
  return `export default defineNuxtConfig({
  modules: [${formatNuxtModule(mode)}],
  css: ['~/assets/css/master.css']
})
`
}

export function addMasterCSSAstroIntegration(content: string, mode?: RenderingMode) {
  if (content.includes('@master/css-astro')) return content
  const pluginCall = formatMasterCSSCall(mode)
  let next = addImport(content, "import masterCSS from '@master/css-astro'")
  if (/integrations\s*:\s*\[/.test(next)) {
    return replaceFirst(next, /integrations\s*:\s*\[/, `integrations: [\n        ${pluginCall},`)
  }
  if (/defineConfig\(\s*\{/.test(next)) {
    return replaceFirst(next, /defineConfig\(\s*\{/, `defineConfig({\n    integrations: [${pluginCall}],`)
  }
  return next
}

export function createAstroConfig(mode?: RenderingMode) {
  return `import { defineConfig } from 'astro/config'
import masterCSS from '@master/css-astro'

export default defineConfig({
  integrations: [
    ${formatMasterCSSCall(mode)}
  ]
})
`
}

export function addViteClientTypes(content: string) {
  let next = content
  if (!next.includes('/// <reference types="vite/client" />')) {
    next = `/// <reference types="vite/client" />\n${next}`
  }
  if (!next.includes('/// <reference types="@master/css/client" />')) {
    const lines = next.split('\n')
    const viteReferenceIndex = lines.findIndex((line) => line.includes('/// <reference types="vite/client" />'))
    lines.splice(viteReferenceIndex + 1, 0, '/// <reference types="@master/css/client" />')
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
  next = addImport(next, "import type CSSRuntime from '@master/css-runtime'")
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
  next = addImport(next, "import CSSRuntime from '@master/css-runtime'")
  next = addImport(next, "import type { MasterCSSManifest } from '@master/css-runtime'")
  const setup = `const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

void CSSRuntime.start({ manifest: defaultManifest })
  .then((cssRuntime) => cssRuntime.observe())
  .catch((error) => console.error(error))

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
    return replaceFirst(next, /export\s+default\s+defineConfig\(\s*\[/, 'export default defineConfig([\n  ...css,')
  }

  if (/export\s+default\s+\[/.test(next)) {
    next = replaceFirst(next, /export\s+default\s+\[/, 'export default defineConfig([\n  ...css,')
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
