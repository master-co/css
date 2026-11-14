import { cssGrammar } from '@master/css-binding/css-grammar'

/** The grammar errors of a stylesheet: parse errors, then at-rule, then rule errors. */
export function validateCSS(text: string) {
  return cssGrammar().validateCSS(text)
}

/** The declarations of a stylesheet as written, by property; `!important` stays in the value. */
export function parseCSSDeclarations(text: string): Record<string, string> {
  return cssGrammar().parseDeclarations(text)
}
