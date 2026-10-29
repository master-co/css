// These third-party packages still consume the TypeScript 6 compiler API.
// Repository source, checks, and declaration generation use TypeScript 7.
export const legacyTypeScriptVersion = '6.0.3'
export const legacyTypeScriptAlias = 'typescript-legacy-api'
export const legacyTypeScriptPackages = [
  '@angular-devkit/build-angular', '@angular/build', '@angular/compiler-cli', '@ngtools/webpack',
  '@nuxt/module-builder', '@sveltejs/package', '@sveltejs/kit',
  '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser', '@typescript-eslint/type-utils',
  '@typescript-eslint/typescript-estree', '@typescript-eslint/project-service', '@typescript-eslint/tsconfig-utils',
  '@typescript-eslint/utils', 'mkdist', 'rolldown-plugin-dts', 'rollup-plugin-dts',
  'svelte-check', 'svelte2tsx', 'ts-api-utils', 'typescript-eslint', 'unbuild', 'vite-plugin-checker', 'vue-tsc'
]
