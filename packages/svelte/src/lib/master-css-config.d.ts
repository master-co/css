declare module 'virtual:master-css-config' {
    import type { Config } from '@master/css'

    const config: Config
    export default config
}

declare module 'virtual:master-css-preloaded' {
    import type { MasterCSSPreloaded } from '@master/css'

    const preloaded: MasterCSSPreloaded
    export default preloaded
}
