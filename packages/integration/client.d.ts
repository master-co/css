declare module '*?master-css-manifest' {
  import type { MasterCSSManifest } from '@master/css-schema/manifest'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module 'virtual:master-utilities.css' {
}

declare module 'virtual:master-css-manifest' {
  import type { MasterCSSManifest } from '@master/css-schema/manifest'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module 'virtual:master-css-emitted-globals' {
  import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

  const emittedGlobals: MasterCSSEmittedGlobals
  export default emittedGlobals
}
