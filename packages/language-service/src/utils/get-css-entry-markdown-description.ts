import type { IPropertyData, IValueData } from 'vscode-css-languageservice'

export function getCssEntryMarkdownDescription(data: IPropertyData | IValueData): string {
    if (!data.description || data.description === '') {
        return ''
    }

    let result = ''
    if (data.status) {
        result += getEntryStatus(data.status)
    }

    if (typeof data.description === 'string') {
        result += textToMarkedString(data.description)
    } else {
        result += data.description.kind === 'markdown' ? data.description.value : textToMarkedString(data.description.value)
    }

    const browserLabel = getBrowserLabel(data.browsers)
    if (browserLabel) {
        result += '\n\n(' + textToMarkedString(browserLabel) + ')'
    }
    if ('syntax' in data && data.syntax) {
        result += `\n\nSyntax: ${textToMarkedString(data.syntax)}`
    }
    if (data.references && data.references.length > 0) {
        if (result.length > 0) {
            result += '\n\nReference: '
        }
        result += data.references.map((r: any) => {
            return `[${r.name.replace(' Reference', '')}](${r.url})`
        }).join(' | ')
    }

    return result
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
            let result = ''
            const matches = b.match(/([A-Z]+)(\d+)?/) ?? ''

            const name = matches[1]
            const version = matches[2]

            if (name in browserNames) {
                result += browserNames[name as keyof typeof browserNames]
            }
            if (version) {
                result += ' ' + version
            }
            return result
        })
        .join(', ')
}