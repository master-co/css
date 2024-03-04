import { render } from '@master/css-server'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
    return await resolve(event, {
        transformPageChunk: ({ html }) => render(html).html
    })
}