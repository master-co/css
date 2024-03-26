import type { IPropertyData, IValueData, MarkupContent } from 'vscode-css-languageservice'
import beautifyCSS from './beautify-css'

export function getCSSDataDocumentation(data?: IPropertyData | IValueData, additionalData?: any): MarkupContent | undefined {
    if (!data) return
    let value = ''
    if (data.status) {
        value += getEntryStatus(data.status)
    }

    if (additionalData?.generatedCSS) {
        value += '```css\n' + beautifyCSS(additionalData.generatedCSS) + '\n```\n\n'
    }

    if (data.description)
        if (typeof data.description === 'string') {
            value += textToMarkedString(data.description)
        } else {
            value += data.description.kind === 'markdown' ? data.description.value : textToMarkedString(data.description.value)
        }

    const browserLabel = getBrowserLabel(data.browsers)
    if (browserLabel) {
        value += '\n\n(' + textToMarkedString(browserLabel) + ')'
    }
    if ('syntax' in data && data.syntax) {
        value += `\n\nSyntax: ${textToMarkedString(data.syntax)}`
    }
    if (data.references && data.references.length > 0) {
        if (value.length > 0) {
            value += '\n\nReference: '
        }
        value += data.references.map((r: any) => {
            return `[${r.name.replace(' Reference', '')}](${r.url})`
        }).join(' | ')
    }
    return value ? {
        kind: 'markdown',
        value
    } : undefined
}

const browserNames = {
    E: 'Edge',
    FF: 'Firefox',
    S: 'Safari',
    C: 'Chrome',
    IE: 'IE',
    O: 'Opera'
}
function getEntryStatus(status: string) {
    switch (status) {
        case 'experimental':
            return '⚠️ Property is experimental. Be cautious when using it.️\n\n'
        case 'nonstandard':
            return '🚨️ Property is nonstandard. Avoid using it.\n\n'
        case 'obsolete':
            return '🚨️️️ Property is obsolete. Avoid using it.\n\n'
        default:
            return ''
    }
}

function textToMarkedString(text: string) {
    text = text.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&') // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function getBrowserLabel(browsers: string[] = []): string | null {
    if (browsers.length === 0) {
        return null
    }

    return browsers
        .map(b => {
            let value = ''
            const matches = b.match(/([A-Z]+)(\d+)?/) ?? ''

            const name = matches[1]
            const version = matches[2]

            if (name in browserNames) {
                value += browserNames[name as keyof typeof browserNames]
            }
            if (version) {
                value += ' ' + version
            }
            return value
        })
        .join(', ')
}