import dedent from 'ts-dedent'
import type { PlayFile } from './types'

const playShareApiURL = process.env.NEXT_PUBLIC_PLAY_API_URL || '/api/play'

export function getFileContent(files: PlayFile[], title: string) {
  return files.find((file) => file.title === title)?.content || ''
}

export function extractClassNamesFromHTML(html: string) {
  const classNames = new Set<string>()

  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const document = new DOMParser().parseFromString(html, 'text/html')
    document.querySelectorAll('[class]').forEach((element) => {
      element.getAttribute('class')?.split(/\s+/).filter(Boolean).forEach((className) => classNames.add(className))
    })
  } else {
    for (const match of html.matchAll(/\bclass\s*=\s*(["'])(.*?)\1/gs)) {
      match[2].split(/\s+/).filter(Boolean).forEach((className) => classNames.add(className))
    }
  }

  return [...classNames]
}

export function formatCSSSize(cssText: string) {
  return Math.round(new TextEncoder().encode(cssText).length / 1024 * 100) / 100 + 'KB'
}

export function createPreviewHTML() {
  return dedent`<html hidden>
    <head>
      <style>${require('../../../../packages/preset/src/base.css?raw')}</style>
      <style>
        @font-face {
          font-family: Geist;
          font-style: normal;
          font-optical-sizing: auto;
          font-weight: 100 900;
          font-display: block;
          src: url("/fonts/GeistVariable.woff2") format("woff2");
        }

        @layer theme {
          :root {
            --font-family-sans: Geist, "Noto Sans TC", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
            --font-family-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            --font-feature-sans: "ss02", "ss03", "ss04", "ss06", "ss07", "ss08";
            --font-feature-mono: "cv01", "cv02", "cv29";
          }
        }
      </style>
      <script>${require('./preview.js?raw')}</script>
    </head>
    <body></body>
  </html>`
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function createFileId(file: PlayFile, index: number) {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  return `play-${index}-${file.title || file.name || 'file'}-${suffix}`
}

function reviveFiles(files: PlayFile[]) {
  return files.map((file, index) => ({
    title: file.title,
    name: file.name,
    language: file.language,
    content: file.content || '',
    id: createFileId(file, index)
  }))
}

function serializeFiles(files: PlayFile[]) {
  return files.map(({ title, name, language, content }) => ({
    title,
    name,
    language,
    content: content || ''
  }))
}

export function stringifyFiles(files: PlayFile[]) {
  return JSON.stringify(serializeFiles(files))
}

async function getResponseError(response: Response) {
  try {
    const body = await response.json()
    if (typeof body?.error === 'string') {
      return body.error
    }
  } catch {
    // Fall back to the HTTP status below.
  }
  return response.statusText || `Request failed with ${response.status}`
}

export async function createPlayShare(files: PlayFile[]) {
  const response = await fetch(`${playShareApiURL}/shares`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      version: 1,
      files: serializeFiles(files)
    })
  })

  if (!response.ok) {
    throw new Error(await getResponseError(response))
  }

  const body = await response.json()
  if (!body?.id || typeof body.id !== 'string') {
    throw new Error('Invalid share response')
  }
  return body.id
}

export async function fetchPlayShare(shareId: string) {
  const response = await fetch(`${playShareApiURL}/shares/${encodeURIComponent(shareId)}`)
  if (!response.ok) {
    throw new Error(await getResponseError(response))
  }

  const body = await response.json()
  if (!Array.isArray(body?.files)) {
    throw new Error('Invalid share data')
  }
  return reviveFiles(body.files)
}

export function getShareURL(shareId: string) {
  const url = new URL(window.location.href)
  const nextPathname = url.pathname.match(/\/play(?:\/[^/]+)?$/)
    ? url.pathname.replace(/\/play(?:\/[^/]+)?$/, `/play/${shareId}`)
    : `${url.pathname.replace(/\/$/, '')}/play/${shareId}`
  url.pathname = nextPathname
  return url
}

export function getShareIdFromPathname(pathname?: string | null) {
  return pathname?.match(/\/play\/([^/?#]+)/)?.[1] || ''
}

export function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path className="fill:text-disabled/.2" d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"></path>
      <path d="M12 14v-11"></path>
      <path d="M9 6l3 -3l3 3"></path>
    </svg>
  )
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path className="fill:accent/.15" d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18z"></path>
      <path d="M9 12l2 2l4 -4"></path>
    </svg>
  )
}
