import { createContext, createElement, type Context } from 'react'

/** Development servers may instantiate a module twice; contexts must stay one object. */
export function sharedContext<T>(name: string, value: T): Context<T> {
  const registry = globalThis as Record<symbol, Context<T> | undefined>
  return registry[Symbol.for(`master-css.site.${name}`)] ??= createContext(value)
}

/** True while rendering inside a client island, where nested client components render inline. */
export const IslandContext = sharedContext('island', false)

export const islandElementName = 'site-island'
export const slotElementName = 'site-slot'

/** Serialized island props. Plain JSON values pass through; markers describe React values. */
export type EncodedValue =
  | null
  | boolean
  | number
  | string
  | EncodedValue[]
  | { [key: string]: EncodedValue }
  | EncodedElement
  | EncodedSlot
  | EncodedReference
  | EncodedDate
  | EncodedUndefined

export interface EncodedElement {
  /** A host element name, `''` for a fragment, or a client module reference `id#export`. */
  $e: string
  k?: string | null
  p: { [key: string]: EncodedValue }
}

export interface EncodedSlot { $s: number }
export interface EncodedReference { $r: string }
export interface EncodedDate { $d: string }
export interface EncodedUndefined { $u: 1 }

/** No host element name is empty, and client references always contain `#`. */
export const fragmentType = ''

/** JSX sibling children travel as an array; pass them as arguments, as the authored JSX did. */
export function createWithChildren(type: any, { children, ...props }: Record<string, any>) {
  return Array.isArray(children) ? createElement(type, props, ...children) : createElement(type, props, children)
}
