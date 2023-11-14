'use client'

import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'throttle-debounce'
import { snackbar } from 'websites/utils/snackbar'
// import ThemeButton from 'websites/components/ThemeButton'
import dedent from 'ts-dedent'
// import DocHeader from 'websites/layouts/Doc/DocHeader'
import { IconBrandCss3, IconChevronDown, IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react'
import Tabs, { Tab } from 'websites/components/Tabs'
// import { Button } from 'websites/components/App/AppBtn'
import { usePathname, useRouter } from 'next/navigation'
import LanguageButton from 'websites/components/LanguageButton'
import previewHandlerScriptText from './previewHandler.js?text'
import ThemeButton from 'websites/components/ThemeButton'
import { getScriptHTML } from './getScriptHTML'
import { getStyleHTML } from './getStyleHTML'
import { beautifyCSS } from 'websites/utils/beautifyCSS'
import templates from './templates'
import latestMasterCSSVersion from 'websites/version'
import { useSearchParams } from 'next/navigation'
import Resizable from 'websites/components/Resizable'
import { getLinkHTML } from './getLinkHTML'
import { useThemeService } from '@master/css.react'
import cloneDeep from 'clone-deep'
import { Logotype } from '~/components/Logotype'
import Header, { HeaderNav } from 'websites/components/Header'
import links from '~/links.mjs'
import i18n from 'websites/i18n.config.mjs'
import { mediaQueries } from '@master/css'
import config from '~/master.css'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import loader from '@monaco-editor/loader'

const ShareButton = dynamic(() => import('./components/ShareButton'))

// import { Registry } from 'monaco-textmate'
// import { wireTmGrammars } from 'monaco-editor-textmate'

loader.config({
    paths: {
        vs: '/monaco-editor/vs',
    }
})

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
    letterSpacing: -0.1,
    fontSize: 14,
    fontFamily: config.variables.font.family.mono.join(','),
    fontLigatures: true
}

const editorHTMLOptions: any = {
    format: {
        wrapLineLength: 0
    }
}

