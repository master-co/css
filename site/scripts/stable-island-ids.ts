import { createHash } from 'node:crypto'

const islandOpeningTag = /<astro-island\b[^>]*>/g
const uidAttribute = /\suid="[^"]*"/

/**
 * Astro hashes each island's absolute source path into its `uid`, so the same release
 * built in another checkout directory (GitHub runner vs Cloudflare Pages) differs by a
 * few bytes on every page. Browsers never read `uid` outside development HMR; derive it
 * from the island's public attributes so verified output is byte-identical everywhere.
 */
export function stabilizeIslandIds(html: string): string {
    return html.replace(islandOpeningTag, tag => {
        if (!uidAttribute.test(tag)) return tag
        const identity = tag.replace(uidAttribute, '')
        const uid = createHash('sha256').update(identity).digest('base64url').slice(0, 8)
        return tag.replace(uidAttribute, ` uid="${uid}"`)
    })
}
