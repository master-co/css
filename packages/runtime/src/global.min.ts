import { MasterCSSRuntime } from './core'

function resolveDefaultProgramURL(scriptURL: string) {
  const defaultProgramURL = new URL(scriptURL)
  defaultProgramURL.search = ''
  defaultProgramURL.hash = ''
  // Master CDN redirects npm paths without CORS response headers. Classic
  // scripts can follow that redirect; fetch/preload must use its destination.
  if (defaultProgramURL.origin === 'https://cdn.master.co'
    && /^\/css-runtime(?:@[^/]+)?(?:\/|$)/.test(defaultProgramURL.pathname)) {
    defaultProgramURL.hostname = 'cdn.jsdelivr.net'
    defaultProgramURL.pathname = '/npm/@master' + defaultProgramURL.pathname
  }
  if (defaultProgramURL.origin === 'https://cdn.jsdelivr.net'
    && /^\/npm\/@master\/css-runtime(?:@[^/]+)?\/?$/.test(defaultProgramURL.pathname)) {
    // Package-entry CDNs select browser: dist/global.min.js, but currentScript
    // retains the requested package URL even after a CDN redirect.
    defaultProgramURL.pathname = defaultProgramURL.pathname.replace(/\/$/, '') + '/dist/default-program.bin'
  } else if (defaultProgramURL.pathname.endsWith('/')) {
    defaultProgramURL.pathname += 'default-program.bin'
  } else if (defaultProgramURL.pathname.endsWith('.js')) {
    defaultProgramURL.pathname = defaultProgramURL.pathname.replace(/\/[^/]*$/, '/default-program.bin')
  } else {
    defaultProgramURL.pathname += '/default-program.bin'
  }
  return defaultProgramURL
}

async function loadDefaultProgram(defaultProgramURL: URL): Promise<ArrayBuffer> {
  try {
    const response = await fetch(defaultProgramURL)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.arrayBuffer()
  } catch (error) {
    throw new Error(`Cannot load the Master CSS default program from ${defaultProgramURL.href}.`, { cause: error })
  }
}

const currentScript = document.currentScript as HTMLScriptElement | null
// Start loading immediately, but scan only once the initial document is parsed.
// A cached program can otherwise reveal a streamed page before its body arrives.
const documentReady = document.readyState === 'loading'
  ? new Promise<void>(resolve => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }))
  : Promise.resolve()

if (currentScript?.src) {
  const defaultProgramURL = resolveDefaultProgramURL(currentScript.src)
  // The runtime fetches the program when its engine starts, which progressive
  // pages defer.
  void MasterCSSRuntime.start({
    program: () => loadDefaultProgram(defaultProgramURL),
    onDiagnostic: diagnostic => console.error(diagnostic)
  })
    .then(async (runtime) => {
      await documentReady
      runtime.observe()
    })
    .catch((error) => {
      document.documentElement.removeAttribute('hidden')
      console.error(error)
    })
} else {
  document.documentElement.removeAttribute('hidden')
  console.error('Cannot resolve the Master CSS runtime script URL.')
}
