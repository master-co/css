import { createHash } from 'node:crypto'
import type { MasterCSSCompilerBindingSession } from '@master/css-binding/compiler'

type CompileGraph = MasterCSSCompilerBindingSession['compileCSSStylesheetGraph']
const results = new Map<string, { result: ReturnType<CompileGraph>, bytes: number }>()
const budget = 16 * 1024 * 1024
let bytes = 0

/** Cache only the pure binding request, after resolving and observing all inputs. */
export function compilePreparedGraph(binding: Pick<MasterCSSCompilerBindingSession, 'compileCSSStylesheetGraph'>, request: Parameters<CompileGraph>[0]): ReturnType<CompileGraph> {
  const key = createHash('sha256').update(JSON.stringify(request)).digest('hex')
  const cached = results.get(key)
  if (cached) {
    results.delete(key)
    results.set(key, cached)
    return structuredClone(cached.result)
  }
  const result = binding.compileCSSStylesheetGraph(request)
  const size = JSON.stringify(result).length * 2
  if (size <= budget) {
    while (bytes + size > budget || results.size >= 64) {
      const oldest = results.keys().next().value!
      bytes -= results.get(oldest)!.bytes
      results.delete(oldest)
    }
    results.set(key, { result: structuredClone(result), bytes: size })
    bytes += size
  }
  return result
}
