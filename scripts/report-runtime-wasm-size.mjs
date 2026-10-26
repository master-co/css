// Attributes the runtime engine Wasm to crates and code categories.
//
// `cargo xtask build-wasm runtime --names` builds the shipped module with its name
// section. Each group's function bodies are brotli-compressed on their own, so the
// numbers rank what a change can remove; they do not add up to the shipped size,
// which is reported separately with every custom section dropped. The report fails
// when code the runtime must not link, such as `core::fmt`, comes back.
//
//   node scripts/report-runtime-wasm-size.mjs [--no-build] [--modules] [--json <file>]
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const wasmPath = path.resolve('target/wasm-size/runtime/mastercss_binding_wasm_engine_bg.wasm')
const args = process.argv.slice(2)
const jsonIndex = args.indexOf('--json')
const jsonPath = jsonIndex === -1 ? undefined : args[jsonIndex + 1]

if (!args.includes('--no-build')) {
  execFileSync('cargo', ['xtask', 'build-wasm', 'runtime', '--names'], { stdio: 'inherit' })
}

function brotli(bytes) {
  return brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY }
  }).byteLength
}

function readU32(bytes, offset) {
  let value = 0
  let shift = 0
  for (;;) {
    const byte = bytes[offset++]
    value += (byte & 0x7f) * 2 ** shift
    shift += 7
    if (byte < 0x80) return [value, offset]
  }
}

function readName(bytes, offset) {
  const [length, start] = readU32(bytes, offset)
  return [new TextDecoder().decode(bytes.subarray(start, start + length)), start + length]
}

/** Splits the module into sections, function bodies, data and function names. */
function parseModule(bytes) {
  const sections = []
  const bodies = []
  const names = new Map()
  let importedFunctions = 0
  let data = new Uint8Array()
  let offset = 8
  while (offset < bytes.length) {
    const id = bytes[offset]
    const [size, start] = readU32(bytes, offset + 1)
    const end = start + size
    sections.push({ id, bytes: bytes.subarray(offset, end) })
    if (id === 2) {
      let [count, cursor] = readU32(bytes, start)
      while (count--) {
        ;[, cursor] = readName(bytes, cursor)
        ;[, cursor] = readName(bytes, cursor)
        const kind = bytes[cursor++]
        if (kind === 0) {
          ;[, cursor] = readU32(bytes, cursor)
          importedFunctions++
        } else if (kind === 1) {
          cursor++
          const [flags, next] = readU32(bytes, cursor)
          ;[, cursor] = readU32(bytes, next)
          if (flags & 1) [, cursor] = readU32(bytes, cursor)
        } else if (kind === 2) {
          const [flags, next] = readU32(bytes, cursor)
          ;[, cursor] = readU32(bytes, next)
          if (flags & 1) [, cursor] = readU32(bytes, cursor)
        } else if (kind === 3) {
          cursor += 2
        } else {
          throw new Error(`Unsupported import kind ${kind}`)
        }
      }
    } else if (id === 10) {
      let [count, cursor] = readU32(bytes, start)
      while (count--) {
        const [length, body] = readU32(bytes, cursor)
        bodies.push(bytes.subarray(body, body + length))
        cursor = body + length
      }
    } else if (id === 11) {
      data = bytes.subarray(start, end)
    } else if (id === 0) {
      const [sectionName, cursor] = readName(bytes, start)
      if (sectionName === 'name') {
        let subsection = cursor
        while (subsection < end) {
          const kind = bytes[subsection]
          const [length, body] = readU32(bytes, subsection + 1)
          if (kind === 1) {
            let [count, entry] = readU32(bytes, body)
            while (count--) {
              const [index, next] = readU32(bytes, entry)
              const [name, after] = readName(bytes, next)
              names.set(index, name)
              entry = after
            }
          }
          subsection = body + length
        }
      }
    }
    offset = end
  }
  return { sections, bodies, names, importedFunctions, data }
}

const crate = name => name.match(/mastercss_(\w+?)\[[0-9a-f]+\]::(\w+)/)

// Code the runtime Wasm must never link again; each was removed on purpose.
const forbidden = [
  ['core::fmt formatting (use concat_text! instead of format!)', /\bcore\[[0-9a-f]+\]::fmt::write\b|\balloc\[[0-9a-f]+\]::fmt::format\b/],
  ['panic formatting (the build rebuilds std with immediate-abort panics)', /\bpanicking::|panic_fmt/],
  ['Unicode tables (decide CSS name code points in mastercss-lexer)', /\bunicode::unicode_data::|unicode::printable::/],
  ['float parsing and formatting (use decimal.rs)', /\bdec2flt::|\bflt2dec::|\bfmt::float::/],
  ['SipHash (use the engine hash.rs aliases)', /\bhash::sip::|\bRandomState\b/],
  ['BTreeMap (use NameCounts or a sorted Vec)', /\bbtree::/],
  ['dlmalloc (the binding allocates with talc)', /\bdlmalloc\b/]
]

