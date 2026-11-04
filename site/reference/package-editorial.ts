import { referenceText as text } from './copy'
/** Reader guidance only. Export paths and searchable symbols come from public package contracts. */
export interface PackageEditorial {
  introduction: string
  usage: string
  entries: Record<string, string>
}

export const packageEditorial: Record<string, PackageEditorial> = {
  '@master/css': {
    introduction: text("packages", "editorial--master-css-introduction"),
    usage: text('packages', "editorial--master-css-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-entries-"),
      './node': text("packages", "editorial--master-css-entries--node"),
      './client': text("packages", "editorial--master-css-entries--client"),
      './index.css': text("packages", "editorial--master-css-entries--index-css"),
      './base.css': text("packages", "editorial--master-css-entries--base-css"),
      './theme.css': text("packages", "editorial--master-css-entries--theme-css"),
      './media.css': text("packages", "editorial--master-css-entries--media-css"),
      './container.css': text("packages", "editorial--master-css-entries--container-css"),
      './utilities.css': text("packages", "editorial--master-css-entries--utilities-css")
    }
  },
  '@master/css-compiler': {
    introduction: text("packages", "editorial--master-css-compiler-introduction"),
    usage: text('packages', "editorial--master-css-compiler-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-compiler-entries-"),
      './node': text("packages", "editorial--master-css-compiler-entries--node"),
      './project': text("packages", "editorial--master-css-compiler-entries--project"),
      './project/sync': text("packages", "editorial--master-css-compiler-entries--project-sync"),
      './stylesheet': text("packages", "editorial--master-css-compiler-entries--stylesheet"),
      './stylesheet/browser': text("packages", "editorial--master-css-compiler-entries--stylesheet-browser"),
      './diagnostics': text("packages", "editorial--master-css-compiler-entries--diagnostics")
    }
  },
  '@master/create-css': {
    introduction: text("packages", "editorial--master-create-css-introduction"),
    usage: text("packages", "editorial--master-create-css-usage"),
    entries: { '.': text("packages", "editorial--master-create-css-entries-") }
  },
  '@master/css-svelte-addon': {
    introduction: text("packages", "editorial--master-css-svelte-addon-introduction"),
    usage: text("packages", "editorial--master-css-svelte-addon-usage"),
    entries: { '.': text("packages", "editorial--master-css-svelte-addon-entries-") }
  },
  '@master/eslint-config-css': {
    introduction: text("packages", "editorial--master-eslint-config-css-introduction"),
    usage: text('packages', "editorial--master-eslint-config-css-usage"),
    entries: { '.': text("packages", "editorial--master-eslint-config-css-entries-") }
  },
  '@master/eslint-plugin-css': {
    introduction: text("packages", "editorial--master-eslint-plugin-css-introduction"),
    usage: text('packages', "editorial--master-eslint-plugin-css-usage"),
    entries: { '.': text("packages", "editorial--master-eslint-plugin-css-entries-") }
  },
  '@master/css-language-server': {
    introduction: text("packages", "editorial--master-css-language-server-introduction"),
    usage: text("packages", "editorial--master-css-language-server-usage"),
    entries: { '.': text("packages", "editorial--master-css-language-server-entries-"), './server': text("packages", "editorial--master-css-language-server-entries--server") }
  },
  '@master/css-language-service': {
    introduction: text("packages", "editorial--master-css-language-service-introduction"),
    usage: text("packages", "editorial--master-css-language-service-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-language-service-entries-"),
      './common': text("packages", "editorial--master-css-language-service-entries--common"),
      './shiki': text("packages", "editorial--master-css-language-service-entries--shiki"),
      './shiki.css': text("packages", "editorial--master-css-language-service-entries--shiki-css"),
      './syntaxes/master-css.tmLanguage.json': text("packages", "editorial--master-css-language-service-entries--syntaxes-master-css-tmLanguage-json")
    }
  },
  '@master/css-mcp': {
    introduction: text("packages", "editorial--master-css-mcp-introduction"),
    usage: text("packages", "editorial--master-css-mcp-usage"),
    entries: { '.': text("packages", "editorial--master-css-mcp-entries-") }
  },
  '@master/css-next': {
    introduction: text("packages", "editorial--master-css-next-introduction"),
    usage: text("packages", "editorial--master-css-next-usage"),
    entries: { '.': text("packages", "editorial--master-css-next-entries-"), './adapter': text("packages", "editorial--master-css-next-entries--adapter") }
  },
  '@master/css-nuxt': {
    introduction: text("packages", "editorial--master-css-nuxt-introduction"),
    usage: text("packages", "editorial--master-css-nuxt-usage"),
    entries: { '.': text("packages", "editorial--master-css-nuxt-entries-") }
  },
  '@master/css-preset': {
    introduction: text("packages", "editorial--master-css-preset-introduction"),
    usage: text("packages", "editorial--master-css-preset-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-preset-entries-"),
      './default-manifest.json': text("packages", "editorial--master-css-preset-entries--default-manifest-json"),
      './index.css': text("packages", "editorial--master-css-preset-entries--index-css"),
      './base.css': text("packages", "editorial--master-css-preset-entries--base-css"),
      './theme.css': text("packages", "editorial--master-css-preset-entries--theme-css"),
      './media.css': text("packages", "editorial--master-css-preset-entries--media-css"),
      './container.css': text("packages", "editorial--master-css-preset-entries--container-css"),
      './utilities.css': text("packages", "editorial--master-css-preset-entries--utilities-css")
    }
  },
  '@master/css-runtime': {
    introduction: text("packages", "editorial--master-css-runtime-introduction"),
    usage: text('packages', "editorial--master-css-runtime-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-runtime-entries-"),
      './default-program': text("packages", "editorial--master-css-runtime-entries--default-program")
    }
  },
  '@master/css-schema': {
    introduction: text("packages", "editorial--master-css-schema-introduction"),
    usage: text('packages', "editorial--master-css-schema-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-schema-entries-"),
      './manifest': text("packages", "editorial--master-css-schema-entries--manifest"),
      './hydration-manifest': text("packages", "editorial--master-css-schema-entries--hydration-manifest"),
      './css-directives': text("packages", "editorial--master-css-schema-entries--css-directives"),
      './css-syntax': text("packages", "editorial--master-css-schema-entries--css-syntax"),
      './utility-type': text("packages", "editorial--master-css-schema-entries--utility-type"),
      './runtime-style': text("packages", "editorial--master-css-schema-entries--runtime-style"),
      './emitted-globals': text("packages", "editorial--master-css-schema-entries--emitted-globals"),
      './css-common': text("packages", "editorial--master-css-schema-entries--css-common"),
      './diagnostics': text("packages", "editorial--master-css-schema-entries--diagnostics"),
      './integration': text("packages", "editorial--master-css-schema-entries--integration")
    }
  },
  '@master/css-server': {
    introduction: text("packages", "editorial--master-css-server-introduction"),
    usage: text('packages', "editorial--master-css-server-usage"),
    entries: { '.': text("packages", "editorial--master-css-server-entries-") }
  },
  '@master/css-svelte': {
    introduction: text("packages", "editorial--master-css-svelte-introduction"),
    usage: text("packages", "editorial--master-css-svelte-usage"),
    entries: { './vite': text("packages", "editorial--master-css-svelte-entries--vite"), './hooks.server': text("packages", "editorial--master-css-svelte-entries--hooks-server") }
  },
  '@master/css-tooling': {
    introduction: text("packages", "editorial--master-css-tooling-introduction"),
    usage: text("packages", "editorial--master-css-tooling-usage"),
    entries: {
      '.': text("packages", "editorial--master-css-tooling-entries-"),
      './node': text("packages", "editorial--master-css-tooling-entries--node"),
      './lexer': text("packages", "editorial--master-css-tooling-entries--lexer"),
      './lexer/node': text("packages", "editorial--master-css-tooling-entries--lexer-node"),
      './source': text("packages", "editorial--master-css-tooling-entries--source"),
      './source/node': text("packages", "editorial--master-css-tooling-entries--source-node"),
      './scanner/node': text("packages", "editorial--master-css-tooling-entries--scanner-node"),
      './validator': text("packages", "editorial--master-css-tooling-entries--validator"),
      './validator/node': text("packages", "editorial--master-css-tooling-entries--validator-node"),
      './lint': text("packages", "editorial--master-css-tooling-entries--lint"),
      './lint/node': text("packages", "editorial--master-css-tooling-entries--lint-node"),
      './language': text("packages", "editorial--master-css-tooling-entries--language"),
      './language/node': text("packages", "editorial--master-css-tooling-entries--language-node")
    }
  },
  '@master/css-vite': {
    introduction: text("packages", "editorial--master-css-vite-introduction"),
    usage: text("packages", "editorial--master-css-vite-usage"),
    entries: { '.': text("packages", "editorial--master-css-vite-entries-") }
  },
  '@master/css-webpack': {
    introduction: text("packages", "editorial--master-css-webpack-introduction"),
    usage: text("packages", "editorial--master-css-webpack-usage"),
    entries: { '.': text("packages", "editorial--master-css-webpack-entries-") }
  },
  '@master/css-astro': {
    introduction: text("packages", "editorial--master-css-astro-introduction"),
    usage: text("packages", "editorial--master-css-astro-usage"),
    entries: { '.': text("packages", "editorial--master-css-astro-entries-"), './middleware': text("packages", "editorial--master-css-astro-entries--middleware") }
  }
}
