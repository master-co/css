import { renderIntoHTML } from '@master/css'
import { config } from './master.css'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    return await resolve(event, {
        transformPageChunk: ({ html }) => renderIntoHTML(html, config)
    })
}