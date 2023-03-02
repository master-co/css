import { renderIntoHTML } from '@master/css'
import { config } from '../master.css.mjs'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    const response = await resolve(event, {
        // transformPageChunk: ({ html }) => renderIntoHTML(html, config) // JIT
    })
   
    return response
}