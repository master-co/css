import initCSSRuntime from './init'
import type { MasterCSSPlan } from 'shared/master-css-plan'

async function loadDefaultPlan(): Promise<MasterCSSPlan> {
    const defaultPlanURL = new URL('./default-plan.json', import.meta.url)
    const defaultPlanModule = await import(defaultPlanURL.href, { with: { type: 'json' } }) as { default: MasterCSSPlan }
    return defaultPlanModule.default
}

if (globalThis.masterCSSPlan) {
    initCSSRuntime({ plan: globalThis.masterCSSPlan })
} else {
    void loadDefaultPlan().then((plan) => initCSSRuntime({ plan }))
}
