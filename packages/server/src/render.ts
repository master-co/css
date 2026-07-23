import type { MasterCSSDiagnostic } from '@master/css-schema'
import type { MasterCSSRenderSnapshot } from '@master/css/node'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  serializeMasterCSSHydrationManifest,
  type MasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import { Element, Text, type ChildNode } from 'domhandler'
import serialize from 'dom-serializer'
import parseHTML from './parse-html'

export type MasterCSSExternalHydrationManifestSource =
  | string
  | ((json: string, hydrationManifest: MasterCSSHydrationManifest) => string)

export interface MasterCSSExternalHydrationManifestOptions {
  readonly type: 'external'
  readonly source: MasterCSSExternalHydrationManifestSource
}

export type MasterCSSHydrationManifestRenderMode =
  | 'return'
  | 'inject'
  | false
  | MasterCSSExternalHydrationManifestOptions

export interface MasterCSSHTMLDocumentOptions {
  readonly hydrationManifest?: MasterCSSHydrationManifestRenderMode
}

export interface MasterCSSHTMLRenderResult {
  readonly html: string
  readonly cssText: string
  readonly classNames: readonly string[]
  readonly invalidClassNames: readonly string[]
  readonly hydrationManifest?: MasterCSSHydrationManifest
  readonly diagnostics: readonly MasterCSSDiagnostic[]
}

function hydrationScript(hydrationManifest: MasterCSSHydrationManifest) {
  return new Element('script', {
    type: 'application/json',
    id: MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
  }, [new Text(serializeMasterCSSHydrationManifest(hydrationManifest))])
}

function isHydrationScript(node: ChildNode): node is Element {
  return node.type === 'script'
    && node.name === 'script'
    && node.attribs.id === MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
}

function findHydrationScripts(
  childNodes: ChildNode[],
  matches: { element: Element, childNodes: ChildNode[], index: number }[] = []
) {
  for (let index = 0; index < childNodes.length; index++) {
    const node = childNodes[index]
    if (isHydrationScript(node)) matches.push({ element: node, childNodes, index })
    if ('childNodes' in node) findHydrationScripts(node.childNodes, matches)
  }
  return matches
}

function removeHydrationScripts(nodes: ChildNode[]) {
  const scripts = findHydrationScripts(nodes)
  for (let index = scripts.length - 1; index >= 0; index--) {
    const script = scripts[index]
    script.childNodes.splice(script.index, 1)
  }
}

function removeNode(nodes: ChildNode[], target: ChildNode): boolean {
  const index = nodes.indexOf(target)
  if (index !== -1) {
    nodes.splice(index, 1)
    return true
  }
  for (const node of nodes) {
    if ('childNodes' in node && removeNode(node.childNodes, target)) return true
  }
  return false
}

function injectHydrationScript(
  nodes: ChildNode[],
  htmlElement: Element | null,
  headElement: Element | null,
  styleElement: Element | null,
  hydrationManifest: MasterCSSHydrationManifest
) {
  if (styleElement) delete styleElement.attribs[MASTER_CSS_HYDRATION_MANIFEST_ATTR]
  const scripts = findHydrationScripts(nodes)
  if (scripts.length) {
    const [first, ...duplicates] = scripts
    first.element.attribs.type = 'application/json'
    first.element.childNodes = [new Text(serializeMasterCSSHydrationManifest(hydrationManifest))]
    for (let index = duplicates.length - 1; index >= 0; index--) {
      const duplicate = duplicates[index]
      duplicate.childNodes.splice(duplicate.index, 1)
    }
    return
  }
  const script = hydrationScript(hydrationManifest)
  if (headElement) headElement.childNodes.push(script)
  else if (htmlElement) htmlElement.childNodes.unshift(new Element('head', {}, [script]))
  else nodes.unshift(script)
}

function externalSource(
  option: MasterCSSExternalHydrationManifestOptions,
  hydrationManifest: MasterCSSHydrationManifest
) {
  const json = serializeMasterCSSHydrationManifest(hydrationManifest)
  return typeof option.source === 'function'
    ? option.source(json, hydrationManifest)
    : option.source
}

function result(
  html: string,
  classNames: readonly string[],
  snapshot?: MasterCSSRenderSnapshot,
  hydrationManifest?: MasterCSSHydrationManifest
): MasterCSSHTMLRenderResult {
  return Object.freeze({
    html,
    cssText: snapshot?.cssText ?? '',
    classNames: Object.freeze([...classNames]),
    invalidClassNames: Object.freeze([...(snapshot?.invalidClassNames ?? [])]),
    ...(hydrationManifest ? { hydrationManifest } : {}),
    diagnostics: Object.freeze([])
  })
}

export function renderHTMLWithSnapshot(
  html: string,
  classNames: readonly string[],
  snapshot: MasterCSSRenderSnapshot | undefined,
  options: MasterCSSHTMLDocumentOptions
) {
  const context = parseHTML(html)
  const { nodes, htmlElement } = context
  let { headElement, styleElement } = context
  const hydrationOption = options.hydrationManifest ?? 'return'
  const hydrationManifest = hydrationOption === false
    ? undefined
    : snapshot?.hydrationManifest as MasterCSSHydrationManifest | undefined
  const external = typeof hydrationOption === 'object' ? hydrationOption : undefined

  if (!snapshot?.cssText) {
    if ((hydrationOption === 'inject' || external) && styleElement) {
      removeNode(nodes, styleElement)
      styleElement = null
    }
    if (external) removeHydrationScripts(nodes)
    const nextHTML = external || styleElement !== context.styleElement
      ? serialize(nodes, { decodeEntities: false, encodeEntities: false })
      : html
    return result(nextHTML, classNames, snapshot, hydrationManifest)
  }

  if (styleElement) {
    styleElement.childNodes = [new Text(snapshot.cssText)]
  } else {
    styleElement = new Element('style', { id: MASTER_CSS_RUNTIME_STYLE_ID }, [
      new Text(snapshot.cssText)
    ])
    if (headElement) headElement.childNodes.push(styleElement)
    else if (htmlElement) {
      headElement = new Element('head', {}, [styleElement])
      htmlElement.childNodes.unshift(headElement)
    } else nodes.unshift(styleElement)
  }

  if (hydrationOption === 'inject' && hydrationManifest?.rules.length) {
    injectHydrationScript(nodes, htmlElement, headElement, styleElement, hydrationManifest)
  } else if (external && hydrationManifest?.rules.length) {
    removeHydrationScripts(nodes)
    styleElement.attribs[MASTER_CSS_HYDRATION_MANIFEST_ATTR] = externalSource(
      external,
      hydrationManifest
    )
  } else {
    delete styleElement.attribs[MASTER_CSS_HYDRATION_MANIFEST_ATTR]
  }

  return result(
    serialize(nodes, { decodeEntities: false, encodeEntities: false }),
    classNames,
    snapshot,
    hydrationManifest
  )
}
