import { createElement as h, Fragment, isValidElement, use, useContext, useId, type ComponentType, type ReactElement, type ReactNode } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { createWithChildren, fragmentType, IslandContext, islandElementName, slotElementName, type EncodedValue } from './context'
import { SiteContext, SiteRoot, type SiteContextValue } from '../docs-shell/layouts/root'

const clientReferenceKey = Symbol.for('master-css.site.client-reference')
const markerKeys = new Set(['$e', '$s', '$r', '$d', '$u', '$o'])
const renders = new WeakMap<object, Promise<string>>()

interface ClientReference { id: string, name: string }

type Boundary = ComponentType<any> & { [clientReferenceKey]?: ClientReference }

function isReactObject(value: any) {
  const type = value?.$$typeof
  return type === Symbol.for('react.memo') || type === Symbol.for('react.forward_ref')
}

function isComponentExport(value: any, name: string) {
  if (isReactObject(value)) return true
  if (typeof value !== 'function') return false
  const functionName = name === 'default' ? value.name : name
  return !functionName || functionName === 'default' || /^[A-Z]/.test(functionName)
}

export function getClientReference(type: unknown): ClientReference | undefined {
  return (type as Boundary | undefined)?.[clientReferenceKey]
}

/**
 * Wraps an export of a `'use client'` module during server rendering. Outside an
 * island it renders a standalone island root; inside one it renders inline.
 */
export function clientReference<T>(value: T, id: string, name: string): T {
  if (!isComponentExport(value, name)) return value
  const Component = value as ComponentType<any>
  const reference = { id, name }
  function ClientBoundary(props: any) {
    const inside = useContext(IslandContext)
    const site = useContext(SiteContext)
    const prefix = `i${useId().replace(/[^\w-]/g, '')}-`
    if (inside) return h(Component, props)
    if (!site) throw new Error(`Client component ${id}#${name} must render inside SiteRoot`)
    let html = renders.get(props)
    if (!html) {
      html = renderIsland(Component, props, reference, site, prefix)
      renders.set(props, html)
    }
    return h(islandElementName, {
      'data-island': `${id}#${name}`,
      'data-props': JSON.stringify(encodeIslandProps(props, reference)),
      'data-id-prefix': prefix,
      dangerouslySetInnerHTML: { __html: use(html) }
    })
  }
  ClientBoundary.displayName = `ClientBoundary(${Component.displayName || (Component as any).name || name})`
  ;(ClientBoundary as Boundary)[clientReferenceKey] = reference
  return ClientBoundary as T
}

async function renderIsland(Component: ComponentType<any>, props: any, reference: ClientReference, site: SiteContextValue, identifierPrefix: string) {
  const slots: ReactNode[] = []
  const islandProps = replaceServerElements(props, slots, reference, 'props') as Record<string, unknown>
  const element = h(SiteRoot, site, h(IslandContext.Provider, { value: true }, createWithChildren(Component, islandProps)))
  const stream = await renderToReadableStream(element, {
    identifierPrefix,
    onError(error) { console.error(`Failed to render client island ${reference.id}#${reference.name}`, error) }
  })
  await stream.allReady
  // React 19 emits resource hints at the start of a fragment render; they are not island content.
  return (await new Response(stream).text()).replace(/^(?:<link\b[^>]*>)+/, '')
}

function SiteSlot({ index, children }: { index: number, children?: ReactNode }) {
  return h(slotElementName, { 'data-slot': index }, h(IslandContext.Provider, { value: false }, children))
}

function isServerElement(element: ReactElement) {
  return typeof element.type !== 'string' && element.type !== Fragment && !getClientReference(element.type)
}

/** Swap server-component elements for slots so the island renders them as static HTML. */
function replaceServerElements(value: any, slots: ReactNode[], reference: ClientReference, path: string): unknown {
  if (Array.isArray(value)) return value.map((item, index) => replaceServerElements(item, slots, reference, `${path}[${index}]`))
  if (isValidElement(value)) {
    const element = value as ReactElement<Record<string, unknown>>
    if (isServerElement(element)) {
      const index = slots.push(element) - 1
      return h(SiteSlot, { index, key: element.key }, element)
    }
    return createWithChildren(element.type, { ...replaceServerProps(element.props, slots, reference, path), key: element.key })
  }
  if (isPlainObject(value)) return replaceServerProps(value, slots, reference, path)
  return value
}

function replaceServerProps(props: Record<string, unknown>, slots: ReactNode[], reference: ClientReference, path: string) {
  return Object.fromEntries(Object.entries(props).map(([key, item]) => [key, replaceServerElements(item, slots, reference, `${path}.${key}`)]))
}

/** Serialize props with the same element/slot traversal order as {@link replaceServerElements}. */
export function encodeIslandProps(props: Record<string, unknown>, reference: ClientReference) {
  const counter = { slots: 0 }
  return encodeObject(props, counter, reference, 'props')
}

function encodeObject(value: Record<string, unknown>, counter: { slots: number }, reference: ClientReference, path: string): EncodedValue {
  const encoded: Record<string, EncodedValue> = {}
  let marked = false
  for (const [key, item] of Object.entries(value)) {
    if (key === 'key' || key === 'ref') continue
    if (markerKeys.has(key)) marked = true
    encoded[key] = encode(item, counter, reference, `${path}.${key}`)
  }
  return marked ? { $o: encoded } : encoded
}

function encode(value: unknown, counter: { slots: number }, reference: ClientReference, path: string): EncodedValue {
  if (value === undefined) return { $u: 1 }
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${describe(reference, path)} cannot serialize ${value}`)
    return value
  }
  if (Array.isArray(value)) return value.map((item, index) => encode(item, counter, reference, `${path}[${index}]`))
  if (value instanceof Date) return { $d: value.toISOString() }
  if (isValidElement(value)) {
    const element = value as ReactElement<Record<string, unknown>>
    if (isServerElement(element)) return { $s: counter.slots++ }
    const clientType = getClientReference(element.type)
    const type = typeof element.type === 'string'
      ? element.type
      : clientType ? `${clientType.id}#${clientType.name}` : fragmentType
    const props = encodeObject(element.props, counter, reference, path)
    return { $e: type, k: element.key, p: props as Record<string, EncodedValue> }
  }
  const clientType = getClientReference(value)
  if (clientType) return { $r: `${clientType.id}#${clientType.name}` }
  if (isPlainObject(value)) return encodeObject(value, counter, reference, path)
  throw new TypeError(`${describe(reference, path)} cannot pass ${typeof value === 'function' ? 'a function' : Object.prototype.toString.call(value)} to a client component`)
}

function describe(reference: ClientReference, path: string) {
  return `${reference.id}#${reference.name} ${path}`
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
