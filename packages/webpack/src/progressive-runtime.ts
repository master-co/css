/// <reference types="@master/css/client" />
/// <reference types="webpack/module" />

import masterCSSEmittedGlobals from 'virtual:master-css-emitted-globals'
import { destroyRuntime, startRuntime } from './runtime-start'

// A fully pre-rendered page never starts the engine, so it never loads this chunk.
const loadProgram = () => import('virtual:master-css-program').then(module => module.default)

if (typeof document !== 'undefined') {
  void startRuntime(loadProgram, masterCSSEmittedGlobals).catch(() => {})
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(() => {})
  import.meta.webpackHot.accept('virtual:master-css-emitted-globals', () => {
    void startRuntime(loadProgram, masterCSSEmittedGlobals).catch(() => {})
  })
  // The program updates only after the engine loaded it; import the new one.
  import.meta.webpackHot.accept('virtual:master-css-program', () => {
    void loadProgram().then(program => startRuntime(program, masterCSSEmittedGlobals)).catch(() => {})
  })
  import.meta.webpackHot.dispose(destroyRuntime)
}
