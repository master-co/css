import { createHighlighterCore, type LanguageRegistration } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import masterCSSTextMateGrammar from '@master/css-language-service/syntaxes/master-css.tmLanguage.json' with { type: 'json' }
import syntaxTheme from './syntax-theme'
import cssModernLanguages, { cssInjectionHosts } from './css-modern-grammar'

const masterCSSShikiLanguage: LanguageRegistration = {
  ...(masterCSSTextMateGrammar as unknown as LanguageRegistration),
  // The `source.css` prefix also covers SCSS, Less and PostCSS roots.
  injectTo: cssInjectionHosts
}

/**
 * Every language loads at once, so embedded grammars always resolve. Lazy embedding would make Shiki reload
 * a grammar such as Vue for each lazily embedded language, and the reloaded grammar loses its injections.
 */
async function eager(language: Promise<{ default: LanguageRegistration[] }>) {
  return (await language).default.map(({ embeddedLangsLazy: _lazy, ...registration }) => ({
    ...registration,
    // Vue's directive and interpolation grammars still target its former `source.vue` root scope.
    injectTo: registration.injectTo?.includes('source.vue') ? [...registration.injectTo, 'text.html.vue'] : registration.injectTo
  }))
}

export default function createHighlighter() {
  return createHighlighterCore({
    langs: [
      ...[
        import('@shikijs/langs/html'),
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/jsx'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/css'),
        import('@shikijs/langs/scss'),
        import('@shikijs/langs/json'),
        import('@shikijs/langs/vue'),
        import('@shikijs/langs/svelte'),
        import('@shikijs/langs/astro'),
        import('@shikijs/langs/markdown'),
        import('@shikijs/langs/mdx'),
        import('@shikijs/langs/bash'),
        import('@shikijs/langs/angular-html'),
        import('@shikijs/langs/toml'),
        import('@shikijs/langs/erb'),
        import('@shikijs/langs/liquid'),
        import('@shikijs/langs/php')
      ].map(eager),
      ...cssModernLanguages,
      masterCSSShikiLanguage
    ],
    themes: [syntaxTheme],
    engine: createJavaScriptRegexEngine(),
  })
}

export const theme = syntaxTheme.name
