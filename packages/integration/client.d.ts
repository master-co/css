declare module '*?master-css-config' {
    import type { Config } from '@master/css'

    const config: Config
    export default config
}

declare module '*?master-css-plan' {
    import type { MasterCSSPlan } from '@master/css-engine'

    const plan: MasterCSSPlan
    export default plan
}

declare module 'virtual:master-utilities.css' {
}

declare module 'virtual:master-css-config' {
    import type { Config } from '@master/css'

    const config: Config
    export default config
}

declare module 'virtual:master-css-plan' {
    import type { MasterCSSPlan } from '@master/css-engine'

    const plan: MasterCSSPlan
    export default plan
}

declare module 'virtual:master-css-preloaded' {
    import type { MasterCSSPreloaded } from '@master/css/preloaded'

    const preloaded: MasterCSSPreloaded
    export default preloaded
}
