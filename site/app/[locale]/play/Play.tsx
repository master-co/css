'use client'

import type { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import dedent from 'ts-dedent'
import { IconBrandCss3, IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react'
import Tabs, { Tab } from 'internal/components/Tabs'
import useRewritedPathname from 'internal/uses/rewrited-pathname'
import { useSearchParams } from 'next/navigation'
import LanguageButton from 'internal/components/LanguageButton'
import ThemeButton from 'internal/components/ThemeButton'
import { beautifyCSS } from 'internal/utils/beautify-css'
import templates from './templates'
import Resizable from 'internal/components/Resizable'
import { useThemeMode } from '@master/theme-mode.react'
import Header from 'internal/components/Header'
import HeaderNav from 'internal/components/HeaderNav'
import { screenVariableValues } from '~/site/utils/screen-variables'
import { getThemeVariables } from '~/site/utils/theme-variables'
import clsx from 'clsx'
import Link from 'internal/components/Link'
import Editor, { loader, type Monaco } from '@monaco-editor/react'
import DocMenuButton from 'internal/components/DocMenuButton'
import { useTranslation } from 'internal/contexts/i18n'
import HeaderContent from 'internal/components/HeaderContent'
import createHighlighter, { themes } from 'internal/utils/create-highlighter'
import { useApp } from 'internal/contexts/app'
import { shikiToMonaco } from '@shikijs/monaco'

if (typeof window !== 'undefined') {
    loader.config({
        paths: {
            vs: window.location.origin + '/monaco-editor/vs',
        }
    })
}

const monoFallbackFont = getThemeVariables('font-family').find(({ key }) => key === 'mono-fallback')?.value

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly: false,
    minimap: {
        enabled: false,
    },
    padding: {
        top: 20,
        bottom: 20,
    },
    scrollBeyondLastLine: false,
    wrappingStrategy: 'advanced',
    overviewRulerLanes: 0,
    lineHeight: 22,
    fontSize: 13,
    fontFamily: typeof monoFallbackFont === 'string' ? monoFallbackFont : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
}

const editorHTMLOptions: any = {
    format: {
        wrapLineLength: 0
    }
}

const template = templates[0]
const playShareApiURL = (process.env.NEXT_PUBLIC_PLAY_API_URL || '/api/play').replace(/\/+$/, '')
let compilerPromise: Promise<typeof import('@master/css-compiler/browser')> | undefined
let playHighlighterPromise: ReturnType<typeof createHighlighter> | undefined
// shikiToMonaco installs global Monaco providers and patches setTheme without
// returning disposables. Keep one highlighter alive for those closures.
const shikiMonacoRegistrations = new WeakMap<Monaco, Promise<void>>()

function loadCompiler() {
    compilerPromise ??= import('@master/css-compiler/browser')
    return compilerPromise
}

function loadPlayHighlighter() {
    playHighlighterPromise ??= createHighlighter()
    return playHighlighterPromise
}

async function registerMonacoShiki(monaco: Monaco) {
    let registration = shikiMonacoRegistrations.get(monaco)
    if (!registration) {
        registration = loadPlayHighlighter().then((highlighter) => {
            shikiToMonaco(highlighter, monaco)
        })
        shikiMonacoRegistrations.set(monaco, registration)
    }
    await registration
}

function getFileContent(files: PlayFile[], title: string) {
    return files.find((file) => file.title === title)?.content || ''
}

function extractClassNamesFromHTML(html: string) {
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

function formatCSSSize(cssText: string) {
    return Math.round(new TextEncoder().encode(cssText).length / 1024 * 100) / 100 + 'KB'
}

function createPreviewHTML() {
    return dedent`<html>
        <head>
            <style>${require('../../../../packages/core/src/base.css?raw')}</style>
            <style>
                body {
                    font-family: Inter, Noto Sans TC, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                }
            </style>
            <script>${require('./preview.js?raw')}</script>
        </head>
        <body></body>
    </html>`
}

function getErrorMessage(error: unknown) {
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

function stringifyFiles(files: PlayFile[]) {
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

async function createPlayShare(files: PlayFile[]) {
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

async function fetchPlayShare(shareId: string) {
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

function getShareURL(shareId: string) {
    const url = new URL(window.location.href)
    const nextPathname = url.pathname.match(/\/play(?:\/[^/]+)?$/)
        ? url.pathname.replace(/\/play(?:\/[^/]+)?$/, `/play/${shareId}`)
        : `${url.pathname.replace(/\/$/, '')}/play/${shareId}`
    url.pathname = nextPathname
    return url
}

function getShareIdFromPathname(pathname?: string | null) {
    return pathname?.match(/\/play\/([^/?#]+)/)?.[1] || ''
}

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path className="fill:text-lightest/.2" d="M8 9h-1a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-8a2 2 0 0 0 -2 -2h-1"></path>
            <path d="M12 14v-11"></path>
            <path d="M9 6l3 -3l3 3"></path>
        </svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.3" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path className="fill:accent/.15" d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0 -18z"></path>
            <path d="M9 12l2 2l4 -4"></path>
        </svg>
    )
}

export default function Play({ shareId }: PlayProps = {}) {
    const $ = useTranslation()
    const app = useApp()
    const themeMode = useThemeMode()
    const searchParams = useSearchParams()
    const pathname = useRewritedPathname()
    const pathShareId = useMemo(() => getShareIdFromPathname(pathname), [pathname])
    const previewIframeRef = useRef<HTMLIFrameElement>(null)
    const filesRef = useRef<PlayFile[]>(template.files)
    const compiledCSSRef = useRef('')
    const compileTicketRef = useRef(0)
    const skipNextShareLoadRef = useRef('')
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [files, setFiles] = useState<PlayFile[]>(template.files)
    const [currentShareId, setCurrentShareId] = useState(shareId || pathShareId)
    const [baselineFilesText, setBaselineFilesText] = useState(() => stringifyFiles(template.files))
    const [generatedCSSText, setGeneratedCSSText] = useState('')
    const [generatedCSSSize, setGeneratedCSSSize] = useState('0KB')
    const [compiling, setCompiling] = useState(true)
    const [compileWarnings, setCompileWarnings] = useState<string[]>([])
    const [previewErrorEvent, setPreviewErrorEvent] = useState<PlayErrorEvent | null>(null)
    const [sharing, setSharing] = useState(false)
    const [copied, setCopied] = useState(false)
    const [shareError, setShareError] = useState('')
    const filesText = useMemo(() => stringifyFiles(files), [files])
    const shareable = filesText !== baselineFilesText
    const layout = useMemo(() => searchParams?.get('layout'), [searchParams])
    const preview = useMemo(() => searchParams?.get('preview'), [searchParams])
    const tab = useMemo(() => searchParams?.get('tab') || files[0].title, [searchParams, files])
    const getTheme = useCallback(() => themeMode.value === 'dark' ? themes.dark : themes.light, [themeMode.value])

    const getSearchPath = useCallback((name?: string, value?: any) => {
        const urlSearchParams = new URLSearchParams(searchParams?.toString())
        if (name)
            if (!value) {
                urlSearchParams.delete(name)
            } else {
                urlSearchParams.set(name, value)
            }
        const searchParamsStr = urlSearchParams.toString()
        return pathname + (searchParamsStr ? '?' + searchParamsStr : '')
    }, [pathname, searchParams])

    const pushShallowURL = useCallback((name?: string, value?: any) => {
        const newPath = getSearchPath(name, value)
        window.history.pushState(null, '', newPath)
    }, [getSearchPath])

    useEffect(() => {
        filesRef.current = files
    }, [files])

    useEffect(() => {
        setCurrentShareId(shareId || pathShareId)
    }, [pathShareId, shareId])

    /**
     * Avoid keeping mobile-only Preview or Generated CSS tabs selected when resizing up.
     */
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= screenVariableValues.md) {
                if (tab === 'Preview' || tab === 'Generated CSS') {
                    pushShallowURL('tab', files[0].title)
                }
            } else {
                pushShallowURL('preview', '')
            }
        }
        window.addEventListener('resize', onResize, { passive: true })
        return () => {
            window.removeEventListener('resize', onResize)
        }
    }, [tab, files, pushShallowURL])

    const postPreviewUpdate = useCallback((html: string, css: string) => {
        previewIframeRef.current?.contentWindow?.postMessage({
            type: 'preview:update',
            content: {
                html,
                css
            }
        }, window.location.origin)
    }, [])

    const compileAndPreview = useCallback(async (nextFiles = filesRef.current) => {
        const ticket = ++compileTicketRef.current
        const html = getFileContent(nextFiles, 'HTML')
        const sourceCSS = getFileContent(nextFiles, 'CSS')
        const classes = extractClassNamesFromHTML(html)

        setCompiling(true)

        try {
            const { compileCSS } = await loadCompiler()
            const result = await compileCSS(sourceCSS, {
                classes,
                from: 'playground.css'
            })
            if (ticket !== compileTicketRef.current) return

            const cssText = result.css
            compiledCSSRef.current = cssText
            setGeneratedCSSText(cssText ? beautifyCSS(cssText) : '')
            setGeneratedCSSSize(formatCSSSize(cssText))
            setCompileWarnings(result.warnings)
            setPreviewErrorEvent(null)
            postPreviewUpdate(html, cssText)
        } catch (error) {
            if (ticket !== compileTicketRef.current) return
            setPreviewErrorEvent({
                type: 'error',
                lineno: 1,
                message: getErrorMessage(error),
                filename: 'index.css',
                datetime: new Date()
            })
        } finally {
            if (ticket === compileTicketRef.current) {
                setCompiling(false)
            }
        }
    }, [postPreviewUpdate])

    const hotUpdatePreviewByFiles = useDebouncedCallback((nextFiles: PlayFile[]) => {
        void compileAndPreview(nextFiles)
    }, 250)

    useEffect(() => {
        void compileAndPreview(filesRef.current)
    }, [compileAndPreview])

    useEffect(() => {
        if (!currentShareId) return
        if (skipNextShareLoadRef.current === currentShareId) {
            skipNextShareLoadRef.current = ''
            return
        }

        let cancelled = false
        void (async () => {
            try {
                const nextFiles = await fetchPlayShare(currentShareId)
                if (cancelled) return
                filesRef.current = nextFiles
                setFiles(nextFiles)
                setBaselineFilesText(stringifyFiles(nextFiles))
                setShareError('')
                void compileAndPreview(nextFiles)
            } catch (error) {
                if (cancelled) return
                setShareError(getErrorMessage(error))
                setPreviewErrorEvent({
                    type: 'error',
                    lineno: 1,
                    message: getErrorMessage(error),
                    filename: 'share',
                    datetime: new Date()
                })
            }
        })()

        return () => {
            cancelled = true
        }
    }, [currentShareId, compileAndPreview])

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== document.location.origin) {
                return
            }
            switch (event.data?.type) {
                case 'previewReady':
                    postPreviewUpdate(getFileContent(filesRef.current, 'HTML'), compiledCSSRef.current)
                    break
                case 'error':
                    setPreviewErrorEvent(event.data)
                    break
            }
        }
        const initialErrorEvent = (window as any).__SANDBOX_INITIAL_ERROR_EVENT
        if (initialErrorEvent) {
            setPreviewErrorEvent(initialErrorEvent)
            delete (window as any).__SANDBOX_INITIAL_ERROR_EVENT
        }
        window.addEventListener('message', onMessage)
        return () => {
            window.removeEventListener('message', onMessage)
        }
    }, [postPreviewUpdate])

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                clearTimeout(copiedTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const onUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            event.returnValue = true
        }
        if (shareable) {
            window.addEventListener('beforeunload', onUnload)
        }
        return () => {
            window.removeEventListener('beforeunload', onUnload)
        }
    }, [shareable])

    const registerShiki = useCallback(async (monaco: Monaco) => {
        monaco.languages.html.htmlDefaults.setOptions(editorHTMLOptions)
        await registerMonacoShiki(monaco)
        setTimeout(() => {
            monaco.editor.setTheme(getTheme())
        })
    }, [getTheme])

    const editorOnMount = useCallback(async (_editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        await registerShiki(monaco)
    }, [registerShiki])

    const updateFileContent = useCallback((fileId: string, content: string) => {
        const nextFiles = filesRef.current.map((file) => file.id === fileId ? { ...file, content } : file)
        filesRef.current = nextFiles
        setFiles(nextFiles)
        setCopied(false)
        setShareError('')
        hotUpdatePreviewByFiles(nextFiles)
    }, [hotUpdatePreviewByFiles])

    const shareCurrentFiles = useCallback(async () => {
        if (sharing) return

        setSharing(true)
        setShareError('')

        try {
            const id = await createPlayShare(filesRef.current)
            const shareURL = getShareURL(id)
            skipNextShareLoadRef.current = id
            setCurrentShareId(id)
            setBaselineFilesText(stringifyFiles(filesRef.current))
            window.history.pushState(null, '', shareURL.pathname + shareURL.search)
            await navigator.clipboard?.writeText(shareURL.toString()).catch(() => undefined)
            setCopied(true)
            if (copiedTimeoutRef.current) {
                clearTimeout(copiedTimeoutRef.current)
            }
            copiedTimeoutRef.current = setTimeout(() => {
                setCopied(false)
            }, 2000)
        } catch (error) {
            setShareError(getErrorMessage(error))
        } finally {
            setSharing(false)
        }
    }, [sharing])

    const responsive = useMemo(() => {
        return preview === 'responsive'
            && tab !== 'Preview'
    }, [tab, preview])

    const tabFile: PlayFile = useMemo(() => {
        switch (tab) {
            case 'Generated CSS':
                return {
                    id: 'GeneratedCSS',
                    title: 'Generated CSS',
                    name: 'master.generated.css',
                    language: 'css',
                    content: generatedCSSText,
                    readOnly: true
                }
            case 'Preview':
                return files[0]
            default:
                return files.find((eachTab) => eachTab.title === tab) || files[0]
        }
    }, [tab, generatedCSSText, files])

    const width = useMemo(() => (!layout || layout === '2') ? '50%' : '100%', [layout])
    const height = useMemo(() => (!layout || layout === '2') ? '100%' : '50%', [layout])
    const previewHTML = useMemo(() => createPreviewHTML(), [])
    const shareButtonTitle = shareError || (copied ? 'Copied share link' : sharing ? 'Sharing ...' : 'Share')

    return (
        <div className="abs flex flex-col full">
            <Header fixed={false}>
                <HeaderContent>
                    <Link href={'/'}>
                        {<app.Logotype width={168} height={20} />}
                    </Link>
                    <div className='app-header-nav rel gap:5 font:medium ml:auto ml:30@md'>
                        v{template.version}
                    </div>
                    {app.navs?.map(({ fullName, Icon, ...eachLink }: any, index) =>
                        <HeaderNav className={clsx('hidden@<md', index === app.navs.length - 1 && 'mr:auto')} key={eachLink.name} {...eachLink}>
                            {$(eachLink.name)}
                        </HeaderNav>
                    )}
                    {(shareable || copied) &&
                        <button className={clsx('hidden@<md', sharing ? 'app-header-nav' : 'app-header-icon')} onClick={shareCurrentFiles} disabled={sharing} aria-label={shareButtonTitle} title={shareButtonTitle}>
                            {copied && !shareable && !sharing
                                ? <CheckIcon className="stroke:accent" />
                                : <ShareIcon className={clsx('stroke:current', sharing && 'opacity:.5', shareError && 'stroke:red')} />
                            }
                            {sharing && <span className="ml:10">{$('Sharing ...')}</span>}
                        </button>}
                    <span className='hidden'>{shareError}</span>
                    {(shareable || copied) && <div className='mx:4x bg:line-light h:1em w:1 hidden@<md'></div>}
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('layout', layout ? '' : '2')}>
                        <svg className={clsx({ 'stroke:accent': !layout || layout === '2' })} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path className={clsx(
                                '~transform|.2s',
                                (!layout || layout === '2') ? 'fill:accent/.15' : 'fill:text-lightest/.2',
                                { 'translate(12,4)': !layout }
                            )} stroke="none" d="M1,0H8A0,0,0,0,1,8,0V16a0,0,0,0,1,0,0H0a0,0,0,0,1,0,0V1A1,1,0,0,1,1,0Z" transform='translate(4 4)' />
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M12 4l0 16"></path>
                        </svg>
                    </button>
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('layout', layout === '3' ? '4' : '3')}>
                        <svg className={clsx({ 'stroke:accent': layout === '3' || layout === '4' }, 'rotate(90)')} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path className={clsx(
                                '~transform|.2s',
                                (layout === '3' || layout === '4') ? 'fill:accent/.15' : 'fill:text-lightest/.2',
                                { 'translate(12,4)': layout === '3' }
                            )} stroke="none" d="M1,0H8A0,0,0,0,1,8,0V16a0,0,0,0,1,0,0H0a0,0,0,0,1,0,0V1A1,1,0,0,1,1,0Z" transform='translate(4 4)' />
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M12 4l0 16"></path>
                        </svg>
                    </button>
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('layout', '5')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={clsx(layout === '5' && 'stroke:accent')} width="22" height="22" strokeWidth="1.2" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M4 9l16 0"></path>
                            <rect className={layout === '5' ? 'fill:accent/.15' : 'fill:text-lightest/.2'} width="16" height="11" stroke='none' transform="translate(4 9)" />
                        </svg>
                    </button>
                    <span className='hidden'>{layout}</span>
                    <div className='mx:4x bg:line-light h:1em w:1 hidden@<md'></div>
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', '')}>
                        <IconDeviceDesktop width="22" height="22" className={clsx(
                            'stroke:1.3',
                            !preview ? 'fill:accent/.15 stroke:accent' : 'fill:text-lightest/.2 stroke:current'
                        )} />
                    </button>
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', 'responsive')}>
                        <IconDeviceMobile width="22" height="22" className={clsx(
                            'stroke:1.3',
                            responsive ? 'fill:accent/.15 stroke:accent' : 'fill:text-lightest/.2 stroke:current'
                        )} />
                    </button>
                    <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', 'css')}>
                        <IconBrandCss3 width="22" height="22" className={clsx(
                            'stroke:1.3',
                            preview === 'css' ? 'fill:accent/.15 stroke:accent' : 'fill:text-lightest/.2 stroke:current'
                        )} />
                    </button>
                    <span className='hidden'>{preview}</span>
                    <div className='mx:4x bg:line-light h:1em w:1 hidden@<md'></div>
                    <LanguageButton className="app-header-icon hidden@<md" />
                    <ThemeButton className="app-header-icon mr:-12 hidden@<md"
                        onChange={(theme: string) => {
                            previewIframeRef.current?.contentWindow?.postMessage({
                                type: 'preview:theme',
                                theme
                            }, window.location.origin)
                        }}
                    />
                    <DocMenuButton className="app-header-icon mr:-12 hidden@md" />
                </HeaderContent>
            </Header >
            <div
                className={clsx(
                    'flex full flex:1 overflow:hidden bg:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin) flex-col!@<sm',
                    {
                        'flex-row': !layout,
                        'flex-row-reverse': layout === '2',
                        'flex-col': layout === '3' || layout === '5',
                        'flex-col-reverse': layout === '4'
                    }
                )}
            >
                <Resizable
                    overlay={false}
                    originX={layout === '2' ? 'right' : 'left'}
                    originY={layout === '3' ? 'top' : 'bottom'}
                    handlerStyle="hidden"
                    showHandler={[layout === '4', !layout, layout === '3', layout === '2']}
                    className={clsx(
                        layout === '5' && 'hidden!@md',
                        {
                            'full!@<md': tab !== 'Preview',
                            'br:1|lighter': !layout,
                            'bl:1|lighter': layout === '2',
                            'bb:1|lighter': layout === '3',
                            'bt:1|lighter': layout === '4'
                        }
                    )}
                    width={tab === 'Preview' ? '' : width}
                    height={tab === 'Preview' ? '' : height}
                    showHeight={true}
                >
                    <Tabs className="flex:0|0|auto" contentClassName="px:5x px:10x@sm">
                        {files.map((file, index) => (
                            <Tab onClick={() => pushShallowURL('tab', index === 0 ? '' : file.title)} size="sm" key={file.id} active={tab === file.title}>
                                {file.title || ''}
                            </Tab>
                        ))}
                        <Tab onClick={() => pushShallowURL('tab', 'Generated CSS')} size="sm" className="hidden@md" active={tab === 'Generated CSS'}>
                            Generated CSS
                        </Tab>
                        <Tab onClick={() => pushShallowURL('tab', 'Preview')} className="hidden@sm" size="sm" active={tab === 'Preview'}>
                            Preview
                        </Tab>
                    </Tabs>
                    <span className='hidden'>{tab}</span>
                    <div className='full min-h:0'>
                        <Editor
                            className={clsx(
                                { 'hidden!': tab === 'Preview' }
                            )}
                            height="100%"
                            width="100%"
                            theme={getTheme()}
                            value={tabFile.content}
                            defaultLanguage={tabFile.language}
                            path={tabFile.id}
                            options={{
                                ...editorOptions,
                                readOnly: tabFile.readOnly
                            }}
                            onMount={editorOnMount}
                            onChange={(value) => {
                                if (!tabFile.readOnly && tabFile.id) {
                                    updateFileContent(tabFile.id, value || '')
                                }
                            }}
                        />
                    </div>
                </Resizable>
                <div className={clsx('rel flex:1|1|auto overflow:hidden bg:canvas', {
                    'flex p:32 jc:center': responsive,
                    'pt:64': responsive && layout !== '3',
                    'pb:64': responsive && layout === '3',
                    'hidden@<md': tab !== 'Preview'
                })}>
                    <Resizable
                        ruleClassName={'abs'}
                        showRuler={responsive && 'always'}
                        rulerPlacement={layout === '3' ? 'bottom' : 'top'}
                        width={responsive ? '490px' : null}
                        height={responsive ? '680px' : null}
                        overlay={false}
                        originX={'center'}
                        showHandler={responsive ? [false, true, true] : false}
                        className={clsx('full outline:1|line-light.resizing', {
                            'outline:1|line-lighter max-h:100% max-w:100%': responsive
                        })}
                        showHeight={true}
                    >
                        <iframe
                            title="Preview"
                            ref={previewIframeRef}
                            className={clsx('demo', { hidden: preview === 'css' })}
                            style={{ width: '100%', height: '100%', borderRadius: 0, margin: 0, padding: 0, border: 0 }}
                            sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-same-origin allow-pointer-lock allow-top-navigation allow-modals"
                            srcDoc={previewHTML}
                            onLoad={() => postPreviewUpdate(getFileContent(filesRef.current, 'HTML'), compiledCSSRef.current)}
                        />
                        <div className={clsx('flex flex-col h:full', { 'hidden!': preview !== 'css' })}>
                            <div className='flex bb:1|lightest flex:0|0|auto px:5x align-items:center font:12 h:48 justify-content:space-between px:10x@sm'>
                                <div>{compiling ? 'Compiling CSS' : 'Generated CSS'}</div>
                                <div className="fg:light">{compileWarnings.length ? `${compileWarnings.length} warnings` : generatedCSSSize}</div>
                            </div>
                            <Editor
                                height="100%"
                                width="100%"
                                theme={getTheme()}
                                value={generatedCSSText}
                                language="css"
                                beforeMount={registerShiki}
                                options={{
                                    ...editorOptions,
                                    readOnly: true
                                }}
                            />
                        </div>
                        {previewErrorEvent &&
                            <div className="abs full inset:0 p:12x fg:red bg:red-5@light bg:red-95@dark">
                                <h2 className="font:20">Error at line {previewErrorEvent.lineno === 1 ? 1 : previewErrorEvent.lineno - 1}</h2>
                                <div className="p:15|20 r:5 my:20 font:14 font:medium bg:black/.2@dark bg:red-90@light white-space:pre-wrap">
                                    {previewErrorEvent.message}
                                </div>
                                <div className="font:12">{previewErrorEvent.datetime.toLocaleTimeString()} {previewErrorEvent.datetime.toDateString()}, {previewErrorEvent.filename}</div>
                            </div>
                        }
                    </Resizable>
                </div>
            </div>
        </div >
    )
}

export interface PlayFile {
    title?: string
    name?: string
    language?: 'html' | 'javascript' | 'css' | 'plaintext'
    content?: string
    id?: string
    readOnly?: boolean
}

interface PlayProps {
    shareId?: string
}

interface PlayErrorEvent {
    type: 'error'
    lineno: number
    message: string
    filename: string
    datetime: Date
}
