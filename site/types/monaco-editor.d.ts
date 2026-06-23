declare module 'monaco-editor' {
    export interface IDisposable {
        dispose(): void
    }

    export namespace editor {
        export interface IModelContentChangedEvent {
            [key: string]: unknown
        }

        export interface IMarker {
            [key: string]: unknown
        }

        export interface IEditorOverrideServices {
            [key: string]: unknown
        }

        export interface ITokenThemeRule {
            token: string
            foreground?: string
            background?: string
            fontStyle?: string
        }

        export interface IStandaloneThemeData {
            base?: string
            inherit?: boolean
            colors: Record<string, string>
            rules: ITokenThemeRule[]
            encodedTokensColors?: string[]
        }

        export interface ITextModel {
            uri: { path: string }
            getValue(): string
            getLanguageId(): string
            getFullModelRange(): unknown
            dispose(): void
        }

        export interface IStandaloneEditorConstructionOptions {
            [key: string]: unknown
        }

        export interface IDiffEditorConstructionOptions {
            [key: string]: unknown
        }

        export interface IStandaloneCodeEditor {
            getModel(): ITextModel | null
            getValue(): string
            setValue(value: string): void
            getOption(option: unknown): unknown
            executeEdits(source: string, edits: unknown[]): void
            pushUndoStop(): void
            updateOptions(options: IStandaloneEditorConstructionOptions): void
            onDidChangeModelContent(listener: (event: IModelContentChangedEvent) => void): IDisposable
            revealLine(line: number): void
            restoreViewState(state: unknown): void
            saveViewState(): unknown
            setModel(model: ITextModel): void
            dispose(): void
        }

        export interface IStandaloneDiffEditor {
            getOriginalEditor(): IStandaloneCodeEditor
            getModifiedEditor(): IStandaloneCodeEditor
            getModel(): { original?: ITextModel, modified?: ITextModel } | null
            setModel(model: { original: ITextModel, modified: ITextModel }): void
            updateOptions(options: IDiffEditorConstructionOptions): void
            dispose(): void
        }

        export const EditorOption: {
            readOnly: unknown
        }

        export function create(element: HTMLElement, options?: IStandaloneEditorConstructionOptions, overrideServices?: IEditorOverrideServices): IStandaloneCodeEditor
        export function createDiffEditor(element: HTMLElement, options?: IDiffEditorConstructionOptions): IStandaloneDiffEditor
        export function createModel(value: string, language?: string, uri?: unknown): ITextModel
        export function getModel(uri: unknown): ITextModel | null
        export function getModels(): ITextModel[]
        export function setModelLanguage(model: ITextModel, languageId: string): void
        export function defineTheme(themeName: string, themeData: IStandaloneThemeData): void
        export function setTheme(themeName: string): void
        export function setModelMarkers(model: ITextModel, owner: string, markers: IMarker[]): void
        export function getModelMarkers(options?: unknown): IMarker[]
        export function onDidChangeMarkers(listener: (uris: { path: string }[]) => void): IDisposable
    }

    export namespace languages {
        export interface ILanguageExtensionPoint {
            id: string
            [key: string]: unknown
        }

        export interface SemanticTokensLegend {
            tokenTypes: string[]
            tokenModifiers: string[]
        }

        export interface DocumentSemanticTokensProvider {
            onDidChange?: (listener: () => void) => IDisposable
            getLegend(): SemanticTokensLegend
            provideDocumentSemanticTokens(model: editor.ITextModel): { data: Uint32Array } | null | undefined
            releaseDocumentSemanticTokens(resultId?: string): void
        }

        export function getLanguages(): ILanguageExtensionPoint[]
        export function register(language: ILanguageExtensionPoint): IDisposable
        export function registerDocumentSemanticTokensProvider(languageId: string, provider: DocumentSemanticTokensProvider): IDisposable

        export namespace html {
            export const htmlDefaults: {
                setOptions(options: unknown): void
            }
        }

        export namespace css {
            export const cssDefaults: {
                options: Record<string, unknown>
                modeConfiguration: Record<string, unknown>
                setOptions(options: Record<string, unknown>): void
                setModeConfiguration(configuration: Record<string, unknown>): void
            }
        }
    }

    export const Uri: {
        parse(value: string): { path: string, toString(): string }
    }
}

declare module 'monaco-editor/esm/vs/editor/editor.api' {
    export * from 'monaco-editor'
}
