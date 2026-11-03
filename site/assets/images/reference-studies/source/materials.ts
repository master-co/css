import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'
import { readFileSync } from 'node:fs'
import { studyIllustrations, type StudyIllustrationId } from '../../../../reference/study-illustrations'

/** Resolve the published package's assets at authoring time. Its drawing helper
 * still carries pre-extraction relative asset URLs; no package files are changed. */
export function study(id: StudyIllustrationId, theme: Theme) {
  const d = drawing(theme)
  const figure = studyIllustrations[id]
  const packageSource = import.meta.resolve('@master/internal-site/demo/illustration-materials.ts')
  const asset = (path: string) => new URL(path, packageSource).href
  const primitives = readFileSync(new URL('../../rendering-modes/source/illustration.css', import.meta.url), 'utf8').replace(/@font-face\s*\{[^}]*\}/g, '')
  const finish = (body: string) => {
    const result = d.scene(figure.title, figure.alt, body)
    result.html = result.html.replace(/<link rel="stylesheet"[^>]+>/g, '')
      .replace('</head>', `
        <link rel="stylesheet" href="${asset('../styles/system/tokens.css')}">
        <style>${primitives}</style>
        <link rel="stylesheet" href="${new URL('./illustration.css', import.meta.url).href}">
        <style>
          @font-face { font-family:Geist; font-weight:100 900; src:url('${asset('../public/fonts/GeistVariable.woff2')}'); }
          @font-face { font-family:'IBM Plex Mono'; font-weight:400; src:url('${asset('../public/fonts/IBMPlexMono-Regular.woff2')}'); }
        </style></head>`)
    return result
  }
  const lines = (values: string[], kind: 'code' | 'note' = 'code') => values.map(value => `<div>${d.label(value, kind)}</div>`).join('')
  const at = (x: number, y: number, content: string, classes = '') => `<div class="study-object ${classes}" style="left:${x}px;top:${y}px">${content}</div>`
  return { ...d, figure, finish, lines, at }
}
