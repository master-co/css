import type { MasterCSS } from '@master/css'
import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export const lazyCSSSymbol = Symbol()

export function getLazyCSS() {
    return getContext<Writable<MasterCSS> | undefined>(lazyCSSSymbol)
}