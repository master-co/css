import type { CSSRuntime } from '@master/css-runtime'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export const cssRuntimeSymbol = Symbol()

export function getCSSRuntime() {
    return getContext<Writable<CSSRuntime> | undefined>(cssRuntimeSymbol)
}