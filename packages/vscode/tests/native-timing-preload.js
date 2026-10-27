// Keep native work visible when a synchronous call blocks the LSP event loop.
// This preload belongs only to the staged-server test child, not the bundle.
const dlopen = process.dlopen

function timed(name, operation) {
  const start = performance.now()
  process.stderr.write(`[native timing] ${name} started\n`)
  try {
    return operation()
  } finally {
    process.stderr.write(`[native timing] ${name} finished in ${Math.round(performance.now() - start)} ms\n`)
  }
}

process.dlopen = function (module, ...args) {
  const result = Reflect.apply(dlopen, this, [module, ...args])
  const binding = module.exports
  if (!binding.LanguageSession?.prototype.completionIndex) return result

  const completionIndex = binding.LanguageSession.prototype.completionIndex
  binding.LanguageSession.prototype.completionIndex = function (...params) {
    return timed('LanguageSession.completionIndex', () => Reflect.apply(completionIndex, this, params))
  }
  for (const name of ['LanguageSession', 'ValidatorSession', 'LintSession']) {
    binding[name] = new Proxy(binding[name], {
      construct(target, params, newTarget) {
        return timed(name, () => Reflect.construct(target, params, newTarget))
      }
    })
  }
  return result
}
