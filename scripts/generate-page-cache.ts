import cheerio from 'cheerio'
import { initializeApp, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import type { File } from '@google-cloud/storage'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import zlib from 'zlib'
// require() of ES Module C:\Users\bg012\master\websites\i18n.config.mjs not supported
// import i18n from '../../../i18n.config.mjs'

// const defaultLocale = i18n.defaultLocale
const defaultLocale = 'en'
const currentBranch = process.env.GITHUB_REF_NAME

console.log('Generating Page Cache...')

const app = initializeApp({
    credential: cert({
        'type': 'service_account',
        'project_id': 'master-co',
        'private_key_id': process.env.FIREBASE_PRIVATE_KEY_ID,
        'private_key': process.env.FIREBASE_PRIVATE_KEY,
        'client_email': 'firebase-adminsdk-fn76u@master-co.iam.gserviceaccount.com',
        'client_id': '101714252365624583952',
        'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
        'token_uri': 'https://oauth2.googleapis.com/token',
        'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs',
        'client_x509_cert_url': 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fn76u%40master-co.iam.gserviceaccount.com',
        'universe_domain': 'googleapis.com'
    } as any)
})

const TEXT_TAGS = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'li', 'a', 'code', 'mark']
const SELF_CLOSING_TAGS = ['path', 'area', 'base', 'img', 'hr', 'br', 'col', 'embed', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
const BYPASS_TAGS = ['svg']
const commentRegexp = /<!--.*?-->/g
const idRegexp = / id="(.*?)"/

function getBracketContent(source: string, startSymbol = '<', endSymbol = '>') {
    const startIndex = source.indexOf(startSymbol)
    let currentIndex = startIndex
    let curlyBracketCount = 0
    let stringModeSymbol = ''

    for (; currentIndex <= source.length; currentIndex++) {
        const char = source[currentIndex]
        if (char === '\\') {
            currentIndex++
            continue
        }

        if (char === '\'' || char === '"') {
            if (stringModeSymbol) {
                if (stringModeSymbol === char) {
                    stringModeSymbol = ''
                }
            } else {
                stringModeSymbol = char
            }
        } else if (!stringModeSymbol) {
            if (char === startSymbol) {
                curlyBracketCount++
            } else if (char === endSymbol) {
                curlyBracketCount--
                if (!curlyBracketCount) {
                    break
                }
            }
        }
    }

    return source.slice(startIndex, currentIndex + 1)
}

const domain: { name: string, units: Record<string, string> } = { name: `https://${currentBranch === 'main' ? '' : currentBranch + '.'}css.master.co`, units: { docs: 'installation' } }
const storage = getStorage(app)
const locale = process.env.LOCALE ?? 'en'

const bucket = storage.bucket('master-co.appspot.com')
const name = `${currentBranch === 'main' ? '' : currentBranch + '.'}css.master.co-${locale}.br`
const file = bucket.file(name) as any as File

(async () => {
    const sha = process.env.GITHUB_SHA
    console.log('sha: '+ sha)
    console.log('file name: ' + name)
    
    try {
        if (
            (await file.exists())[0]
            && (await bucket.file(name).getMetadata())[0].metadata?.sha === sha
        ) {
            console.log('The page cache is the latest.')
            return
        }
    } catch (err) {
        console.error(err)
        console.error('Failed to check file metadata.')
        return
    }

    const data: Record<string, { title: string, category: string, description: string, nodes: { text: string, id: string }[], disabled: boolean }> = {}
    const nullData: Record<string, boolean> = {}
    const crawle = async (baseUrl: string, crawleUrl: string) => {
        const url = new URL(crawleUrl, baseUrl)
    
        if (
            !(url.pathname in data)
            && !(url.pathname in nullData)
            && url.href.startsWith(baseUrl)
        ) {
            console.log(url.pathname)
            const html = await (await fetch(url.href)).text()
            const $ = cheerio.load(html)
    
            let content = html
            content = content.slice(content.indexOf('<article')).replace(commentRegexp, '')
    
            let i = 0
            const nodes: { text: string, id: string, tag: string }[] = [];
            (function reorganizate(tag, isParentTextTag, isParentBypassTag, bypassHandleTag) {
                const tagContent = getBracketContent(content.slice(i))
                i += tagContent.length
                if (tagContent.endsWith('/>') || SELF_CLOSING_TAGS.includes(tag))
                    return ''
    
                const closedTag = '</' + tag + '>'
                const isBypassTag = isParentBypassTag || BYPASS_TAGS.includes(tag)
                const isTextTag = !isBypassTag && (isParentTextTag || TEXT_TAGS.includes(tag))
    
                let currentData = ''
                let nextTagName = ''
                for (; i < content.length; i++) {
                    const char = content[i]
                    if (nextTagName) {
                        if (char.match(/[a-zA-Z0-9]/)) {
                            nextTagName += char
                        } else {
                            if (nextTagName.length > 1) {
                                i -= nextTagName.length
    
                                const innerData = reorganizate(nextTagName.slice(1), isTextTag, isBypassTag, bypassHandleTag || nextTagName.slice(1) === 'code')
                                if (isTextTag) {
                                    currentData += innerData
                                }
    
                                i--
                            } else {
                                currentData += nextTagName + char
                            }
    
                            nextTagName = ''
                        }
                    } else if (char === '<') {
                        if (content.slice(i, i + closedTag.length) === closedTag) {
                            i += closedTag.length
                            break
                        } else if (bypassHandleTag) {
                            currentData += char
                        } else {
                            nextTagName += char
                        }
                    } else {
                        currentData += char
                    }
                }
    
                if (isTextTag && !isParentTextTag && !bypassHandleTag) {
                    if (currentData) {
                        let id = ''
                        idRegexp.lastIndex = 0
                        const idResult = idRegexp.exec(tagContent)
                        if (idResult) {
                            id = idResult[1]
                        }
    
                        nodes.push({ text: currentData.replace(/&nbsp;/g, ' '), id, tag })
                    }
                    return ''
                } else {
                    return currentData
                }
            })('article', false, false, false)
    
            if (nodes.length) {
                data[url.pathname] = {
                    title: $('title').text().replace(/- Master (CSS|UI|Components|Templates)/, ''),
                    description: /meta name="description" content="(.*?)"/.exec(html)?.[1] ?? '',
                    category: /meta name="category" content="(.*?)"/.exec(html)?.[1] ?? '',
                    nodes,
                    disabled: false
                }
            } else {
                nullData[url.pathname] = true
            }
    
            const hrefs = $('a')
                .map((index, element) => $(element).attr('href'))
                .get()
            for (const eachHref of hrefs) {
                await crawle(baseUrl, eachHref)
            }
        }
    }
    
    const content: Array<typeof data[0] & { url: string }> = []
    const suffix = (locale === defaultLocale) ? '' : ('/' + locale)
    for (const eachUnit in domain.units) {
        await crawle(domain.name + suffix + '/' + eachUnit, eachUnit + '/' + domain.units[eachUnit])

        for (const eachUrl in data) {
            content.push({
                url: eachUrl,
                ...data[eachUrl]
            })
            delete data[eachUrl]
        }
    }
    
    if (content.length) {
        const filePath = path.resolve(process.cwd(), name).replace(/:[0-9]+/, '')
        fs.writeFileSync(filePath, zlib.brotliCompressSync(JSON.stringify(content)), { encoding: 'utf-8' })
    
        await bucket.upload(filePath, { destination: name, contentType: 'application/json', metadata: { contentEncoding: 'br', metadata: { sha } } })
        await bucket.file(name).makePublic()

        console.log('Page Cache Generated')
    } else {
        console.error(`No page cache \`${name}\` is generated.`)
    }
})()