/** Mirrors the categories used to plan the runtime Wasm size work. */
function category(name) {
  if (name.includes('serde_wasm_bindgen')) return 'serde_wasm_bindgen'
  if (name.includes('serde_json') || /\bserde(_core)?\[/.test(name)) return 'serde_json + serde'
  if (/drop_in_place|drop_glue|::sort::|hashbrown|hash::map|HashMap|HashSet|sip::|RandomState|btree|clone::Clone/.test(name)) {
    return 'collections / sort / clone / drop'
  }
  if (/flt2dec|dec2flt|fmt::float|zmij|bignum/.test(name) || (name.includes('core') && name.includes('::fmt'))) {
    return 'fmt + float'
  }
  const owner = crate(name)
  if (owner?.[1] === 'engine') return 'engine'
  if (owner?.[1] === 'lexer') return 'lexer'
  if (owner?.[1] === 'schema') return 'schema'
  return 'std / alloc / bindgen / other'
}

function engineModule(name) {
  const owner = crate(name)
  if (owner?.[1] !== 'engine') return
  return /^[A-Z]/.test(owner[2]) ? `lib.rs (${owner[2]})` : owner[2]
}

function concat(chunks) {
  const total = chunks.reduce((size, chunk) => size + chunk.byteLength, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output
}

function groupSizes(bodies, keyOf) {
  const groups = new Map()
  bodies.forEach((body, index) => {
    const key = keyOf(index)
    if (key === undefined) return
    const group = groups.get(key) ?? []
    group.push(body)
    groups.set(key, group)
  })
  return [...groups].map(([key, chunks]) => {
    const bytes = concat(chunks)
    return { group: key, functions: chunks.length, raw: bytes.byteLength, brotli: brotli(bytes) }
  }).sort((left, right) => right.raw - left.raw)
}

const bytes = readFileSync(wasmPath)
const module = parseModule(bytes)
const nameOf = index => module.names.get(index + module.importedFunctions) ?? ''
const shipped = concat([bytes.subarray(0, 8), ...module.sections.filter(section => section.id !== 0).map(section => section.bytes)])
const report = {
  shipped: { raw: shipped.byteLength, gzip: gzipSync(shipped, { level: 9 }).byteLength, brotli: brotli(shipped) },
  code: { raw: module.bodies.reduce((size, body) => size + body.byteLength, 0), brotli: brotli(concat(module.bodies)) },
  data: { raw: module.data.byteLength, brotli: brotli(module.data) },
  categories: groupSizes(module.bodies, index => category(nameOf(index))),
  engineModules: groupSizes(module.bodies, index => engineModule(nameOf(index)))
}

const kb = value => `${(value / 1000).toFixed(1)} KB`
const row = (label, raw, compressed, extra = '') => `${label.padEnd(40)} ${kb(raw).padStart(10)} ${kb(compressed).padStart(10)}${extra}`
const lines = [
  `Shipped runtime Wasm: ${kb(report.shipped.raw)} raw, ${kb(report.shipped.gzip)} gzip, ${kb(report.shipped.brotli)} brotli`,
  '',
  `${'group (each brotli-compressed alone)'.padEnd(40)} ${'raw'.padStart(10)} ${'brotli'.padStart(10)}`,
  ...report.categories.map(group => row(group.group, group.raw, group.brotli, `  ${group.functions} fn`)),
  row('all code', report.code.raw, report.code.brotli),
  row('data section', report.data.raw, report.data.brotli)
]
if (args.includes('--modules')) {
  lines.push('', 'mastercss-engine modules')
  for (const group of report.engineModules) lines.push(row(`  ${group.group}`, group.raw, group.brotli, `  ${group.functions} fn`))
}
const linkedNames = [...module.names.values()]
const violations = forbidden.flatMap(([label, pattern]) => {
  const linked = linkedNames.filter(name => pattern.test(name))
  return linked.length ? [`${label}: ${linked.slice(0, 3).join(', ')}${linked.length > 3 ? ` and ${linked.length - 3} more` : ''}`] : []
})
report.forbidden = violations
if (violations.length) lines.push('', 'Forbidden code is linked:', ...violations.map(violation => `  ${violation}`))
process.stdout.write(`${lines.join('\n')}\n`)
if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
if (violations.length) process.exitCode = 1
