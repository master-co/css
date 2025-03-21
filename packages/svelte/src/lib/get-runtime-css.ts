import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'
import type CSSRuntime from '@master/css-runtime'

export function getRuntimeCSS() {
    return getContext<Writable<CSSRuntime>>('runtime-css')
}