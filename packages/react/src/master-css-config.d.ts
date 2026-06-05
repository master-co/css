declare module 'virtual:master-css-config' {
    import type { Config } from 'shared/css-config'

    const config: Config
    export default config
}

declare module 'virtual:master-css-preloaded' {
    import type { MasterCSSPreloaded } from 'shared/css-preloaded-module'

    const preloaded: MasterCSSPreloaded
    export default preloaded
}
