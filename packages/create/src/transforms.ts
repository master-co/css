import { CANONICAL_ESLINT_CONFIG } from './constants'
import type { MasterCSSRenderingMode } from '@master/css-schema/integration'
import { ManualSetupStep, addToConfigArray, expressionEnd, isCommonJS, matchingBracket } from './config-source'

export { ManualSetupStep } from './config-source'

function assertModule(content: string, step: string) {
  if (isCommonJS(content)) throw new ManualSetupStep(`This CommonJS config cannot take an ES import; ${step} manually.`)
}

function addConfigEntry(content: string, name: string, entry: string, step: string, options: { factories?: readonly string[], entryIndent: string, propertyIndent: string }) {
  const updated = addToConfigArray(content, name, entry, options)
  if (updated === undefined) throw new ManualSetupStep(`Setup could not find the exported config object; ${step} manually.`)
  return updated
}

function formatMasterCSSCall(mode?: MasterCSSRenderingMode) {
  return mode ? `masterCSS({ mode: '${mode}' })` : 'masterCSS()'
}

function formatWebpackPluginCall(mode?: MasterCSSRenderingMode) {
  return mode ? `new MasterCSSPlugin({ mode: '${mode}' })` : 'new MasterCSSPlugin()'
}

function formatNuxtModule(mode?: MasterCSSRenderingMode) {
  return mode ? `['@master/css-nuxt', { mode: '${mode}' }]` : "'@master/css-nuxt'"
}

function formatNextCall(target: string, mode?: MasterCSSRenderingMode) {
  return mode
    ? `withMasterCSS(${target}, { mode: '${mode}' })`
    : `withMasterCSS(${target})`
}

function formatNextExport(target: string, mode?: MasterCSSRenderingMode) {
  // Next's TypeScript config loader can compile the module as CommonJS. Let
  // Next call the async config instead of awaiting during module evaluation.
  return `${!mode || mode === 'static' ? 'async () => ' : ''}${formatNextCall(target, mode)}`
}

