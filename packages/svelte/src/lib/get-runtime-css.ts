import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'
import type RuntimeCSS from '@master/css-runtime'

export function getRuntimeCSS() {
    return getContext<Writable<RuntimeCSS>>('runtime-css')
}