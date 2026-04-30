#!/usr/bin/env node

// Use the CJS build: the ESM build of this server re-exports through nested
// dependency subpaths (`vscode-languageserver/node`,
// `vscode-css-languageservice/lib/umd/...`) that have no `exports` map and
// therefore fail Node ≥ 22 ESM resolution. CJS `require` is forgiving here
// and is what every LSP host (VSCode, Neovim, Helix, Sublime) ends up
// spawning anyway. techor compiles this file to `dist/bin/index.cjs`.
import CSSLanguageServer from '../core'

new CSSLanguageServer().start()
