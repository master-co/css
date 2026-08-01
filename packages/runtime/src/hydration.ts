import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import { MasterCSSError } from '@master/css-schema'

export function isDocumentRoot(root: Document | ShadowRoot): root is Document {
  const rootConstructorName = root?.constructor.name
  return rootConstructorName === 'HTMLDocument' || rootConstructorName === 'Document'
}

export function findElementById(root: Document | ShadowRoot, id: string) {
  return isDocumentRoot(root)
    ? root.getElementById(id)
    : root.querySelector(`#${id}`)
}

export function getRootHost(root: Document | ShadowRoot) {
  return isDocumentRoot(root) ? root.documentElement : root.host
}

function validateHydrationManifest(hydrationManifest: unknown): MasterCSSHydrationManifest | undefined {
  return (hydrationManifest as MasterCSSHydrationManifest | undefined)?.version === 1
    && Array.isArray((hydrationManifest as MasterCSSHydrationManifest | undefined)?.rules)
    && Array.isArray((hydrationManifest as MasterCSSHydrationManifest | undefined)?.resourceOrder)
    ? hydrationManifest as MasterCSSHydrationManifest
    : undefined
}

function invalidHydrationManifest(message: string, cause?: unknown) {
  return new MasterCSSError({
    code: 'INVALID_HYDRATION_MANIFEST',
    domain: 'runtime',
    message
  }, { cause })
}

function parseHydrationManifest(source: string): MasterCSSHydrationManifest {
  try {
    const hydrationManifest = validateHydrationManifest(JSON.parse(source))
    if (hydrationManifest) return hydrationManifest
  } catch (cause) {
    throw invalidHydrationManifest('Cannot parse the Master CSS hydration manifest.', cause)
  }
  throw invalidHydrationManifest('Unsupported Master CSS hydration manifest. Expected version 1.')
}

function readInlineHydrationManifest(root: Document | ShadowRoot): MasterCSSHydrationManifest | undefined {
  const source = findElementById(root, MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)?.textContent?.trim()
  return source ? parseHydrationManifest(source) : undefined
}

function readExternalHydrationManifestSource(root: Document | ShadowRoot) {
  const styleElement = findElementById(root, MASTER_CSS_RUNTIME_STYLE_ID)
  return styleElement?.getAttribute(MASTER_CSS_HYDRATION_MANIFEST_ATTR) || undefined
}

function resolveExternalHydrationManifestURL(root: Document | ShadowRoot, source: string) {
  const ownerDocument = isDocumentRoot(root) ? root : root.ownerDocument
  return new URL(source, ownerDocument.baseURI).href
}

async function importHydrationManifest(url: string): Promise<MasterCSSHydrationManifest> {
  try {
    let value: unknown
    let loadHydrationManifestModule: ((specifier: string) => Promise<{ default: unknown }>) | undefined
    try {
      loadHydrationManifestModule = globalThis.Function(
        'specifier',
        "return import(specifier, { with: { type: 'json' } })"
      ) as (specifier: string) => Promise<{ default: unknown }>
    } catch (cause) {
      if ((cause as { name?: unknown })?.name !== 'SyntaxError') throw cause
    }
    if (loadHydrationManifestModule) {
      value = (await loadHydrationManifestModule(url)).default
    } else {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Cannot load the Master CSS hydration manifest from ${url} (HTTP ${response.status}).`)
      }
      value = await response.json()
    }
    const hydrationManifest = validateHydrationManifest(value)
    if (hydrationManifest) return hydrationManifest
    throw invalidHydrationManifest(`Invalid Master CSS hydration manifest loaded from ${url}.`)
  } catch (cause) {
    if (cause instanceof MasterCSSError) throw cause
    throw invalidHydrationManifest(`Cannot load the Master CSS hydration manifest from ${url}.`, cause)
  }
}

export async function resolveHydrationManifest(
  root: Document | ShadowRoot,
  explicit: MasterCSSHydrationManifest | undefined
) {
  if (explicit !== undefined) {
    const hydrationManifest = validateHydrationManifest(explicit)
    if (!hydrationManifest) {
      throw invalidHydrationManifest('Unsupported Master CSS hydration manifest. Expected version 1.')
    }
    return hydrationManifest
  }
  const inline = readInlineHydrationManifest(root)
  if (inline) return inline
  const source = readExternalHydrationManifestSource(root)
  return source
    ? await importHydrationManifest(resolveExternalHydrationManifestURL(root, source))
    : undefined
}

