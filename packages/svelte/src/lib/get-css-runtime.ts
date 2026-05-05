import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'
import type { CSSRuntime } from '@master/css-runtime'

export const CSS_RUNTIME_CONTEXT_KEY = 'css-runtime'

export function getCSSRuntime() {
    return getContext<Writable<CSSRuntime | undefined>>(CSS_RUNTIME_CONTEXT_KEY)
}