function addImport(content: string, statement: string) {
  if (content.includes(statement)) return content
  const newline = content.includes('\r\n') ? '\r\n' : '\n'
  const lines = content.split('\n')
  // A header may contain a shebang or directive prologue. Appending an ESM
  // import keeps it intact without guessing where comments or strings end.
  if (content && !/^import\s/.test(lines[0])) {
    return content + (content.endsWith('\n') ? '' : newline) + statement + newline
  }
  let insertIndex = 0
  while (insertIndex < lines.length) {
    const complete = /^import\s+(?:[^'"]+\s+from\s+)?(['"])[^'"]+\1\s*(;?)\s*(?:\/\/.*)?$/.exec(lines[insertIndex])
    if (!complete) break
    const next = lines.slice(insertIndex + 1).find(line => line.trim())?.trim()
    // Without a semicolon, a following attribute clause can still belong to
    // this import. Insert before it unless the next statement is unambiguous.
    if (!complete[2] && next && !/^(?:import|export|const|let|var|function|class)\b/.test(next)) break
    insertIndex++
  }
  lines.splice(insertIndex, 0, statement + (newline === '\r\n' ? '\r' : ''))
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

export function addMasterCSSVitePlugin(content: string, mode?: MasterCSSRenderingMode) {
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

export function addMasterCSSTanStackStartVitePlugin(content: string, mode: MasterCSSRenderingMode = 'static') {
  const pluginCall = formatMasterCSSCall(mode)
  if (content.includes('@master/css-vite')) return content
  const step = `add ${pluginCall} from @master/css-vite to the Vite plugins`
  assertModule(content, step)
  const next = addImport(content, "import masterCSS from '@master/css-vite'")
  const tanStackStartPluginPattern = /^(\s*)tanstackStart\([^)]*\),?/m
  if (tanStackStartPluginPattern.test(next)) {
    return next.replace(tanStackStartPluginPattern, (match, indent: string) => {
      return `${match.endsWith(',') ? match : `${match},`}\n${indent}${pluginCall},`
    })
  }
  return addConfigEntry(next, 'plugins', pluginCall, step, { entryIndent: '            ', propertyIndent: '    ' })
}

function addWebpackCompatiblePlugin(content: string, mode: MasterCSSRenderingMode | undefined, bundler: string) {
  if (content.includes('@master/css-webpack')) return content
  const pluginCall = formatWebpackPluginCall(mode)
  const step = `add ${pluginCall} from @master/css-webpack to the ${bundler} plugins`
  assertModule(content, step)
  const next = addImport(content, "import MasterCSSPlugin from '@master/css-webpack'")
  return addConfigEntry(next, 'plugins', pluginCall, step, { entryIndent: '        ', propertyIndent: '    ' })
}

export function addMasterCSSRspackPlugin(content: string, mode?: MasterCSSRenderingMode) {
  return addWebpackCompatiblePlugin(content, mode, 'Rspack')
}

export function addMasterCSSWebpackPlugin(content: string, mode?: MasterCSSRenderingMode) {
  return addWebpackCompatiblePlugin(content, mode, 'Webpack')
}

export function addMasterCSSRsbuildPlugin(content: string, mode?: MasterCSSRenderingMode) {
  if (content.includes('@master/css-webpack')) return content
  assertModule(content, 'register MasterCSSPlugin from @master/css-webpack in tools.rspack')
  const next = addImport(content, "import MasterCSSPlugin from '@master/css-webpack'")
  const pluginCall = formatWebpackPluginCall(mode)
  const rspackSetupBody = `            config.plugins ||= []
      config.plugins.push(${pluginCall})
      return config`
  const rspackSetup = `rspack(config) {
${rspackSetupBody}
    }`

  // An existing hook keeps its own body and return: register the plugin first.
  const hook = /\brspack\s*(?::\s*(?:function\s*)?)?\(\s*config\b[^)]*\)\s*(?:=>\s*)?\{/.exec(next)
  if (hook) {
    const at = hook.index + hook[0].length
    return `${next.slice(0, at)}
      config.plugins ||= []
      config.plugins.push(${pluginCall})${next.slice(at)}`
  }
  if (/\brspack\s*:/.test(next)) {
    throw new ManualSetupStep(`Setup cannot extend this tools.rspack form; push ${pluginCall} from @master/css-webpack onto the Rspack plugins manually.`)
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
  throw new ManualSetupStep(`Setup could not find the exported config object; register ${pluginCall} from @master/css-webpack in tools.rspack manually.`)
}

function addMasterCSSVitePluginCall(content: string, pluginCall: string) {
  if (content.includes('@master/css-vite')) return content
  const step = `add ${pluginCall} from @master/css-vite to the Vite plugins`
  assertModule(content, step)
  const next = addImport(content, "import masterCSS from '@master/css-vite'")
  return addConfigEntry(next, 'plugins', pluginCall, step, { entryIndent: '            ', propertyIndent: '    ' })
}

export function createViteConfig(mode?: MasterCSSRenderingMode) {
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

export function createRspackConfig(mode?: MasterCSSRenderingMode) {
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

export function createWebpackConfig(mode?: MasterCSSRenderingMode) {
  return `import MasterCSSPlugin from '@master/css-webpack'

export default {
  plugins: [
    ${formatWebpackPluginCall(mode)}
  ]
}
`
}

export function createRsbuildConfig(mode?: MasterCSSRenderingMode) {
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

export function createNextConfig(mode?: MasterCSSRenderingMode) {
  return `import withMasterCSS from '@master/css-next'

const nextConfig = ${formatNextExport('{}', mode)}

export default nextConfig
`
}

export function addMasterCSSNextConfig(content: string, mode?: MasterCSSRenderingMode) {
  if (content.includes('@master/css-next')) return updateMasterCSSNextConfig(content, mode)
  const step = `wrap the exported config object with ${formatNextCall('nextConfig', mode)} from @master/css-next`
  assertModule(content, step)
  const next = addImport(content, "import withMasterCSS from '@master/css-next'")
  const exported = /\bexport\s+default\s+/.exec(next)
  if (exported) {
    // The exported expression may span lines, such as an object literal.
    const start = exported.index + exported[0].length
    const expression = next.slice(start, expressionEnd(next, start)).trimEnd()
    // withMasterCSS takes a config object, not a phase function.
    if (/^(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/.test(expression)) {
      throw new ManualSetupStep(`Setup cannot wrap a config function; ${step} manually.`)
    }
    return `${next.slice(0, start)}${formatNextExport(expression, mode)}${next.slice(start + expression.length)}`
  }
  return `${next.trimEnd()}

export default ${formatNextExport('{}', mode)}
`
}

function updateMasterCSSNextConfig(content: string, mode?: MasterCSSRenderingMode) {
  const callPattern = /(await[ \t]+)?\b(withMasterCSS\(\s*(\{\s*\}|[A-Za-z_$][\w$]*)\s*(?:,\s*(\{[^)]*\}))?\s*\))/g
  return content.replace(callPattern, (match, awaited: string | undefined, call: string, target: string, options: string | undefined, offset: number) => {
    let updated = call
    if (mode) {
      if (!options || /^\{\s*(?:mode\s*:\s*['"][a-z-]+['"]\s*,?\s*)?\}$/.test(options)) {
        updated = formatNextCall(target, mode)
      } else {
        const original = /^\{ \.\.\.(\{[^)]*\}), mode: '[a-z-]+' \}$/.exec(options)?.[1] ?? options
        updated = `withMasterCSS(${target}, { ...${original}, mode: '${mode}' })`
      }
    }

    // Only normalize top-level wrappers written by this installer. An await
    // inside an existing async configuration still belongs to that function.
    const before = content.slice(content.lastIndexOf('\n', offset - 1) + 1, offset)
    const after = content.slice(offset + match.length)
    const exportedCall = /^export[ \t]+default[ \t]+$/.test(before) && /^;?[ \t]*(?:\r?\n|$)/.test(after)
    const exportedBinding = /^const[ \t]+nextConfig[ \t]*=[ \t]*$/.test(before)
      && /^;?[ \t]*(?:\r?\n[ \t]*)+export[ \t]+default[ \t]+nextConfig;?[ \t]*(?:\r?\n|$)/.test(after)
    if ((exportedCall || exportedBinding) && (awaited || mode === 'static')) {
      return `${!mode || mode === 'static' ? 'async () => ' : ''}${updated}`
    }
    return (awaited ?? '') + updated
  })
}

// `~~` is the project root; Nuxt 4 points `~` at the `app/` source directory.
const NUXT_CSS_ENTRY = "'~~/assets/css/master.css'"

export function addMasterCSSNuxtModule(content: string, mode?: MasterCSSRenderingMode) {
  if (content.includes('@master/css-nuxt')) return content
  const moduleEntry = formatNuxtModule(mode)
  const options = { factories: ['defineNuxtConfig'], entryIndent: '        ', propertyIndent: '    ' }
  // The module does not load a stylesheet itself; the CSS entry must be listed.
  const withCSS = content.includes('assets/css/master.css')
    ? content
    : addConfigEntry(content, 'css', NUXT_CSS_ENTRY, `add ${NUXT_CSS_ENTRY} to css and ${moduleEntry} to modules`, options)
  return addConfigEntry(withCSS, 'modules', moduleEntry, `add ${moduleEntry} to modules`, options)
}

export function createNuxtConfig(mode?: MasterCSSRenderingMode) {
  return `export default defineNuxtConfig({
  modules: [${formatNuxtModule(mode)}],
  css: [${NUXT_CSS_ENTRY}]
})
`
}

export function addMasterCSSAstroIntegration(content: string, mode?: MasterCSSRenderingMode) {
  if (content.includes('@master/css-astro')) return content
  const pluginCall = formatMasterCSSCall(mode)
  const step = `add ${pluginCall} from @master/css-astro to the integrations`
  assertModule(content, step)
  const next = addImport(content, "import masterCSS from '@master/css-astro'")
  return addConfigEntry(next, 'integrations', pluginCall, step, { entryIndent: '        ', propertyIndent: '    ' })
}

export function createAstroConfig(mode?: MasterCSSRenderingMode) {
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

/** Preserve the component's own styles while adding build-generated shadow CSS. */
export function addLitShadowStylesheet(content: string) {
  if (content.includes("import masterCSSStyles from './index.css?inline'")) return content
  const own = /\bstatic\s+(override\s+)?(get\s+)?styles\b/.exec(content)
  // The renamed member overrides nothing; the new getter overrides LitElement.styles,
  // which `noImplicitOverride` projects such as the Lit starter mark with `override`.
  let next = own ? content.replace(own[0], `static ${own[2] ?? ''}masterCSSOriginalStyles`) : content
  next = addImport(next, "import { unsafeCSS } from 'lit'")
  next = addImport(next, "import masterCSSStyles from './index.css?inline'")
  return next.replace(/(export\s+class\s+\w+[^\{]*\{)/, `$1\n  static ${own?.[1] ?? ''}get styles() { return [unsafeCSS(masterCSSStyles)${own ? ', this.masterCSSOriginalStyles' : ''}] }\n`)
}

export function addGeneratedStylesheetImport(content: string) {
  const statement = "@import './master.generated.css';"
  return content.includes(statement) ? content : `${statement}\n${content}`
}

export function addLitShadowRuntime(content: string) {
  if (
    content.includes('@master/css-runtime')
    && content.includes('virtual:master-css-program')
    && content.includes('@withMasterCSSRuntime({ program, emittedGlobals })')
    && content.includes('masterCSSRuntime?: MasterCSSRuntime')
  ) return content
  let next = addImport(content, "import { withMasterCSSRuntime } from '@master/css-runtime'")
  next = addImport(next, "import type { MasterCSSRuntime } from '@master/css-runtime'")
  next = addImport(next, "import program from 'virtual:master-css-program'")
  next = addImport(next, "import emittedGlobals from 'virtual:master-css-emitted-globals'")

  if (!next.includes('@withMasterCSSRuntime({ program, emittedGlobals })')) {
    if (/@customElement\([^\n]+\)\nexport\s+class\s/.test(next)) {
      next = next.replace(/(@customElement\([^\n]+\)\n)(export\s+class\s)/, '$1@withMasterCSSRuntime({ program, emittedGlobals })\n$2')
    } else {
      next = next.replace(/export\s+class\s/, '@withMasterCSSRuntime({ program, emittedGlobals })\nexport class ')
    }
  }

  if (!next.includes('masterCSSRuntime?: MasterCSSRuntime')) {
    next = next.replace(/(export\s+class\s+\w+[^{]*\{)/, '$1\n\n    masterCSSRuntime?: MasterCSSRuntime')
  }

  return next
}

export function addAngularRuntimeSetup(content: string) {
  if (content.includes('@master/css-runtime')) return content
  const next = addImport(content, "import { MasterCSSRuntime } from '@master/css-runtime'")
  // The default preset's program loads as its own chunk.
  const setup = `void MasterCSSRuntime.start({ program: () => import('@master/css-runtime/default-program').then((module) => module.defaultProgram) })
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
  const step = 'spread masterCSS from @master/eslint-config-css into the exported flat config array'
  assertModule(content, step)
  const wrapped = /\bexport\s+default\s+defineConfig\(\s*\[/.exec(content)
  const array = wrapped ? undefined : /\bexport\s+default\s+\[/.exec(content)
  if (!wrapped && !array) throw new ManualSetupStep(`Setup could not find an exported flat config array; ${step} manually.`)
  // Keep an existing `import { defineConfig, globalIgnores } from 'eslint/config'`.
  let next = /\bimport\s*\{[^}]*\bdefineConfig\b[^}]*\}\s*from\s*['"]eslint\/config['"]/.test(content)
    ? content
    : addImport(content, "import { defineConfig } from 'eslint/config'")
  next = addImport(next, "import masterCSS from '@master/eslint-config-css'")

  if (wrapped) {
    return replaceFirst(next, /\bexport\s+default\s+defineConfig\(\s*\[/, 'export default defineConfig([\n  ...masterCSS,')
  }
  const open = /\bexport\s+default\s+\[/.exec(next)!
  const bracket = open.index + open[0].length - 1
  const close = matchingBracket(next, bracket)
  if (close === undefined) throw new ManualSetupStep(`Setup could not read the exported flat config array; ${step} manually.`)
  return `${next.slice(0, open.index)}export default defineConfig([\n  ...masterCSS,${next.slice(bracket + 1, close + 1)})${next.slice(close + 1)}`
}
