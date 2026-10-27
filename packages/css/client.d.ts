declare module '*?master-css-manifest' {
  import type { MasterCSSManifest } from '@master/css-schema/manifest'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module '*?master-css-program' {
  /** The CSS entry's manifest compiled into the runtime program browsers execute. */
  const program: Uint8Array
  export default program
}

declare module 'virtual:master-utilities.css' {
}

declare module 'virtual:master-css-runtime' {
}

declare module 'virtual:master-css-manifest' {
  import type { MasterCSSManifest } from '@master/css-schema/manifest'

  const manifest: MasterCSSManifest
  export default manifest
}

declare module 'virtual:master-css-program' {
  /** The project manifest compiled into the runtime program browsers execute. */
  const program: Uint8Array
  export default program
}

declare module 'virtual:master-css-emitted-globals' {
  import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals'

  const emittedGlobals: MasterCSSEmittedGlobals
  export default emittedGlobals
}
