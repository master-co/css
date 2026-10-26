/// <reference types="@master/css/client" />
/// <reference types="webpack/module" />

import masterCSSProgram from 'virtual:master-css-program'
import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'
import { destroyRuntime, startRuntime } from './runtime-start'

// Runtime pages render every class in the browser, so the program loads with the entry.
if (typeof document !== 'undefined') {
  void startRuntime(masterCSSProgram, masterCSSEmittedGlobals).catch(() => {})
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(() => {})
  // Webpack rebinds both imports before this callback runs.
  import.meta.webpackHot.accept([
    'virtual:master-css-program',
    'virtual:master-css-emitted-globals'
  ], () => {
    void startRuntime(masterCSSProgram, masterCSSEmittedGlobals).catch(() => {})
  })
  import.meta.webpackHot.dispose(destroyRuntime)
}
