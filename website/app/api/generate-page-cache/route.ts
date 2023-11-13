import * as cheerio from 'cheerio'
import app from 'websites/firebase-admin-app'
import { getStorage } from 'firebase-admin/storage'
import path from 'path'
import fs from 'fs'
import getCurrentGitBranch from 'current-git-branch'
import zlib from 'zlib'

const currentBranch = getCurrentGitBranch()

const isProduction = process.env.NODE_ENV === 'production';
const DOMAINS: { name: string, units: Record<string, string> }[] = isProduction
    ? [{ name: 'https://beta.css.master.co', units: { 'docs': 'installation' } }]
    : [{ name: 'http://localhost:3000', units: { 'docs': 'installation' } }];
const TEXT_TAGS = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'li', 'a', 'code', 'mark'];
const SELF_CLOSING_TAGS = ['path', 'area', 'base', 'img', 'hr', 'br', 'col', 'embed', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
const BYPASS_TAGS = ['svg'];
const commentRegexp = /<!--.*?-->/g;
const idRegexp = / id="(.*?)"/;

function getBracketContent(source: string, startSymbol = '<', endSymbol = '>') {
    let startIndex = source.indexOf(startSymbol);
    let currentIndex = startIndex;
    let curlyBracketCount = 0;
    let stringModeSymbol = '';

    for (; currentIndex <= source.length; currentIndex++) {
        const char = source[currentIndex];
        if (char === '\\') {
            currentIndex++;
            continue;
        }

        if (char === '\'' || char === '"') {
            if (stringModeSymbol) {
                if (stringModeSymbol === char) {
                    stringModeSymbol = '';
                }
            } else {
                stringModeSymbol = char;
            }
        } else if (!stringModeSymbol) {
            if (char === startSymbol) {
                curlyBracketCount++;
            } else if (char === endSymbol) {
                curlyBracketCount--;
                if (!curlyBracketCount) {
                    break;
                }
            }
        }
    }

    return source.slice(startIndex, currentIndex + 1);
}

export async function POST(req: Request) {
    const storage = getStorage(app)
    let host = req.headers.get('host')
    const locale = new URL(req.url).searchParams.get('locale')
    if (!locale || !host)
        return new Response(null, { status: 200 })

    const name = `${host}-${locale}.br`
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(name)
    if (host.startsWith('localhost')) {
        if (currentBranch === 'main') {
            host = 'css.master.co'
        } else {
            host = currentBranch + '.css.master.co'
        }
    } else {
        try {
            const result = await fetch(
                `https://api.github.com/repos/${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}/commits/${process.env.VERCEL_GIT_COMMIT_REF}`,
                {
                    headers: { Authorization: 'Bearer ' + process.env.GITHUB_GENERATE_PAGE_CACHE_TOKEN }
                })

            console.log(
                process.env.VERCEL_GIT_REPO_OWNER,
                process.env.VERCEL_GIT_REPO_SLUG,
                process.env.VERCEL_GIT_COMMIT_REF,
                (await result.json()).sha,
                process.env.VERCEL_GIT_COMMIT_SHA
            )

            if ((await result.json()).sha !== process.env.VERCEL_GIT_COMMIT_SHA)
                return new Response('Only the latest commit can generate the page cache.', { status: 400 })
        } catch (err) {
            console.error(err)

            return new Response('Failed to get latest commit.', { status: 400 })
        }

        try {
            if (
                (await file.exists())[0]
                && (await bucket.file(name).getMetadata())[0].metadata?.sha === process.env.VERCEL_GIT_COMMIT_SHA
            )
                return new Response('The page cache is the latest.', { status: 400 })
        } catch (err) {
            console.error(err)

            return new Response('Failed to check file metadata.', { status: 400 })
        }
    }

    const data: Record<string, { title: string, category: string, description: string, nodes: { text: string, id: string }[], disabled: boolean }> = {}
    const crawle = async (baseUrl: string, crawleUrl: string) => {
        const url = new URL(crawleUrl, baseUrl)

        if (!(url.pathname in data) && url.href.startsWith(baseUrl)) {
            const html = await (await fetch(url.href)).text()
            const $ = cheerio.load(html)

            let content = html
            content = content.slice(content.indexOf('<article')).replace(commentRegexp, '')

            let i = 0;
            const nodes: { text: string, id: string, tag: string }[] = [];
            (function reorganizate(tag, isParentTextTag, isParentBypassTag, bypassHandleTag) {
                const tagContent = getBracketContent(content.slice(i));
                i += tagContent.length;
                if (tagContent.endsWith('/>') || SELF_CLOSING_TAGS.includes(tag))
                    return '';

                const closedTag = '</' + tag + '>'
                const isBypassTag = isParentBypassTag || BYPASS_TAGS.includes(tag);
                const isTextTag = !isBypassTag && (isParentTextTag || TEXT_TAGS.includes(tag));

                let currentData = '';
                let nextTagName = '';
                for (; i < content.length; i++) {
                    const char = content[i];
                    if (nextTagName) {
                        if (char.match(/[a-zA-Z0-9]/)) {
                            nextTagName += char;
                        } else {
                            if (nextTagName.length > 1) {
                                i -= nextTagName.length;

                                const innerData = reorganizate(nextTagName.slice(1), isTextTag, isBypassTag, bypassHandleTag || nextTagName.slice(1) === 'code');
                                if (isTextTag) {
                                    currentData += innerData;
                                }

                                i--;
                            } else {
                                currentData += nextTagName + char
                            }

                            nextTagName = '';
                        }
                    } else if (char === '<') {
                        if (content.slice(i, i + closedTag.length) === closedTag) {
                            i += closedTag.length;
                            break;
                        } else if (bypassHandleTag) {
                            currentData += char;
                        } else {
                            nextTagName += char;
                        }
                    } else {
                        currentData += char;
                    }
                }

                if (isTextTag && !isParentTextTag && !bypassHandleTag) {
                    if (currentData) {
                        let id = '';
                        idRegexp.lastIndex = 0;
                        const idResult = idRegexp.exec(tagContent);
                        if (idResult) {
                            id = idResult[1];
                        }

                        nodes.push({ text: currentData.replace(/&nbsp;/g, ' '), id, tag });
                    }
                    return '';
                } else {
                    return currentData;
                }
            })('article', false, false, false);

            let disabled: boolean = false

            if (nodes.length) {
                data[url.pathname] = {
                    title: $('title').text().replace(/- Master (CSS|UI|Components|Templates)/, ''),
                    description: /meta name="description" content="(.*?)"/.exec(html)?.[1] ?? '',
                    category: /meta name="category" content="(.*?)"/.exec(html)?.[1] ?? '',
                    nodes,
                    disabled
                }
            }

            const hrefs = $('a')
                .map((index, element) => $(element).attr('href'))
                .get();
            for (const eachHref of hrefs) {
                await crawle(baseUrl, eachHref)
            }
        }
    }

    const content = [];
    const regexp = new RegExp('^https:\\/\\/([A-Za-z]+).master.co(\\/' + locale + ')', 'm')
    const suffix = '/' + locale;
    for (const eachDomain of DOMAINS) {
        for (const eachUnit in eachDomain.units) {
            await crawle(eachDomain.name + suffix + '/' + eachUnit, eachUnit + '/' + eachDomain.units[eachUnit])

            for (const eachUrl in data) {
                // const url = isProduction
                //     ? eachUrl.replace(regexp, (origin, unit, _locale) => _locale + '/' + unit)
                //     : new URL(eachUrl).pathname

                content.push({
                    url: eachUrl,
                    ...data[eachUrl]
                });
                delete data[eachUrl];
            }
        }
    }

    if (content?.length) {
        const filePath = path.resolve(process.cwd(), `${process.env.CRAWLEE_STORAGE_DIR}/${name}`).replace(/:[0-9]+/, '')
        fs.writeFileSync(filePath, zlib.brotliCompressSync(JSON.stringify(content)), { encoding: 'utf-8' });

        await bucket.upload(filePath, { destination: name, contentType: 'application/json', metadata: { contentEncoding: 'br', metadata: { sha: process.env.VERCEL_GIT_COMMIT_SHA } } })
        await bucket.file(name).makePublic()

        return new Response(undefined, { status: 200 })
    } else {
        return new Response(`No page cache \`${name}\` is generated.`, { status: 400 })
    }
}