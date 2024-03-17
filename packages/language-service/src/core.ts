import { MasterCSS } from '@master/css'
import EventEmitter from 'node:events'
import exploreConfig from 'explore-config'
import type { TextDocument } from 'vscode-languageserver-textdocument'
import settings, { type Settings } from './settings'
import { minimatch } from 'minimatch'
import { instancePattern } from './utils/regex'
import { fileURLToPath } from 'node:url'
import getSyntaxHover from './functions/get-syntax-hover'
import getSyntaxCompletionItems from './functions/get-syntax-completion-items'
import getSyntaxColorInfo from './functions/get-syntax-color-info'
import getSyntaxColorPresentation from './functions/get-syntax-color-presentations'

export default class MasterCSSLanguageService extends EventEmitter {
    css: MasterCSS
    settings: Settings

    constructor(
        public customSettings: Settings,
        public cwd: string
    ) {
        super()
        this.settings = Object.assign({}, settings, customSettings)
        if (settings) {
            console.log(`settings:`, this.settings)
        }
        this.css = new MasterCSS(this.exploreConfig())
    }

    exploreConfig(configName = this.settings.config || 'master.css') {
        try {
            return exploreConfig(configName, {
                cwd: this.cwd,
                found: (basename) => console.log(`Loaded ${basename}`)
            })
        } catch (e) {
            console.log('Config loading failed')
            console.error(e)
            console.log('Using default config')
        }
    }

    onHover = getSyntaxHover
    onCompletion = getSyntaxCompletionItems
    onDocumentColor = getSyntaxColorInfo
    onColorPresentation = getSyntaxColorPresentation

    getPosition(text: string, positionIndex: number, startIndex: number, patterns?: string[]): {
        index: { start: number, end: number },
        instanceContent: string
    } | undefined {
        let result
        let instanceMatch: RegExpExecArray | null
        let classMatch: RegExpExecArray | null
        if (!patterns) patterns = this.settings.classMatch
        if (!patterns) return
        for (const classRegexString of patterns) {
            const classPattern = new RegExp(classRegexString, 'g')
            while ((classMatch = classPattern.exec(text)) !== null) {

                if ((classMatch.index <= (positionIndex - startIndex) && classMatch.index + classMatch[0].length >= (positionIndex - startIndex)) == true) {

                    const classContentStartIndex = classMatch.index + classMatch[1].length
                    instancePattern.lastIndex = 0
                    while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                        const instanceStartIndex = classContentStartIndex + instanceMatch.index
                        const instanceEndIndex = classContentStartIndex + instanceMatch.index + instanceMatch[0].length

                        if (instanceStartIndex <= (positionIndex - startIndex) && instanceEndIndex >= (positionIndex - startIndex)) {
                            result = {
                                index: {
                                    start: instanceStartIndex,
                                    end: instanceEndIndex
                                },
                                instanceContent: instanceMatch[0]
                            }
                            return result
                        }
                    }
                }
                else if (classMatch.index > (positionIndex - startIndex)) {
                    break
                }
            }
        }
        return
    }

    isDocAllowed(doc: TextDocument): boolean {
        if (!this.settings.exclude) return true
        for (const exclude of this.settings.exclude) {
            if (minimatch(fileURLToPath(doc.uri), exclude)) {
                return false
            }
        }
        return true
    }
}