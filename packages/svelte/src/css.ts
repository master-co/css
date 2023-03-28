import type { MasterCSS } from '@master/css'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export const cssSymbol = Symbol()

export function getCSS() {
    return getContext<Writable<MasterCSS> | undefined>(cssSymbol)
}