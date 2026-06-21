import type { MasterCSSManifest } from 'shared/master-css-manifest'
import type { CSSRuntime, HydrateResult } from '@master/css-runtime'

export default interface EventCallbacks {
    'runtime:created': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:hydrated': (context: { cssRuntime: CSSRuntime, result: HydrateResult }) => void
    'runtime:observed': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:mutated': (context: { cssRuntime: CSSRuntime, classCounts: Map<string, number>, records: MutationRecord[] }) => void
    'runtime:refreshed': (context: { cssRuntime: CSSRuntime, manifest: MasterCSSManifest }) => void
    'runtime:disconnected': (context: { cssRuntime: CSSRuntime }) => void
    'runtime:destroyed': (context: { cssRuntime: CSSRuntime }) => void
}
