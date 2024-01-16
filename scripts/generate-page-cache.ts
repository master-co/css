import cheerio from 'cheerio'
import { initializeApp, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import type { File } from '@google-cloud/storage'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import zlib from 'zlib'
import githubToken from 'websites/tokens/github'
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
        'private_key_id': '08f827cdcaac4f21382b3c094f8163ba252969f8',
        'private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDgO2+z7PqU/Mz+\nHkw4h3iFbq0YRO8tdAJ6z97yoKyCAEVVHOsH1+MOYK1IZS7ogLqEfMhju1F/dqTP\nB7aR6F/0YoM69csfKR6ly1Wt8aPNESVtkZJpwMEX36c5uBfnPRE0IUu5VhBLVbRG\nNK0B2Rk72dnR2H/rh7uVe9ZB+06vzA5ysmPsvuW723vU23dM3C9Rs3eYY7XjV4gZ\npb+iAmfgZz82beHGUor4TPC5BKLt87vI2cWLOrsaU8AYfBHZqvllYzUGaTtUEgHD\nIGJcW67F9IpFVOd2IXBZf52eWWuHu6axRqadOrzr0/JgJvcjj2bUMLM1RESC1Wbx\nYvymoyXDAgMBAAECggEABGGU6qaQNNYFqVdtNNOMysqhTi6Wn8Q7AixKlmIGTNn1\ngNa6TuJseMzxxc7YTkmpm0oW3j/8NSnbyYHEkvA/47YDC2VfDSJQC3xAFdB5W1ng\n6dWkzzUpcK55hXqv2OBMFEEsShhA5D/t8Es6MCWORSmaBGwe/7qcsyyCwLJI1M12\nAUpnhNPkr39ecubleSIC7VVk3+gdaX5hoPPyQX/+HiDYWZZUY77kov6BFQgI1FOL\nQQQMqkENsdfKaX6vMAQl2h9Yc+RAv6MlymOxx7fvUeHlo4LvyZJxhQPNNynmRisO\n5dZ9X5VRq+N3DsGwr2A8HWWgQSIOJfNbXe4/w25raQKBgQD7MKlcfKGgy355YiKl\nwL4KUo+N6z6Xh0KhdC+ZFdPavz/wNfm1o/WMAUtAADnLCKVPHkYNB5dc/Up/YUUV\nmVdpNAr/rwg6SzemY0bngS2VsOlYCs0HfDFXTHDmkpSSsvegOpDtEhefmElcF6Ey\nRCZ99ZkfnHR1rFWOnq+5RTbDyQKBgQDkhqBodCFdc4BOdtnuOvPZW3CkJLNMnrJq\nOmNqiCI7iYUtIOe7XPvbgFMkq1/QIGiZIxG8QIVKJFYSYG3tar4l4VYYGvYeJSmj\n8EvNJDVjMJbv+QqQZ9lJ1x1DZeklMBBIQkC6bbXOame2IGN+fKoWBodArXEWtWlK\nUi1gbuGrKwKBgAjlW0okO9EnA86mtBVssw5IiD79ctUI/EodhEYGqN8ZYNlQAAz3\nxo1zykd0+pb/MmOP7ekuOKUZb1b9ieXO7XKTXkRZ3Y+69DiXUX6Ha6beghUVJNe8\nBT9TPLhdvpdHcU+iY1mSB3YmfYqeZ54RHc/eL9MXxmQYe1s2sYB9PAhJAoGAewYi\nurix8Y4pZ5RCFCb2eW/pfuQnBjt0zw0p0gMBcs3AvR+2wL349BzsJZSAmxmnVbF0\nbcTKPLS9BV2WMDbDsL7TS1zQXEAjX5cQJ5qzhvd0ejG2xzCw4DiHD26Aib2LNms8\nT2CafEn6FSjwhvpz0jGnhGEavV/iE9mThhOLN0sCgYEAqH4JBdSP549w0qvvdm4l\nYNAKgV/p8gDb+LHSNepnyyYuesLNO+19/O++7f9/PjNo+N3qgc950VwrQ5qdlRx8\nvsMK6ASHi+ed2Nc6EGClBRNdrvUTWPxPZX+Cpxbmn0h4p64AnBYUx3SiQOfQAhHI\nqvLzmoTV5eKy7goBIwYllLs=\n-----END PRIVATE KEY-----\n',
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
    let sha = ''

    try {
        const result = await fetch(
            `https://api.github.com/repos/master-co/css/commits/${currentBranch}`,
            {
                headers: { Authorization: 'Bearer ' + githubToken }
            })
        if (result.status === 200) {
            const json = await result.json();
            sha = json.sha
        }
    } catch (err) {
        console.error(err)
    }
    if (!sha) {
        console.error('Failed to get latest commit.')
        return
    }
    console.log('sha: '+ sha)
    
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
    console.log('file name: ' + name);

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