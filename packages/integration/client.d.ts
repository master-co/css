declare module '*?master-css-plan' {
    import type { MasterCSSPlan } from '@master/css-engine'

    const plan: MasterCSSPlan
    export default plan
}

declare module 'virtual:master-utilities.css' {
}

declare module 'virtual:master-css-plan' {
    import type { MasterCSSPlan } from '@master/css-engine'

    const plan: MasterCSSPlan
    export default plan
}

declare module 'virtual:master-css-preloaded' {
    import type { MasterCSSPreloaded } from '@master/css-engine'

    const preloaded: MasterCSSPreloaded
    export default preloaded
}
