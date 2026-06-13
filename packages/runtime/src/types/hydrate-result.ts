import type { GeneratedRule } from '@master/css-engine'
import type HydratedGeneratedRule from '../generated-rule'

export interface HydrateResult {
    allUtilities: (GeneratedRule | HydratedGeneratedRule)[]
}
