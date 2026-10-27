import { createElement as h, Fragment, memo, type ComponentType, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import islandModules from 'virtual:site-islands'
import { createWithChildren, fragmentType, IslandContext, islandElementName, slotElementName, type EncodedElement, type EncodedValue } from './context'
import { readSiteContext, SiteRoot } from '../docs-shell/layouts/root'

type IslandElement = HTMLElement & { siteIslandHydrated?: boolean }

const modules = new Map<string, Promise<Record<string, unknown>>>()
const site = readSiteContext()

function loadModule(id: string) {
  let module = modules.get(id)
  if (!module) {
    const load = islandModules[id]
    if (!load) throw new Error(`Unknown client island module ${id}`)
    module = load()
    modules.set(id, module)
  }
  return module
}

async function resolveReference(reference: string) {
  const separator = reference.lastIndexOf('#')
  const module = await loadModule(reference.slice(0, separator))
  const value = module[reference.slice(separator + 1)]
  if (!value) throw new Error(`Client island ${reference} is not exported`)
  return value as ComponentType<any>
}

/** Slot HTML must be read before any island hydrates, including islands nested in slots. */
function ownSlots(island: HTMLElement) {
  const slots: string[] = []
  island.querySelectorAll<HTMLElement>(slotElementName).forEach((slot) => {
    if (slot.closest(islandElementName) === island) slots[Number(slot.dataset.slot)] = slot.innerHTML
  })
  return slots
}

interface StaticSlotProps { index: number, html: string }

function StaticSlotElement(props: StaticSlotProps) {
  return h(slotElementName, { 'data-slot': props.index, suppressHydrationWarning: true, dangerouslySetInnerHTML: { __html: props.html } })
}

/** Server-rendered HTML that the island never re-renders. */
const StaticSlot = memo(StaticSlotElement, () => true)

function collectReferences(value: EncodedValue, references: Set<string>) {
  if (Array.isArray(value)) return value.forEach((item) => collectReferences(item, references))
  if (!value || typeof value !== 'object') return
  if ('$r' in value) return references.add(value.$r as string)
  if ('$e' in value) {
    const element = value as EncodedElement
    if (element.$e.includes('#')) references.add(element.$e)
    return collectReferences(element.p, references)
  }
  for (const item of Object.values('$o' in value ? value.$o as Record<string, EncodedValue> : value)) collectReferences(item, references)
}

function decode(value: EncodedValue, slots: string[], references: Map<string, ComponentType<any>>): any {
  if (Array.isArray(value)) return value.map((item) => decode(item, slots, references))
  if (!value || typeof value !== 'object') return value
  if ('$u' in value) return undefined
  if ('$d' in value) return new Date(value.$d as string)
  if ('$s' in value) {
    const index = value.$s as number
    return h(StaticSlot, { index, html: slots[index] ?? '' })
  }
  if ('$r' in value) return references.get(value.$r as string)
  if ('$e' in value) {
    const element = value as EncodedElement
    const type = element.$e === fragmentType
      ? Fragment
      : element.$e.includes('#') ? references.get(element.$e)! : element.$e
    return createWithChildren(type, { ...decodeObject(element.p, slots, references), key: element.k ?? undefined })
  }
  return decodeObject(value as Record<string, EncodedValue>, slots, references)
}

function decodeObject(value: Record<string, EncodedValue>, slots: string[], references: Map<string, ComponentType<any>>) {
  const object = '$o' in value ? value.$o as Record<string, EncodedValue> : value
  return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, decode(item, slots, references)]))
}

async function prepare(island: IslandElement) {
  island.siteIslandHydrated = true
  const encoded = JSON.parse(island.dataset.props || '{}') as EncodedValue
  const slots = ownSlots(island)
  const referenceIds = new Set<string>([island.dataset.island!])
  collectReferences(encoded, referenceIds)
  const references = new Map(await Promise.all([...referenceIds].map(async (id) => [id, await resolveReference(id)] as const)))
  const Component = references.get(island.dataset.island!)!
  const props = decode(encoded, slots, references)
  return () => {
    const children: ReactNode = h(SiteRoot, site, h(IslandContext.Provider, { value: true }, createWithChildren(Component, props)))
    hydrateRoot(island, children, {
      identifierPrefix: island.dataset.idPrefix,
      onRecoverableError(error) {
        console.warn(`Client island ${island.dataset.island} recovered from a hydration error`, error)
      }
    })
  }
}

function pendingIslands(root: ParentNode = document) {
  return [...root.querySelectorAll<IslandElement>(islandElementName)].filter((island) => !island.siteIslandHydrated)
}

function isNearViewport(island: HTMLElement) {
  for (const child of island.children) {
    const rect = child.getBoundingClientRect()
    if (rect.width || rect.height) return rect.bottom > -200 && rect.top < innerHeight + 200
  }
  return false
}

const idle = (callback: () => void) => 'requestIdleCallback' in window
  ? requestIdleCallback(callback, { timeout: 500 })
  : setTimeout(callback, 1)

async function hydrate(islands: IslandElement[]) {
  // Prepare everything first so slot HTML is captured before any root changes the DOM.
  const prepared = await Promise.all(islands.map(async (island) => ({ island, hydrate: await prepare(island) })))
  const visible = prepared.filter(({ island }) => isNearViewport(island))
  const deferred = prepared.filter((entry) => !visible.includes(entry))
  visible.forEach(({ hydrate }) => hydrate())
  const next = () => {
    const entry = deferred.shift()
    if (!entry) return
    entry.hydrate()
    idle(next)
  }
  idle(next)
}

async function start() {
  await hydrate(pendingIslands())
  // A client component may remount a static slot; hydrate islands restored from its HTML.
  new MutationObserver((records) => {
    const added = records.flatMap(({ addedNodes }) => [...addedNodes].flatMap((node) => node instanceof HTMLElement
      ? [...(node.matches(islandElementName) ? [node as IslandElement] : []), ...pendingIslands(node)]
      : []))
    const islands = [...new Set(added)].filter((island) => !island.siteIslandHydrated)
    if (islands.length) hydrate(islands)
  }).observe(document.body, { childList: true, subtree: true })
}

start()
