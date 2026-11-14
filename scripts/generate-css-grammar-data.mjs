/**
 * Writes `crates/mastercss-css-grammar/data/grammar.json`, the CSS grammar that
 * the Rust value checks match against: mdn-data's types, properties and at-rules
 * with `data/patch.json` applied, merged exactly as css-tree merges its data
 * (`lib/data.js`). The patch is css-tree's (MIT, Copyright (C) 2016-2026 by
 * Roman Dvornov), maintained here since Master CSS no longer depends on css-tree.
 *
 * Run from the repository root after updating mdn-data or the patch:
 *
 *   node scripts/generate-css-grammar-data.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = new URL('../crates/mastercss-css-grammar/data/', import.meta.url)
const patch = JSON.parse(readFileSync(new URL('patch.json', root), 'utf8'))
const mdnVersion = require('mdn-data/package.json').version
const mdnAtrules = require('mdn-data/css/at-rules.json')
const mdnProperties = require('mdn-data/css/properties.json')
const mdnSyntaxes = require('mdn-data/css/syntaxes.json')
const extendSyntax = /^\s*\|\s*/

function preprocessAtrules(dict) {
  const result = {}
  for (const [name, atrule] of Object.entries(dict)) {
    let descriptors = null
    if (atrule.descriptors) {
      descriptors = {}
      for (const [descriptor, value] of Object.entries(atrule.descriptors)) descriptors[descriptor] = value.syntax
    }
    result[name.slice(1)] = {
      prelude: atrule.syntax.trim().replace(/\{(.|\s)+\}/, '').match(/^@\S+\s+([^;{]*)/)[1].trim() || null,
      descriptors
    }
  }
  return result
}

function patchDictionary(dict, patchDict) {
  const result = {}
  for (const [key, value] of Object.entries(dict)) if (value) result[key] = value.syntax || value
  for (const key of Object.keys(patchDict)) {
    if (Object.hasOwn(dict, key)) {
      if (patchDict[key].syntax) {
        result[key] = extendSyntax.test(patchDict[key].syntax) ? result[key] + ' ' + patchDict[key].syntax.trim() : patchDict[key].syntax
      } else {
        delete result[key]
      }
    } else if (patchDict[key].syntax) {
      result[key] = patchDict[key].syntax.replace(extendSyntax, '')
    }
  }
  return result
}

function preprocessPatchDescriptors(declarations) {
  const result = {}
  for (const [key, value] of Object.entries(declarations || {})) result[key] = typeof value === 'string' ? { syntax: value } : value
  return result
}

function patchAtrules(dict, patchDict) {
  const result = {}
  for (const key in dict) {
    if (patchDict[key] === null) continue
    const atrulePatch = patchDict[key] || {}
    result[key] = {
      prelude: key in patchDict && 'prelude' in atrulePatch ? atrulePatch.prelude : dict[key].prelude || null,
      descriptors: patchDictionary(dict[key].descriptors || {}, preprocessPatchDescriptors(atrulePatch.descriptors))
    }
  }
  for (const [key, atrulePatch] of Object.entries(patchDict)) {
    if (atrulePatch && !Object.hasOwn(dict, key)) {
      result[key] = {
        prelude: atrulePatch.prelude || null,
        descriptors: atrulePatch.descriptors ? patchDictionary({}, preprocessPatchDescriptors(atrulePatch.descriptors)) : null
      }
    }
  }
  return result
}

const sorted = (record) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
export const grammar = {
  types: patchDictionary(mdnSyntaxes, patch.types),
  atrules: patchAtrules(preprocessAtrules(mdnAtrules), patch.atrules),
  properties: patchDictionary(mdnProperties, patch.properties)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL('grammar.json', root), JSON.stringify({
    source: `mdn-data ${mdnVersion} with data/patch.json`,
    types: sorted(grammar.types),
    properties: sorted(grammar.properties),
    atrules: sorted(grammar.atrules)
  }, null, 1) + '\n')
}
