import axios from 'axios'
import cheerio from 'cheerio'
import { brotliCompressSync } from 'zlib'
import log from '@techor/log'
import { filesize } from 'filesize'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fileSizeOptions = { round: 0 }

async function fetchWithBrotli(url: string) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'Accept-Encoding': 'br'
            }
        })
        return response
    } catch (error: any) {
        if (error.response.status === 404) {
            return error.response
        }
    }
}

async function fetchAndCalculateCSS({ name, url }: any) {
    const response = await fetchWithBrotli(url)
    const $ = cheerio.load(response.data.toString())
    const domain = response.request.protocol + '//' + response.request.host
    let totalInternalCSSSize = 0
    let totalInternalCSSBrotliSize = 0
    let totalExternalCSSSize = 0
    let totalExternalCSSBrotliSize = 0
    const externals: any[] = []
    const internals: any[] = []

    await Promise.all(
        // Get all external CSS links
        $('link[rel*="stylesheet"]')
            .map((i, el) => $(el).attr('href')).get()
            .map(async (cssUrl) => {
                const cssLinkResponse = await fetchWithBrotli(
                    cssUrl.startsWith('http')
                        ? cssUrl
                        : new URL(cssUrl, domain).toString()
                )
                const cssLinkSize = cssLinkResponse.data.toString().length
                const cssLinkBrotliSize = brotliCompressSync(cssLinkResponse.data).length
                totalExternalCSSSize += cssLinkSize
                totalExternalCSSBrotliSize += cssLinkBrotliSize
                externals.push({
                    url: cssUrl,
                    size: cssLinkSize,
                    brotliSize: cssLinkBrotliSize
                })
            })
    )

    $('style').each((i, el) => {
        const styleText = $(el).text()
        const styleSize = styleText.length
        const styleBrotliSize = brotliCompressSync(Buffer.from(styleText)).length
        totalInternalCSSSize += styleSize
        totalInternalCSSBrotliSize += styleBrotliSize
        internals.push({
            tag: `<style${el.attribs.id ? ` id="${el.attribs.id}"` : ''}>`,
            size: styleSize,
            brotliSize: styleBrotliSize
        })
    })

    return {
        name,
        url,
        totalCSSSize: totalInternalCSSSize + totalExternalCSSSize,
        totalCSSBrotliSize: totalInternalCSSBrotliSize + totalExternalCSSBrotliSize,
        totalInternalCSSSize,
        totalInternalCSSBrotliSize,
        totalExternalCSSSize,
        totalExternalCSSBrotliSize,
        externals,
        internals,
        date: new Date().toISOString()
    }
}

const inputs = JSON.parse(readFileSync(resolve(__dirname, './inputs.json')).toString())
const results = (await Promise.all(inputs.map((site: any) => fetchAndCalculateCSS(site))))
    .sort((a, b) => b.totalCSSSize - a.totalCSSSize)
const masterCSSResult = results.find((result) => result.name === 'Master CSS')

results.forEach((result) => {
    log``
    log`Fetch: ${result.url}`
    if (result.externals.length) console.table(result.externals)
    if (result.internals.length) console.table(result.internals)
})

log``
console.log('---')
log``

log`Total of page critical CSS (raw):`
log``
results.forEach((output) => {
    log`📄 ${output.name}\t\t${filesize(output.totalCSSSize, fileSizeOptions)}\t**${(output.totalCSSSize / masterCSSResult.totalCSSSize).toFixed(1)}x**\tInternal ${filesize(output.totalInternalCSSSize, fileSizeOptions)}\tExternal ${filesize(output.totalExternalCSSSize, fileSizeOptions)}`
})

log``
console.log('---')
log``

log`Total of page critical CSS (brotli):`
log``
results.forEach((output) => {
    log`📄 ${output.name}\t\t${filesize(output.totalCSSBrotliSize, fileSizeOptions)}\t**${(output.totalCSSBrotliSize / masterCSSResult.totalCSSBrotliSize).toFixed(1)}x**\tInternal ${filesize(output.totalInternalCSSBrotliSize, fileSizeOptions)}\tExternal ${filesize(output.totalExternalCSSBrotliSize, fileSizeOptions)}`
})

log``

writeFileSync(resolve(__dirname, './results.json'), JSON.stringify(results, null, 4))