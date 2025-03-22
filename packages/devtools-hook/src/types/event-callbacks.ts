import type { Config } from '@master/css'
import type CSSRuntime from '@master/css-runtime'

export default interface EventCallbacks {
    'runtime:created': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:hydrated': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:observed': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:mutated': (context: { cssRuntime: CSSRuntime, classCounts: Map<string, number>, records: MutationRecord[] }) => void
    'runtime:refreshed': (context: { cssRuntime: CSSRuntime, customConfig: Config }) => void
    'runtime:disconnected': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:destroyed': (context: { cssRuntime: CSSRuntime }) => void
}