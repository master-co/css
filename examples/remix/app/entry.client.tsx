import { RemixBrowser } from '@remix-run/react'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { MasterCSS } from '@master/css/dist'

function hydrate() {
    startTransition(() => {
        new MasterCSS()
        hydrateRoot(
            document,
            <StrictMode>
                <RemixBrowser />
            </StrictMode>
        )
    })
}

if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(hydrate)
} else {
    // Safari doesn't support requestIdleCallback
    // https://caniuse.com/requestidlecallback
    setTimeout(hydrate, 1)
}
