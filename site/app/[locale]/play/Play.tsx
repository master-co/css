'use client'

import type { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'
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
import { breakpointVariableValues } from '~/site/utils/breakpoint-variables'
import clsx from 'clsx'
import Link from 'internal/components/Link'
import Editor, { type Monaco } from '@monaco-editor/react'
import DocMenuButton from 'internal/components/DocMenuButton'
import { useTranslation } from 'internal/contexts/i18n'
import HeaderContent from 'internal/components/HeaderContent'
import { useApp } from 'internal/contexts/app'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import {
  createToolingSession,
  type MasterCSSToolingSession
} from '@master/css-tooling'
import { SEMANTIC_TOKENS_LEGEND } from '@master/css-tooling/language'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest
const template = templates[0]

import {
  editorOptions,
  loadCompiler,
  playMonacoThemes,
  preparePlayMonaco,
  refreshMonacoHighlighting,
  registerMonacoShiki,
  scheduleMonacoShikiLanguageRefresh
} from './monaco'
import {
  CheckIcon,
  ShareIcon,
  createPlayShare,
  createPreviewHTML,
  extractClassNamesFromHTML,
  fetchPlayShare,
  formatCSSSize,
  getErrorMessage,
  getFileContent,
  getShareIdFromPathname,
  getShareURL,
  stringifyFiles
} from './play-helpers'
import type { PlayErrorEvent, PlayFile, PlayPreviewContent, PlayProps } from './types'
export type { PlayFile } from './types'

export default function Play({ shareId }: PlayProps = {}) {
  const $ = useTranslation()
  const app = useApp()
  const themeMode = useThemeMode()
  const searchParams = useSearchParams()
  const pathname = useRewritedPathname()
  const pathShareId = useMemo(() => getShareIdFromPathname(pathname), [pathname])
  const previewIframeRef = useRef<HTMLIFrameElement>(null)
  const filesRef = useRef<PlayFile[]>(template.files)
  const compiledPreviewRef = useRef<PlayPreviewContent | null>(null)
  const compiledManifestRef = useRef<MasterCSSManifest>(defaultManifest)
  const compileTicketRef = useRef(0)
  const skipNextShareLoadRef = useRef('')
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const semanticTokenListenersRef = useRef(new Set<() => void>())
  const semanticProviderDisposablesRef = useRef<{ dispose(): void }[]>([])
  const semanticLanguageSessionRef = useRef<MasterCSSToolingSession | undefined>(undefined)
  const semanticLanguageTicketRef = useRef(0)
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
  const getTheme = useCallback(() => themeMode.value === 'dark' ? playMonacoThemes.dark : playMonacoThemes.light, [themeMode.value])

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

  const normalizeURLState = useCallback(() => {
    const validLayouts = new Set(['2', '3', '4', '5'])
    const validPreviews = new Set(['responsive', 'css'])
    const validTabs = new Set([
      ...files.map((file) => file.title).filter(Boolean),
      'Generated CSS',
      'Preview'
    ])
    if (layout && !validLayouts.has(layout)) {
      pushShallowURL('layout', '')
      return
    }
    if (preview && !validPreviews.has(preview)) {
      pushShallowURL('preview', '')
      return
    }
    if (!validTabs.has(tab)) {
      pushShallowURL('tab', '')
      return
    }
    if (window.innerWidth >= breakpointVariableValues.md) {
      if (tab === 'Preview' || tab === 'Generated CSS') {
        pushShallowURL('tab', '')
      }
    } else if (preview) {
      pushShallowURL('preview', '')
    }
  }, [files, layout, preview, pushShallowURL, tab])

  useEffect(() => {
    normalizeURLState()
    window.addEventListener('resize', normalizeURLState, { passive: true })
    return () => {
      window.removeEventListener('resize', normalizeURLState)
    }
  }, [normalizeURLState])

  const postPreviewUpdate = useCallback((html: string, css: string) => {
    previewIframeRef.current?.contentWindow?.postMessage({
      type: 'preview:update',
      content: {
        html,
        css
      }
    }, window.location.origin)
  }, [])

  const postReadyPreviewUpdate = useCallback(() => {
    const compiledPreview = compiledPreviewRef.current
    if (!compiledPreview) return
    postPreviewUpdate(compiledPreview.html, compiledPreview.css)
  }, [postPreviewUpdate])

  const emitSemanticTokenChange = useCallback(() => {
    semanticTokenListenersRef.current.forEach((listener) => listener())
  }, [])

  const replaceSemanticLanguageSession = useCallback(async (manifest: MasterCSSManifest) => {
    const ticket = ++semanticLanguageTicketRef.current
    try {
      const session = await createToolingSession({ manifest })
      if (ticket !== semanticLanguageTicketRef.current) {
        session.dispose()
        return
      }
      semanticLanguageSessionRef.current?.dispose()
      semanticLanguageSessionRef.current = session
      emitSemanticTokenChange()
    } catch {
      if (ticket !== semanticLanguageTicketRef.current) return
      semanticLanguageSessionRef.current?.dispose()
      semanticLanguageSessionRef.current = undefined
      emitSemanticTokenChange()
    }
  }, [emitSemanticTokenChange])

  const compileAndPreview = useCallback(async (nextFiles = filesRef.current) => {
    const ticket = ++compileTicketRef.current
    const html = getFileContent(nextFiles, 'HTML')
    const sourceCSS = getFileContent(nextFiles, 'CSS')
    const classes = extractClassNamesFromHTML(html)

    compiledPreviewRef.current = null
    setCompiling(true)

    try {
      const { compilePlayCSS } = await loadCompiler()
      const result = await compilePlayCSS(sourceCSS, classes)
      if (ticket !== compileTicketRef.current) return

      const cssText = result.css
      const compiledPreview = { html, css: cssText }
      compiledPreviewRef.current = compiledPreview
      compiledManifestRef.current = result.manifest
      void replaceSemanticLanguageSession(result.manifest)
      setGeneratedCSSText(cssText ? beautifyCSS(cssText) : '')
      setGeneratedCSSSize(formatCSSSize(cssText))
      setCompileWarnings(result.warnings)
      setPreviewErrorEvent(null)
      postPreviewUpdate(compiledPreview.html, compiledPreview.css)
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
  }, [postPreviewUpdate, replaceSemanticLanguageSession])

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
          postReadyPreviewUpdate()
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
  }, [postReadyPreviewUpdate])

  useEffect(() => {
    const semanticTokenListeners = semanticTokenListenersRef.current
    const semanticProviderDisposables = semanticProviderDisposablesRef.current
    const semanticLanguageTicket = semanticLanguageTicketRef
    const semanticLanguageSession = semanticLanguageSessionRef
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current)
      }
      semanticProviderDisposables.forEach((disposable) => disposable.dispose())
      semanticProviderDisposables.length = 0
      semanticTokenListeners.clear()
      semanticLanguageTicket.current++
      semanticLanguageSession.current?.dispose()
      semanticLanguageSession.current = undefined
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

  const registerMasterCSSSemanticTokens = useCallback((monaco: Monaco) => {
    if (semanticProviderDisposablesRef.current.length) return

    const provider = {
      onDidChange: (listener: () => void) => {
        semanticTokenListenersRef.current.add(listener)
        return {
          dispose() {
            semanticTokenListenersRef.current.delete(listener)
          }
        }
      },
      getLegend() {
        return SEMANTIC_TOKENS_LEGEND
      },
      provideDocumentSemanticTokens(model: editor.ITextModel) {
        const session = semanticLanguageSessionRef.current
        if (!session) return { data: new Uint32Array() }
        const document = session.analyzeDocument({
          source: model.getValue(),
          languageId: model.getLanguageId()
        })
        return { data: Uint32Array.from(document.semanticTokenData) }
      },
      releaseDocumentSemanticTokens() {
        // Monaco requires this method even when no result ids are used.
      }
    }

    semanticProviderDisposablesRef.current.push(
      monaco.languages.registerDocumentSemanticTokensProvider('html', provider),
      monaco.languages.registerDocumentSemanticTokensProvider('css', provider)
    )
  }, [])

  const registerShiki = useCallback(async (monaco: Monaco) => {
    preparePlayMonaco(monaco)
    const [runtime] = await Promise.all([
      registerMonacoShiki(monaco),
      replaceSemanticLanguageSession(compiledManifestRef.current)
    ])
    registerMasterCSSSemanticTokens(monaco)
    refreshMonacoHighlighting(monaco)
    scheduleMonacoShikiLanguageRefresh(runtime, monaco, getTheme)
    setTimeout(() => {
      monaco.editor.setTheme(getTheme())
    })
  }, [getTheme, registerMasterCSSSemanticTokens, replaceSemanticLanguageSession])

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
          <div className='app-header-nav rel gap:0.313rem ml:auto font:medium ml:1.875rem@md'>
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
                : <ShareIcon className={clsx('stroke:current', sharing && 'opacity:.5', shareError && 'stroke:danger')} />
              }
              {sharing && <span className="ml:0.625rem">{$('Sharing ...')}</span>}
            </button>}
          <span className='hidden'>{shareError}</span>
          {(shareable || copied) && <div className='h:1em w:1px mx:md bg:line-base hidden@<md'></div>}
          <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('layout', layout ? '' : '2')}>
            <svg className={clsx({ 'stroke:accent': !layout || layout === '2' })} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path className={clsx(
                'transition:transform|.2s',
                (!layout || layout === '2') ? 'fill:accent/.15' : 'fill:text-disabled/.2',
                { 'transform:translate(12px,4px)': !layout }
              )} stroke="none" d="M1,0H8A0,0,0,0,1,8,0V16a0,0,0,0,1,0,0H0a0,0,0,0,1,0,0V1A1,1,0,0,1,1,0Z" transform='translate(4 4)' />
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
              <path d="M12 4l0 16"></path>
            </svg>
          </button>
          <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('layout', layout === '3' ? '4' : '3')}>
            <svg className={clsx({ 'stroke:accent': layout === '3' || layout === '4' }, 'rotate:90')} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path className={clsx(
                'transition:transform|.2s',
                (layout === '3' || layout === '4') ? 'fill:accent/.15' : 'fill:text-disabled/.2',
                { 'transform:translate(12px,4px)': layout === '3' }
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
              <rect className={layout === '5' ? 'fill:accent/.15' : 'fill:text-disabled/.2'} width="16" height="11" stroke='none' transform="translate(4 9)" />
            </svg>
          </button>
          <span className='hidden'>{layout}</span>
          <div className='h:1em w:1px mx:md bg:line-base hidden@<md'></div>
          <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', '')}>
            <IconDeviceDesktop width="22" height="22" className={clsx(
              'stroke:1.3',
              !preview ? 'fill:accent/.15 stroke:accent' : 'fill:text-disabled/.2 stroke:current'
            )} />
          </button>
          <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', 'responsive')}>
            <IconDeviceMobile width="22" height="22" className={clsx(
              'stroke:1.3',
              responsive ? 'fill:accent/.15 stroke:accent' : 'fill:text-disabled/.2 stroke:current'
            )} />
          </button>
          <button className="app-header-icon hidden@<md" onClick={() => pushShallowURL('preview', 'css')}>
            <IconBrandCss3 width="22" height="22" className={clsx(
              'stroke:1.3',
              preview === 'css' ? 'fill:accent/.15 stroke:accent' : 'fill:text-disabled/.2 stroke:current'
            )} />
          </button>
          <span className='hidden'>{preview}</span>
          <div className='h:1em w:1px mx:md bg:line-base hidden@<md'></div>
          <LanguageButton className="app-header-icon hidden@<md" />
          <ThemeButton className="app-header-icon mr:-3x hidden@<md"
            onChange={(theme: string) => {
              previewIframeRef.current?.contentWindow?.postMessage({
                type: 'preview:theme',
                theme
              }, window.location.origin)
            }}
          />
          <DocMenuButton className="app-header-icon mr:-3x hidden@md" />
        </HeaderContent>
      </Header >
      <div
        className={clsx(
          'flex overflow:hidden flex:1 full bg:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin) flex-col!@<md',
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
              'br:1px|solid|muted': !layout,
              'bl:1px|solid|muted': layout === '2',
              'bb:1px|solid|muted': layout === '3',
              'bt:1px|solid|muted': layout === '4'
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
              {$('Generated CSS')}
            </Tab>
            <Tab onClick={() => pushShallowURL('tab', 'Preview')} className="hidden@md" size="sm" active={tab === 'Preview'}>
              {$('Preview')}
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
              beforeMount={registerShiki}
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
        <div className={clsx('rel overflow:hidden flex:1|1|auto bg:surface-base', {
          'flex justify-center p:xl': responsive,
          'pt:3xl': responsive && layout !== '3',
          'pb:3xl': responsive && layout === '3',
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
            className={clsx('full outline:1px|solid|base.resizing', {
              'max-size:100% outline:1px|solid|muted': responsive
            })}
            showHeight={true}
          >
            <iframe
              title={$('Preview')}
              ref={previewIframeRef}
              className={clsx('demo', { hidden: preview === 'css' })}
              style={{ width: '100%', height: '100%', borderRadius: 0, margin: 0, padding: 0, border: 0 }}
              sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-same-origin allow-pointer-lock allow-top-navigation allow-modals"
              srcDoc={previewHTML}
              onLoad={postReadyPreviewUpdate}
            />
            <div className={clsx('flex flex-col h:full', { 'hidden!': preview !== 'css' })}>
              <div className='flex flex:0|0|auto items-center justify-between h:48px px:5x bb:1px|solid|subtle font:xs px:10x@sm'>
                <div>{compiling ? $('Compiling CSS') : $('Generated CSS')}</div>
                <div className="text:muted">{compileWarnings.length ? `${compileWarnings.length} ${$('warnings')}` : generatedCSSSize}</div>
              </div>
              <Editor
                height="100%"
                width="100%"
                theme={getTheme()}
                value={generatedCSSText}
                language="css"
                beforeMount={registerShiki}
                onMount={editorOnMount}
                options={{
                  ...editorOptions,
                  readOnly: true
                }}
              />
            </div>
            {previewErrorEvent &&
              <div className="abs inset:0 full p:2xl text:danger bg:red-5@light bg:red-95@dark">
                <h2 className="font:xl">{$('Error at line')} {previewErrorEvent.lineno === 1 ? 1 : previewErrorEvent.lineno - 1}</h2>
                <div className="my:5x p:0.938rem|5x r:5px font:medium font:sm white-space:pre-wrap bg:black/.2@dark bg:red-90@light">
                  {previewErrorEvent.message}
                </div>
                <div className="font:xs">{previewErrorEvent.datetime.toLocaleTimeString()} {previewErrorEvent.datetime.toDateString()}, {previewErrorEvent.filename}</div>
              </div>
            }
          </Resizable>
        </div>
      </div>
    </div >
  )
}
