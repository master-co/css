import { createHighlighterCore, type LanguageRegistration } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import masterCSSTextMateGrammar from '@master/css-language-service/syntaxes/master-css.tmLanguage.json' with { type: 'json' }
import syntaxTheme from './syntax-theme'

const masterCSSShikiLanguage: LanguageRegistration = {
  ...(masterCSSTextMateGrammar as unknown as LanguageRegistration),
  injectTo: [
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
  ]
}

export default function createHighlighter() {
  return createHighlighterCore({
    langs: [
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
      import('@shikijs/langs/php'),
      masterCSSShikiLanguage
    ],
    themes: [syntaxTheme],
    engine: createJavaScriptRegexEngine(),
  })
}

export const theme = syntaxTheme.name
