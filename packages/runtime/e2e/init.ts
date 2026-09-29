import { Page } from '@playwright/test'
import { renderClassNamesSync } from '@master/css/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifestVariable
} from '@master/css-schema/manifest'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createServer, type ViteDevServer } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
let runtimeServerPromise: Promise<ViteDevServer> | undefined

type RuntimeManifestVariableInput = MasterCSSManifestVariable

type RuntimeProjectManifestInput = Partial<Omit<MasterCSSManifest, 'variables'>> & {
  variables?: RuntimeManifestVariableInput[]
}

export function createRuntimeProjectManifest(manifest: RuntimeProjectManifestInput): MasterCSSManifest {
  const custom = (manifest.variables || []).map(variable => ({
    ...variable,
    name: variable.name || (variable.namespace ? `${variable.namespace}-${variable.key}` : variable.key)
  }))
  const merged = new Map<string, MasterCSSManifestVariable>(flattenMasterCSSManifestVariables(defaultManifest.variables).map(variable => [variable.name!, variable]))
  for (const variable of custom) {
    const previous = merged.get(variable.name)
    merged.set(variable.name, { ...variable, values: [...(previous?.values || []), ...variable.values], dependencies: [...new Set([...(previous?.dependencies || []), ...(variable.dependencies || [])])] })
  }
  const nodes: import('@master/css-schema/manifest').MasterCSSThemeNode[] = []
  for (const variable of custom) for (const value of variable.values) {
    let children = nodes
    for (const prelude of value.path) {
      const previous = children.at(-1)
      if (previous?.type === 'rule' && previous.prelude === prelude) children = previous.children
      else {
        const node: import('@master/css-schema/manifest').MasterCSSThemeNode = { type: 'rule' as const, prelude, children: [] }
        children.push(node)
        children = node.children
      }
    }
    children.push({ type: 'declaration' as const, name: variable.name, value: value.value })
  }
  return {
    ...defaultManifest, ...manifest,
    theme: [...(defaultManifest.theme || []), ...(manifest.theme || []), ...nodes],
    variables: groupMasterCSSManifestVariables([...merged.values()]),
    mixins: [...(defaultManifest.mixins || []), ...(manifest.mixins || [])]
  }
}

async function createHydrationManifestForPage(page: Page, manifest: MasterCSSManifest) {
  const classNames = await page.evaluate(() => {
    const classNames = new Set<string>()
    for (const element of document.querySelectorAll('[class]')) {
      element.classList.forEach((className) => classNames.add(className))
    }
    return [...classNames]
  })
  return renderClassNamesSync(classNames, { manifest }).hydrationManifest
}

export async function getRuntimeLoaderURL() {
  runtimeServerPromise ??= (async () => {
    const server = await createServer({
      appType: 'custom',
      configFile: false,
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      logLevel: 'error',
      root: packageRoot,
      server: {
        cors: true,
        host: '127.0.0.1',
        port: 0
      }
    })
    await server.listen()
    return server
  })()
  const server = await runtimeServerPromise
  const localURL = server.resolvedUrls?.local[0]
  if (!localURL) throw new Error('Cannot resolve runtime e2e Vite server URL.')
  return new URL('/e2e/runtime-loader.ts', localURL).href
}

export default async function init(
  page: Page,
  text?: string,
  manifestInput?: RuntimeProjectManifestInput,
  hydrationManifestInput?: MasterCSSHydrationManifest | 'auto'
) {
  const manifest = manifestInput ? createRuntimeProjectManifest(manifestInput) : undefined
  const hydrationManifest = hydrationManifestInput === 'auto'
    ? await createHydrationManifestForPage(page, manifest || defaultManifest)
    : hydrationManifestInput
  await page.evaluate(({ hydrationManifest, text, manifestScriptId, runtimeStyleId }) => {
    if (text) {
      const style = document.createElement('style')
      style.id = runtimeStyleId
      style.textContent = text
      document.head.appendChild(style)
    }
    if (hydrationManifest) {
      const script = document.createElement('script')
      script.type = 'application/json'
      script.id = manifestScriptId
      script.textContent = JSON.stringify(hydrationManifest)
      document.head.appendChild(script)
    }
  }, {
    hydrationManifest,
    text,
    manifestScriptId: MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
    runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID
  })
  await page.evaluate(async ({ loaderURL, manifest }) => {
    const { startCSSRuntime } = await import(loaderURL)
    await startCSSRuntime({ manifest })
  }, { loaderURL: await getRuntimeLoaderURL(), manifest })
  await page.waitForFunction(() => !!globalThis.__MASTER_CSS_RUNTIME_TEST__)
}
