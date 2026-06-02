import { inject, type InjectionKey, type ShallowRef } from 'vue'
import type { CSSRuntime } from '@master/css-runtime'

export type CSSRuntimeRef = ShallowRef<CSSRuntime | undefined>

export const CSS_RUNTIME_INJECTION_KEY = Symbol('css-runtime') as InjectionKey<CSSRuntimeRef>

export function useCSSRuntime() {
    return inject(CSS_RUNTIME_INJECTION_KEY)
}