export default function Play(props: any) {
    const { dict } = props
    const router = useRouter()
    const themeService = useThemeService()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const versionSelectRef = useRef<HTMLSelectElement>(null)
    const monacoProvidersRef = useRef<any>([])
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const previewIframeRef = useRef<HTMLIFrameElement>(null)
    const prevVersionRef = useRef(props.shareItem?.version ?? latestMasterCSSVersion)
    const [layout, _setLayout] = useState<string | null>(searchParams.get('layout'))
    const [preview, _setPreview] = useState<string | null>(searchParams.get('preview'))
    const [shareId, setShareId] = useState(props.shareId ?? '')
    const [sharing, setSharing] = useState(false)
    const [version, setVersion] = useState(props.shareItem?.version ?? latestMasterCSSVersion)
    const [generatedCSSText, setGeneratedCSSText] = useState('')
    const template = useMemo(() => templates.find((eachTemplate) => eachTemplate.version === version), [version])
    const [previewErrorEvent, setPreviewErrorEvent] = useState<any>()
    const shareItem: PlayShare = useMemo(() => {
        if (props.shareItem && props.shareItem.version === version) {
            props.shareItem.files
                .forEach((eachFile: PlayShareFile) => {
                    eachFile.content = (eachFile.content || '').replace(/\\n/g, '\n')
                })
            return props.shareItem
        } else {
            return {
                files: props.shareItem?.files ?? cloneDeep(template?.files),
                dependencies: cloneDeep(template?.dependencies),
                version: latestMasterCSSVersion,
                links: cloneDeep(template?.links)
            }
        }
    }, [props.shareItem, template?.dependencies, template?.files, template?.links, version])

    const navigateWithQueryParams = useCallback((params: Record<string, string | null | undefined>) => {
        const urlSearchParams = new URLSearchParams(location.search)
        for (const eachParamName in params) {
            const eachParamValue = params[eachParamName]
            if (!eachParamValue) {
                urlSearchParams.delete(eachParamName)
            } else {
                urlSearchParams.set(eachParamName, eachParamValue)
            }
        }
        router.push(pathname + '?' + urlSearchParams.toString())
    }, [pathname, router])

    const setLayout = useCallback((layout: string | null) => {
        _setLayout(layout)
        navigateWithQueryParams({ layout })
    }, [navigateWithQueryParams])

    const setPreview = useCallback((preview: string | null) => {
        _setPreview(preview)
        navigateWithQueryParams({ preview })
    }, [navigateWithQueryParams])

    const [currentTabTitle, setCurrentTabTitle] = useState<any>(
        shareItem.files.find(({ title }) => searchParams.get('tab') === title)
            ? searchParams.get('tab')
            : shareItem.files[0].title
    )
    const editorModelRef = useRef<Record<string, editor.IModel | undefined>>({})
    const generateDatabaseShareItem = useCallback((target: any) => ({
        files: target.files,
        dependencies: template?.dependencies,
        version
    }), [template?.dependencies, version])

    const [strignifiedPrevShareItem, setStrignifiedPrevShareItem] = useState(JSON.stringify(generateDatabaseShareItem(shareItem)))
    const [shareable, setShareable] = useState(false)
    const sharePathname = useMemo(() => {
        if (typeof window === 'undefined') {
            return ''
        }
        return `${props.locale === i18n.defaultLocale ? '' : `/${props.locale}`}/play/${shareId}${window.location.search}`
    }, [props.locale, shareId])

    useEffect(() => {
        if (prevVersionRef.current !== version) {
            prevVersionRef.current = version
            setStrignifiedPrevShareItem(JSON.stringify(generateDatabaseShareItem(shareItem)))
            setShareable(false)
        }
    }, [generateDatabaseShareItem, shareItem, version])

    const validateShareable = useCallback(() => {
        const databaseShareItem = generateDatabaseShareItem(shareItem)
        const strignifiedDatabaseShareItem = JSON.stringify(databaseShareItem)
        setShareable(strignifiedDatabaseShareItem !== strignifiedPrevShareItem)
    }, [generateDatabaseShareItem, shareItem, strignifiedPrevShareItem])

    useEffect(() => {
        const urlSearchParams = new URLSearchParams(location.search)
        const queryTab = urlSearchParams.get('tab')
        if ([...shareItem.files.map(({ title }) => title)].includes(queryTab || '')) {
            setCurrentTabTitle(queryTab)
        } else {
            setCurrentTabTitle(shareItem.files[0].title)
        }
    }, [pathname, router, searchParams, shareItem.files])

    /**
     * 避免切換到更大視口時仍停留在僅小視口支援的 Preview 或 Generated CSS 瀏覽模式
     */
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= mediaQueries.md) {
                if (currentTabTitle === 'Preview' || currentTabTitle === 'Generated CSS') {
                    setCurrentTabTitle(shareItem.files[0].title)
                }
            }
        }
        window.addEventListener('resize', onResize, { passive: true })
        return () => {
            window.removeEventListener('resize', onResize)
        }
    }, [currentTabTitle, shareItem.files])

    /**
     * 需避免即時編輯 HTML, Config 或切換 Theme 時更新 previewHTML，否則 Preview 將重載並造成視覺閃爍
     */
    const previewHTML = useMemo(() => {
        let headInnerHTML = ''
        let bodyInnerHTML = ''

        const appendFile = (eachFile: PlayShareFile) => {
            const content = eachFile.content
            if (!content) {
                return
            }
            const eachTemplateFile: any = template?.files.find(({ title }: any) => title === eachFile.title)
            switch (eachTemplateFile?.language) {
                case 'html':
                    bodyInnerHTML += content
                    return
                case 'javascript':
                    // eslint-disable-next-line no-case-declarations
                    let eachScriptHTML = getScriptHTML({ ...eachTemplateFile, text: content })
                    if (eachFile.name === 'master.css.js') {
                        eachScriptHTML = eachScriptHTML
                            .replace(/(export default|export const config =)/, 'window.masterCSSConfig =')
                    }
                    headInnerHTML += eachScriptHTML
                    break
                case 'css':
                    headInnerHTML += getStyleHTML({ ...eachTemplateFile, text: content })
                    break
            }
        }

        shareItem.files
            .filter((eachFile) => eachFile.priority === 'low')
            .filter((eachFile) => appendFile(eachFile))

        shareItem?.links?.forEach((link) => {
            headInnerHTML += getLinkHTML(link)
        })

        shareItem?.dependencies?.styles
            ?.forEach((style) => {
                headInnerHTML += getStyleHTML(style)
            })

        shareItem?.dependencies?.scripts
            ?.forEach((script) => {
                headInnerHTML += getScriptHTML(script)
            })

        shareItem.files
            .filter((eachFile) => eachFile.priority !== 'low')
            .filter((eachFile) => appendFile(eachFile))

        return dedent`<html>
            <head>
                <link rel="stylesheet" href="/fonts/fira-code.css">
                <link rel="stylesheet" href="/fonts/inter.css">
                <script>${previewHandlerScriptText}</script>
                <style>body { font-family: Inter var, Noto Sans TC, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" }</style>
                ${headInnerHTML}
            </head>
            <body>${bodyInnerHTML}</body>
        </html>`
    }, [shareItem?.dependencies?.scripts, shareItem?.dependencies?.styles, shareItem.files, shareItem?.links, template?.files])

    const currentCodeTab: { id: string, language: string, content: string, readOnly: boolean, name: string, title: string } = useMemo(() => {
        switch (currentTabTitle) {
            // mobile
            case 'Generated CSS':
                return {
                    id: 'GeneratedCSS',
                    title: 'Generated CSS',
                    name: 'master.css',
                    language: 'css',
                    content: generatedCSSText,
                    readOnly: true
                }
            // mobile
            case 'Preview':
                return shareItem.files[0]
            default:
                return shareItem.files.find((eachTab: any) => eachTab.title === currentTabTitle) as any
        }
    }, [currentTabTitle, generatedCSSText, shareItem.files])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const hotUpdatePreviewByFile = useCallback(debounce(250, () => {
        if (editorRef.current) {
            currentCodeTab.content = editorRef.current?.getValue()
            validateShareable()
        }

        previewIframeRef?.current?.contentWindow?.postMessage({
            id: currentCodeTab.id,
            language: currentCodeTab.language,
            name: currentCodeTab.name,
            title: currentCodeTab.title,
            content: currentCodeTab.content
        }, window.location.origin)

        setTimeout(() => {
            setPreviewErrorEvent(null)
        })
    }), [currentCodeTab, validateShareable])

    const editorOnChange = useCallback(() => {
        hotUpdatePreviewByFile()
    }, [hotUpdatePreviewByFile])

    /**
     * 手動更新 editor value，不要使用 value={currentCodeTab.value}
     */
    useEffect(() => {
        if (currentTabTitle !== 'Preview' && editorRef.current && monacoRef.current) {
            const content = currentTabTitle === 'Generated CSS' ? generatedCSSText : currentCodeTab.content
            let currentEditorModel: any = editorModelRef.current?.[currentCodeTab.id]
            if (currentEditorModel) {
                if (currentEditorModel.getValue() !== content) {
                    currentEditorModel.setValue(content)
                }
            } else {
                currentEditorModel
                    = editorModelRef.current[currentCodeTab.id]
                    = monacoRef.current?.editor.createModel(content, currentCodeTab.language) as editor.ITextModel
            }

            if (editorRef.current.getValue() !== content) {
                editorRef.current.setModel(currentEditorModel)
            }

            /* 取消因上文觸發 hotUpdatePreviewByFile() */
            hotUpdatePreviewByFile.cancel({ upcomingOnly: true })
        }
    }, [currentCodeTab, currentTabTitle, generatedCSSText, hotUpdatePreviewByFile, shareItem.files])

    // dispose monaco providers
    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            monacoProvidersRef.current.forEach((provider: any) => {
                provider.dispose()
            })
            editorRef.current?.dispose()

        }
    }, [])

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            const { type, content } = event.data
            if (event.origin !== document.location.origin) {
                return
            }
            switch (type) {
                case 'cssUpdate':
                    // eslint-disable-next-line no-case-declarations
                    const cssText = content ? beautifyCSS(content) : ''
                    setGeneratedCSSText(cssText)
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
    }, [shareable])

    useEffect(() => {
        const onUnload = (event: any) => {
            event.preventDefault()
            event.returnValue = true
        }
        if (shareable) {
            window.addEventListener('beforeunload', onUnload)
        } else {
            window.removeEventListener('beforeunload', onUnload)
        }
        return () => {
            window.removeEventListener('beforeunload', onUnload)
        }
    }, [shareable])

    const copyShareLink = useCallback(async (newSharePathname?: string) => {
        snackbar('Share link copied!')
        await navigator.clipboard.writeText(window.location.origin + (newSharePathname || sharePathname))
    }, [sharePathname])

    const share = useCallback(async (writeShareItem: any) => {
        if (!shareable) {
            return
        }
        setSharing(true)
        const databaseShareItem = generateDatabaseShareItem(shareItem)
        const newShareId = await writeShareItem(databaseShareItem)
        const newSharePathname = `${props.locale === i18n.defaultLocale ? '' : `/${props.locale}`}/play/${newShareId}${window.location.search}`
        setShareId(newShareId)
        setStrignifiedPrevShareItem(JSON.stringify(databaseShareItem))
        setShareable(false)
        setSharing(false)
        copyShareLink(newSharePathname)
        router.push(newSharePathname)
    }, [copyShareLink, generateDatabaseShareItem, props.locale, router, shareItem, shareable])

    const responsive = useMemo(() => {
        return preview === 'responsive'
            // 避免在 @<md 時觸發響應式預覽
            && currentTabTitle !== 'Preview'
    }, [currentTabTitle, preview])

    // change version
    const onVersionSelectChange = (event: any) => {
        if (shareable) {
            if (!window.confirm('Are you sure you want to discard the current changes?') ?? '') {
                event.preventDefault()
                return
            }
        }
        setVersion(event.target.value)
    }

    const editorOnMount = async (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
        // TODO: 須確認是否可由 @monaco-editor/react 的相關 API 改寫，不要用 monaco-editor
        const { languages } = await import('monaco-editor')
        editorRef.current = editor
        monacoRef.current = monaco

        languages.html.htmlDefaults.setOptions(editorHTMLOptions)

        // const {
        //     CompletionItemProvider,
        //     ColorPresentationProvider,
        //     DocumentColorsProvider,
        //     HoverItemProvider
        // } = await import('./master-css-monaco')

        // monacoProvidersRef.current.push(languages.registerCompletionItemProvider('html', {
        //     provideCompletionItems: function (model, position) {
        //         return CompletionItemProvider(model, position, 'html')
        //     },
        //     triggerCharacters: [':', '@', '~'],
        // }))

        // monacoProvidersRef.current.push(languages.registerCompletionItemProvider('javascript', {
        //     provideCompletionItems: function (model, position) {
        //         return CompletionItemProvider(model, position, 'javascript')
        //     },
        //     triggerCharacters: [':', '@', '~'],
        // }))

        // monacoProvidersRef.current.push(languages.registerHoverProvider('html', {
        //     provideHover: function (model, position) {
        //         var result = HoverItemProvider(position, model)
        //         if (result != null) {
        //             return result
        //         }
        //     },
        // }))

        // monacoProvidersRef.current.push(languages.registerColorProvider('html', {
        //     provideColorPresentations(model, colorInfo) {
        //         return ColorPresentationProvider(model, colorInfo)
        //     },

        //     provideDocumentColors(model, token) {
        //         return DocumentColorsProvider(model)
        //     },
        // }))

        // monacoProvidersRef.current.push(languages.registerColorProvider('javascript', {
        //     provideColorPresentations(model, colorInfo) {
        //         return ColorPresentationProvider(model, colorInfo)
        //     },

        //     provideDocumentColors(model, token) {
        //         return DocumentColorsProvider(model)
        //     },
        // }))

        // languages.register({ id: 'master-css' })
        // languages.register({ id: 'master-css-injection-class' })

        // const registry = new Registry({
        //     getGrammarDefinition: async (scopeName) => {
        //         switch (scopeName) {
        //             case 'source.master-css':
        //                 return {
        //                     format: 'json',
        //                     content: await (await fetch('/tmLanguage/master-css.tmLanguage.json')).text(),
        //                 }
        //             case 'source.master-css.injection-class':
        //                 return {
        //                     format: 'json',
        //                     content: await (await fetch('/tmLanguage/master-css.injection-class.tmLanguage.json')).text(),
        //                 }
        //             case 'source.master-css.injection-js':
        //                 return {
        //                     format: 'json',
        //                     content: await (await fetch('/tmLanguage/master-css.injection-js.tmLanguage.json')).text(),
        //                 }
        //             case 'source.master-css.injection-string':
        //                 return {
        //                     format: 'json',
        //                     content: await (await fetch('/tmLanguage/master-css.injection-string.tmLanguage.json')).text(),
        //                 }
        //             default:
        //                 return null
        //         }
        //     },
        //     getInjections(scopeName: ScopeName): string[] | undefined {
        //         switch (scopeName) {
        //             case 'source.master-css.injection-class':
        //                 return [
        //                     "source",
        //                     "text"
        //                 ]
        //             case 'source.master-css.injection-js':
        //                 return [
        //                     "source.js",
        //                     "source.ts"
        //                 ]
        //             case 'source.master-css.injection-string':
        //                 return [
        //                     "source.js",
        //                     "source.ts"
        //                 ]
        //             default:
        //                 return undefined
        //         }
        //         const grammar = grammars[scopeName];
        //         return grammar ? grammar.injections : undefined;
        //     },
        // })
        // const grammars = new Map()
        // grammars.set('master-css', 'source.master-css')
        // await wireTmGrammars(monaco, registry, grammars, editor)
        // const grammar = await registry.loadGrammar(languages.get(languageId))

        // languages.setTokensProvider(languageId, {
        //     getInitialState: () => new TokenizerState(INITIAL),
        //     tokenize: (line: string, state: TokenizerState) => {
        //         const res = grammar.tokenizeLine(line, state.ruleStack)
        //         return {
        //             endState: new TokenizerState(res.ruleStack),
        //             tokens: res.tokens.map(token => ({
        //                 ...token,
        //                 // TODO: At the moment, monaco-editor doesn't seem to accept array of scopes
        //                 scopes: editor ? TMToMonacoToken(editor, token.scopes) : token.scopes[token.scopes.length - 1]
        //             })),
        //         }
        //     }
        // })

        previewIframeRef?.current?.contentWindow?.postMessage({ type: 'editorReady' }, window.location.origin)
    }

    const width = useMemo(() => (!layout || layout === '2') ? '50%' : '100%', [layout])
    const height = useMemo(() => (!layout || layout === '2') ? '100%' : '50%', [layout])
    return (
        <div className="abs flex full flex:col">
            <Header fixed={false} Logotype={Logotype}>
                <label className='app-header-nav rel gap:5 ml:30'>
                    v{version}
                    <select ref={versionSelectRef} name="version" defaultValue={version}
                        className="abs full cursor:pointer inset:0 opacity:0"
                        onChange={onVersionSelectChange}>
                        {templates.map(({ version: eachVersion }) => (
                            <option value={eachVersion} key={eachVersion}>v{eachVersion}</option>
                        ))}
                        {
                            shareItem?.version && !templates.find((eachTemplate) => eachTemplate.version === version)
                            && <option value={shareItem.version} disabled>
                                v{shareItem?.version}
                            </option>
                        }
                    </select>
                    <IconChevronDown className="1emx1em mr:-3 stroke:1.3" />
                </label>
                {links?.map((eachLink: any) => <HeaderNav key={eachLink.name} {...eachLink} onClick={(event: any) => {
                    if (shareable) {
                        if (!window.confirm('Are you sure to go to another page and discard current changes?')) {
                            event.preventDefault()
                            return
                        }
                    }
                }}>{dict[eachLink.name] || eachLink.name}</HeaderNav>)}
                <div className="flex align-items:center ml:auto mr:-12">
                    {(shareId && !shareable) && <button className="app-header-icon hide@<md mx:12" onClick={() => copyShareLink()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M9 15l6 -6"></path>
                            <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"></path>
                            <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"></path>
                        </svg>
                        <span className="font:12 ls:0 ml:10">
                            {shareId}
                        </span>
                    </button>}
                    {/* share button */}
                    {shareable && <ShareButton className={clsx('hide@<md', sharing ? 'app-header-nav' : 'app-header-icon')} disabled={sharing} onClick={share}>
                        {sharing && <span className="ml:10">
                            {dict['Sharing ...']}
                        </span>}
                    </ShareButton>}
                    {(shareId || shareable) && <div className='hide@<md bg:white/.1@dark bg:slate-90@light h:1em mx:15 w:1'></div>}
                    <button className="app-header-icon hide@<md" onClick={() => (setLayout(layout ? null : '2'))}>
                        <svg className={clsx({ 'stroke:accent': !layout || layout === '2' })} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path className={clsx(
                                '~transform|.2s',
                                (!layout || layout === '2') ? 'fill:accent/.15' : 'fill:dim/.2',
                                { 'translate(12,4)': !layout }
                            )} stroke="none" d="M1,0H8A0,0,0,0,1,8,0V16a0,0,0,0,1,0,0H0a0,0,0,0,1,0,0V1A1,1,0,0,1,1,0Z" transform='translate(4 4)' />
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M12 4l0 16"></path>
                        </svg>
                    </button>
                    <button className="app-header-icon hide@<md" onClick={(event) => (setLayout(layout === '3' ? '4' : '3'))}>
                        <svg className={clsx({ 'stroke:accent': layout === '3' || layout === '4' }, 'rotate(90)')} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path className={clsx(
                                '~transform|.2s',
                                (layout === '3' || layout === '4') ? 'fill:accent/.15' : 'fill:dim/.2',
                                { 'translate(12,4)': layout === '3' }
                            )} stroke="none" d="M1,0H8A0,0,0,0,1,8,0V16a0,0,0,0,1,0,0H0a0,0,0,0,1,0,0V1A1,1,0,0,1,1,0Z" transform='translate(4 4)' />
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M12 4l0 16"></path>
                        </svg>
                    </button>
                    <button className="app-header-icon hide@<md" onClick={(event) => setLayout('5')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={clsx(layout === '5' && 'stroke:accent')} width="22" height="22" strokeWidth="1.2" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                            <path d="M4 9l16 0"></path>
                            <rect className={layout === '5' ? 'fill:accent/.15' : 'fill:dim/.2'} width="16" height="11" stroke='none' transform="translate(4 9)" />
                        </svg>
                    </button>
                    <div className='hide@<md bg:white/.1@dark bg:slate-90@light h:1em mx:15 w:1'></div>
                    {/* preview: desktop */}
                    <button className="app-header-icon hide@<md" onClick={(event) => setPreview('')}>
                        <IconDeviceDesktop width="22" height="22" className={clsx(
                            'stroke:1.3 stroke:current',
                            !preview ? 'fill:accent/.15 stroke:accent' : 'fill:dim/.2'
                        )} />
                    </button>
                    {/* preview: responsive */}
                    <button className="app-header-icon hide@<md" onClick={(event) => setPreview('responsive')}>
                        <IconDeviceMobile width="22" height="22" className={clsx(
                            'stroke:1.3 stroke:current',
                            responsive ? 'fill:accent/.15 stroke:accent' : 'fill:dim/.2'
                        )} />
                    </button>
                    {/* preview: css */}
                    <button className="app-header-icon hide@<md" onClick={(event) => setPreview('css')}>
                        <IconBrandCss3 width="22" height="22" className={clsx(
                            'stroke:1.3 stroke:current',
                            preview === 'css' ? 'fill:accent/.15 stroke:accent' : 'fill:dim/.2'
                        )} />
                    </button>
                    <div className='hide@<md bg:white/.1@dark bg:slate-90@light h:1em mx:15 w:1'></div>
                    <LanguageButton className="app-header-icon" locale={props.locale} />
                    <ThemeButton className="app-header-icon"
                        onChange={(theme: string) => {
                            previewIframeRef?.current?.contentWindow?.postMessage({
                                theme
                            }, window.location.origin)
                        }}
                    />
                </div>
            </Header >
            <div
                className={clsx(
                    'flex full bg:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin) flex:1 flex:col!@<sm overflow:hidden',
                    {
                        'flex:row': !layout,
                        'flex:row-reverse': layout === '2',
                        'flex:col': layout === '3' || layout === '5',
                        'flex:col-reverse': layout === '4'
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
                        layout === '5' && 'hide!@md',
                        {
                            'full!@<md': currentTabTitle !== 'Preview',
                            'br:1|divider': !layout,
                            'bl:1|divider': layout === '2',
                            'bb:1|divider': layout === '3',
                            'bt:1|divider': layout === '4'
                        }
                    )}
                    width={currentTabTitle === 'Preview' ? '' : width}
                    height={currentTabTitle === 'Preview' ? '' : height}
                    showHeight={true}
                >
                    <Tabs className="flex:0|0|auto" contentClassName="px:30">
                        {shareItem.files.map((file, index) => (
                            <Tab size="sm" active={currentTabTitle === file.title} key={file.id} onClick={() => {
                                navigateWithQueryParams({ tab: index === 0 ? '' : file.title })
                                // 不可僅依賴 router push 進行切換
                                setCurrentTabTitle(file.title)
                            }}>
                                {file.title || ''}
                            </Tab>
                        ))}
                        {/* mobile couldn't support tab active */}
                        <Tab size="sm" className="hide@md" active={currentTabTitle === 'Generated CSS'} onClick={() => {
                            // 不可依賴 router push 進行切換
                            setCurrentTabTitle('Generated CSS')
                        }
                        }>
                            Generated CSS
                        </Tab>
                        <Tab className="hide@sm" size="sm" active={currentTabTitle === 'Preview'} onClick={() => {
                            // 不可依賴 router push 進行切換
                            setCurrentTabTitle('Preview')
                        }}>
                            Preview
                        </Tab>
                    </Tabs>
                    <div className='full min-h:0'>
                        <Editor
                            className={clsx(
                                { 'hide!': currentTabTitle === 'Preview' }
                            )}
                            height="100%"
                            width="100%"
                            theme={'vs-' + themeService?.current}
                            defaultValue={currentCodeTab.content}
                            defaultLanguage={currentCodeTab.language}
                            language={currentCodeTab.language}
                            path={currentTabTitle}
                            options={{
                                ...editorOptions,
                                readOnly: currentCodeTab.readOnly
                            }}
                            onMount={editorOnMount}
                            onChange={editorOnChange}
                        />
                    </div>
                </Resizable>
                <div className={clsx('rel bg:gray-10@dark bg:slate-95@light flex:1|1|auto overflow:hidden', {
                    'flex jc:center p:32': responsive,
                    'pt:64': responsive && layout !== '3',
                    'pb:64': responsive && layout === '3',
                    'hide@<md': currentTabTitle !== 'Preview'
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
                        className={clsx(
                            'full',
                            {
                                'max-w:100% max-h:100% outline:1|divider': responsive
                            }
                        )}
                        showHeight={true}
                    >
                        <iframe ref={previewIframeRef}
                            className={clsx('demo', { hide: preview === 'css' })}
                            style={{ width: '100%', height: '100%', borderRadius: 0, margin: 0, padding: 0, border: 0 }}
                            sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-same-origin allow-pointer-lock allow-top-navigation allow-modals"
                            srcDoc={previewHTML}
                        />
                        <Editor
                            wrapperProps={{ className: clsx({ 'hide!': preview !== 'css' }) }}
                            height="100%"
                            width="100%"
                            theme={'vs-' + themeService?.current}
                            defaultValue={generatedCSSText}
                            value={generatedCSSText}
                            language="css"
                            options={{
                                ...editorOptions,
                                readOnly: true
                            }}
                        />
                        {previewErrorEvent &&
                            <div className="abs full bg:red-10@dark bg:red-95@light fg:red-75@dark fg:red@light inset:0 p:50">
                                <h2 className="font:20">Error at line {previewErrorEvent.lineno === 1 ? 1 : previewErrorEvent.lineno - 1}</h2>
                                <div className="bg:black/.2@dark bg:red-90@light font:14 font:medium my:20 p:15|20 r:5">
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

export interface PlayShare {
    files: PlayShareFile[]
    dependencies: PlayShareDependencies
    version: string
    links: string[]
}

export interface PlayShareFile {
    title?: string
    name?: string
    language?: 'html' | 'javascript' | 'css' | 'plaintext'
    path?: string
    content?: string
    priority?: 'low'
    id?: string
}

export interface PlayShareDependencies {
    styles: any[]
    scripts: any[]
}
