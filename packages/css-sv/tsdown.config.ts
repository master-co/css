import { nativeDeclarationOptions } from '../../scripts/typescript-declarations.mjs'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts'
  },
  platform: 'node',
  tsconfig: './tsconfig.prod.json',
  dts: nativeDeclarationOptions('./tsconfig.prod.json'),
  deps: {
    onlyBundle: ['@sveltejs/sv-utils']
  },
  outputOptions: {
    entryFileNames: '[name].js',
    codeSplitting: false
  }
})
