import { MasterCSSRuntime } from './core'

function resolveDefaultProgramURL(scriptURL: string) {
  const defaultProgramURL = new URL(scriptURL)
  defaultProgramURL.search = ''
  defaultProgramURL.hash = ''
  if (defaultProgramURL.pathname.endsWith('/')) {
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

if (currentScript?.src) {
  const defaultProgramURL = resolveDefaultProgramURL(currentScript.src)
  // The runtime fetches the program when its engine starts, which progressive
  // pages defer.
  void MasterCSSRuntime.start({
    program: () => loadDefaultProgram(defaultProgramURL),
    onDiagnostic: diagnostic => console.error(diagnostic)
  })
    .then((runtime) => runtime.observe())
    .catch((error) => console.error(error))
} else {
  console.error('Cannot resolve the Master CSS runtime script URL.')
}
