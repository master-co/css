import type { HighlighterCore, ShikiTransformer } from 'shiki/core'
import { transformerNotationDiff, transformerNotationFocus, transformerNotationHighlight, transformerRemoveLineBreak } from '@shikijs/transformers'
import {
  getMasterCSSShikiLanguageId,
  isMasterCSSClassListLanguage,
  isMasterCSSShikiSupportedLanguage,
  type MasterCSSShikiOptions,
  transformerMasterCSS
} from '@master/css-language-service/shiki'
import { createLanguageSessionSync, type MasterCSSLanguageSession } from '@master/css-tooling/language/node'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import clsx from 'clsx'
import { dedent } from 'ts-dedent'
import { beautifyCSS } from '../utils/beautify-css'
import beautifyJS from '../utils/beautify-js'
import { beautifyHTML } from '../utils/beautify-html'
import createHighlighter, { theme } from './create-highlighter'
import transformerNotationWordMark from './transformer-notation-word-mark'
import { defu } from 'defu'

declare type Options = {
  lang: string,
  inline?: boolean,
  beautify?: boolean
  dedent?: boolean | 'block'
  className?: string
  masterCSS?: MasterCSSShikiOptions
  transformers?: ShikiTransformer[]
}

const highlighterPromise: Promise<HighlighterCore> = createHighlighter()
/** Notation classes Shiki's transformers add to a line, read back as its `data-mark`. */
const lineMarks = { added: 'notation-added', removed: 'notation-removed', active: 'notation-active' } as const
const languageSessions = new WeakMap<MasterCSSManifest, MasterCSSLanguageSession>()

function getLanguageSession(options?: MasterCSSShikiOptions) {
  if (options?.session) return options.session
  const manifest = options?.manifest ?? options?.settings?.manifest ?? defaultManifest as MasterCSSManifest
  let session = languageSessions.get(manifest)
  if (!session) {
    session = createLanguageSessionSync({ manifest })
    languageSessions.set(manifest, session)
  }
  return session
}

export default async function highlightCode(code: string, options: Options) {
  const masterCSSOptions = options.masterCSS
  options = defu(options, {
    lang: 'plaintext',
    inline: false,
    beautify: false,
    dedent: true,
    mergeWhitespaces: false
  } as Options) as Options
  const transformers: ShikiTransformer[] = []
  let lang = options.lang
  const isMasterCSSClassList = isMasterCSSClassListLanguage(lang)
  const shikiLang = isMasterCSSClassList ? 'plaintext' : getMasterCSSShikiLanguageId(lang) ?? lang
  if (options.beautify) {
    switch (lang) {
      case 'css':
        code = beautifyCSS(code)
        break
      case 'html':
        code = beautifyHTML(code)
        break
      default:
        code = beautifyJS(code)
        break
    }
  }
  if (options.inline) {
    transformers.push({
      line(hast) {
        hast.properties!.class = ''
      },
      code(element) {
        element.properties!.class = clsx('shiki', options.className)
      },
      root(root) {
        const code = (root.children![0] as any).children![0]
        root.children = [code]
      }
    })
  } else {
    transformers.push(
      transformerNotationDiff({
        classLineAdd: lineMarks.added,
        classLineRemove: lineMarks.removed,
      }),
      transformerRemoveLineBreak(),
      transformerNotationWordMark(),
      transformerNotationHighlight({
        classActiveLine: lineMarks.active,
      }),
      transformerNotationFocus({
        classActiveLine: 'focus',
      }),
      {
        pre(element) {
          element!.properties!.class = clsx(element!.properties!.class, options.className)
          delete element!.properties!.style
        },
        code(element) {
          delete element!.properties!.class
          // Lines are `ui-code-line` parts; a notation's line state becomes their `data-mark`.
          for (const line of element.children) {
            if (line.type !== 'element') continue
            const raw = line.properties.class
            const classes = new Set((Array.isArray(raw) ? raw.map(String) : String(raw ?? '').split(/\s+/)).filter(Boolean))
            for (const [mark, className] of Object.entries(lineMarks)) {
              if (classes.delete(className)) line.properties.dataMark = mark
            }
            // An array: the Master CSS transformer finds lines by an exact `line` entry.
            line.properties.class = [...classes, 'ui-code-line']
          }
        },
      }
    )
  }
  if (isMasterCSSClassList || isMasterCSSShikiSupportedLanguage(lang)) {
    transformers.push(transformerMasterCSS({
      ...options.masterCSS,
      session: getLanguageSession(masterCSSOptions),
      classList: isMasterCSSClassList
    }) as unknown as ShikiTransformer)
  }
  if (options.transformers) {
    transformers.push(...options.transformers)
  }
  const normalizedCode = options.dedent === false
    ? trimCodeBlockBoundary(code)
    : options.dedent === 'block'
      ? dedentCodeBlock(code)
      : dedent(code).trim()
  const hast = (await highlighterPromise).codeToHast(normalizedCode, {
    ...options,
    lang: shikiLang,
    theme,
    transformers,
  })
  return hast
}

function trimCodeBlockBoundary(code: string): string {
  return code.replace(/^\r?\n/, '').replace(/\r?\n$/, '')
}

function dedentCodeBlock(code: string): string {
  code = trimCodeBlockBoundary(code)
  const lines = code.split(/\r?\n/)
  const firstCodeLine = lines.find((line) => line.trim())
  if (!firstCodeLine || !countIndent(firstCodeLine)) return code
  const commonIndent = lines.reduce((minIndent, line) => {
    if (!line.trim()) return minIndent
    return Math.min(minIndent, countIndent(line))
  }, Infinity)
  if (!Number.isFinite(commonIndent) || commonIndent === 0) return code
  return lines.map((line) => line.trim() ? line.slice(commonIndent) : '').join('\n')
}

function countIndent(line: string): number {
  return line.match(/^[\t ]*/)?.[0].length ?? 0
}
