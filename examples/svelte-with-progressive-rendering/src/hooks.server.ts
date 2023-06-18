import { renderHTML } from '@master/css'
import config from './master.css'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    return await resolve(event, {
        transformPageChunk: ({ html }) => renderHTML(html, config)
    })
}